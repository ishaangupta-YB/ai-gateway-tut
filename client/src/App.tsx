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
import { GlobeIcon, Settings2, User } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import Navbar from '@/components/Navbar';
import ModelSettings from '@/components/ModelSettings';
import ChatInterface, { type ChatInterfaceRef } from '@/components/ChatInterface';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
    <SidebarProvider>
      <div className="h-screen w-screen flex overflow-hidden">
        <Sidebar>
          <SidebarHeader>
            <SidebarGroup>
              <SidebarGroupLabel>AI Pasta</SidebarGroupLabel>
            </SidebarGroup>
          </SidebarHeader>
          <SidebarContent> 
            <SidebarGroup>
              <SidebarGroupLabel>Conversations</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton disabled>
                      Conversation Feature Coming Soon. Stay Tuned!
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
             
            <SidebarGroup>
              <SidebarGroupContent>
                <div className="flex items-center gap-3 px-2 py-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face" alt="User" />
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">Ishaan Gupta</p>
                    <p className="text-xs text-muted-foreground truncate">ishaang@example.com</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 hover:bg-sidebar-accent">
                        <Settings2 className="h-4 w-4" />
                        <span className="sr-only">User settings</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      side="top"
                      sideOffset={8}
                      className="w-56 bg-popover border border-border shadow-lg rounded-lg"
                    >
                      <DropdownMenuLabel className="px-3 py-2 text-sm font-semibold">
                        My Account
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="px-3 py-2 hover:bg-accent cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="px-3 py-2 hover:bg-accent cursor-pointer">
                        <Settings2 className="mr-2 h-4 w-4" />
                        <span>Preferences</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="px-3 py-2 text-red-600 hover:bg-red-50 hover:text-red-700 cursor-pointer">
                        <span>Sign out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="flex-1 min-w-0">
          <div className="h-full w-full flex flex-col overflow-hidden">
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
                <div className="flex justify-center p-6">
                  <div className="w-full max-w-3xl">
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
                      </PromptInputTools>
                      <PromptInputSubmit disabled={!input} />
                    </PromptInputToolbar>
                    </PromptInput>
                  </div>
                </div>
              </div>
            )}
          </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default App;