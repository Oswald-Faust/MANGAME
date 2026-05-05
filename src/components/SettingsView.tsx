"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import {
  User,
  Cloud,
  Shield,
  LogOut,
  RefreshCw,
  Info,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";

export default function SettingsView() {
  const { data: session } = useSession();

  const handleReconnectDrive = () => {
    signIn("google", {
      callbackUrl: "/",
      prompt: "consent",
    } as Parameters<typeof signIn>[1]);
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-950">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Paramètres</h1>
          <p className="text-gray-400 text-sm mt-1">
            Gérez votre compte et vos préférences
          </p>
        </div>

        {/* Profile section */}
        <section className="mb-6">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Profil
          </h2>
          <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
            <div className="p-5 flex items-center gap-4">
              {session?.user?.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={session.user.image}
                  alt={session.user.name || ""}
                  className="w-14 h-14 rounded-full border-2 border-gray-700"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xl font-bold">
                  {session?.user?.name?.[0]?.toUpperCase() ?? "?"}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-base truncate">
                  {session?.user?.name ?? "—"}
                </p>
                <p className="text-gray-400 text-sm truncate">
                  {session?.user?.email ?? "—"}
                </p>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-500/10 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                <span className="text-xs text-green-400 font-medium">Connecté</span>
              </div>
            </div>
          </div>
        </section>

        {/* Google Drive section */}
        <section className="mb-6">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Google Drive
          </h2>
          <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden divide-y divide-gray-800">
            <div className="p-5 flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Cloud className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium">
                  Accès Google Drive
                </p>
                <p className="text-gray-400 text-xs mt-0.5">
                  Lecture seule de vos fichiers Drive
                </p>
              </div>
            </div>
            <button
              onClick={handleReconnectDrive}
              className="w-full p-4 flex items-center gap-3 hover:bg-gray-800 transition-colors text-left"
            >
              <RefreshCw className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-gray-200">
                  Reconnecter Google Drive
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Rafraîchit les permissions si Drive ne fonctionne pas
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </section>

        {/* Permissions section */}
        <section className="mb-6">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Permissions accordées
          </h2>
          <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
            {[
              {
                icon: User,
                color: "text-indigo-400",
                bg: "bg-indigo-500/10",
                label: "Profil Google",
                desc: "Nom, photo et adresse e-mail",
              },
              {
                icon: Cloud,
                color: "text-blue-400",
                bg: "bg-blue-500/10",
                label: "Google Drive (lecture)",
                desc: "Accès en lecture seule à vos fichiers",
              },
              {
                icon: Shield,
                color: "text-green-400",
                bg: "bg-green-500/10",
                label: "OpenID Connect",
                desc: "Authentification sécurisée",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="flex items-center gap-4 p-4 border-b border-gray-800 last:border-0"
                >
                  <div className={`w-8 h-8 ${item.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-4 h-4 ${item.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-200 font-medium">{item.label}</p>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                </div>
              );
            })}
          </div>
        </section>

        {/* App info */}
        <section className="mb-8">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Application
          </h2>
          <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
            <div className="p-4 flex items-center gap-3 border-b border-gray-800">
              <Info className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <div className="flex-1 flex items-center justify-between">
                <span className="text-sm text-gray-400">Version</span>
                <span className="text-sm text-gray-200 font-medium">0.1.0</span>
              </div>
            </div>
            <div className="p-4 flex items-center gap-3">
              <Info className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <div className="flex-1 flex items-center justify-between">
                <span className="text-sm text-gray-400">Stack</span>
                <span className="text-sm text-gray-200 font-medium">
                  Next.js · MongoDB · Gemini AI
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Danger zone */}
        <section>
          <h2 className="text-xs font-semibold text-red-500/70 uppercase tracking-wider mb-3">
            Zone dangereuse
          </h2>
          <div className="bg-gray-900 rounded-2xl border border-red-900/40 overflow-hidden">
            <button
              onClick={() => signOut({ callbackUrl: "/signin" })}
              className="w-full p-4 flex items-center gap-3 hover:bg-red-900/10 transition-colors text-left"
            >
              <LogOut className="w-4 h-4 text-red-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-red-400 font-medium">Se déconnecter</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Ferme votre session et supprime le token local
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
