import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { nanoid } from 'nanoid';

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

export interface CreateThreadRequest {
  title?: string;
  initialMessage?: Omit<ThreadMessage, 'id' | 'timestamp'>;
}

export interface UpdateThreadRequest {
  title?: string;
}

class ThreadStorage {
  private dataPath: string;
  private threads: Thread[] = [];

  constructor() {
    this.dataPath = join(process.cwd(), 'threads.json');
    this.loadThreads();
  }

  private loadThreads() {
    try {
      if (existsSync(this.dataPath)) {
        const data = readFileSync(this.dataPath, 'utf8');
        this.threads = JSON.parse(data);
      }
    } catch (error) {
      console.warn('Error loading threads:', error);
      this.threads = [];
    }
  }

  private saveThreads() {
    try {
      writeFileSync(this.dataPath, JSON.stringify(this.threads, null, 2));
    } catch (error) {
      console.error('Error saving threads:', error);
    }
  }

  getAllThreads(): Thread[] {
    return this.threads.sort((a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  getThreadById(id: string): Thread | null {
    return this.threads.find(thread => thread.id === id) || null;
  }

  createThread(data: CreateThreadRequest): Thread {
    const now = new Date().toISOString();
    const thread: Thread = {
      id: nanoid(),
      title: data.title || 'New Conversation',
      createdAt: now,
      updatedAt: now,
      messages: []
    };

    if (data.initialMessage) {
      thread.messages.push({
        ...data.initialMessage,
        id: nanoid(),
        timestamp: now
      });
    }

    this.threads.push(thread);
    this.saveThreads();
    return thread;
  }

  updateThread(id: string, data: UpdateThreadRequest): Thread | null {
    const threadIndex = this.threads.findIndex(thread => thread.id === id);
    if (threadIndex === -1) return null;

    const thread = this.threads[threadIndex];
    const updatedThread = {
      ...thread,
      ...data,
      updatedAt: new Date().toISOString()
    };

    this.threads[threadIndex] = updatedThread;
    this.saveThreads();
    return updatedThread;
  }

  deleteThread(id: string): boolean {
    const initialLength = this.threads.length;
    this.threads = this.threads.filter(thread => thread.id !== id);

    if (this.threads.length < initialLength) {
      this.saveThreads();
      return true;
    }
    return false;
  }

  addMessageToThread(threadId: string, message: Omit<ThreadMessage, 'id' | 'timestamp'>): ThreadMessage | null {
    const thread = this.getThreadById(threadId);
    if (!thread) return null;

    const threadMessage: ThreadMessage = {
      ...message,
      id: nanoid(),
      timestamp: new Date().toISOString()
    };

    thread.messages.push(threadMessage);
    thread.updatedAt = new Date().toISOString();

    // Auto-update thread title if it's still default and we have a user message
    if (thread.title === 'New Conversation' && message.role === 'user' && message.content.trim()) {
      thread.title = message.content.slice(0, 50) + (message.content.length > 50 ? '...' : '');
    }

    this.saveThreads();
    return threadMessage;
  }

  getThreadMessages(threadId: string): ThreadMessage[] {
    const thread = this.getThreadById(threadId);
    return thread ? thread.messages : [];
  }
}

export const threadStorage = new ThreadStorage();