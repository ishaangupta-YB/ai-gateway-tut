'use client';

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import { Suggestion, Suggestions } from '@/components/ai-elements/suggestion';
import { Message, MessageContent } from '@/components/ai-elements/message';
import {
  Actions,
  Action,
} from '@/components/ai-elements/actions';
import { RefreshCcwIcon, CopyIcon, ThumbsUpIcon, ThumbsDownIcon, MessageSquare } from 'lucide-react';
import { Fragment, forwardRef, useImperativeHandle } from 'react';
import { useChat } from '@ai-sdk/react';
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
import { ConversationEmptyState } from '@/components/ai-elements/conversation';

interface ChatInterfaceProps {
  model: string;
  webSearch: boolean;
  onSendMessage: (text: string) => void;
  totalModels?: number;
}

export interface ChatInterfaceRef {
  sendMessage: (text: string) => void;
}

const ChatInterface = forwardRef<ChatInterfaceRef, ChatInterfaceProps>(({ model, webSearch, onSendMessage, totalModels = 1 }, ref) => {
  const { messages, sendMessage, status, regenerate } = useChat({
    transport: new DefaultChatTransport({
      api: 'http://localhost:3001/api/chat',
    }),
  });

  const handleLike = (messageIndex: number) => {
    console.log('Like', messageIndex);
  };

  const handleDislike = (messageIndex: number) => {
    console.log('Dislike', messageIndex);
  };

  const suggestions = [
    'What are the latest news in NYC?',
    'Explain quantum computing in simple terms',
    'Help me write a professional email',
    'What are the best practices for React development?',
  ];

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(
      { text: suggestion },
      {
        body: {
          model: model,
          webSearch: webSearch,
        },
      },
    );
    onSendMessage(suggestion);
  };

  const handleMessageSend = (text: string) => {
    sendMessage(
      { text },
      {
        body: {
          model: model,
          webSearch: webSearch,
        },
      },
    );
    onSendMessage(text);
  };

  useImperativeHandle(ref, () => ({
    sendMessage: handleMessageSend,
  }));

  // Calculate dynamic width based on number of models
  const getWidthClass = () => {
    if (totalModels === 1) return 'w-full max-w-4xl';
    if (totalModels === 2) return 'w-1/2 min-w-[500px]';
    if (totalModels === 3) return 'w-1/3 min-w-[400px]';
    return 'w-[400px] min-w-[400px]'; // For 4+ models, use fixed width
  };

  return (
    <div className={`flex flex-col h-full border-r border-border last:border-r-0 ${getWidthClass()}`}>
      <div className="p-4 border-b border-border bg-muted/30 flex-shrink-0">
        <h3 className="font-medium text-sm">{model}</h3>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        <Conversation className="relative w-full h-full">
          <ConversationContent className="p-4 custom-scrollbar">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-full space-y-6">
                <ConversationEmptyState
                  icon={<MessageSquare className="size-12" />}
                  title="Start a conversation"
                  description="Choose a suggestion below or type your own message"
                />
                <Suggestions>
                  {suggestions.map((suggestion) => (
                    <Suggestion
                      key={suggestion}
                      onClick={handleSuggestionClick}
                      suggestion={suggestion}
                    />
                  ))}
                </Suggestions>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((message, messageIndex) => (
                  <div key={message.id}>
                    {message.role === 'assistant' && message.parts.filter((part) => part.type === 'source-url').length > 0 && (
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
                              href={part.url}
                              title={part.url}
                            />
                          </SourcesContent>
                        ))}
                      </Sources>
                    )}
                    {message.parts.map((part, i) => {
                      switch (part.type) {
                        case 'text':
                          return (
                            <Fragment key={`${message.id}-${i}`}>
                              <Message from={message.role}>
                                <MessageContent>
                                  <Response>{part.text}</Response>
                                </MessageContent>
                              </Message>
                            </Fragment>
                          );
                        case 'reasoning':
                          return (
                            <Reasoning
                              key={`${message.id}-${i}`}
                              className="w-full"
                              isStreaming={status === 'streaming' && i === message.parts.length - 1 && message.id === messages.at(-1)?.id}
                            >
                              <ReasoningTrigger />
                              <ReasoningContent>{part.text}</ReasoningContent>
                            </Reasoning>
                          );
                        default:
                          return null;
                      }
                    })}
                    {message.role === 'assistant' && (
                      <Actions className="mt-2">
                        <Action
                          onClick={() => regenerate()}
                          label="Retry"
                        >
                          <RefreshCcwIcon className="size-3" />
                        </Action>
                        <Action label="Like" onClick={() => handleLike(messageIndex)}>
                          <ThumbsUpIcon className="size-4" />
                        </Action>
                        <Action label="Dislike" onClick={() => handleDislike(messageIndex)}>
                          <ThumbsDownIcon className="size-4" />
                        </Action>
                        <Action
                          onClick={() => {
                            const textPart = message.parts.find((p: any) => p.type === 'text');
                            if (textPart && 'text' in textPart) {
                              navigator.clipboard.writeText(textPart.text);
                            }
                          }}
                          label="Copy"
                        >
                          <CopyIcon className="size-3" />
                        </Action>
                      </Actions>
                    )}
                  </div>
                ))}
                {status === 'submitted' && <Loader />}
              </div>
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
      </div>
    </div>
  );
});

ChatInterface.displayName = 'ChatInterface';

export default ChatInterface;