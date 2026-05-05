import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export function getFileIcon(mimeType: string, name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() || "";

  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType === "application/pdf" || ext === "pdf") return "pdf";
  if (
    mimeType.includes("word") ||
    mimeType.includes("document") ||
    ext === "doc" ||
    ext === "docx"
  )
    return "word";
  if (
    mimeType.includes("sheet") ||
    mimeType.includes("excel") ||
    ext === "xls" ||
    ext === "xlsx"
  )
    return "excel";
  if (
    mimeType.includes("presentation") ||
    mimeType.includes("powerpoint") ||
    ext === "ppt" ||
    ext === "pptx"
  )
    return "powerpoint";
  if (mimeType === "text/plain" || ext === "txt") return "text";
  if (ext === "json") return "code";
  if (["js", "ts", "jsx", "tsx", "py", "html", "css"].includes(ext))
    return "code";
  if (mimeType === "application/zip" || ext === "zip" || ext === "rar")
    return "archive";
  return "file";
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}
