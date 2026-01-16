import type { ChatStatus } from "ai";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "./ai-elements/prompt-input";

export interface ChatInputProps {
  status: ChatStatus;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  onNewChat: () => void;
  onSendMessage: (text: string) => void;
  stop: () => void;
}

export default function ChatInput({
  status,
  textareaRef,
  onNewChat,
  onSendMessage,
  stop,
}: ChatInputProps) {
  const [text, setText] = useState("");

  return (
    <div className="fixed bottom-2 w-full max-w-2xl bg-background">
      <PromptInput
        onSubmit={(message: PromptInputMessage) => {
          const hasText = Boolean(message.text);
          if (!hasText) return;

          onSendMessage(message.text || "");
          setText("");
        }}
      >
        <PromptInputBody>
          <PromptInputTextarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ask me about flights, airports, or bookings..."
          />
        </PromptInputBody>
        <PromptInputFooter>
          <PromptInputTools>
            <Button
              type="button"
              size="sm"
              onClick={async () => {
                await stop();
                await onNewChat();
                setText("");
              }}
            >
              New Chat
            </Button>
          </PromptInputTools>
          <PromptInputSubmit status={status} disabled={!text.trim()} />
        </PromptInputFooter>
      </PromptInput>
    </div>
  );
}
