"use client";

import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import {
  Cloud,
  RefreshCw,
  ExternalLink,
  Bot,
  Eye,
  AlertCircle,
  ChevronRight,
  Loader2,
  Folder,
  ShieldAlert,
} from "lucide-react";
import { Button } from "./ui/button";
import FileIcon from "./FileIcon";
import { formatDate, formatBytes } from "@/lib/utils";
import { toast } from "sonner";

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime: string;
  webViewLink?: string;
  parents?: string[];
}

interface DriveExplorerProps {
  onViewFile: (file: {
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
  }) => void;
  onAskAI: (fileId: string, fileName: string) => void;
}

export default function DriveExplorer({ onViewFile, onAskAI }: DriveExplorerProps) {
  const { data: session } = useSession();
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [insufficientScopes, setInsufficientScopes] = useState(false);
  const [currentFolderId, setCurrentFolderId] = useState("root");
  const [breadcrumb, setBreadcrumb] = useState<{ id: string; name: string }[]>([]);
  const [importedFiles, setImportedFiles] = useState<Set<string>>(new Set());

  const loadDriveFiles = async (folderId = "root") => {
    if (!session?.accessToken) return;
    setLoading(true);
    setError(null);
    setInsufficientScopes(false);

    try {
      const res = await fetch(`/api/drive?folderId=${folderId}`);
      if (!res.ok) {
        const data = await res.json();
        // Detect scope / permission issue
        if (res.status === 403 && data.error === "insufficient_scopes") {
          setInsufficientScopes(true);
          return;
        }
        if (res.status === 401) {
          setInsufficientScopes(true);
          return;
        }
        throw new Error(data.error || "Erreur Drive");
      }
      const data = await res.json();
      setDriveFiles(data.files || []);
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.accessToken) {
      loadDriveFiles(currentFolderId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.accessToken, currentFolderId]);

  const navigateToFolder = (file: DriveFile) => {
    setBreadcrumb((prev) => [...prev, { id: file.id, name: file.name }]);
    setCurrentFolderId(file.id);
    setDriveFiles([]);
  };

  const navigateToBreadcrumb = (index: number) => {
    if (index === -1) {
      setBreadcrumb([]);
      setCurrentFolderId("root");
    } else {
      const newBreadcrumb = breadcrumb.slice(0, index + 1);
      setBreadcrumb(newBreadcrumb);
      setCurrentFolderId(newBreadcrumb[newBreadcrumb.length - 1].id);
    }
    setDriveFiles([]);
  };

  const importFile = async (file: DriveFile) => {
    if (importedFiles.has(file.id)) return;

    setImportedFiles((prev) => new Set([...prev, file.id]));

    try {
      const res = await fetch("/api/drive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driveFile: file }),
      });

      if (!res.ok) throw new Error("Erreur import");

      const savedFile = await res.json();
      toast.success(`${file.name} importé et en cours de traitement`);

      // Ouvrir le fichier importé
      onViewFile({
        ...savedFile,
        _id: savedFile._id,
        createdAt: savedFile.createdAt || new Date().toISOString(),
      });
    } catch {
      setImportedFiles((prev) => {
        const next = new Set(prev);
        next.delete(file.id);
        return next;
      });
      toast.error("Erreur lors de l'import");
    }
  };

  const isFolder = (file: DriveFile) =>
    file.mimeType === "application/vnd.google-apps.folder";

  if (!session?.accessToken) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
        <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center">
          <Cloud className="w-8 h-8 text-gray-600" />
        </div>
        <div className="text-center">
          <h3 className="text-white font-semibold mb-2">Google Drive non connecté</h3>
          <p className="text-gray-400 text-sm">
            Connectez-vous avec Google pour accéder à vos fichiers Drive.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-800 bg-gray-900">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M6 2L2 9l4 7h12l4-7-4-7z" opacity="0" />
            <path fill="#34A853" d="M12 2L6 12h12z" opacity="0" />
            <path
              fill="#4285F4"
              d="M8.5 2L2 13h5l6.5-11z"
            />
            <path
              fill="#FBBC05"
              d="M15.5 2L22 13h-5L10.5 2z"
            />
            <path
              fill="#34A853"
              d="M2 13l5 9h10l5-9H2z"
            />
          </svg>
          <span className="font-semibold text-white">Google Drive</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => loadDriveFiles(currentFolderId)}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
        <div className="ml-auto text-xs text-gray-500">
          {driveFiles.length} éléments
        </div>
      </div>

      {/* Breadcrumb */}
      {breadcrumb.length > 0 && (
        <div className="flex items-center gap-1 px-6 py-2 text-sm text-gray-400 bg-gray-900/50 border-b border-gray-800">
          <button
            onClick={() => navigateToBreadcrumb(-1)}
            className="hover:text-white transition-colors"
          >
            Mon Drive
          </button>
          {breadcrumb.map((item, i) => (
            <span key={item.id} className="flex items-center gap-1">
              <ChevronRight className="w-3.5 h-3.5" />
              <button
                onClick={() => navigateToBreadcrumb(i)}
                className={i === breadcrumb.length - 1 ? "text-white" : "hover:text-white transition-colors"}
              >
                {item.name}
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Contenu */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="flex items-center gap-2 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Chargement de votre Drive...</span>
            </div>
          </div>
        ) : insufficientScopes ? (
          <div className="flex flex-col items-center justify-center h-full gap-5 py-16">
            <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center">
              <ShieldAlert className="w-8 h-8 text-amber-400" />
            </div>
            <div className="text-center max-w-sm">
              <p className="text-white font-semibold mb-2">Accès Drive non autorisé</p>
              <p className="text-gray-400 text-sm">
                Votre session n&apos;a pas les permissions Google Drive. Reconnectez-vous pour accorder l&apos;accès.
              </p>
            </div>
            <Button
              onClick={() =>
                signIn("google", {
                  callbackUrl: "/",
                  prompt: "consent",
                } as Parameters<typeof signIn>[1])
              }
              className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2"
            >
              <Cloud className="w-4 h-4" />
              Reconnecter avec Google Drive
            </Button>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <AlertCircle className="w-8 h-8 text-red-400" />
            <p className="text-red-400 text-sm">{error}</p>
            <Button variant="outline" size="sm" onClick={() => loadDriveFiles(currentFolderId)}>
              Réessayer
            </Button>
          </div>
        ) : driveFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <Cloud className="w-8 h-8 text-gray-600" />
            <p className="text-gray-400 text-sm">Ce dossier est vide</p>
          </div>
        ) : (
          <div className="space-y-1">
            {/* Header */}
            <div className="flex items-center gap-4 px-3 py-2 text-xs text-gray-500 uppercase tracking-wider">
              <span className="w-8" />
              <span className="flex-1">Nom</span>
              <span className="w-32 text-right">Modifié</span>
              <span className="w-36" />
            </div>

            {driveFiles.map((file) => (
              <div
                key={file.id}
                className="group flex items-center gap-4 px-3 py-2.5 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
                onDoubleClick={() => isFolder(file) ? navigateToFolder(file) : importFile(file)}
              >
                {isFolder(file) ? (
                  <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <Folder className="w-4 h-4 text-blue-400" />
                  </div>
                ) : (
                  <FileIcon mimeType={file.mimeType} name={file.name} size="sm" />
                )}

                <span className="flex-1 text-sm text-gray-200 truncate">
                  {file.name}
                </span>

                <span className="w-32 text-xs text-gray-500 text-right">
                  {file.modifiedTime ? formatDate(file.modifiedTime) : "—"}
                </span>

                <div className="w-36 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {isFolder(file) ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => navigateToFolder(file)}
                      className="text-xs h-7"
                    >
                      Ouvrir
                    </Button>
                  ) : (
                    <>
                      {file.webViewLink && (
                        <a
                          href={file.webViewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button size="icon" variant="ghost" className="h-7 w-7">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Button>
                        </a>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => importFile(file)}
                        disabled={importedFiles.has(file.id)}
                        className="text-xs h-7 gap-1"
                      >
                        {importedFiles.has(file.id) ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Import...
                          </>
                        ) : (
                          <>
                            <Eye className="w-3 h-3" />
                            Importer
                          </>
                        )}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          importFile(file).then(() => {
                            // L'IA sera disponible après import
                          });
                          onAskAI(file.id, file.name);
                        }}
                        className="h-7 w-7 text-indigo-400"
                        title="Interroger l'IA"
                      >
                        <Bot className="w-3.5 h-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
