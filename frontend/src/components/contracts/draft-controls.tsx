"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Save, Upload, Download, Trash2, Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  saveDraft,
  loadDraft,
  clearDraft,
  exportDraftJson,
  parseImportedDraft,
  formatSavedAgo,
  type DraftEnvelope,
} from "@/lib/contract-templates/drafts";

interface DraftControlsProps {
  type: string;
  contractName: string;
  formData: Record<string, unknown>;
  onLoad: (formData: Record<string, unknown>) => void;
  onClear: () => void;
  /** Disable autosave (e.g. while initially populating defaults) */
  paused?: boolean;
  className?: string;
}

const AUTOSAVE_DEBOUNCE_MS = 800;

export function DraftControls({
  type,
  contractName,
  formData,
  onLoad,
  onClear,
  paused = false,
  className,
}: DraftControlsProps) {
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0); // forces re-render of "X ago" label
  const fileInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstSave = useRef(true);

  // Hydrate from localStorage once on mount
  useEffect(() => {
    const draft = loadDraft(type);
    if (draft) {
      onLoad(draft.formData);
      setSavedAt(draft.savedAt);
      setStatus("saved");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  // Tick the "saved X ago" relative label every 30s
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(interval);
  }, []);

  // Debounced autosave on formData change
  useEffect(() => {
    if (paused) return;
    // Skip the very first effect call which fires on initial render
    // (avoids saving an empty default state and overwriting an existing draft)
    if (isFirstSave.current) {
      isFirstSave.current = false;
      return;
    }
    setStatus("saving");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      try {
        const envelope = saveDraft(type, contractName, formData);
        setSavedAt(envelope.savedAt);
        setStatus("saved");
        setError(null);
      } catch (err) {
        setStatus("error");
        setError(err instanceof Error ? err.message : "Failed to save draft");
      }
    }, AUTOSAVE_DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [formData, type, contractName, paused]);

  const handleExport = useCallback(() => {
    const envelope: DraftEnvelope = {
      version: 1,
      type,
      contractName,
      formData,
      savedAt: new Date().toISOString(),
    };
    const json = exportDraftJson(envelope);
    const blob = new Blob([json], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${type}-draft-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [type, contractName, formData]);

  const handleImport = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = ""; // allow re-importing the same file later
      if (!file) return;
      try {
        const text = await file.text();
        const draft = parseImportedDraft(text);
        if (draft.type !== type) {
          throw new Error(
            `This draft is for "${draft.contractName}" (${draft.type}), not ${contractName}.`
          );
        }
        onLoad(draft.formData);
        const envelope = saveDraft(type, contractName, draft.formData);
        setSavedAt(envelope.savedAt);
        setStatus("saved");
        setError(null);
      } catch (err) {
        setStatus("error");
        setError(err instanceof Error ? err.message : "Failed to import draft");
      }
    },
    [type, contractName, onLoad]
  );

  const handleClear = useCallback(() => {
    if (!confirm("Clear this draft? Your filled-in data will be removed.")) return;
    clearDraft(type);
    onClear();
    setSavedAt(null);
    setStatus("idle");
    setError(null);
  }, [type, onClear]);

  // Use the tick variable so the relative label refreshes
  const savedLabel = savedAt ? formatSavedAgo(savedAt) : null;
  void tick;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Status indicator */}
      <div className="flex items-center gap-1.5 text-xs min-w-0">
        {status === "saving" && (
          <>
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-muted-foreground hidden md:inline">Saving…</span>
          </>
        )}
        {status === "saved" && savedLabel && (
          <>
            <Check className="h-3.5 w-3.5 text-emerald-600" />
            <span className="text-muted-foreground hidden md:inline truncate">
              Saved {savedLabel}
            </span>
          </>
        )}
        {status === "error" && (
          <span title={error ?? ""} className="flex items-center gap-1 text-rose-600">
            <AlertCircle className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Save failed</span>
          </span>
        )}
        {status === "idle" && (
          <span className="text-muted-foreground hidden md:inline">No draft saved</span>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-0.5 ml-1">
        <button
          type="button"
          onClick={handleExport}
          className="flex items-center gap-1.5 px-2 py-1.5 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title="Export as JSON file"
        >
          <Download className="h-3.5 w-3.5" />
          <span className="hidden lg:inline">Export</span>
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-2 py-1.5 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title="Import from JSON file"
        >
          <Upload className="h-3.5 w-3.5" />
          <span className="hidden lg:inline">Import</span>
        </button>
        <button
          type="button"
          onClick={handleClear}
          disabled={!savedAt}
          className="flex items-center gap-1.5 px-2 py-1.5 rounded text-xs text-muted-foreground hover:text-rose-600 hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Clear draft"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span className="hidden lg:inline">Clear</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          onChange={handleImport}
          className="hidden"
          aria-hidden
        />
      </div>
    </div>
  );
}
