"use client";

import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import {
  FolderOpen,
  Cloud,
  Bot,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Home,
  Search,
  Star,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

const navItems = [
  { id: "files", label: "Mes fichiers", icon: Home },
  { id: "drive", label: "Google Drive", icon: Cloud },
  { id: "ai", label: "Assistant IA", icon: Bot },
  { id: "search", label: "Rechercher", icon: Search },
  { id: "starred", label: "Favoris", icon: Star },
  { id: "trash", label: "Corbeille", icon: Trash2 },
];

export default function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "flex flex-col h-full bg-gray-900 border-r border-gray-800 transition-all duration-300",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-800">
        <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <FolderOpen className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <span className="font-bold text-white text-lg tracking-tight">DocAI</span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto text-gray-500 hover:text-gray-300 transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                isActive
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                  : "text-gray-400 hover:bg-gray-800 hover:text-gray-100"
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Footer utilisateur */}
      <div className="p-3 border-t border-gray-800">
        {session?.user && (
          <div className={cn("flex items-center gap-3 mb-2", collapsed && "justify-center")}>
            {session.user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={session.user.image}
                alt={session.user.name || ""}
                className="w-8 h-8 rounded-full flex-shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                {session.user.name?.[0]?.toUpperCase()}
              </div>
            )}
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">
                  {session.user.name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {session.user.email}
                </p>
              </div>
            )}
          </div>
        )}

        <div className={cn("flex gap-1", collapsed && "flex-col items-center")}>
          <button
            onClick={() => onViewChange("settings")}
            className={cn(
              "flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors",
              activeView === "settings"
                ? "bg-indigo-600/20 text-indigo-400"
                : "text-gray-400 hover:bg-gray-800 hover:text-gray-100"
            )}
            title="Paramètres"
          >
            <Settings className="w-3.5 h-3.5" />
            {!collapsed && "Paramètres"}
          </button>
          <button
            onClick={() => signOut({ callbackUrl: "/signin" })}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-gray-400 hover:bg-red-900/30 hover:text-red-400 transition-colors"
            title="Déconnexion"
          >
            <LogOut className="w-3.5 h-3.5" />
            {!collapsed && "Déconnexion"}
          </button>
        </div>
      </div>
    </aside>
  );
}
