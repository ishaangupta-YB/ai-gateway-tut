export interface Thread {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ThreadMessage[];
}

export interface ThreadMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  model?: string;
}

// AI SDK 5.0 compatible UIMessage interface for our use
export interface UIMessagePart {
  type: 'text' | 'reasoning' | 'source-url' | 'file' | string;
  text?: string;
  url?: string;
  title?: string;
  state?: 'streaming' | 'done';
}

export interface CustomUIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  parts: UIMessagePart[];
  metadata?: unknown;
}

export interface CreateThreadRequest {
  title?: string;
  initialMessage?: Omit<ThreadMessage, 'id' | 'timestamp'>;
}

export interface UpdateThreadRequest {
  title?: string;
}

export interface ThreadsResponse {
  threads: Thread[];
}

export interface ThreadResponse {
  thread: Thread;
}

export interface MessageResponse {
  message: ThreadMessage;
}