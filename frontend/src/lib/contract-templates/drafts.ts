/**
 * Contract draft autosave + JSON export/import.
 *
 * Storage strategy: per-contract-type localStorage key, with a metadata
 * envelope so we can validate the file on import (version bump if the
 * schema changes in the future).
 */

export const DRAFT_VERSION = 1;
export const DRAFT_STORAGE_PREFIX = "jurisgpt:contract-draft:";

export interface DraftEnvelope {
  version: number;
  type: string;
  contractName: string;
  formData: Record<string, unknown>;
  savedAt: string;
  /** Optional client-only id so multiple drafts of the same type can coexist */
  draftId?: string;
}

export function storageKey(type: string, draftId?: string): string {
  return `${DRAFT_STORAGE_PREFIX}${type}${draftId ? `:${draftId}` : ""}`;
}

export function saveDraft(
  type: string,
  contractName: string,
  formData: Record<string, unknown>,
  draftId?: string
): DraftEnvelope {
  const envelope: DraftEnvelope = {
    version: DRAFT_VERSION,
    type,
    contractName,
    formData,
    savedAt: new Date().toISOString(),
    draftId,
  };
  try {
    localStorage.setItem(storageKey(type, draftId), JSON.stringify(envelope));
  } catch (err) {
    console.warn("Failed to save draft to localStorage:", err);
  }
  return envelope;
}

export function loadDraft(type: string, draftId?: string): DraftEnvelope | null {
  try {
    const raw = localStorage.getItem(storageKey(type, draftId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DraftEnvelope;
    if (parsed.version !== DRAFT_VERSION) {
      console.warn(
        `Draft version mismatch (got ${parsed.version}, expected ${DRAFT_VERSION}). Skipping.`
      );
      return null;
    }
    if (parsed.type !== type) return null;
    return parsed;
  } catch (err) {
    console.warn("Failed to load draft from localStorage:", err);
    return null;
  }
}

export function clearDraft(type: string, draftId?: string): void {
  try {
    localStorage.removeItem(storageKey(type, draftId));
  } catch {
    /* ignore */
  }
}

export function exportDraftJson(envelope: DraftEnvelope): string {
  return JSON.stringify(envelope, null, 2);
}

/**
 * Validate an imported JSON envelope. Throws on invalid input.
 */
export function parseImportedDraft(json: string): DraftEnvelope {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error("Invalid JSON. The file is not a valid draft.");
  }

  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("Draft file is malformed.");
  }

  const obj = parsed as Record<string, unknown>;
  if (typeof obj.version !== "number") {
    throw new Error("Draft is missing version metadata.");
  }
  if (obj.version !== DRAFT_VERSION) {
    throw new Error(
      `Draft version ${obj.version} is incompatible with this app (expected ${DRAFT_VERSION}).`
    );
  }
  if (typeof obj.type !== "string") {
    throw new Error("Draft is missing the contract type.");
  }
  if (typeof obj.contractName !== "string") {
    throw new Error("Draft is missing the contract name.");
  }
  if (typeof obj.formData !== "object" || obj.formData === null) {
    throw new Error("Draft is missing form data.");
  }
  if (typeof obj.savedAt !== "string") {
    throw new Error("Draft is missing savedAt timestamp.");
  }

  return {
    version: obj.version,
    type: obj.type,
    contractName: obj.contractName,
    formData: obj.formData as Record<string, unknown>,
    savedAt: obj.savedAt,
    draftId: typeof obj.draftId === "string" ? obj.draftId : undefined,
  };
}

/**
 * Format a timestamp as a relative "saved X ago" string.
 */
export function formatSavedAgo(savedAt: string): string {
  const t = new Date(savedAt).getTime();
  if (isNaN(t)) return "saved";
  const ms = Date.now() - t;
  if (ms < 0) return "just now";
  const sec = Math.floor(ms / 1000);
  if (sec < 5) return "just now";
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}
