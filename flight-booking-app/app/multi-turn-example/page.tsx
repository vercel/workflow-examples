'use client';

import { useMultiTurnChat } from '@/components/use-multi-turn-chat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

/**
 * Example page demonstrating multi-turn chat sessions
 * 
 * This shows how to:
 * 1. Start a new chat session
 * 2. Send follow-up messages within the same session
 * 3. End the session when done
 */
export default function MultiTurnChatExample() {
  const [inputText, setInputText] = useState('');
  const {
    messages,
    threadId,
    startSession,
    sendMessage,
    endSession,
    status,
  } = useMultiTurnChat();

  const handleStart = async () => {
    if (!inputText.trim()) return;
    await startSession(inputText);
    setInputText('');
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;
    await sendMessage(inputText);
    setInputText('');
  };

  const handleEnd = async () => {
    await endSession();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!threadId) {
      await handleStart();
    } else {
      await handleSend();
    }
  };

  return (
    <div className="flex flex-col w-full max-w-2xl mx-auto p-8 space-y-4">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Multi-Turn Chat Example</h1>
        <p className="text-muted-foreground">
          This demonstrates a multi-turn chat session where follow-up messages
          are injected into the running workflow via hooks.
        </p>
      </div>

      {threadId && (
        <div className="p-3 bg-muted rounded-lg">
          <p className="text-sm">
            <span className="font-medium">Thread ID:</span>{' '}
            <code className="text-xs">{threadId}</code>
          </p>
          <p className="text-sm">
            <span className="font-medium">Status:</span> {status}
          </p>
        </div>
      )}

      <div className="flex-1 border rounded-lg p-4 min-h-[400px] max-h-[600px] overflow-y-auto space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Start a conversation to see messages here
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`p-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground ml-auto max-w-[80%]'
                  : 'bg-muted max-w-[80%]'
              }`}
            >
              <div className="text-xs font-medium mb-1 opacity-70">
                {message.role}
              </div>
              {message.parts?.map((part, idx) => {
                if (part.type === 'text') {
                  return (
                    <div key={idx} className="text-sm">
                      {part.text}
                    </div>
                  );
                }
                return null;
              })}
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={
            threadId
              ? 'Send a follow-up message...'
              : 'Start a new conversation...'
          }
          disabled={status === 'submitted' || status === 'streaming'}
        />
        <Button
          type="submit"
          disabled={!inputText.trim() || status === 'submitted' || status === 'streaming'}
        >
          {threadId ? 'Send' : 'Start'}
        </Button>
        {threadId && (
          <Button type="button" variant="outline" onClick={handleEnd}>
            End Session
          </Button>
        )}
      </form>

      <div className="text-xs text-muted-foreground space-y-1">
        <p>
          <strong>How it works:</strong>
        </p>
        <ul className="list-disc list-inside space-y-1">
          <li>Click "Start" to begin a new chat session with a workflow</li>
          <li>
            Send follow-up messages which are injected into the running workflow
            via hooks
          </li>
          <li>
            The workflow continues processing your messages in the same session
          </li>
          <li>Click "End Session" to terminate the workflow</li>
        </ul>
      </div>
    </div>
  );
}

