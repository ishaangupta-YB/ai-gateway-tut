import express from 'express';
import cors from 'cors';
import { streamText, convertToModelMessages } from 'ai';
import { createGateway } from '@ai-sdk/gateway';
import dotenv from 'dotenv';
import { threadStorage, CreateThreadRequest, UpdateThreadRequest } from './threadStorage';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for all origins
app.use(cors());
app.use(express.json());

const gateway = createGateway({
    apiKey: process.env.AI_GATEWAY_API_KEY,
    baseURL: 'https://ai-gateway.vercel.sh/v1/ai',
});

app.get('/api/models', async (req, res) => {
    const availableModels = await gateway.getAvailableModels();
    // availableModels.models.forEach((model) => {
    //     console.log(`${model.id}: ${model.name}`);
    //     if (model.description) {
    //       console.log(`  Description: ${model.description}`);
    //     }
    //     if (model.pricing) {
    //       console.log(`  Input: $${model.pricing.input}/token`);
    //       console.log(`  Output: $${model.pricing.output}/token`);
    //       if (model.pricing.cachedInputTokens) {
    //         console.log(
    //           `  Cached input (read): $${model.pricing.cachedInputTokens}/token`,
    //         );
    //       }
    //       if (model.pricing.cacheCreationInputTokens) {
    //         console.log(
    //           `  Cache creation (write): $${model.pricing.cacheCreationInputTokens}/token`,
    //         );
    //       }
    //     }
    //   });
    res.json(availableModels);
});

// Chat API endpoint compatible with AI SDK 5.0
app.post('/api/chat', async (req, res) => {
    try {
        const { message, id, model, webSearch } = req.body;
        console.log('Chat request:', req.body);

        // Handle both old format (messages array) and new format (single message + id)
        let messages: Array<{ role: string; content: string }> = [];
        let threadId = id;

        if (message && id) {
            // New AI SDK 5.0 format - load previous messages and append new one
            try {
                const thread = threadStorage.getThreadById(id);
                console.log('Thread:', thread);
                const previousMessages = thread ? thread.messages.map(msg => ({
                    role: msg.role,
                    content: msg.content
                })) : [];
                console.log('Previous messages:', previousMessages);

                // Convert UI message to simple message format
                const newMessage = {
                    role: message.role,
                    content: message.parts?.find((p: any) => p.type === 'text')?.text || 'Empty message'
                };
                console.log('New message:', newMessage);

                messages = [...previousMessages, newMessage];
            } catch (error) {
                console.error('Error loading thread:', error);
                messages = [{
                    role: message.role,
                    content: message.parts?.find((p: any) => p.type === 'text')?.text || 'Empty message'
                }];
            }
        } else if (req.body.messages && Array.isArray(req.body.messages)) {
            // Legacy format
            messages = req.body.messages;
            threadId = req.body.threadId;
        } else {
            return res.status(400).json({ error: 'Invalid request format' });
        }

        // Ensure messages is an array with at least one message
        if (!Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ error: 'No valid messages found' });
        }

        console.log('Final messages array:', messages);

        // Get available models to validate the requested model
        const availableModels = await gateway.getAvailableModels();

        // Find model by name (display name) and get its ID
        const requestedModel = availableModels.models.find(m => m.name === model);
        let selectedModel: string;
        if (webSearch) {
            // For web search, check if perplexity/sonar is available, otherwise use first available model
            const perplexityModel = availableModels.models.find(m => m.id === 'perplexity/sonar');
            selectedModel = perplexityModel ? perplexityModel.id : availableModels.models[0]?.id;
        } else if (model && requestedModel) {
            // Use the model ID, not the display name
            selectedModel = requestedModel.id;
        } else {
            // Fallback to first available model if requested model doesn't exist
            selectedModel = availableModels.models[0]?.id || 'openai/gpt-4o';
        }

        if (!selectedModel) {
            return res.status(400).json({ error: 'No available models found' });
        }

        // Save the user message to thread if threadId is provided
        if (threadId && message) {
            try {
                threadStorage.addMessageToThread(threadId, {
                    role: 'user',
                    content: message.parts?.find((p: any) => p.type === 'text')?.text || '',
                    model: selectedModel
                });
            } catch (error) {
                console.error('Error saving user message to thread:', error);
            }
        }

        // Set headers for optimal smooth streaming
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('Transfer-Encoding', 'chunked');
        res.setHeader('X-Accel-Buffering', 'no');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Headers', '*');

        const result = streamText({
            model: gateway(selectedModel),
            messages: convertToModelMessages(messages),
            system: 'You are a helpful assistant that can answer questions and help with tasks',
        });

        console.log('Starting optimal stream with messages, reasoning & sources...');

        // Convert messages to UI format for the response
        const uiMessages = messages.map((msg, index) => ({
            id: `msg-${Date.now()}-${index}`,
            role: msg.role as 'user' | 'assistant' | 'system',
            parts: [{ type: 'text' as const, text: msg.content }]
        }));

        // Use pipeUIMessageStreamToResponse for optimal Express streaming
        // This handles messages, reasoning, and sources automatically
        return result.pipeUIMessageStreamToResponse(res, {
            sendSources: true,      // ✅ Sources will stream smoothly
            sendReasoning: true,    // ✅ Reasoning will stream smoothly
            originalMessages: uiMessages,
            onFinish: async ({ messages: finishedMessages }) => {
                // Save assistant response to thread
                if (threadId && finishedMessages && finishedMessages.length > 0) {
                    try {
                        const lastMessage = finishedMessages[finishedMessages.length - 1];
                        if (lastMessage.role === 'assistant') {
                            // Extract text from message parts
                            let content = '';
                            if (lastMessage.parts) {
                                for (const part of lastMessage.parts) {
                                    if (part.type === 'text' && 'text' in part) {
                                        content += (part as any).text;
                                    }
                                }
                            }

                            threadStorage.addMessageToThread(threadId, {
                                role: 'assistant',
                                content: content || 'No response content',
                                model: selectedModel
                            });
                        }
                    } catch (error) {
                        console.error('Error saving assistant message to thread:', error);
                    }
                }
            }
        });
    } catch (error) {
        console.error('Chat API error:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// Thread Management Endpoints

// Get all threads
app.get('/api/threads', (_, res) => {
    try {
        const threads = threadStorage.getAllThreads();
        res.json({ threads });
    } catch (error) {
        console.error('Get threads error:', error);
        res.status(500).json({ error: 'Failed to get threads' });
    }
});

// Get specific thread with messages
app.get('/api/threads/:id', (req, res) => {
    try {
        const { id } = req.params;
        const thread = threadStorage.getThreadById(id);

        if (!thread) {
            return res.status(404).json({ error: 'Thread not found' });
        }

        res.json({ thread });
    } catch (error) {
        console.error('Get thread error:', error);
        res.status(500).json({ error: 'Failed to get thread' });
    }
});

// Create new thread
app.post('/api/threads', (req, res) => {
    try {
        const createData: CreateThreadRequest = req.body;
        const thread = threadStorage.createThread(createData);
        res.status(201).json({ thread });
    } catch (error) {
        console.error('Create thread error:', error);
        res.status(500).json({ error: 'Failed to create thread' });
    }
});

// Update thread (rename, etc.)
app.put('/api/threads/:id', (req, res) => {
    try {
        const { id } = req.params;
        const updateData: UpdateThreadRequest = req.body;
        const thread = threadStorage.updateThread(id, updateData);

        if (!thread) {
            return res.status(404).json({ error: 'Thread not found' });
        }

        res.json({ thread });
    } catch (error) {
        console.error('Update thread error:', error);
        res.status(500).json({ error: 'Failed to update thread' });
    }
});

// Delete thread
app.delete('/api/threads/:id', (req, res) => {
    try {
        const { id } = req.params;
        const deleted = threadStorage.deleteThread(id);

        if (!deleted) {
            return res.status(404).json({ error: 'Thread not found' });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Delete thread error:', error);
        res.status(500).json({ error: 'Failed to delete thread' });
    }
});

// Add message to thread
app.post('/api/threads/:id/messages', (req, res) => {
    try {
        const { id } = req.params;
        const { role, content, model } = req.body;

        if (!role || !content) {
            return res.status(400).json({ error: 'Role and content are required' });
        }

        const message = threadStorage.addMessageToThread(id, { role, content, model });

        if (!message) {
            return res.status(404).json({ error: 'Thread not found' });
        }

        res.status(201).json({ message });
    } catch (error) {
        console.error('Add message error:', error);
        res.status(500).json({ error: 'Failed to add message' });
    }
});

// Health check endpoint
app.get('/health', (_, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});