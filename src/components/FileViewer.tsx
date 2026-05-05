"use client";

import { useState, useEffect } from "react";
import { X, Download, ExternalLink, Bot, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import FileIcon from "./FileIcon";
import { formatBytes, formatDate } from "@/lib/utils";

interface FileViewerProps {
  file: {
    _id: string;
    name: string;
    mimeType: string;
    size: number;
    url: string;
    source: string;
    driveViewLink?: string;
    content?: string;
    transcription?: string;
    processed?: boolean;
    createdAt: string;
  };
  onClose: () => void;
  onAskAI?: (fileId: string, fileName: string) => void;
}

export default function FileViewer({ file, onClose, onAskAI }: FileViewerProps) {
  const [activeTab, setActiveTab] = useState<"preview" | "content" | "info">("preview");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, [file._id]);

  const isImage = file.mimeType.startsWith("image/");
  const isVideo = file.mimeType.startsWith("video/");
  const isAudio = file.mimeType.startsWith("audio/");
  const isPDF = file.mimeType === "application/pdf";
  const isDrive = file.source === "google-drive";

  const renderPreview = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
        </div>
      );
    }

    if (isDrive) {
      return (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <FileIcon mimeType={file.mimeType} name={file.name} size="lg" />
          <p className="text-gray-400 text-sm">Fichier Google Drive</p>
          {file.driveViewLink && (
            <a
              href={file.driveViewLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 text-sm"
            >
              <ExternalLink className="w-4 h-4" />
              Ouvrir dans Google Drive
            </a>
          )}
        </div>
      );
    }

    if (isImage) {
      return (
        <div className="flex items-center justify-center bg-gray-950 rounded-lg overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={file.url}
            alt={file.name}
            className="max-h-96 object-contain"
          />
        </div>
      );
    }

    if (isVideo) {
      return (
        <video
          controls
          className="w-full rounded-lg max-h-80"
          src={file.url}
        >
          Votre navigateur ne supporte pas la vidéo.
        </video>
      );
    }

    if (isAudio) {
      return (
        <div className="flex flex-col items-center gap-4 py-8">
          <FileIcon mimeType={file.mimeType} name={file.name} size="lg" />
          <audio controls className="w-full" src={file.url}>
            Votre navigateur ne supporte pas l&apos;audio.
          </audio>
        </div>
      );
    }

    if (isPDF) {
      return (
        <iframe
          src={`${file.url}#toolbar=0`}
          className="w-full h-96 rounded-lg border border-gray-700"
          title={file.name}
        />
      );
    }

    return (
      <div className="flex flex-col items-center justify-center h-48 gap-3">
        <FileIcon mimeType={file.mimeType} name={file.name} size="lg" />
        <p className="text-gray-400 text-sm">Prévisualisation non disponible</p>
        <a
          href={file.url}
          download={file.name}
          className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 text-sm"
        >
          <Download className="w-4 h-4" />
          Télécharger le fichier
        </a>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-800">
          <FileIcon mimeType={file.mimeType} name={file.name} size="sm" />
          <div className="flex-1 min-w-0">
            <h2 className="font-medium text-white truncate">{file.name}</h2>
            <p className="text-xs text-gray-500">
              {formatBytes(file.size)} •{" "}
              {isDrive ? "Google Drive" : "Fichier local"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {onAskAI && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAskAI(file._id, file.name)}
                className="gap-1.5"
              >
                <Bot className="w-3.5 h-3.5" />
                Interroger l&apos;IA
              </Button>
            )}
            {!isDrive && (
              <a href={file.url} download={file.name}>
                <Button size="sm" variant="ghost">
                  <Download className="w-4 h-4" />
                </Button>
              </a>
            )}
            <Button size="sm" variant="ghost" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-4 pt-3 border-b border-gray-800">
          {(["preview", "content", "info"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === tab
                  ? "text-white border-b-2 border-indigo-500"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              {tab === "preview" && "Aperçu"}
              {tab === "content" && "Contenu extrait"}
              {tab === "info" && "Informations"}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === "preview" && renderPreview()}

          {activeTab === "content" && (
            <div>
              {!file.processed ? (
                <div className="flex items-center gap-2 text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Traitement en cours...</span>
                </div>
              ) : file.transcription ? (
                <div>
                  <p className="text-xs text-indigo-400 uppercase font-semibold mb-2">
                    Transcription
                  </p>
                  <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {file.transcription}
                  </p>
                </div>
              ) : file.content ? (
                <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {file.content}
                </p>
              ) : (
                <p className="text-sm text-gray-500">
                  Aucun contenu textuel extrait.
                </p>
              )}
            </div>
          )}

          {activeTab === "info" && (
            <div className="space-y-3">
              {[
                { label: "Nom", value: file.name },
                { label: "Type", value: file.mimeType },
                { label: "Taille", value: formatBytes(file.size) },
                { label: "Source", value: isDrive ? "Google Drive" : "Fichier local" },
                { label: "Ajouté le", value: formatDate(file.createdAt) },
                {
                  label: "Traitement IA",
                  value: file.processed ? "Terminé" : "En cours...",
                },
              ].map(({ label, value }) => (
                <div key={label} className="flex gap-3">
                  <span className="text-xs font-medium text-gray-500 w-28 flex-shrink-0 pt-0.5">
                    {label}
                  </span>
                  <span className="text-sm text-gray-300 break-all">{value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
