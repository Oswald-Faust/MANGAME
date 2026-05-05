"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import FileExplorer from "@/components/FileExplorer";
import DriveExplorer from "@/components/DriveExplorer";
import AIChat from "@/components/AIChat";
import FileViewer from "@/components/FileViewer";
import SettingsView from "@/components/SettingsView";
import {
  Search,
  Loader2,
  Files,
  FolderOpen,
  Cloud,
  HardDrive,
  Menu,
  X,
} from "lucide-react";
import { formatBytes } from "@/lib/utils";

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

interface Stats {
  totalFiles: number;
  totalFolders: number;
  localFiles: number;
  driveFiles: number;
  totalSize: number;
}

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeView, setActiveView] = useState("files");
  const [viewingFile, setViewingFile] = useState<FileData | null>(null);
  const [aiFileId, setAiFileId] = useState<string>();
  const [aiFileName, setAiFileName] = useState<string>();
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetch("/api/stats")
        .then((r) => r.json())
        .then(setStats)
        .catch(console.error);
    }
  }, [session, activeView]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-950">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
          <p className="text-gray-400 text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const handleAskAI = (fileId: string, fileName: string) => {
    setAiFileId(fileId);
    setAiFileName(fileName);
    setActiveView("ai");
    setViewingFile(null);
  };

  const handleViewChange = (view: string) => {
    setActiveView(view);
    setSidebarOpen(false);
    if (view !== "ai") {
      setAiFileId(undefined);
      setAiFileName(undefined);
    }
  };

  const renderContent = () => {
    switch (activeView) {
      case "files":
        return (
          <div className="flex flex-col h-full">
            {/* Stats bar */}
            {stats && (
              <div className="flex gap-4 px-6 py-3 bg-gray-900/50 border-b border-gray-800">
                {[
                  {
                    icon: Files,
                    label: "Fichiers",
                    value: stats.totalFiles,
                    color: "text-indigo-400",
                  },
                  {
                    icon: FolderOpen,
                    label: "Dossiers",
                    value: stats.totalFolders,
                    color: "text-yellow-400",
                  },
                  {
                    icon: HardDrive,
                    label: "Stockage local",
                    value: formatBytes(stats.totalSize),
                    color: "text-green-400",
                  },
                  {
                    icon: Cloud,
                    label: "Drive importés",
                    value: stats.driveFiles,
                    color: "text-blue-400",
                  },
                ].map(({ icon: Icon, label, value, color }) => (
                  <div
                    key={label}
                    className="flex items-center gap-2 text-sm"
                  >
                    <Icon className={`w-4 h-4 ${color}`} />
                    <span className="text-gray-500">{label}:</span>
                    <span className="text-gray-200 font-medium">{value}</span>
                  </div>
                ))}
              </div>
            )}
            <FileExplorer
              onViewFile={setViewingFile}
              onAskAI={handleAskAI}
              searchQuery=""
            />
          </div>
        );
      case "drive":
        return (
          <DriveExplorer
            onViewFile={setViewingFile}
            onAskAI={handleAskAI}
          />
        );
      case "ai":
        return (
          <AIChat
            key={`${aiFileId}-${aiFileName}`}
            initialFileId={aiFileId}
            initialFileName={aiFileName}
          />
        );
      case "search":
        return (
          <div className="flex flex-col h-full">
            <div className="px-6 py-4 border-b border-gray-800 bg-gray-900">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Recherche
              </h2>
              <div className="relative max-w-lg">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  placeholder="Rechercher dans tous vos fichiers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  autoFocus
                />
              </div>
            </div>
            <FileExplorer
              onViewFile={setViewingFile}
              onAskAI={handleAskAI}
              searchQuery={searchQuery}
            />
          </div>
        );
      case "starred":
        return (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="w-16 h-16 bg-yellow-500/20 rounded-2xl flex items-center justify-center">
              <span className="text-3xl">⭐</span>
            </div>
            <div className="text-center">
              <p className="font-semibold text-white">Favoris</p>
              <p className="text-sm text-gray-500 mt-1">Fonctionnalité à venir</p>
            </div>
          </div>
        );
      case "trash":
        return (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center">
              <span className="text-3xl">🗑️</span>
            </div>
            <div className="text-center">
              <p className="font-semibold text-white">Corbeille</p>
              <p className="text-sm text-gray-500 mt-1">Fonctionnalité à venir</p>
            </div>
          </div>
        );
      case "settings":
        return <SettingsView />;
      default:
        return null;
    }
  };

  const viewLabels: Record<string, string> = {
    files: "Mes fichiers",
    drive: "Google Drive",
    ai: "Assistant IA",
    search: "Rechercher",
    starred: "Favoris",
    trash: "Corbeille",
    settings: "Paramètres",
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-950">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - drawer on mobile, fixed on desktop */}
      <div
        className={[
          "fixed md:relative inset-y-0 left-0 z-30 md:z-auto transition-transform duration-300",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        ].join(" ")}
      >
        <Sidebar activeView={activeView} onViewChange={handleViewChange} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-gray-900 border-b border-gray-800 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-400 hover:text-white transition-colors p-1"
            aria-label="Ouvrir le menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-indigo-600 rounded-md flex items-center justify-center">
              <span className="text-white text-xs font-bold">D</span>
            </div>
            <span className="text-white font-semibold text-sm">
              {viewLabels[activeView] || "DocAI"}
            </span>
          </div>
          {viewingFile && (
            <button
              onClick={() => setViewingFile(null)}
              className="ml-auto text-gray-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </header>

        <main className="flex-1 overflow-hidden">{renderContent()}</main>
      </div>

      {/* File viewer */}
      {viewingFile && (
        <FileViewer
          file={viewingFile}
          onClose={() => setViewingFile(null)}
          onAskAI={handleAskAI}
        />
      )}
    </div>
  );
}
