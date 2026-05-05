"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FolderPlus,
  Upload,
  Grid,
  List,
  Search,
  ChevronRight,
  Folder,
  MoreVertical,
  Trash2,
  Eye,
  Bot,
  RefreshCw,
  FolderOpen,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import FileIcon from "./FileIcon";
import UploadZone from "./UploadZone";
import { formatBytes, formatDate, truncate } from "@/lib/utils";
import { toast } from "sonner";

interface FileData {
  _id: string;
  name: string;
  mimeType: string;
  size: number;
  url: string;
  source: "local" | "google-drive";
  driveViewLink?: string;
  content?: string;
  transcription?: string;
  processed: boolean;
  createdAt: string;
  folderId?: string;
}

interface FolderData {
  _id: string;
  name: string;
  color: string;
  createdAt: string;
}

interface FileExplorerProps {
  onViewFile: (file: FileData) => void;
  onAskAI: (fileId: string, fileName: string) => void;
  searchQuery?: string;
}

export default function FileExplorer({
  onViewFile,
  onAskAI,
  searchQuery = "",
}: FileExplorerProps) {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [folders, setFolders] = useState<FolderData[]>([]);
  const [files, setFiles] = useState<FileData[]>([]);
  const [currentFolder, setCurrentFolder] = useState<FolderData | null>(null);
  const [breadcrumb, setBreadcrumb] = useState<FolderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [localSearch, setLocalSearch] = useState("");

  const effectiveSearch = searchQuery || localSearch;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [foldersRes, filesRes] = await Promise.all([
        fetch(
          `/api/folders${currentFolder ? `?parentId=${currentFolder._id}` : ""}`
        ),
        fetch(
          `/api/files?source=local${currentFolder ? `&folderId=${currentFolder._id}` : ""}${effectiveSearch ? `&search=${effectiveSearch}` : ""}`
        ),
      ]);

      const [foldersData, filesData] = await Promise.all([
        foldersRes.json(),
        filesRes.json(),
      ]);

      setFolders(Array.isArray(foldersData) ? foldersData : []);
      setFiles(Array.isArray(filesData) ? filesData : []);
    } catch {
      toast.error("Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [currentFolder, effectiveSearch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      const res = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newFolderName.trim(),
          parentId: currentFolder?._id,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Dossier créé");
      setNewFolderName("");
      setShowNewFolder(false);
      loadData();
    } catch {
      toast.error("Erreur lors de la création du dossier");
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (!confirm("Supprimer ce dossier et son contenu ?")) return;
    try {
      await fetch(`/api/folders/${folderId}`, { method: "DELETE" });
      toast.success("Dossier supprimé");
      loadData();
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm("Supprimer ce fichier ?")) return;
    try {
      await fetch(`/api/files/${fileId}`, { method: "DELETE" });
      toast.success("Fichier supprimé");
      loadData();
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  };

  const navigateToFolder = (folder: FolderData) => {
    setBreadcrumb((prev) => [...prev, folder]);
    setCurrentFolder(folder);
  };

  const navigateToBreadcrumb = (index: number) => {
    if (index === -1) {
      setBreadcrumb([]);
      setCurrentFolder(null);
    } else {
      const newBreadcrumb = breadcrumb.slice(0, index + 1);
      setBreadcrumb(newBreadcrumb);
      setCurrentFolder(newBreadcrumb[newBreadcrumb.length - 1]);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-800 bg-gray-900">
        <div className="flex-1 flex items-center gap-2">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <Input
              placeholder="Rechercher..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={loadData}
            title="Actualiser"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          <div className="flex border border-gray-700 rounded-lg overflow-hidden">
            <button
              onClick={() => setView("grid")}
              className={`p-1.5 ${view === "grid" ? "bg-gray-700 text-white" : "text-gray-400 hover:bg-gray-800"}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView("list")}
              className={`p-1.5 ${view === "list" ? "bg-gray-700 text-white" : "text-gray-400 hover:bg-gray-800"}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowNewFolder(true)}
            className="gap-1.5"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            Nouveau dossier
          </Button>
          <Button size="sm" onClick={() => setShowUpload(true)} className="gap-1.5">
            <Upload className="w-3.5 h-3.5" />
            Uploader
          </Button>
        </div>
      </div>

      {/* Breadcrumb */}
      {breadcrumb.length > 0 && (
        <div className="flex items-center gap-1 px-6 py-2 text-sm text-gray-400 bg-gray-900/50 border-b border-gray-800">
          <button
            onClick={() => navigateToBreadcrumb(-1)}
            className="hover:text-white transition-colors"
          >
            Mes fichiers
          </button>
          {breadcrumb.map((folder, i) => (
            <span key={folder._id} className="flex items-center gap-1">
              <ChevronRight className="w-3.5 h-3.5" />
              <button
                onClick={() => navigateToBreadcrumb(i)}
                className={i === breadcrumb.length - 1 ? "text-white" : "hover:text-white transition-colors"}
              >
                {folder.name}
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Zone d'upload inline */}
      {showUpload && (
        <div className="px-6 py-4 border-b border-gray-800 bg-gray-900/30">
          <UploadZone
            folderId={currentFolder?._id}
            onUploadComplete={() => {
              loadData();
              setShowUpload(false);
            }}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowUpload(false)}
            className="mt-2"
          >
            Fermer
          </Button>
        </div>
      )}

      {/* Contenu */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="flex gap-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        ) : folders.length === 0 && files.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-60 gap-4">
            <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center">
              <FolderOpen className="w-8 h-8 text-gray-600" />
            </div>
            <div className="text-center">
              <p className="text-gray-400 font-medium">Aucun fichier</p>
              <p className="text-gray-600 text-sm mt-1">
                Créez un dossier ou uploadez des fichiers
              </p>
            </div>
            <Button onClick={() => setShowUpload(true)} className="gap-2">
              <Upload className="w-4 h-4" />
              Uploader des fichiers
            </Button>
          </div>
        ) : view === "grid" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {/* Dossiers */}
            {folders.map((folder) => (
              <div
                key={folder._id}
                className="group relative bg-gray-800/50 border border-gray-700 hover:border-gray-600 rounded-xl p-4 cursor-pointer transition-all hover:bg-gray-800"
                onDoubleClick={() => navigateToFolder(folder)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${folder.color}20` }}
                  >
                    <Folder
                      className="w-5 h-5"
                      style={{ color: folder.color }}
                    />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-700 transition-all">
                        <MoreVertical className="w-3.5 h-3.5 text-gray-400" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigateToFolder(folder)}>
                        <FolderOpen className="w-3.5 h-3.5" />
                        Ouvrir
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-400 focus:text-red-300"
                        onClick={() => handleDeleteFolder(folder._id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <p className="text-sm font-medium text-gray-200 truncate">
                  {folder.name}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Dossier</p>
              </div>
            ))}

            {/* Fichiers */}
            {files.map((file) => (
              <div
                key={file._id}
                className="group relative bg-gray-800/50 border border-gray-700 hover:border-gray-600 rounded-xl p-4 cursor-pointer transition-all hover:bg-gray-800"
                onDoubleClick={() => onViewFile(file)}
              >
                <div className="flex items-start justify-between mb-3">
                  <FileIcon mimeType={file.mimeType} name={file.name} />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-700 transition-all">
                        <MoreVertical className="w-3.5 h-3.5 text-gray-400" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onViewFile(file)}>
                        <Eye className="w-3.5 h-3.5" />
                        Voir
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onAskAI(file._id, file.name)}>
                        <Bot className="w-3.5 h-3.5" />
                        Interroger l&apos;IA
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-400 focus:text-red-300"
                        onClick={() => handleDeleteFile(file._id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <p className="text-sm font-medium text-gray-200 truncate">
                  {file.name}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {formatBytes(file.size)}
                </p>
                {!file.processed && (
                  <div className="absolute top-2 right-2 w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
                )}
              </div>
            ))}
          </div>
        ) : (
          /* Vue liste */
          <div className="space-y-1">
            {/* Header liste */}
            <div className="flex items-center gap-4 px-3 py-2 text-xs text-gray-500 uppercase tracking-wider">
              <span className="w-8" />
              <span className="flex-1">Nom</span>
              <span className="w-20 text-right">Taille</span>
              <span className="w-32 text-right">Modifié</span>
              <span className="w-20" />
            </div>

            {folders.map((folder) => (
              <div
                key={folder._id}
                className="group flex items-center gap-4 px-3 py-2.5 rounded-lg hover:bg-gray-800 cursor-pointer transition-colors"
                onDoubleClick={() => navigateToFolder(folder)}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${folder.color}20` }}
                >
                  <Folder className="w-4 h-4" style={{ color: folder.color }} />
                </div>
                <span className="flex-1 text-sm text-gray-200 truncate">
                  {folder.name}
                </span>
                <span className="w-20 text-xs text-gray-500 text-right">—</span>
                <span className="w-32 text-xs text-gray-500 text-right">
                  {formatDate(folder.createdAt)}
                </span>
                <div className="w-20 flex justify-end">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-gray-700">
                        <MoreVertical className="w-3.5 h-3.5 text-gray-400" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigateToFolder(folder)}>
                        <FolderOpen className="w-3.5 h-3.5" /> Ouvrir
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-400"
                        onClick={() => handleDeleteFolder(folder._id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}

            {files.map((file) => (
              <div
                key={file._id}
                className="group flex items-center gap-4 px-3 py-2.5 rounded-lg hover:bg-gray-800 cursor-pointer transition-colors"
                onDoubleClick={() => onViewFile(file)}
              >
                <FileIcon mimeType={file.mimeType} name={file.name} size="sm" />
                <span className="flex-1 text-sm text-gray-200 truncate">
                  {truncate(file.name, 40)}
                </span>
                <span className="w-20 text-xs text-gray-500 text-right">
                  {formatBytes(file.size)}
                </span>
                <span className="w-32 text-xs text-gray-500 text-right">
                  {formatDate(file.createdAt)}
                </span>
                <div className="w-20 flex justify-end gap-1">
                  <button
                    onClick={() => onViewFile(file)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-gray-200"
                    title="Voir"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onAskAI(file._id, file.name)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-indigo-400"
                    title="Interroger l'IA"
                  >
                    <Bot className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteFile(file._id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-red-400"
                    title="Supprimer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dialog nouveau dossier */}
      <Dialog open={showNewFolder} onOpenChange={setShowNewFolder}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouveau dossier</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Nom du dossier"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewFolder(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
