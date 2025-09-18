import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Thread, ThreadMessage, CreateThreadRequest, UpdateThreadRequest } from '../types/thread';
import { threadsApi } from '../api/threads';

interface ThreadContextType {
  threads: Thread[];
  activeThread: Thread | null;
  activeThreadId: string | null;
  loading: boolean;
  error: string | null;

  // Actions
  loadThreads: () => Promise<void>;
  createNewThread: (data?: CreateThreadRequest) => Promise<Thread>;
  selectThread: (threadId: string) => Promise<void>;
  updateThread: (threadId: string, data: UpdateThreadRequest) => Promise<void>;
  deleteThread: (threadId: string) => Promise<void>;
  addMessageToCurrentThread: (message: Omit<ThreadMessage, 'id' | 'timestamp'>) => Promise<void>;
  updateActiveThreadMessages: (messages: ThreadMessage[]) => void;
  updateActiveThreadFromUIMessages: (messages: any[]) => void;
}

const ThreadContext = createContext<ThreadContextType | undefined>(undefined);

export const useThreadContext = () => {
  const context = useContext(ThreadContext);
  if (!context) {
    throw new Error('useThreadContext must be used within a ThreadProvider');
  }
  return context;
};

interface ThreadProviderProps {
  children: ReactNode;
}

export const ThreadProvider: React.FC<ThreadProviderProps> = ({ children }) => {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThread, setActiveThread] = useState<Thread | null>(null);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load all threads
  const loadThreads = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedThreads = await threadsApi.getAllThreads();
      setThreads(fetchedThreads);

      // If no active thread is set and we have threads, select the most recent one
      if (!activeThreadId && fetchedThreads.length > 0) {
        const mostRecentThread = fetchedThreads[0];
        setActiveThread(mostRecentThread);
        setActiveThreadId(mostRecentThread.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load threads');
    } finally {
      setLoading(false);
    }
  };

  // Create new thread
  const createNewThread = async (data: CreateThreadRequest = {}): Promise<Thread> => {
    try {
      setError(null);
      const newThread = await threadsApi.createThread(data);
      setThreads(prev => [newThread, ...prev]);
      setActiveThread(newThread);
      setActiveThreadId(newThread.id);
      return newThread;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create thread';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Select and load a specific thread
  const selectThread = async (threadId: string) => {
    try {
      setError(null);

      // Check if thread is already loaded with messages
      const existingThread = threads.find(t => t.id === threadId);
      if (existingThread && existingThread.messages.length > 0) {
        setActiveThread(existingThread);
        setActiveThreadId(threadId);
        return;
      }

      // Load thread with messages from server
      const thread = await threadsApi.getThread(threadId);
      setActiveThread(thread);
      setActiveThreadId(threadId);

      // Update the thread in the threads list
      setThreads(prev => prev.map(t => t.id === threadId ? thread : t));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load thread');
    }
  };

  // Update thread (rename, etc.)
  const updateThread = async (threadId: string, data: UpdateThreadRequest) => {
    try {
      setError(null);
      const updatedThread = await threadsApi.updateThread(threadId, data);

      setThreads(prev => prev.map(t => t.id === threadId ? updatedThread : t));

      if (activeThreadId === threadId) {
        setActiveThread(updatedThread);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update thread');
    }
  };

  // Delete thread
  const deleteThread = async (threadId: string) => {
    try {
      setError(null);
      await threadsApi.deleteThread(threadId);

      setThreads(prev => prev.filter(t => t.id !== threadId));

      if (activeThreadId === threadId) {
        const remainingThreads = threads.filter(t => t.id !== threadId);
        if (remainingThreads.length > 0) {
          await selectThread(remainingThreads[0].id);
        } else {
          setActiveThread(null);
          setActiveThreadId(null);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete thread');
    }
  };

  // Add message to current thread
  const addMessageToCurrentThread = async (message: Omit<ThreadMessage, 'id' | 'timestamp'>) => {
    if (!activeThreadId) {
      throw new Error('No active thread selected');
    }

    try {
      setError(null);
      const newMessage = await threadsApi.addMessage(activeThreadId, message);

      // Update active thread
      if (activeThread) {
        const updatedThread = {
          ...activeThread,
          messages: [...activeThread.messages, newMessage]
        };
        setActiveThread(updatedThread);

        // Update in threads list
        setThreads(prev => prev.map(t => t.id === activeThreadId ? updatedThread : t));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add message');
    }
  };

  // Update active thread messages (for real-time updates from chat)
  const updateActiveThreadMessages = (messages: ThreadMessage[]) => {
    if (!activeThread || !activeThreadId) return;

    const updatedThread = {
      ...activeThread,
      messages
    };
    setActiveThread(updatedThread);
    setThreads(prev => prev.map(t => t.id === activeThreadId ? updatedThread : t));
  };

  // Convert UI messages to thread messages and update
  const updateActiveThreadFromUIMessages = (uiMessages: any[]) => {
    if (!activeThread || !activeThreadId) return;

    const threadMessages: ThreadMessage[] = uiMessages.map(msg => ({
      id: msg.id,
      role: msg.role,
      content: msg.parts?.find((p: any) => p.type === 'text')?.text || '',
      timestamp: new Date().toISOString(),
      model: (msg.metadata as any)?.model || undefined
    }));

    updateActiveThreadMessages(threadMessages);
  };

  // Load threads on mount
  useEffect(() => {
    loadThreads();
  }, []);

  const value: ThreadContextType = {
    threads,
    activeThread,
    activeThreadId,
    loading,
    error,
    loadThreads,
    createNewThread,
    selectThread,
    updateThread,
    deleteThread,
    addMessageToCurrentThread,
    updateActiveThreadMessages,
    updateActiveThreadFromUIMessages
  };

  return (
    <ThreadContext.Provider value={value}>
      {children}
    </ThreadContext.Provider>
  );
};