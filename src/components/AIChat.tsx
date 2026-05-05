"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  Bot,
  User,
  Loader2,
  FileText,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: string[];
  timestamp: Date;
}

interface AIChatProps {
  initialFileId?: string;
  initialFileName?: string;
}

const SUGGESTIONS = [
  "Résume les documents disponibles",
  "Quels sont les points clés de ces fichiers ?",
  "Y a-t-il des informations importantes à retenir ?",
  "Traduis le contenu en anglais",
];

export default function AIChat({ initialFileId, initialFileName }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string>();
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>(
    initialFileId ? [initialFileId] : []
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (initialFileId && initialFileName) {
      setSelectedFileIds([initialFileId]);
      setMessages([
        {
          role: "assistant",
          content: `Bonjour ! Je suis prêt à répondre à vos questions sur **${initialFileName}**. Que souhaitez-vous savoir ?`,
          timestamp: new Date(),
        },
      ]);
    }
  }, [initialFileId, initialFileName]);

  const sendMessage = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || loading) return;

    setInput("");
    const userMessage: Message = {
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageText,
          conversationId,
          fileIds: selectedFileIds,
        }),
      });

      if (!res.ok) throw new Error("Erreur de réponse");

      const data = await res.json();
      setConversationId(data.conversationId);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.message,
          sources: data.sources,
          timestamp: new Date(),
        },
      ]);
    } catch {
      toast.error("Erreur lors de la communication avec l'IA");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Désolé, une erreur s'est produite. Veuillez réessayer.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-950">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-800 bg-gray-900">
        <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="font-semibold text-white">Assistant IA</h2>
          <p className="text-xs text-gray-500">
            {selectedFileIds.length > 0
              ? `${selectedFileIds.length} fichier(s) sélectionné(s)`
              : "Tous vos fichiers disponibles"}
          </p>
        </div>

        {initialFileName && (
          <div className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/30 rounded-lg">
            <FileText className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-xs text-indigo-300 max-w-32 truncate">
              {initialFileName}
            </span>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
            <div className="relative">
              <div className="w-16 h-16 bg-indigo-600/20 rounded-2xl flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-indigo-400" />
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-gray-950" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Comment puis-je vous aider ?
              </h3>
              <p className="text-sm text-gray-400 max-w-sm">
                Posez une question sur vos documents, et je répondrai en me basant sur leur contenu.
              </p>
            </div>

            {/* Suggestions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => sendMessage(suggestion)}
                  className="px-4 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-sm text-gray-300 text-left transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-3 animate-fadeIn ${
                msg.role === "user" ? "flex-row-reverse" : ""
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center ${
                  msg.role === "user"
                    ? "bg-indigo-600"
                    : "bg-gray-800 border border-gray-700"
                }`}
              >
                {msg.role === "user" ? (
                  <User className="w-4 h-4 text-white" />
                ) : (
                  <Bot className="w-4 h-4 text-indigo-400" />
                )}
              </div>

              {/* Bubble */}
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-indigo-600 text-white rounded-tr-sm"
                    : "bg-gray-800 text-gray-200 rounded-tl-sm"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                  {msg.content}
                </p>

                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-700">
                    <p className="text-xs text-gray-500 mb-1">Sources :</p>
                    <div className="flex flex-wrap gap-1">
                      {msg.sources.map((src) => (
                        <span
                          key={src}
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-700/50 rounded text-xs text-gray-400"
                        >
                          <FileText className="w-2.5 h-2.5" />
                          {src}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {loading && (
          <div className="flex gap-3 animate-fadeIn">
            <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center bg-gray-800 border border-gray-700">
              <Bot className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      {messages.length > 3 && (
        <div className="flex justify-center pb-2">
          <button
            onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })}
            className="p-1.5 bg-gray-800 rounded-full text-gray-400 hover:text-gray-200 transition-colors"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Input */}
      <div className="px-4 pb-4 pt-2 border-t border-gray-800">
        <div className="flex gap-2 items-end bg-gray-800 rounded-xl border border-gray-700 px-3 py-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Posez une question sur vos documents..."
            className="flex-1 border-0 bg-transparent focus-visible:ring-0 px-0 py-0 text-sm placeholder:text-gray-500"
            disabled={loading}
          />
          <Button
            size="icon"
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="h-7 w-7 flex-shrink-0 rounded-lg"
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
          </Button>
        </div>
        <p className="text-xs text-gray-600 text-center mt-2">
          L&apos;IA répond en se basant sur le contenu de vos documents
        </p>
      </div>
    </div>
  );
}
