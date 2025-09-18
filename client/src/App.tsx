'use client';

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import { Message, MessageContent } from '@/components/ai-elements/message';
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  PromptInputButton,
  type PromptInputMessage,
  PromptInputModelSelect,
  PromptInputModelSelectContent,
  PromptInputModelSelectItem,
  PromptInputModelSelectTrigger,
  PromptInputModelSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from '@/components/ai-elements/prompt-input';
import {
  Actions,
  Action,
} from '@/components/ai-elements/actions';
import { RefreshCcwIcon, CopyIcon, GlobeIcon } from 'lucide-react';
import { Fragment, useEffect, useState } from 'react';
import { useChat, type UIMessage } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { Response } from '@/components/ai-elements/response';
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from '@/components/ai-elements/sources';
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from '@/components/ai-elements/reasoning';
import { Loader } from '@/components/ai-elements/loader';
import { ThreadProvider, useThreadContext } from '@/contexts/ThreadContext';
import Sidebar from '@/components/Sidebar';
import type { ThreadMessage } from '@/types/thread';

// Chat component that uses thread context
const ChatInterface = () => {
  const [input, setInput] = useState('');
  const [model, setModel] = useState<string>('openai/gpt-4o');
  const [models, setModels] = useState<string[]>([]);
  const [webSearch, setWebSearch] = useState(false);

  const {
    activeThread,
    activeThreadId,
    createNewThread
  } = useThreadContext();

  // Convert thread messages to UI messages format for AI SDK 5.0
  const threadMessagesToUIMessages = (threadMessages: ThreadMessage[]): UIMessage[] => {
    return threadMessages.map(msg => ({
      id: msg.id,
      role: msg.role as 'user' | 'assistant' | 'system',
      parts: [{ type: 'text', text: msg.content }],
      metadata: { model: msg.model }
    }));
  };

  const { messages, sendMessage, status, regenerate, setMessages } = useChat({
    id: activeThreadId || undefined,
    messages: activeThread ? threadMessagesToUIMessages(activeThread.messages) : [],
    transport: new DefaultChatTransport({
      api: 'http://localhost:3001/api/chat',
      prepareSendMessagesRequest: ({ messages, id }) => {
        // Send only the last message to reduce payload, server will load previous messages
        const lastMessage = messages[messages.length - 1];
        return {
          body: {
            message: lastMessage,
            id: id || activeThreadId,
            model: model,
            webSearch: webSearch,
          }
        };
      }
    }),
    experimental_throttle: 100,
  });

  // Load thread messages when active thread changes
  useEffect(() => {
    if (activeThread && activeThread.messages.length > 0) {
      const uiMessages = threadMessagesToUIMessages(activeThread.messages);
      setMessages(uiMessages);
    } else if (!activeThread) {
      setMessages([]);
    }
  }, [activeThread?.id]); // Only depend on thread ID

  // Remove the problematic second useEffect that was causing the loop
  // Thread updates will be handled by the server's onFinish callback

  useEffect(() => {
    console.log('fetching models');
    const fetchModels = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/models');
        const data = await res.json();
        setModels(data.models);
      } catch (error) {
        console.error('Failed to fetch models:', error);
      }
    };
    fetchModels();
  }, []);

  const handleSubmit = async (message: PromptInputMessage) => {
    const hasText = Boolean(message.text);
    const hasAttachments = Boolean(message.files?.length);

    if (!(hasText || hasAttachments)) {
      return;
    }

    // If no active thread, create one
    if (!activeThreadId) {
      try {
        await createNewThread({
          title: message.text?.slice(0, 50) || 'New Conversation',
          initialMessage: {
            role: 'user',
            content: message.text || 'Sent with attachments',
            model: model
          }
        });
      } catch (error) {
        console.error('Failed to create new thread:', error);
        return;
      }
    }

    // Send message using AI SDK 5.0 format
    sendMessage({
      text: message.text || 'Sent with attachments',
      files: message.files
    });

    setInput('');
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="flex-1 flex flex-col">
        <Conversation className="h-full">
          <ConversationContent>
            {!activeThread && messages.length === 0 && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <h2 className="text-2xl font-semibold text-gray-700 mb-4">
                    Welcome to AI Chat
                  </h2>
                  <p className="text-gray-500 mb-8">
                    Start a conversation or select an existing one from the sidebar.
                  </p>
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div key={message.id}>
                {message.role === 'assistant' && message.parts?.filter((part) => part.type === 'source-url').length > 0 && (
                  <Sources>
                    <SourcesTrigger
                      count={
                        message.parts.filter(
                          (part) => part.type === 'source-url',
                        ).length
                      }
                    />
                    {message.parts.filter((part) => part.type === 'source-url').map((part, i) => (
                      <SourcesContent key={`${message.id}-${i}`}>
                        <Source
                          key={`${message.id}-${i}`}
                          href={part.url || ''}
                          title={part.title || part.url || ''}
                        />
                      </SourcesContent>
                    ))}
                  </Sources>
                )}
                {message.parts?.map((part, i) => {
                  switch (part.type) {
                    case 'text':
                      return (
                        <Fragment key={`${message.id}-${i}`}>
                          <Message from={message.role}>
                            <MessageContent>
                              <Response>
                                {part.text}
                              </Response>
                            </MessageContent>
                          </Message>
                          {message.role === 'assistant' && (
                            <Actions className="mt-2">
                              <Action
                                onClick={() => regenerate()}
                                label="Retry"
                              >
                                <RefreshCcwIcon className="size-3" />
                              </Action>
                              <Action
                                onClick={() =>
                                  navigator.clipboard.writeText(part.text || '')
                                }
                                label="Copy"
                              >
                                <CopyIcon className="size-3" />
                              </Action>
                            </Actions>
                          )}
                        </Fragment>
                      );
                    case 'reasoning':
                      return (
                        <Reasoning
                          key={`${message.id}-${i}`}
                          className="w-full"
                          isStreaming={status === 'streaming' && i === message.parts?.length - 1 && message.id === messages.at(-1)?.id}
                        >
                          <ReasoningTrigger />
                          <ReasoningContent>{part.text}</ReasoningContent>
                        </Reasoning>
                      );
                    default:
                      return null;
                  }
                })}
              </div>
            ))}
            {status === 'submitted' && <Loader />}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <PromptInput onSubmit={handleSubmit} className="mt-4" globalDrop multiple>
          <PromptInputBody>
            <PromptInputAttachments>
              {(attachment) => <PromptInputAttachment data={attachment} />}
            </PromptInputAttachments>
            <PromptInputTextarea
              onChange={(e) => setInput(e.target.value)}
              value={input}
              placeholder={activeThread ? 'Continue the conversation...' : 'Start a new conversation...'}
            />
          </PromptInputBody>
          <PromptInputToolbar>
            <PromptInputTools>
              <PromptInputActionMenu>
                <PromptInputActionMenuTrigger />
                <PromptInputActionMenuContent>
                  <PromptInputActionAddAttachments />
                </PromptInputActionMenuContent>
              </PromptInputActionMenu>
              <PromptInputButton
                variant={webSearch ? 'default' : 'ghost'}
                onClick={() => setWebSearch(!webSearch)}
              >
                <GlobeIcon size={16} />
                <span>Search</span>
              </PromptInputButton>
              <PromptInputModelSelect
                onValueChange={(value) => {
                  setModel(value);
                }}
                value={model}
              >
                <PromptInputModelSelectTrigger>
                  <PromptInputModelSelectValue />
                </PromptInputModelSelectTrigger>
                <PromptInputModelSelectContent>
                  {models.map((modelItem: any) => (
                    <PromptInputModelSelectItem key={modelItem.id} value={modelItem.name}>
                      {modelItem.name}
                    </PromptInputModelSelectItem>
                  ))}
                </PromptInputModelSelectContent>
              </PromptInputModelSelect>
            </PromptInputTools>
            <PromptInputSubmit disabled={!input && status !== 'ready'} status={status} />
          </PromptInputToolbar>
        </PromptInput>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <ThreadProvider>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 p-6">
          <ChatInterface />
        </div>
      </div>
    </ThreadProvider>
  );
};

export default App;