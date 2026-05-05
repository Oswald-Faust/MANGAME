import { getFileIcon } from "@/lib/utils";

const iconMap: Record<string, { bg: string; emoji: string }> = {
  image: { bg: "bg-purple-500/20", emoji: "🖼️" },
  video: { bg: "bg-pink-500/20", emoji: "🎬" },
  audio: { bg: "bg-orange-500/20", emoji: "🎵" },
  pdf: { bg: "bg-red-500/20", emoji: "📄" },
  word: { bg: "bg-blue-500/20", emoji: "📝" },
  excel: { bg: "bg-green-500/20", emoji: "📊" },
  powerpoint: { bg: "bg-orange-500/20", emoji: "📈" },
  text: { bg: "bg-gray-500/20", emoji: "📃" },
  code: { bg: "bg-cyan-500/20", emoji: "💻" },
  archive: { bg: "bg-yellow-500/20", emoji: "🗜️" },
  file: { bg: "bg-gray-500/20", emoji: "📁" },
};

interface FileIconProps {
  mimeType: string;
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function FileIcon({
  mimeType,
  name,
  size = "md",
  className = "",
}: FileIconProps) {
  const type = getFileIcon(mimeType, name);
  const { bg, emoji } = iconMap[type] || iconMap.file;

  const sizeClasses = {
    sm: "w-8 h-8 text-base",
    md: "w-10 h-10 text-lg",
    lg: "w-14 h-14 text-2xl",
  };

  return (
    <div
      className={`${sizeClasses[size]} ${bg} rounded-lg flex items-center justify-center flex-shrink-0 ${className}`}
    >
      <span>{emoji}</span>
    </div>
  );
}
