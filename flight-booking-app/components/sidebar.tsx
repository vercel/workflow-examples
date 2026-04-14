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
  onNewChat: () => void;
  onSelect: (runId: string) => void;
  onDelete: (runId: string) => void;
}

export function Sidebar({
  conversations,
  activeRunId,
  onNewChat,
  onSelect,
  onDelete,
}: SidebarProps) {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "light") {
      setIsDark(false);
      document.body.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.body.classList.add("dark");
      localStorage.setItem(THEME_KEY, "dark");
    } else {
      document.body.classList.remove("dark");
      localStorage.setItem(THEME_KEY, "light");
    }
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
      <div className="p-3 border-t border-border">
        <button
          type="button"
          onClick={toggleTheme}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors cursor-pointer"
        >
          {isDark ? (
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
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
          {isDark ? "Light mode" : "Dark mode"}
        </button>
      </div>
    </aside>
  );
}
