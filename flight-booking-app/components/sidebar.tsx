"use client";

import { Button } from "@/components/ui/button";

export interface ConversationEntry {
  runId: string;
  title: string;
  createdAt: number;
}

export const CONVERSATIONS_KEY = "sidebar-conversations";

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
    </aside>
  );
}
