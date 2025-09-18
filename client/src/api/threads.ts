import type {
  Thread,
  ThreadMessage,
  CreateThreadRequest,
  UpdateThreadRequest,
  ThreadsResponse,
  ThreadResponse,
  MessageResponse
} from '../types/thread';

const API_BASE = 'http://localhost:3001/api';

export const threadsApi = {
  // Get all threads
  getAllThreads: async (): Promise<Thread[]> => {
    const response = await fetch(`${API_BASE}/threads`);
    if (!response.ok) {
      throw new Error('Failed to fetch threads');
    }
    const data: ThreadsResponse = await response.json();
    return data.threads;
  },

  // Get specific thread
  getThread: async (id: string): Promise<Thread> => {
    const response = await fetch(`${API_BASE}/threads/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch thread');
    }
    const data: ThreadResponse = await response.json();
    return data.thread;
  },

  // Create new thread
  createThread: async (threadData: CreateThreadRequest): Promise<Thread> => {
    const response = await fetch(`${API_BASE}/threads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(threadData),
    });
    if (!response.ok) {
      throw new Error('Failed to create thread');
    }
    const data: ThreadResponse = await response.json();
    return data.thread;
  },

  // Update thread
  updateThread: async (id: string, threadData: UpdateThreadRequest): Promise<Thread> => {
    const response = await fetch(`${API_BASE}/threads/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(threadData),
    });
    if (!response.ok) {
      throw new Error('Failed to update thread');
    }
    const data: ThreadResponse = await response.json();
    return data.thread;
  },

  // Delete thread
  deleteThread: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/threads/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete thread');
    }
  },

  // Add message to thread
  addMessage: async (threadId: string, message: Omit<ThreadMessage, 'id' | 'timestamp'>): Promise<ThreadMessage> => {
    const response = await fetch(`${API_BASE}/threads/${threadId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });
    if (!response.ok) {
      throw new Error('Failed to add message');
    }
    const data: MessageResponse = await response.json();
    return data.message;
  }
};