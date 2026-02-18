"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  Upload,
  FileText,
  FileSpreadsheet,
  FileImage,
  File,
  Loader2,
  AlertCircle,
  Trash2,
  Download,
  FolderOpen,
  Grid3X3,
  List,
  X,
  Tag,
  Plus,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { vaultApi } from "@/lib/api";

interface VaultDocument {
  id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  category: string;
  description?: string;
  tags: string[];
  uploaded_at: string;
  download_url?: string;
}

const CATEGORIES = [
  "All",
  "Agreements",
  "Contracts",
  "Compliance",
  "Tax",
  "Employment",
  "Corporate",
  "Court Documents",
];

function getFileIcon(fileType: string) {
  const type = fileType.toLowerCase();
  if (type.includes("pdf")) return <FileText className="h-8 w-8 text-red-500" />;
  if (type.includes("spreadsheet") || type.includes("excel") || type.includes("csv") || type.includes("xlsx"))
    return <FileSpreadsheet className="h-8 w-8 text-green-600" />;
  if (type.includes("image") || type.includes("png") || type.includes("jpg") || type.includes("jpeg"))
    return <FileImage className="h-8 w-8 text-blue-500" />;
  if (type.includes("word") || type.includes("doc"))
    return <FileText className="h-8 w-8 text-blue-700" />;
  return <File className="h-8 w-8 text-muted-foreground" />;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function categoryBadgeColor(category: string) {
  const colors: Record<string, string> = {
    Agreements: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
    Contracts: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
    Compliance: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
    Tax: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
    Employment: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300",
    Corporate: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300",
    "Court Documents": "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  };
  return colors[category] || "bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-300";
}

export default function VaultPage() {
  const [documents, setDocuments] = useState<VaultDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  // Upload form state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadCategory, setUploadCategory] = useState("");
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploadTags, setUploadTags] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const result = await vaultApi.list(
        activeCategory !== "All" ? { category: activeCategory } : undefined
      );
      setDocuments(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, [activeCategory]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleUpload = async () => {
    if (!uploadFile || !uploadCategory) return;
    try {
      setUploading(true);
      setError(null);
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("category", uploadCategory);
      if (uploadDescription) formData.append("description", uploadDescription);
      if (uploadTags) {
        const tags = uploadTags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);
        tags.forEach((tag) => formData.append("tags", tag));
      }
      await vaultApi.upload(formData);
      setUploadDialogOpen(false);
      resetUploadForm();
      fetchDocuments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setDeletingIds((prev) => new Set(prev).add(id));
      setError(null);
      await vaultApi.delete(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const resetUploadForm = () => {
    setUploadFile(null);
    setUploadCategory("");
    setUploadDescription("");
    setUploadTags("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  if (loading && documents.length === 0) {
    return (
      <div className="flex h-screen bg-background">
        <div className="flex-1 flex flex-col">
          <header className="bg-card border-b border-border px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-primary" />
                <h1 className="text-xl font-semibold text-foreground">Vault</h1>
              </div>
            </div>
          </header>
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground text-sm">Loading documents...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && documents.length === 0) {
    return (
      <div className="flex h-screen bg-background">
        <div className="flex-1 flex flex-col">
          <header className="bg-card border-b border-border px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-primary" />
                <h1 className="text-xl font-semibold text-foreground">Vault</h1>
              </div>
            </div>
          </header>
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <p className="text-destructive font-medium">Failed to load documents</p>
              <p className="text-muted-foreground text-sm">{error}</p>
              <Button variant="outline" onClick={() => fetchDocuments()}>
                Retry
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <div className="flex-1 flex flex-col">
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-primary" />
                <h1 className="text-xl font-semibold text-foreground">Vault</h1>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">Secure document storage — upload, tag, categorize, and manage your legal files</p>
            </div>
            <Button onClick={() => setUploadDialogOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 bg-background">
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Error Banner */}
            {error && (
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm rounded-md p-3 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
                <button onClick={() => setError(null)} className="ml-auto">
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Category Tabs and View Toggle */}
            <div className="flex items-center justify-between gap-4">
              <Tabs
                value={activeCategory}
                onValueChange={setActiveCategory}
                className="flex-1"
              >
                <TabsList className="flex-wrap h-auto gap-1">
                  {CATEGORIES.map((cat) => (
                    <TabsTrigger key={cat} value={cat} className="text-xs">
                      {cat}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
              <div className="flex items-center gap-1 border border-border rounded-md p-1">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Documents */}
            {documents.length === 0 ? (
              <Card className="shadow-sm border-border">
                <CardContent className="p-12 text-center">
                  <FolderOpen className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No Documents</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {activeCategory === "All"
                      ? "Your vault is empty. Upload your first document to get started."
                      : `No documents found in the "${activeCategory}" category.`}
                  </p>
                  <Button onClick={() => setUploadDialogOpen(true)}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Document
                  </Button>
                </CardContent>
              </Card>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {documents.map((doc) => (
                  <Card
                    key={doc.id}
                    className="shadow-sm border-border hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {getFileIcon(doc.file_type)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {doc.file_name}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatFileSize(doc.file_size)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        <Badge className={categoryBadgeColor(doc.category)}>
                          {doc.category}
                        </Badge>
                      </div>
                      {doc.tags && doc.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {doc.tags.map((tag, idx) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className="text-xs px-1.5 py-0"
                            >
                              <Tag className="h-3 w-3 mr-0.5" />
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mb-3">
                        Uploaded {formatDate(doc.uploaded_at)}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            if (doc.download_url) window.open(doc.download_url, "_blank");
                          }}
                        >
                          <Download className="h-3.5 w-3.5 mr-1" />
                          Download
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          disabled={deletingIds.has(doc.id)}
                          onClick={() => handleDelete(doc.id)}
                        >
                          {deletingIds.has(doc.id) ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <Card
                    key={doc.id}
                    className="shadow-sm border-border hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0">
                          {getFileIcon(doc.file_type)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {doc.file_name}
                          </p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span>{formatFileSize(doc.file_size)}</span>
                            <span>Uploaded {formatDate(doc.uploaded_at)}</span>
                          </div>
                        </div>
                        <Badge className={categoryBadgeColor(doc.category)}>
                          {doc.category}
                        </Badge>
                        {doc.tags && doc.tags.length > 0 && (
                          <div className="hidden md:flex gap-1">
                            {doc.tags.slice(0, 2).map((tag, idx) => (
                              <Badge
                                key={idx}
                                variant="outline"
                                className="text-xs px-1.5 py-0"
                              >
                                {tag}
                              </Badge>
                            ))}
                            {doc.tags.length > 2 && (
                              <Badge variant="outline" className="text-xs px-1.5 py-0">
                                +{doc.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (doc.download_url) window.open(doc.download_url, "_blank");
                            }}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            disabled={deletingIds.has(doc.id)}
                            onClick={() => handleDelete(doc.id)}
                          >
                            {deletingIds.has(doc.id) ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload Dialog */}
      <Dialog
        open={uploadDialogOpen}
        onOpenChange={(open) => {
          setUploadDialogOpen(open);
          if (!open) resetUploadForm();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Add a new document to your vault. Select a file and choose a category.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="vault-file">File</Label>
              <Input
                id="vault-file"
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.png,.jpg,.jpeg"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              />
              {uploadFile && (
                <p className="text-xs text-muted-foreground">
                  {uploadFile.name} ({formatFileSize(uploadFile.size)})
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={uploadCategory} onValueChange={setUploadCategory}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.filter((c) => c !== "All").map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="vault-description">Description (optional)</Label>
              <Textarea
                id="vault-description"
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
                placeholder="Brief description of the document..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vault-tags">Tags (optional, comma-separated)</Label>
              <Input
                id="vault-tags"
                value={uploadTags}
                onChange={(e) => setUploadTags(e.target.value)}
                placeholder="e.g. Q4 2024, Annual, Draft"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setUploadDialogOpen(false);
                resetUploadForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!uploadFile || !uploadCategory || uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Upload
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
