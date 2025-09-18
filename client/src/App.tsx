'use client';

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
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from '@/components/ai-elements/prompt-input';
import { GlobeIcon } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import Navbar from '@/components/Navbar';
import ModelSettings from '@/components/ModelSettings';
import ChatInterface, { type ChatInterfaceRef } from '@/components/ChatInterface';

const App = () => {
  const [input, setInput] = useState('');
  const [models, setModels] = useState<any[]>([]);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [webSearch, setWebSearch] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const chatInterfaceRefs = useRef<{ [key: string]: ChatInterfaceRef | null }>({});

  useEffect(() => {
    console.log('fetching models');
    const fetchModels = async () => {
      const res = await fetch('http://localhost:3001/api/models')
      const data = await res.json();
      setModels(data.models);
      // Set default model selection - prefer Gemini Flash 2.5, fallback to first available
      if (data.models && data.models.length > 0) {
        const geminiFlash = data.models.find((model: any) =>
          model.name.includes("Gemini 2.0 Flash") ||
          model.name.includes("Gemini 2.5 Flash")
        ); 
        // console.log(data.models);
        setSelectedModels([geminiFlash ? geminiFlash.name : data.models[0].name]);
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

    const messageText = message.text || 'Sent with attachments';

    // Send message to all selected chat interfaces
    selectedModels.forEach(modelName => {
      const ref = chatInterfaceRefs.current[modelName];
      if (ref) {
        ref.sendMessage(messageText);
      }
    });

    setInput('');
  };

  const handleMessageSent = (text: string) => {
    // This callback will be used to sync between interfaces if needed
    console.log('Message sent:', text);
  };

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden">
      <Navbar onSettingsClick={() => setIsSettingsOpen(true)} />

      <ModelSettings
        isOpen={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        models={models}
        selectedModels={selectedModels}
        onSelectedModelsChange={setSelectedModels}
      />

      {/* Main Content Container - Takes remaining space */}
      <div className="flex-1 min-h-0 flex flex-col">
        {/* Chat Area - Scrollable content */}
        <div className="flex-1 overflow-hidden">
          {selectedModels.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-4">
                <h2 className="text-xl font-semibold text-muted-foreground">No models selected</h2>
                <p className="text-muted-foreground">Please select at least one model from settings to start chatting</p>
              </div>
            </div>
          ) : (
            <div className={`flex h-full overflow-x-auto overflow-y-hidden custom-scrollbar ${
              selectedModels.length === 1 ? 'justify-center' : ''
            }`}>
              {selectedModels.map((modelName) => (
                <ChatInterface
                  key={modelName}
                  model={modelName}
                  webSearch={webSearch}
                  onSendMessage={handleMessageSent}
                  totalModels={selectedModels.length}
                  ref={(ref) => {
                    chatInterfaceRefs.current[modelName] = ref;
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Fixed Input Area at Bottom - Always visible */}
        {selectedModels.length > 0 && (
          <div className="flex-shrink-0 border-t bg-background">
            <div className="  max-w-3xl mx-auto p-6">
              <PromptInput onSubmit={handleSubmit} globalDrop multiple>
                <PromptInputBody>
                  <PromptInputAttachments>
                    {(attachment) => <PromptInputAttachment data={attachment} />}
                  </PromptInputAttachments>
                  <PromptInputTextarea
                    onChange={(e) => setInput(e.target.value)}
                    value={input}
                    placeholder={`Send message to selected models`}
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
                    {/* Commented out model selector as requested */}
                    {/* <PromptInputModelSelect
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
                    </PromptInputModelSelect> */}
                  </PromptInputTools>
                  <PromptInputSubmit disabled={!input} />
                </PromptInputToolbar>
              </PromptInput>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;