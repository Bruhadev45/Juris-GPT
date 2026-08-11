/**
 * Server-side proxy for the public demo.
 *
 * Why a proxy rather than calling the backend from the browser: the backend's
 * CSRF cookie is issued with SameSite=Strict, so it is never sent on a
 * cross-site request. With the frontend and backend on different hosts, a
 * browser-direct POST would fail CSRF validation every time. Routing through
 * a Next.js Route Handler keeps the browser same-origin and makes the call to
 * the backend a server-to-server request, which carries no browser cookies at
 * all.
 *
 * The Authorization header satisfies the backend's documented CSRF exemption
 * for bearer-token callers. DEMO_API_TOKEN is server-only — it is never sent
 * to the browser, and rotating it revokes demo access without a redeploy of
 * the backend.
 */

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const DEMO_API_TOKEN = process.env.DEMO_API_TOKEN ?? "";
const UPSTREAM_TIMEOUT_MS = 60_000;
const MAX_MESSAGE_LENGTH = 2000;

/** Per-IP fixed window. Keeps one demo visitor from exhausting the model budget. */
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 6;

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

/**
 * In-memory and therefore per-instance: a serverless deployment may run
 * several instances, so the effective limit is this figure times the instance
 * count. That is acceptable for a demo throttle — it exists to stop casual
 * abuse, not as a security control.
 */
const rateLimitBuckets = new Map<string, RateLimitEntry>();

function clientKey(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]!.trim();
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitBuckets.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitBuckets.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }

  // Immutable update — replace the entry rather than mutating in place.
  rateLimitBuckets.set(key, { ...entry, count: entry.count + 1 });
  return false;
}

/** Drop expired buckets so the map cannot grow without bound. */
function pruneRateLimitBuckets(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitBuckets) {
    if (now > entry.resetAt) {
      rateLimitBuckets.delete(key);
    }
  }
}

interface DemoChatRequest {
  message?: unknown;
  conversation_history?: unknown;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  pruneRateLimitBuckets();

  if (isRateLimited(clientKey(request))) {
    return NextResponse.json(
      { error: "Too many questions in a short time. Please wait a minute and try again." },
      { status: 429 },
    );
  }

  let body: DemoChatRequest;
  try {
    body = (await request.json()) as DemoChatRequest;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) {
    return NextResponse.json({ error: "Please enter a question." }, { status: 400 });
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json(
      { error: `Question is too long (limit ${MAX_MESSAGE_LENGTH} characters).` },
      { status: 400 },
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  try {
    // /api/demo/message, not /api/chat/message: the chat router sits behind
    // Depends(require_auth), while the demo router is the deliberately public,
    // rate-limited, read-only surface. Forward the caller's IP so the backend's
    // per-client throttle sees the visitor rather than this server.
    const upstream = await fetch(`${API_BASE}/api/demo/message`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Forwarded-For": clientKey(request),
        ...(DEMO_API_TOKEN ? { Authorization: `Bearer ${DEMO_API_TOKEN}` } : {}),
      },
      body: JSON.stringify({ message }),
      signal: controller.signal,
      cache: "no-store",
    });

    if (!upstream.ok) {
      // Deliberately generic: upstream error text can carry internal detail,
      // and this endpoint is public.
      return NextResponse.json(
        { error: "The legal assistant is unavailable right now. Please try again shortly." },
        { status: 502 },
      );
    }

    const data = await upstream.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error: unknown) {
    const isTimeout = error instanceof Error && error.name === "AbortError";
    return NextResponse.json(
      {
        error: isTimeout
          ? "That question took too long to answer. Please try a shorter one."
          : "Could not reach the legal assistant. Please try again shortly.",
      },
      { status: isTimeout ? 504 : 502 },
    );
  } finally {
    clearTimeout(timeout);
  }
}
