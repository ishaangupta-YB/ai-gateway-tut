'use client';

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import { Message, MessageContent } from '@/components/ai-elements/message';
import {
  Actions,
  Action,
} from '@/components/ai-elements/actions';
import { RefreshCcwIcon, CopyIcon, ThumbsUpIcon, ThumbsDownIcon, MessageSquare, StopCircleIcon, AlertCircleIcon } from 'lucide-react';
import { Fragment, forwardRef, useImperativeHandle, useState, useEffect } from 'react';
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

interface ResponseRating {
  messageId: string;
  model: string;
  rating: 'like' | 'dislike';
  timestamp: number;
  messageText: string;
}

export interface ChatInterfaceRef {
  sendMessage: (text: string) => void;
}

const ChatInterface = forwardRef<ChatInterfaceRef, ChatInterfaceProps>(({ model, webSearch, onSendMessage, totalModels = 1 }, ref) => {
  const [ratings, setRatings] = useState<Map<string, 'like' | 'dislike'>>(new Map());

  const { messages, sendMessage, status, regenerate, stop, error } = useChat({
    transport: new DefaultChatTransport({
      api: 'http://localhost:3001/api/chat',
    }),
    onError: error => {
      console.error('Chat error:', error);
    },
  });

  // Load ratings from localStorage on mount
  useEffect(() => {
    const savedRatings = localStorage.getItem('ai-chat-ratings');
    if (savedRatings) {
      try {
        const parsed: ResponseRating[] = JSON.parse(savedRatings);
        const ratingsMap = new Map<string, 'like' | 'dislike'>();
        parsed.forEach(rating => {
          if (rating.model === model) {
            ratingsMap.set(rating.messageId, rating.rating);
          }
        });
        setRatings(ratingsMap);
      } catch (error) {
        console.error('Error loading ratings from localStorage:', error);
      }
    }
  }, [model]);

  const saveRatingToStorage = (messageId: string, rating: 'like' | 'dislike', messageText: string) => {
    try {
      const existingRatings = localStorage.getItem('ai-chat-ratings');
      let ratings: ResponseRating[] = existingRatings ? JSON.parse(existingRatings) : [];

      // Remove existing rating for this message and model
      ratings = ratings.filter(r => !(r.messageId === messageId && r.model === model));

      // Add new rating
      ratings.push({
        messageId,
        model,
        rating,
        timestamp: Date.now(),
        messageText: messageText.substring(0, 100) // Store first 100 chars for reference
      });

      localStorage.setItem('ai-chat-ratings', JSON.stringify(ratings));
    } catch (error) {
      console.error('Error saving rating to localStorage:', error);
    }
  };

  const handleLike = (messageIndex: number) => {
    const message = messages[messageIndex];
    if (message && message.role === 'assistant') {
      const textPart = message.parts.find((p: any) => p.type === 'text');
      if (textPart && 'text' in textPart) {
        const newRating = ratings.get(message.id) === 'like' ? undefined : 'like';
        const newRatings = new Map(ratings);

        if (newRating) {
          newRatings.set(message.id, newRating);
          saveRatingToStorage(message.id, newRating, textPart.text);
        } else {
          newRatings.delete(message.id);
          // Remove from localStorage
          try {
            const existingRatings = localStorage.getItem('ai-chat-ratings');
            if (existingRatings) {
              let ratings: ResponseRating[] = JSON.parse(existingRatings);
              ratings = ratings.filter(r => !(r.messageId === message.id && r.model === model));
              localStorage.setItem('ai-chat-ratings', JSON.stringify(ratings));
            }
          } catch (error) {
            console.error('Error removing rating from localStorage:', error);
          }
        }

        setRatings(newRatings);
      }
    }
  };

  const handleDislike = (messageIndex: number) => {
    const message = messages[messageIndex];
    if (message && message.role === 'assistant') {
      const textPart = message.parts.find((p: any) => p.type === 'text');
      if (textPart && 'text' in textPart) {
        const newRating = ratings.get(message.id) === 'dislike' ? undefined : 'dislike';
        const newRatings = new Map(ratings);

        if (newRating) {
          newRatings.set(message.id, newRating);
          saveRatingToStorage(message.id, newRating, textPart.text);
        } else {
          newRatings.delete(message.id);
          // Remove from localStorage
          try {
            const existingRatings = localStorage.getItem('ai-chat-ratings');
            if (existingRatings) {
              let ratings: ResponseRating[] = JSON.parse(existingRatings);
              ratings = ratings.filter(r => !(r.messageId === message.id && r.model === model));
              localStorage.setItem('ai-chat-ratings', JSON.stringify(ratings));
            }
          } catch (error) {
            console.error('Error removing rating from localStorage:', error);
          }
        }

        setRatings(newRatings);
      }
    }
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

  const getWidthClass = () => {
    if (totalModels === 1) return 'w-full';
    if (totalModels === 2) return 'w-1/2 min-w-[500px]';
    if (totalModels === 3) return 'w-1/3 min-w-[400px]';
    return 'w-[400px] min-w-[400px]'; // For 4+ models, use fixed width
  };

  return (
    <div className={`flex flex-col h-full border-r border-border last:border-r-0 ${getWidthClass()}`}>
      <div className="p-4 border-b border-border bg-muted/30 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-sm">{model}</h3>
          {status === 'streaming' && (
            <button
              onClick={stop}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-red-500 hover:bg-red-600 text-white rounded transition-colors"
            >
              <StopCircleIcon className="size-3" />
              Stop
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        <Conversation className="relative w-full h-full">
          <ConversationContent className="p-4 custom-scrollbar">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-full space-y-6">
                <ConversationEmptyState
                  icon={<MessageSquare className="size-12" />}
                  title="Start a conversation" 
                /> 
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
                        <Action
                          label={ratings.get(message.id) === 'like' ? 'Liked' : 'Like'}
                          onClick={() => handleLike(messageIndex)}
                          className={ratings.get(message.id) === 'like' ? 'text-green-600' : ''}
                        >
                          <ThumbsUpIcon className={`size-4 ${ratings.get(message.id) === 'like' ? 'fill-current' : ''}`} />
                        </Action>
                        <Action
                          label={ratings.get(message.id) === 'dislike' ? 'Disliked' : 'Dislike'}
                          onClick={() => handleDislike(messageIndex)}
                          className={ratings.get(message.id) === 'dislike' ? 'text-red-600' : ''}
                        >
                          <ThumbsDownIcon className={`size-4 ${ratings.get(message.id) === 'dislike' ? 'fill-current' : ''}`} />
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
                {error && (
                  <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
                    <AlertCircleIcon className="size-5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="font-medium text-sm">Rate limit exceeded</div>
                      <div className="text-xs text-yellow-600 mt-1">
                        Please try again after some time.
                      </div> 
                    </div>
                  </div>
                )}
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