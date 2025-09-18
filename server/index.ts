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

// Chat API endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const { messages, model, webSearch } = req.body;
        console.log(req.body);

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'Messages array is required' });
        }

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

        // Use pipeUIMessageStreamToResponse for optimal Express streaming
        // This handles messages, reasoning, and sources automatically
        return result.pipeUIMessageStreamToResponse(res, {
            sendSources: true,      // ✅ Sources will stream smoothly
            sendReasoning: true,    // ✅ Reasoning will stream smoothly
        });
    } catch (error) {
        console.error('Chat API error:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// Health check endpoint
app.get('/health', (_, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});