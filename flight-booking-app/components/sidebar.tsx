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
}

export function Sidebar({
  conversations,
  activeRunId,
  onNewChat,
  onSelect,
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
          <button
            key={conv.runId}
            type="button"
            onClick={() => onSelect(conv.runId)}
            className={`w-full text-left px-3 py-2 rounded-md text-sm truncate transition-colors cursor-pointer ${
              activeRunId === conv.runId
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            }`}
            title={conv.title}
          >
            {conv.title}
          </button>
        ))}
      </nav>
    </aside>
  );
}
