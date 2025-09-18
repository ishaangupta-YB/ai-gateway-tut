import React, { useState, useRef, useEffect } from 'react';
import {
  PlusIcon,
  MessageSquareIcon,
  SearchIcon,
  TrashIcon,
  EditIcon,
  CheckIcon,
  XIcon,
  MoreHorizontalIcon,
} from 'lucide-react';
import { useThreadContext } from '../contexts/ThreadContext';
import type { Thread } from '../types/thread';

const Sidebar: React.FC = () => {
  const {
    threads,
    activeThreadId,
    loading,
    error,
    createNewThread,
    selectThread,
    updateThread,
    deleteThread,
  } = useThreadContext();

  const [searchQuery, setSearchQuery] = useState('');
  const [editingThreadId, setEditingThreadId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const editInputRef = useRef<HTMLInputElement>(null);

  // Filter threads based on search query
  const filteredThreads = threads.filter(thread =>
    thread.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group threads by time (Today, Yesterday, Last 7 days, etc.)
  const groupThreadsByTime = (threads: Thread[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const groups = {
      today: [] as Thread[],
      yesterday: [] as Thread[],
      lastWeek: [] as Thread[],
      older: [] as Thread[],
    };

    threads.forEach(thread => {
      const threadDate = new Date(thread.updatedAt);
      if (threadDate >= today) {
        groups.today.push(thread);
      } else if (threadDate >= yesterday) {
        groups.yesterday.push(thread);
      } else if (threadDate >= weekAgo) {
        groups.lastWeek.push(thread);
      } else {
        groups.older.push(thread);
      }
    });

    return groups;
  };

  const threadGroups = groupThreadsByTime(filteredThreads);

  // Handle creating new thread
  const handleNewThread = async () => {
    try {
      await createNewThread();
    } catch (error) {
      console.error('Failed to create new thread:', error);
    }
  };

  // Handle thread selection
  const handleSelectThread = async (threadId: string) => {
    try {
      await selectThread(threadId);
    } catch (error) {
      console.error('Failed to select thread:', error);
    }
  };

  // Handle starting edit mode
  const handleStartEdit = (thread: Thread) => {
    setEditingThreadId(thread.id);
    setEditingTitle(thread.title);
  };

  // Handle saving edit
  const handleSaveEdit = async () => {
    if (!editingThreadId) return;

    try {
      await updateThread(editingThreadId, { title: editingTitle.trim() });
      setEditingThreadId(null);
      setEditingTitle('');
    } catch (error) {
      console.error('Failed to update thread:', error);
    }
  };

  // Handle canceling edit
  const handleCancelEdit = () => {
    setEditingThreadId(null);
    setEditingTitle('');
  };

  // Handle deleting thread
  const handleDeleteThread = async (threadId: string) => {
    if (confirm('Are you sure you want to delete this conversation?')) {
      try {
        await deleteThread(threadId);
      } catch (error) {
        console.error('Failed to delete thread:', error);
      }
    }
  };

  // Focus edit input when editing starts
  useEffect(() => {
    if (editingThreadId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingThreadId]);

  // Thread item component
  const ThreadItem: React.FC<{ thread: Thread }> = ({ thread }) => {
    const [showActions, setShowActions] = useState(false);
    const isActive = thread.id === activeThreadId;
    const isEditing = editingThreadId === thread.id;

    return (
      <div
        className={`group relative p-3 rounded-lg cursor-pointer transition-colors ${
          isActive
            ? 'bg-blue-50 border border-blue-200 text-blue-900'
            : 'hover:bg-gray-50 text-gray-700'
        }`}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        {isEditing ? (
          <div className="flex items-center gap-2">
            <input
              ref={editInputRef}
              type="text"
              value={editingTitle}
              onChange={(e) => setEditingTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveEdit();
                if (e.key === 'Escape') handleCancelEdit();
              }}
              className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={handleSaveEdit}
              className="p-1 text-green-600 hover:bg-green-100 rounded"
            >
              <CheckIcon size={14} />
            </button>
            <button
              onClick={handleCancelEdit}
              className="p-1 text-red-600 hover:bg-red-100 rounded"
            >
              <XIcon size={14} />
            </button>
          </div>
        ) : (
          <div
            className="flex items-center justify-between"
            onClick={() => !isActive && handleSelectThread(thread.id)}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <MessageSquareIcon size={14} className="flex-shrink-0" />
                <h3 className="text-sm font-medium truncate">{thread.title}</h3>
              </div>
              <p className="text-xs text-gray-500 truncate">
                {thread.messages.length} message{thread.messages.length !== 1 ? 's' : ''}
                {thread.messages.length > 0 && (
                  <span className="ml-2">
                    {new Date(thread.updatedAt).toLocaleDateString()}
                  </span>
                )}
              </p>
            </div>

            {(showActions || isActive) && (
              <div className="flex items-center gap-1 ml-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartEdit(thread);
                  }}
                  className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded"
                  title="Rename"
                >
                  <EditIcon size={12} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteThread(thread.id);
                  }}
                  className="p-1 text-red-500 hover:text-red-700 hover:bg-red-100 rounded"
                  title="Delete"
                >
                  <TrashIcon size={12} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Thread group component
  const ThreadGroup: React.FC<{ title: string; threads: Thread[] }> = ({ title, threads }) => {
    if (threads.length === 0) return null;

    return (
      <div className="mb-4">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-3">
          {title}
        </h4>
        <div className="space-y-1">
          {threads.map((thread) => (
            <ThreadItem key={thread.id} thread={thread} />
          ))}
        </div>
      </div>
    );
  };

  if (isCollapsed) {
    return (
      <div className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-4">
        <button
          onClick={() => setIsCollapsed(false)}
          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
          title="Expand sidebar"
        >
          <MessageSquareIcon size={20} />
        </button>
        <button
          onClick={handleNewThread}
          className="p-2 mt-4 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
          title="New conversation"
        >
          <PlusIcon size={20} />
        </button>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Conversations</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleNewThread}
              disabled={loading}
              className="p-2 text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 rounded-lg transition-colors"
              title="New conversation"
            >
              <PlusIcon size={16} />
            </button>
            <button
              onClick={() => setIsCollapsed(true)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              title="Collapse sidebar"
            >
              <MoreHorizontalIcon size={16} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <SearchIcon size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {error && (
          <div className="p-4 bg-red-50 border-l-4 border-red-500">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="p-4 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">Loading conversations...</p>
          </div>
        ) : threads.length === 0 ? (
          <div className="p-4 text-center">
            <MessageSquareIcon size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-sm text-gray-500 mb-4">No conversations yet</p>
            <button
              onClick={handleNewThread}
              className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Start your first conversation
            </button>
          </div>
        ) : filteredThreads.length === 0 ? (
          <div className="p-4 text-center">
            <SearchIcon size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-sm text-gray-500">No conversations match your search</p>
          </div>
        ) : (
          <div className="p-2">
            <ThreadGroup title="Today" threads={threadGroups.today} />
            <ThreadGroup title="Yesterday" threads={threadGroups.yesterday} />
            <ThreadGroup title="Last 7 days" threads={threadGroups.lastWeek} />
            <ThreadGroup title="Older" threads={threadGroups.older} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;