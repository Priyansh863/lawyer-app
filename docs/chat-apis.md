# Chat System – API Reference

This document explains **all APIs used for the chat system**, organized by **UI action** and component.

---

## 1. Main Chat List (`/chat`)

### 1.1 Load chat list

- **UI place**: 
  - `components/chat/chat-list.tsx` (main chat list)
  - `components/chat/simple-chat-list.tsx` (simplified sidebar chat list)
- **When it's called**:
  - On page load of `/chat`
  - When search query changes
- **Frontend function**:
  - `getChats()` from `lib/api/chat-api.ts` (main chat)
  - `getUserChats()` from `lib/api/simple-chat-api.ts` (simple chat)
- **HTTP request**:
  ```
  GET {API_BASE_URL}/chat/my-chats
  ```
- **Query params**:
  - `query` (optional, search term)
  - `page` (default: 1)
  - `limit` (default: 20)
- **Used in**:
  - `components/chat/chat-list.tsx` → `fetchChats()`
  - `components/chat/simple-chat-list.tsx` → `loadChats()`

---

## 2. Opening/Creating a Chat

### 2.1 Create or get existing chat

- **UI place**:
  - Clicking on a user in chat list
  - Starting a new chat from a user profile
- **Frontend function**:
  - `createOrGetChat(participantId)` from `lib/api/simple-chat-api.ts`
- **HTTP request**:
  ```
  POST {API_BASE_URL}/chat/create
  ```
- **Request body**:
  ```json
  {
    "participantId": "user_id_here"
  }
  ```
- **Used in**:
  - `components/chat/simple-chat.tsx` (when opening chat by clientId)
  - `components/modals/chat-consultation-modal.tsx`

---

## 3. Chat Messages

### 3.1 Load chat messages

- **UI place**:
  - When opening a chat
  - When scrolling up to load older messages
- **Frontend function**:
  - `getChatMessages(chatId, page, limit)` from `lib/api/simple-chat-api.ts`
- **HTTP request**:
  ```
  GET {API_BASE_URL}/chat/{chatId}/messages
  ```
- **Query params**:
  - `page` (default: 1)
  - `limit` (default: 50)
- **Used in**:
  - `components/chat/simple-chat.tsx` → `initializeChat()`

### 3.2 Send message

- **UI place**:
  - Message input in chat window
- **Frontend function**:
  - `sendMessage({ chatId, message, messageType })` from `lib/api/simple-chat-api.ts`
- **HTTP request**:
  ```
  POST {API_BASE_URL}/chat/{chatId}/send
  ```
- **Request body**:
  ```json
  {
    "message": "Hello!",
    "messageType": "text"
  }
  ```
- **Used in**:
  - `components/chat/simple-chat.tsx` → `handleSendMessage()`
  - `components/modals/send-message-modal.tsx`

### 3.3 Mark messages as read

- **UI place**:
  - When opening a chat
  - When receiving new messages while chat is open
- **Frontend function**:
  - `markMessagesAsRead(chatId)` from `lib/api/chat-api.ts`
- **HTTP request**:
  ```
  POST {API_BASE_URL}/chat/{chatId}/read
  ```
- **Used in**:
  - `hooks/use-chat.ts` → `markMessagesAsRead()`

---

## 4. Chat Management

### 4.1 Delete chat

- **UI place**:
  - Delete icon in chat list
- **Frontend function**:
  - `deleteChat(chatId)` from `lib/api/simple-chat-api.ts`
- **HTTP request**:
  ```
  DELETE {API_BASE_URL}/chat/{chatId}
  ```
- **Used in**:
  - `components/chat/simple-chat-list.tsx` → `confirmDeleteChat()`

### 4.2 Get chat summary (AI)

- **UI place**:
  - Chat info/header
- **Frontend function**:
  - `getChatSummary(chatId)` from `lib/api/chat-api.ts`
- **HTTP request**:
  ```
  GET {API_BASE_URL}/chat/{chatId}/summary
  ```
- **Used in**:
  - `hooks/use-chat.ts` → `loadChatSummary()`

---

## 5. Real-time Events (WebSocket)

### 5.1 Join chat room

- **When**:
  - Opening a chat
- **Socket event**:
  ```typescript
  socket.emit('join_chat', { chatId })
  ```
- **Used in**:
  - `hooks/use-chat.ts` → `joinChat()`

### 5.2 Send message (real-time)

- **When**:
  - Sending a message
- **Socket event**:
  ```typescript
  socket.emit('send_message', {
    chatId,
    message: content,
    messageType: 'text'
  })
  ```
- **Used in**:
  - `hooks/use-chat.ts` → `sendMessage()`

### 5.3 Typing indicators

- **When**:
  - User starts/stops typing
- **Socket events**:
  ```typescript
  // Start typing
  socket.emit('start_typing', { chatId })
  
  // Stop typing
  socket.emit('stop_typing', { chatId })
  ```
- **Used in**:
  - `hooks/use-chat.ts` → `startTyping()` / `stopTyping()`

---

## 6. Next.js API Routes

### 6.1 `/api/chat/messages/read`

- **Method**: `POST`
- **Purpose**: Mark messages as read
- **Used by**: Frontend as a proxy to mark messages read
- **File**: `app/api/chat/message/read/route.ts`

### 6.2 `/api/chat/messages/send`

- **Method**: `POST`
- **Purpose**: Send message (alternative to direct WebSocket)
- **File**: `app/api/chat/message/read/send/route.ts`

---

## 7. Key Files and Their Roles

- `lib/api/chat-api.ts` - Main chat API functions (used by `useChat` hook)
- `lib/api/simple-chat-api.ts` - Simplified chat API (used by popup/chatbox UI)
- `hooks/use-chat.ts` - Main chat hook with real-time logic
- `components/chat/` - Chat components
  - `chat-list.tsx` - Main chat list
  - `simple-chat.tsx` - Chat window component
  - `simple-chat-list.tsx` - Sidebar chat list
- `app/api/chat/` - Next.js API routes for chat

## 8. Environment Variables

```env
NEXT_PUBLIC_API_URL=https://d3qiclz5mtkmyk.cloudfront.net/api/v1  # Your API base URL
```
