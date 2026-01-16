import type { ChatStatus } from 'ai';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { MyUIMessage } from '@/schemas/chat';
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from './ai-elements/prompt-input';

export default function ChatInput({
  status,
  textareaRef,
  setMessages,
  sendMessage,
  stop,
  onNewChat,
}: {
  status: ChatStatus;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  setMessages: (messages: MyUIMessage[]) => void;
  sendMessage: (
    message: PromptInputMessage & { metadata?: { createdAt: number } }
  ) => void;
  stop: () => void;
  onNewChat?: () => void | Promise<void>;
}) {
  const [text, setText] = useState('');

  return (
    <div className="fixed bottom-2 w-full max-w-2xl bg-background">
      <PromptInput
        onSubmit={(message: PromptInputMessage) => {
          const hasText = Boolean(message.text);
          if (!hasText) return;

          // Always send the message - the hook will handle routing
          // (either as new message or follow-up to existing thread)
          sendMessage({
            text: message.text || '',
            metadata: { createdAt: Date.now() },
          });
          setText('');
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
                if (onNewChat) {
                  await onNewChat();
                } else {
                  // Fallback if onNewChat not provided
                  localStorage.removeItem('active-workflow-run-id');
                  localStorage.removeItem('active-thread-id');
                  setMessages([]);
                }
                setText('');
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
