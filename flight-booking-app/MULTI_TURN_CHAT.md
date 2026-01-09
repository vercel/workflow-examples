# Multi-Turn Chat Implementation

This document explains the multi-turn chat implementation that allows clients to send follow-up messages to a running workflow.

## Overview

The multi-turn chat system enables:
1. **Initial Session Creation**: Start a chat workflow with initial messages
2. **Message Injection**: Send follow-up messages that are injected into the running workflow via hooks
3. **Session Management**: Properly end sessions and clean up resources

## Architecture

### Components

#### 1. Client-Side Hook (`components/use-multi-turn-chat.ts`)

The `useMultiTurnChat()` hook manages the client-side chat session:

```typescript
const {
  messages,        // Array of all messages in the conversation
  threadId,        // Current thread ID (null if no active session)
  startSession,    // Function to start a new session
  sendMessage,     // Function to send follow-up messages
  endSession,      // Function to end the current session
  status,          // Current chat status ('submitted', 'streaming', etc.)
  stop,            // Function to stop generation
  setMessages,     // Function to manually update messages
} = useMultiTurnChat();
```

**Key Features:**
- Automatically manages workflow run IDs for reconnection
- Handles optimistic UI updates for follow-up messages
- Provides session lifecycle management

#### 2. Workflow (`workflows/chat/index.ts`)

The workflow implements the server-side chat logic:

```typescript
export async function chat(threadId: string, initialMessages: UIMessage[])
```

**Key Features:**
- Converts UIMessage[] to ModelMessage[] for the DurableAgent
- Implements a loop that waits for user messages via hooks
- Maintains conversation state across multiple turns
- Returns ModelMessage[] which gets converted to UIMessage[] by the streaming infrastructure

**Flow:**
1. Converts initial UIMessages to ModelMessages
2. Processes messages through DurableAgent
3. Waits for next user message via `chatMessageHook`
4. Adds user message to conversation and continues loop
5. Ends when `/done` message is received

#### 3. API Routes

##### POST `/api/chat`
Creates a new chat workflow:
- Accepts `{ threadId, messages }` or messages with threadId in metadata
- Starts the workflow with `start(chat, [threadId, messages])`
- Returns streaming response with `x-workflow-run-id` header

##### POST `/api/chat/[id]`
Injects messages into running workflow:
- Accepts `{ message }` in body
- Resumes the workflow hook: `chatMessageHook.resume()`
- Returns success response

##### GET `/api/chat/[id]/stream`
Reconnects to an existing workflow stream:
- Used for automatic reconnection after network failures
- Returns the workflow's readable stream starting from the specified index

#### 4. Hooks (`workflows/chat/hooks/chat-message.ts`)

The `chatMessageHook` enables message injection:

```typescript
export const chatMessageHook = defineHook({
  schema: z.object({
    message: z.string(),
  }),
});
```

**Usage in workflow:**
```typescript
const hook = chatMessageHook.create({ token: `thread:${threadId}` });
const { message } = await hook; // Waits for message injection
```

**Usage in API route:**
```typescript
await chatMessageHook.resume(`thread:${threadId}`, { message });
```

## Message Type Conversions

The implementation handles two message formats:

### UIMessage (Client Format)
```typescript
interface UIMessage {
  id: string;
  role: 'user' | 'assistant';
  parts: Array<{ type: string; text?: string; ... }>;
}
```

### ModelMessage (Agent Format)
```typescript
type ModelMessage = 
  | { role: 'system'; content: string }
  | { role: 'user'; content: string }
  | { role: 'assistant'; content: string | Array<ToolCall> }
```

**Conversion Flow:**
1. Client sends UIMessage[] to API
2. Workflow converts to ModelMessage[] using `convertToModelMessages()`
3. DurableAgent processes ModelMessage[]
4. Results are returned as ModelMessage[]
5. Streaming infrastructure converts back to UIMessage[] for client

## Usage Example

```typescript
'use client';

import { useMultiTurnChat } from '@/components/use-multi-turn-chat';

export default function ChatPage() {
  const {
    messages,
    threadId,
    startSession,
    sendMessage,
    endSession,
    status,
  } = useMultiTurnChat();

  // Start a new session
  const handleStart = async () => {
    await startSession('Hello, I need help booking a flight');
  };

  // Send follow-up message in the same session
  const handleSendFollowUp = async () => {
    if (!threadId) return;
    await sendMessage('What about flights to Los Angeles?');
  };

  // End the session
  const handleEnd = async () => {
    await endSession();
  };

  return (
    <div>
      {/* Render messages */}
      {messages.map(msg => <div key={msg.id}>{/* ... */}</div>)}
      
      {!threadId ? (
        <button onClick={handleStart}>Start Chat</button>
      ) : (
        <>
          <button onClick={handleSendFollowUp}>Send Message</button>
          <button onClick={handleEnd}>End Session</button>
        </>
      )}
    </div>
  );
}
```

## Testing the Implementation

1. **Start the development server:**
   ```bash
   pnpm dev
   ```

2. **Navigate to the example page:**
   ```
   http://localhost:3000/multi-turn-example
   ```

3. **Test the flow:**
   - Enter an initial message and click "Start"
   - Wait for the assistant's response
   - Send follow-up messages
   - Observe how messages are injected into the running workflow
   - Click "End Session" to terminate

4. **Test edge cases:**
   - Network interruptions (should auto-reconnect)
   - Rapid message sending (should queue properly)
   - Page refresh during active session
   - Multiple concurrent sessions

## Comparison with Standard useChat

### Standard useChat (Original Implementation)
- Each message starts a new workflow
- No session continuity
- Simpler but less efficient for conversations

### useMultiTurnChat (New Implementation)
- Single workflow handles multiple messages
- Maintains session state across turns
- More efficient for multi-turn conversations
- Requires explicit session management

## Best Practices

1. **Always end sessions**: Call `endSession()` when done to free resources
2. **Handle errors**: Implement error boundaries and retry logic
3. **Validate thread IDs**: Check `threadId` exists before sending messages
4. **Clean up on unmount**: Use useEffect cleanup to end sessions
5. **Monitor status**: Disable inputs during `'submitted'` and `'streaming'` states

## Troubleshooting

### Messages not appearing
- Check that threadId is set after `startSession()`
- Verify the workflow hook is properly created with the correct token
- Ensure the API route is correctly resuming the hook

### Type errors
- Ensure UIMessage and ModelMessage types are properly imported from 'ai'
- Verify `convertToModelMessages()` is available in your AI SDK version
- Check that return types match expected formats

### Session not ending
- Verify `/done` message is being sent to the hook endpoint
- Check workflow logs for the ending message
- Ensure cleanup code is running in `endSession()`

## Future Enhancements

1. **Message Queueing**: Implement proper queueing for rapid-fire messages
2. **Persistent Sessions**: Store sessions in database for long-term continuity
3. **Multiple Agents**: Support switching between different agents mid-session
4. **Branching Conversations**: Allow forking conversations at any point
5. **Session History**: Store and retrieve past sessions

