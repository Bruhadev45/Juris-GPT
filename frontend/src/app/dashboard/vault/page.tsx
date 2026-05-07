"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
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
  Network,
  Link2,
  Edit3,
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  vaultApi,
  type VaultDocument,
  type VaultDocumentLinks,
  type VaultGraphNode,
  type VaultKnowledgeGraph,
  type VaultLinkSuggestion,
} from "@/lib/api";

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

function truncateGraphLabel(label: string, maxLength = 22) {
  return label.length > maxLength ? `${label.slice(0, maxLength - 1)}...` : label;
}

function graphNodeFill(type: VaultGraphNode["type"]) {
  if (type === "document") return "fill-primary";
  if (type === "tag") return "fill-emerald-500";
  return "fill-amber-500";
}

function VaultKnowledgeGraphView({
  graph,
  selectedNodeId,
  onSelectNode,
  onOpenDocument,
}: {
  graph: VaultKnowledgeGraph;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
  onOpenDocument: (documentId: string) => void;
}) {
  const layout = useMemo(() => {
    const width = 860;
    const height = 520;
    const centerX = width / 2;
    const centerY = height / 2;
    const positions = new Map<string, { x: number; y: number }>();
    const documentNodes = graph.nodes.filter((node) => node.type === "document");
    const tagNodes = graph.nodes.filter((node) => node.type === "tag");
    const categoryNodes = graph.nodes.filter((node) => node.type === "category");

    documentNodes.forEach((node, index) => {
      const angle = (Math.PI * 2 * index) / Math.max(documentNodes.length, 1) - Math.PI / 2;
      const radius = documentNodes.length <= 1 ? 0 : 130;
      positions.set(node.id, {
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
      });
    });

    tagNodes.forEach((node, index) => {
      const angle = (Math.PI * 2 * index) / Math.max(tagNodes.length, 1) + Math.PI / 7;
      positions.set(node.id, {
        x: centerX + Math.cos(angle) * 230,
        y: centerY + Math.sin(angle) * 205,
      });
    });

    categoryNodes.forEach((node, index) => {
      const step = height / Math.max(categoryNodes.length + 1, 2);
      positions.set(node.id, {
        x: 88,
        y: step * (index + 1),
      });
    });

    return { width, height, positions };
  }, [graph.nodes]);

  const selectedNode = graph.nodes.find((node) => node.id === selectedNodeId) ?? graph.nodes[0] ?? null;

  if (graph.nodes.length === 0) {
    return (
      <Card className="shadow-sm border-border">
        <CardContent className="p-12 text-center">
          <Network className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Graph Data</h3>
          <p className="text-sm text-muted-foreground">
            Upload and tag documents to build the knowledge graph.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-4">
      <Card className="shadow-sm border-border overflow-hidden">
        <CardContent className="p-0">
          <div className="border-b border-border px-4 py-3 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Network className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Knowledge Graph</h2>
            </div>
            <div className="ml-auto flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span>{graph.stats.documents} docs</span>
              <span>{graph.stats.tags} tags</span>
              <span>{graph.stats.connections} links</span>
            </div>
          </div>
          <div className="h-[540px] overflow-hidden bg-muted/20">
            <svg
              viewBox={`0 0 ${layout.width} ${layout.height}`}
              className="h-full w-full"
              role="img"
              aria-label="Vault knowledge graph"
            >
              <g>
                {graph.edges.map((edge, index) => {
                  const source = layout.positions.get(edge.source);
                  const target = layout.positions.get(edge.target);
                  if (!source || !target) return null;
                  const isReference = edge.type === "reference";
                  return (
                    <line
                      key={`${edge.source}-${edge.target}-${edge.type}-${index}`}
                      x1={source.x}
                      y1={source.y}
                      x2={target.x}
                      y2={target.y}
                      className={isReference ? "stroke-primary/50" : "stroke-border"}
                      strokeWidth={Math.min(1 + edge.strength * 0.45, 4)}
                    />
                  );
                })}
              </g>
              <g>
                {graph.nodes.map((node) => {
                  const position = layout.positions.get(node.id);
                  if (!position) return null;
                  const isSelected = selectedNode?.id === node.id;
                  return (
                    <g
                      key={node.id}
                      className="cursor-pointer"
                      onClick={() => onSelectNode(node.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") onSelectNode(node.id);
                      }}
                    >
                      <circle
                        cx={position.x}
                        cy={position.y}
                        r={node.size + (isSelected ? 4 : 0)}
                        className={`${graphNodeFill(node.type)} transition-opacity`}
                        opacity={isSelected ? 0.95 : 0.78}
                      />
                      <circle
                        cx={position.x}
                        cy={position.y}
                        r={node.size + 7}
                        className={isSelected ? "stroke-primary fill-transparent" : "stroke-transparent fill-transparent"}
                        strokeWidth="2"
                      />
                      <text
                        x={position.x}
                        y={position.y + node.size + 18}
                        textAnchor="middle"
                        className="fill-foreground text-[12px] font-medium"
                      >
                        {truncateGraphLabel(node.label)}
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-border">
        <CardContent className="p-5 space-y-4">
          {selectedNode ? (
            <>
              <div>
                <Badge variant="outline" className="mb-3 capitalize">
                  {selectedNode.type}
                </Badge>
                <h3 className="text-base font-semibold text-foreground break-words">
                  {selectedNode.label}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedNode.type === "document" ? selectedNode.category : `${selectedNode.metadata.document_count ?? 0} linked documents`}
                </p>
              </div>
              {selectedNode.type === "document" && (
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-xs uppercase text-muted-foreground mb-1">Size</p>
                    <p>{formatFileSize(selectedNode.metadata.file_size ?? 0)}</p>
                  </div>
                  {selectedNode.metadata.uploaded_at && (
                    <div>
                      <p className="text-xs uppercase text-muted-foreground mb-1">Uploaded</p>
                      <p>{formatDate(selectedNode.metadata.uploaded_at)}</p>
                    </div>
                  )}
                  {selectedNode.metadata.description && (
                    <div>
                      <p className="text-xs uppercase text-muted-foreground mb-1">Description</p>
                      <p className="text-muted-foreground">{selectedNode.metadata.description}</p>
                    </div>
                  )}
                  {selectedNode.metadata.tags && selectedNode.metadata.tags.length > 0 && (
                    <div>
                      <p className="text-xs uppercase text-muted-foreground mb-2">Tags</p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedNode.metadata.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedNode.metadata.document_id && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => onOpenDocument(selectedNode.metadata.document_id as string)}
                    >
                      <Link2 className="h-4 w-4 mr-2" />
                      Open Links
                    </Button>
                  )}
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Select a graph node to inspect it.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function VaultPage() {
  const [documents, setDocuments] = useState<VaultDocument[]>([]);
  const [graph, setGraph] = useState<VaultKnowledgeGraph | null>(null);
  const [loading, setLoading] = useState(true);
  const [graphLoading, setGraphLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [viewMode, setViewMode] = useState<"grid" | "list" | "graph">("grid");
  const [selectedGraphNodeId, setSelectedGraphNodeId] = useState<string | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  // Upload form state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadCategory, setUploadCategory] = useState("");
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploadTags, setUploadTags] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<VaultDocument | null>(null);
  const [documentLinks, setDocumentLinks] = useState<VaultDocumentLinks | null>(null);
  const [linksLoading, setLinksLoading] = useState(false);
  const [savingMetadata, setSavingMetadata] = useState(false);
  const [editCategory, setEditCategory] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editTags, setEditTags] = useState("");
  const [linkSuggestions, setLinkSuggestions] = useState<VaultLinkSuggestion[]>([]);

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

  const fetchGraph = useCallback(async () => {
    try {
      setError(null);
      setGraphLoading(true);
      const result = await vaultApi.graph(
        activeCategory !== "All" ? { category: activeCategory } : undefined
      );
      setGraph(result.data);
      setSelectedGraphNodeId((current) => {
        if (current && result.data.nodes.some((node) => node.id === current)) return current;
        return result.data.nodes.find((node) => node.type === "document")?.id ?? result.data.nodes[0]?.id ?? null;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load knowledge graph");
    } finally {
      setGraphLoading(false);
    }
  }, [activeCategory]);

  useEffect(() => {
    if (viewMode === "graph") {
      fetchGraph();
    }
  }, [viewMode, fetchGraph]);

  const fetchDocumentLinks = useCallback(async (documentId: string) => {
    try {
      setLinksLoading(true);
      const result = await vaultApi.getLinks(documentId);
      setDocumentLinks(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load document links");
    } finally {
      setLinksLoading(false);
    }
  }, []);

  const openDocumentDetails = useCallback(async (documentOrId: VaultDocument | string) => {
    try {
      setError(null);
      const doc =
        typeof documentOrId === "string"
          ? documents.find((item) => item.id === documentOrId) ?? (await vaultApi.get(documentOrId)).data
          : documentOrId;
      setSelectedDocument(doc);
      setEditCategory(doc.category);
      setEditDescription(doc.description ?? "");
      setEditTags((doc.tags ?? []).join(", "));
      setDetailsOpen(true);
      setDocumentLinks(null);
      fetchDocumentLinks(doc.id);
      const suggestions = await vaultApi.linkSuggestions("");
      setLinkSuggestions(suggestions.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to open document links");
    }
  }, [documents, fetchDocumentLinks]);

  const insertWikilink = (title: string) => {
    setEditDescription((current) => {
      const suffix = current.trim() ? "\n" : "";
      return `${current}${suffix}[[${title}]]`;
    });
  };

  const handleSaveMetadata = async () => {
    if (!selectedDocument || !editCategory) return;
    try {
      setSavingMetadata(true);
      setError(null);
      const tags = editTags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);
      const result = await vaultApi.updateMetadata(selectedDocument.id, {
        category: editCategory,
        description: editDescription,
        tags,
      });
      setSelectedDocument(result.data);
      setDocuments((current) =>
        current.map((doc) => (doc.id === result.data.id ? result.data : doc))
      );
      await fetchDocumentLinks(result.data.id);
      if (viewMode === "graph") await fetchGraph();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save document metadata");
    } finally {
      setSavingMetadata(false);
    }
  };

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
        formData.append("tags", tags.join(","));
      }
      await vaultApi.upload(formData);
      setUploadDialogOpen(false);
      resetUploadForm();
      fetchDocuments();
      if (viewMode === "graph") fetchGraph();
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
      if (viewMode === "graph") fetchGraph();
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

  const visibleLinkSuggestions = linkSuggestions.filter(
    (suggestion) => suggestion.id !== selectedDocument?.id
  );

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
                <Button
                  variant={viewMode === "graph" ? "default" : "ghost"}
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => setViewMode("graph")}
                >
                  <Network className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Documents */}
            {viewMode === "graph" ? (
              graphLoading && !graph ? (
                <Card className="shadow-sm border-border">
                  <CardContent className="p-12 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Building knowledge graph...</p>
                  </CardContent>
                </Card>
              ) : graph ? (
                <VaultKnowledgeGraphView
                  graph={graph}
                  selectedNodeId={selectedGraphNodeId}
                  onSelectNode={setSelectedGraphNodeId}
                  onOpenDocument={openDocumentDetails}
                />
              ) : null
            ) : documents.length === 0 ? (
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
                          onClick={() => openDocumentDetails(doc)}
                        >
                          <Link2 className="h-3.5 w-3.5 mr-1" />
                          Links
                        </Button>
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
                            onClick={() => openDocumentDetails(doc)}
                          >
                            <Link2 className="h-4 w-4" />
                          </Button>
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

      {/* Document Links Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[88vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-primary" />
              {selectedDocument?.file_name ?? "Document Links"}
            </DialogTitle>
            <DialogDescription>
              Edit vault metadata, add [[wikilinks]], and inspect backlinks.
            </DialogDescription>
          </DialogHeader>

          {selectedDocument && (
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-5">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={editCategory} onValueChange={setEditCategory}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.filter((category) => category !== "All").map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vault-edit-description">Linked note</Label>
                  <Textarea
                    id="vault-edit-description"
                    value={editDescription}
                    onChange={(event) => setEditDescription(event.target.value)}
                    placeholder="Add notes and connect documents with [[Cap Table]] style links."
                    rows={7}
                  />
                  {visibleLinkSuggestions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {visibleLinkSuggestions.slice(0, 8).map((suggestion) => (
                        <Button
                          key={suggestion.id}
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => insertWikilink(suggestion.title)}
                        >
                          [[{suggestion.title}]]
                        </Button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vault-edit-tags">Tags</Label>
                  <Input
                    id="vault-edit-tags"
                    value={editTags}
                    onChange={(event) => setEditTags(event.target.value)}
                    placeholder="equity, filing, compliance"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Card className="border-border shadow-sm">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-foreground">Connections</h3>
                      {linksLoading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs uppercase text-muted-foreground">Outgoing Links</p>
                      {documentLinks?.outgoing_links.length ? (
                        <div className="space-y-1.5">
                          {documentLinks.outgoing_links.map((link) => (
                            <div key={link.raw} className="rounded-md border border-border px-2 py-1.5 text-xs">
                              <p className="font-medium text-foreground">
                                {link.document?.file_name ?? link.target}
                              </p>
                              {!link.resolved && (
                                <p className="text-muted-foreground">Unresolved link</p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">No outgoing wikilinks.</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs uppercase text-muted-foreground">Backlinks</p>
                      {documentLinks?.backlinks.length ? (
                        <div className="space-y-1.5">
                          {documentLinks.backlinks.map((link) => (
                            <button
                              key={`${link.source?.id}-${link.raw}`}
                              type="button"
                              className="w-full rounded-md border border-border px-2 py-1.5 text-left text-xs hover:bg-secondary"
                              onClick={() => {
                                if (link.source?.id) openDocumentDetails(link.source.id);
                              }}
                            >
                              <p className="font-medium text-foreground">{link.source?.file_name}</p>
                              <p className="text-muted-foreground">mentions [[{selectedDocument.file_name.replace(/\.[^/.]+$/, "")}]]</p>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">No backlinks yet.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border shadow-sm">
                  <CardContent className="p-4 space-y-2">
                    <h3 className="text-sm font-semibold text-foreground">Related By Tags</h3>
                    {documentLinks?.related_documents.length ? (
                      <div className="space-y-1.5">
                        {documentLinks.related_documents.map((related) => (
                          <button
                            key={related.document.id}
                            type="button"
                            className="w-full rounded-md border border-border px-2 py-1.5 text-left text-xs hover:bg-secondary"
                            onClick={() => openDocumentDetails(related.document.id)}
                          >
                            <p className="font-medium text-foreground">{related.document.file_name}</p>
                            <p className="text-muted-foreground">{related.shared_tags.join(", ")}</p>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">No shared-tag documents.</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsOpen(false)}>
              Close
            </Button>
            <Button onClick={handleSaveMetadata} disabled={!selectedDocument || savingMetadata}>
              {savingMetadata ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Edit3 className="h-4 w-4 mr-2" />
                  Save Metadata
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                placeholder="Brief description. Use [[Document Name]] to connect it to another vault document."
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
