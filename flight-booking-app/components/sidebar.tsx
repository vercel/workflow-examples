"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

export interface ConversationEntry {
  runId: string;
  title: string;
  createdAt: number;
}

export const CONVERSATIONS_KEY = "sidebar-conversations";
const THEME_KEY = "theme-preference";

export function loadConversations(): ConversationEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CONVERSATIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveConversations(conversations: ConversationEntry[]) {
  localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
}

interface SidebarProps {
  conversations: ConversationEntry[];
  activeRunId: string | null;
  showDebug: boolean;
  onNewChat: () => void;
  onSelect: (runId: string) => void;
  onDelete: (runId: string) => void;
  onToggleDebug: () => void;
}

export function Sidebar({
  conversations,
  activeRunId,
  showDebug,
  onNewChat,
  onSelect,
  onDelete,
  onToggleDebug,
}: SidebarProps) {
  const [theme, setTheme] = useState<"system" | "light" | "dark">("dark");

  useEffect(() => {
    const stored = localStorage.getItem(THEME_KEY) as "system" | "light" | "dark" | null;
    const initial = stored || "dark";
    setTheme(initial);
    applyTheme(initial);
  }, []);

  const applyTheme = (t: "system" | "light" | "dark") => {
    if (t === "system") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.body.classList.toggle("dark", prefersDark);
    } else {
      document.body.classList.toggle("dark", t === "dark");
    }
  };

  const setThemeAndPersist = (t: "system" | "light" | "dark") => {
    setTheme(t);
    localStorage.setItem(THEME_KEY, t);
    applyTheme(t);
  };

  return (
    <aside className="w-64 flex-shrink-0 border-r border-border bg-muted/30 flex flex-col h-screen">
      <div className="p-3 border-b border-border">
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={onNewChat}
        >
          + New Chat
        </Button>
      </div>
      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {conversations.length === 0 && (
          <p className="px-3 py-4 text-sm text-muted-foreground text-center">
            No conversations yet
          </p>
        )}
        {conversations.map((conv) => (
          <div
            key={conv.runId}
            className={`group flex items-center rounded-md transition-colors ${
              activeRunId === conv.runId
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            }`}
          >
            <button
              type="button"
              onClick={() => onSelect(conv.runId)}
              className="flex-1 text-left px-3 py-2 text-sm truncate cursor-pointer"
              title={conv.title}
            >
              {conv.title}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(conv.runId);
              }}
              className="hidden group-hover:flex items-center justify-center shrink-0 w-7 h-7 mr-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer"
              title="Delete conversation"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        ))}
      </nav>
      <div className="p-3 border-t border-border space-y-1">
        <button
          type="button"
          onClick={onToggleDebug}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors cursor-pointer"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20v-6M6 20V10M18 20V4" />
          </svg>
          {showDebug ? "Hide" : "Show"} debug info
        </button>
        <div className="flex items-center gap-1 px-2">
          <span className="text-xs text-muted-foreground mr-auto">Theme</span>
          {(["system", "light", "dark"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setThemeAndPersist(t)}
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                theme === t
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              }`}
              title={t.charAt(0).toUpperCase() + t.slice(1)}
            >
              {t === "system" && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
              )}
              {t === "light" && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              )}
              {t === "dark" && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
