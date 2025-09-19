import express from 'express';
import cors from 'cors';
import { streamText, convertToModelMessages } from 'ai';
import { createGateway } from '@ai-sdk/gateway';
import dotenv from 'dotenv';

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
    try {
        const availableModels = await gateway.getAvailableModels();
        // console.log(availableModels);
        // Filter to only include chat models (language models)
        const chatModels = availableModels.models.filter((model: any) => {
            // Exclude image preview models and other non-chat models
            if (model.id === 'google/gemini-2.5-flash-image-preview') return false;

            return model.modelType === 'language';
        });
        // console.log(`Filtered ${chatModels.length} chat models from ${availableModels.models.length} total models`);
        res.json({
            ...availableModels,
            models: chatModels
        });
    } catch (error) {
        console.error('Error fetching models:', error);
        res.status(500).json({
            error: 'Failed to fetch available models',
            details: error instanceof Error ? error.message : 'Unknown error',
            models: [] // Return empty array as fallback
        });
    }
});

app.post('/api/chat', async (req, res) => {
    let isStreamStarted = false;

    try {
        const { messages, model, webSearch } = req.body;
        console.log('Chat request:', { model, webSearch, messageCount: messages?.length });

        // Validate input
        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({
                error: 'Invalid request',
                details: 'Messages array is required',
                code: 'INVALID_MESSAGES'
            });
        }

        if (messages.length === 0) {
            return res.status(400).json({
                error: 'Invalid request',
                details: 'At least one message is required',
                code: 'EMPTY_MESSAGES'
            });
        }

        // Convert client message format to AI SDK format
        const convertedMessages = messages.map((msg: any) => {
            if (msg.parts) {
                // Client sends: { parts: [{ type: 'text', text: 'content' }], role: 'user' }
                // AI SDK expects: { role: 'user', content: 'text content' }
                const textContent = msg.parts
                    .filter((part: any) => part.type === 'text')
                    .map((part: any) => part.text)
                    .join(' ');

                return {
                    role: msg.role,
                    content: textContent
                };
            }
            // If already in AI SDK format, pass through
            return msg;
        });

        if (!model) {
            return res.status(400).json({
                error: 'Invalid request',
                details: 'Model is required',
                code: 'MISSING_MODEL'
            });
        }

        // Get available models to validate the requested model
        let availableModels;
        try {
            availableModels = await gateway.getAvailableModels();
        } catch (modelError) {
            console.error('Error fetching available models:', modelError);
            return res.status(503).json({
                error: 'Service temporarily unavailable',
                details: 'Unable to fetch available models',
                code: 'MODEL_SERVICE_ERROR'
            });
        }

        // Filter chat models (same logic as /api/models endpoint)
        const chatModels = availableModels.models.filter((model: any) => {
            // Exclude image preview models and other non-chat models
            if (model.id === 'google/gemini-2.5-flash-image-preview') return false;

            return model.modelType === 'language';
        });

        // Find model by name (display name) and get its ID
        const requestedModel = chatModels.find((m: any) => m.name === model);
        let selectedModel: string;

        if (webSearch) {
            // For web search, check if perplexity/sonar is available, otherwise use first available model
            const perplexityModel = chatModels.find((m: any) => m.id === 'perplexity/sonar');
            selectedModel = perplexityModel ? perplexityModel.id : chatModels[0]?.id;
        } else if (model && requestedModel) {
            // Use the model ID, not the display name
            selectedModel = requestedModel.id;
        } else {
            // Fallback to first available model if requested model doesn't exist
            selectedModel = chatModels[0]?.id || 'openai/gpt-4o';
        }

        if (!selectedModel) {
            return res.status(400).json({
                error: 'Model not available',
                details: `Model '${model}' is not available or is not a chat model`,
                code: 'MODEL_NOT_FOUND',
                availableModels: chatModels.map((m: any) => m.name)
            });
        }

        console.log(`Using model: ${selectedModel} for request`);

        // Set headers for optimal smooth streaming
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('Transfer-Encoding', 'chunked');
        res.setHeader('X-Accel-Buffering', 'no');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Headers', '*');

        isStreamStarted = true;

        const result = streamText({
            model: gateway(selectedModel),
            messages: convertedMessages,
            system: 'You are a helpful assistant that can answer questions and help with tasks',
        });

        // Use pipeUIMessageStreamToResponse for optimal Express streaming
        return result.pipeUIMessageStreamToResponse(res, {
            sendSources: true,
            sendReasoning: true,
        });

    } catch (error) {
        console.error('Chat API error:', error);

        // If streaming already started, we can't send JSON error response
        if (isStreamStarted) {
            console.error('Error occurred after stream started, cannot send JSON response');
            return;
        }

        // Check if it's a rate limit error
        if (error instanceof Error &&
            (error.message.includes('rate limit') ||
             error.message.includes('rate_limit_exceeded') ||
             error.message.includes('429'))) {
            res.status(429).json({
                error: 'Rate limit exceeded. Please try again later.',
                code: 'RATE_LIMIT'
            });
        } else {
            res.status(500).json({
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
});

// Health check endpoint
app.get('/health', async (_, res) => {
    try {
        // Test gateway connection
        await gateway.getAvailableModels();
        res.json({
            status: 'OK',
            timestamp: new Date().toISOString(),
            services: {
                gateway: 'healthy',
                server: 'healthy'
            }
        });
    } catch (error) {
        console.error('Health check failed:', error);
        res.status(503).json({
            status: 'ERROR',
            timestamp: new Date().toISOString(),
            services: {
                gateway: 'unhealthy',
                server: 'healthy'
            },
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});