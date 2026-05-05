"use client";

import { useState, useCallback, useRef } from "react";
import { Upload, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { cn, formatBytes } from "@/lib/utils";
import { toast } from "sonner";

interface UploadFile {
  file: File;
  status: "pending" | "uploading" | "done" | "error";
  progress: number;
  id: string;
}

interface UploadZoneProps {
  folderId?: string;
  onUploadComplete?: () => void;
}

export default function UploadZone({ folderId, onUploadComplete }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<UploadFile[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (uploadFile: UploadFile) => {
    const formData = new FormData();
    formData.append("file", uploadFile.file);
    if (folderId) formData.append("folderId", folderId);

    setFiles((prev) =>
      prev.map((f) =>
        f.id === uploadFile.id ? { ...f, status: "uploading", progress: 0 } : f
      )
    );

    try {
      // Simulation progression
      const interval = setInterval(() => {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id && f.status === "uploading"
              ? { ...f, progress: Math.min(f.progress + 10, 90) }
              : f
          )
        );
      }, 200);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      clearInterval(interval);

      if (!res.ok) throw new Error("Échec de l'upload");

      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id
            ? { ...f, status: "done", progress: 100 }
            : f
        )
      );

      toast.success(`${uploadFile.file.name} uploadé avec succès`);
      onUploadComplete?.();
    } catch {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id ? { ...f, status: "error" } : f
        )
      );
      toast.error(`Erreur lors de l'upload de ${uploadFile.file.name}`);
    }
  };

  const addFiles = useCallback(
    (newFiles: File[]) => {
      const uploadFiles: UploadFile[] = newFiles.map((file) => ({
        file,
        status: "pending",
        progress: 0,
        id: Math.random().toString(36).slice(2),
      }));

      setFiles((prev) => [...prev, ...uploadFiles]);

      // Lancer les uploads
      uploadFiles.forEach((f) => uploadFile(f));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [folderId, onUploadComplete]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const droppedFiles = Array.from(e.dataTransfer.files);
      if (droppedFiles.length) addFiles(droppedFiles);
    },
    [addFiles]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <div className="space-y-3">
      {/* Zone de drop */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
          isDragging
            ? "border-indigo-500 bg-indigo-500/5"
            : "border-gray-700 hover:border-gray-600 hover:bg-gray-800/50"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            const selected = Array.from(e.target.files || []);
            if (selected.length) addFiles(selected);
            e.target.value = "";
          }}
        />
        <div className="flex flex-col items-center gap-3">
          <div
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
              isDragging ? "bg-indigo-500/20" : "bg-gray-800"
            )}
          >
            <Upload
              className={cn(
                "w-5 h-5 transition-colors",
                isDragging ? "text-indigo-400" : "text-gray-400"
              )}
            />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-200">
              {isDragging ? "Déposez vos fichiers ici" : "Glissez-déposez vos fichiers"}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              ou{" "}
              <span className="text-indigo-400 hover:underline">
                cliquez pour parcourir
              </span>
            </p>
          </div>
          <p className="text-xs text-gray-600">
            PDF, Word, Excel, images, vidéos, audio et plus
          </p>
        </div>
      </div>

      {/* Liste des fichiers en cours */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((f) => (
            <div
              key={f.id}
              className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-200 truncate">{f.file.name}</p>
                <p className="text-xs text-gray-500">{formatBytes(f.file.size)}</p>

                {f.status === "uploading" && (
                  <div className="mt-1.5 h-1 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                      style={{ width: `${f.progress}%` }}
                    />
                  </div>
                )}
              </div>

              <div className="flex-shrink-0">
                {f.status === "uploading" && (
                  <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                )}
                {f.status === "done" && (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                )}
                {f.status === "error" && (
                  <AlertCircle className="w-4 h-4 text-red-400" />
                )}
                {f.status === "pending" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(f.id);
                    }}
                    className="text-gray-500 hover:text-gray-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
