'use client';

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import { Suggestion, Suggestions } from '@/components/ai-elements/suggestion';
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
import { RefreshCcwIcon, CopyIcon, GlobeIcon, ThumbsUpIcon, ThumbsDownIcon, MessageSquare } from 'lucide-react';
import { Fragment, useEffect, useState } from 'react';
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

const App = () => {
  const [input, setInput] = useState('');
  const [model, setModel] = useState<string>('');
  const [models, setModels] = useState<string[]>([]);
  const [webSearch, setWebSearch] = useState(false);
  const { messages, sendMessage, status, regenerate, stop, setMessages, error, clearError } = useChat({
    transport: new DefaultChatTransport({
      api: 'http://localhost:3001/api/chat',
    }),
    // experimental_throttle: 100,
  });

  useEffect(() => {
    console.log('fetching models');
    const fetchModels = async () => {
      const res = await fetch('http://localhost:3001/api/models')
      const data = await res.json();
      setModels(data.models);
      if (data.models && data.models.length > 0) {
        setModel(data.models[0].name);
      }
    }
    fetchModels();
  }, []);

  const handleSubmit = (message: PromptInputMessage) => {
    const hasText = Boolean(message.text);
    const hasAttachments = Boolean(message.files?.length);

    if (!(hasText || hasAttachments)) {
      return;
    }

    sendMessage(
      {
        text: message.text || 'Sent with attachments',
        files: message.files
      },
      {
        body: {
          model: model,
          webSearch: webSearch,
        },
      },
    );
    setInput('');
  };

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
  };


  return (
    <div className="min-h-screen w-full">
      {/* Main Chat Area - Uses browser scrolling */}
      <div className="max-w-4xl mx-auto px-6 py-6 pb-32">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-screen space-y-6">
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
      </div>

      {/* Fixed Input Area at Bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t">
        <div className="max-w-4xl mx-auto p-6">
          <PromptInput onSubmit={handleSubmit} globalDrop multiple>
            <PromptInputBody>
              <PromptInputAttachments>
                {(attachment) => <PromptInputAttachment data={attachment} />}
              </PromptInputAttachments>
              <PromptInputTextarea
                onChange={(e) => setInput(e.target.value)}
                value={input}
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
                {status === 'streaming' && (
                  <PromptInputButton
                    variant="destructive"
                    onClick={() => stop()}
                  >
                    Stop
                  </PromptInputButton>
                )}
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
                    {models.map((model: any) => (
                      <PromptInputModelSelectItem key={model.id} value={model.name}>
                        {model.name}
                      </PromptInputModelSelectItem>
                    ))}
                  </PromptInputModelSelectContent>
                </PromptInputModelSelect>
              </PromptInputTools>
              <PromptInputSubmit disabled={!input && status !== 'streaming'} status={status} />
            </PromptInputToolbar>
          </PromptInput>
        </div>
      </div>
    </div>
  );
};

export default App;