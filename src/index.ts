import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';

interface GenerateImageArgs {
  prompt: string;
  model?: string;
  width?: number;
  height?: number;
  steps?: number;
  n?: number;
  response_format?: string;
}

const defaultConfig = {
  model: "black-forest-labs/FLUX.1-schnell-Free",
  width: 1024,
  height: 768,
  steps: 1,
  n: 1,
  response_format: "b64_json"
};

class ImageGenerationServer {
  private readonly server: Server;
  private readonly apiKey: string;
  private readonly API_ENDPOINT = 'https://api.together.xyz/v1/images/generations';
  private readonly listToolsHandler: (request: any) => Promise<any>;
  private readonly callToolHandler: (request: any) => Promise<any>;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    if (!this.apiKey) {
      throw new Error('TOGETHER_API_KEY is required');
    }

    this.server = new Server(
      {
        name: 'together-image-generator',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Store handlers for direct access
    this.listToolsHandler = this.createListToolsHandler();
    this.callToolHandler = this.createCallToolHandler();

    this.setupToolHandlers();
    this.server.onerror = (error) => console.error('[MCP Error]', error);
  }

  private createListToolsHandler() {
    return async () => ({
      tools: [
        {
          name: 'generate_image',
          description: 'Generate an image using Together AI API',
          inputSchema: {
            type: 'object',
            properties: {
              prompt: {
                type: 'string',
                description: 'Text prompt for image generation',
              },
              model: {
                type: 'string',
                description: 'Model to use for generation (default: black-forest-labs/FLUX.1-schnell-Free)',
              },
              width: {
                type: 'number',
                description: 'Image width (default: 1024)',
                minimum: 128,
                maximum: 2048,
              },
              height: {
                type: 'number',
                description: 'Image height (default: 768)',
                minimum: 128,
                maximum: 2048,
              },
              steps: {
                type: 'number',
                description: 'Number of inference steps (default: 1)',
                minimum: 1,
                maximum: 100,
              },
              n: {
                type: 'number',
                description: 'Number of images to generate (default: 1)',
                minimum: 1,
                maximum: 4,
              },
              response_format: {
                type: 'string',
                description: 'Response format (default: b64_json)',
                enum: ['b64_json', 'url'],
              },
            },
            required: ['prompt'],
          },
        },
      ],
    });
  }

  private createCallToolHandler() {
    return async (request: any) => {
      if (request.params.name !== 'generate_image') {
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${request.params.name}`
        );
      }

      // Type check and validate arguments
      if (!request.params.arguments || typeof request.params.arguments !== 'object') {
        throw new McpError(ErrorCode.InvalidParams, 'Invalid arguments provided');
      }

      if (!('prompt' in request.params.arguments) || typeof request.params.arguments.prompt !== 'string') {
        throw new McpError(ErrorCode.InvalidParams, 'Prompt is required and must be a string');
      }

      const args: GenerateImageArgs = {
        prompt: request.params.arguments.prompt,
        ...(typeof request.params.arguments.model === 'string' && { model: request.params.arguments.model }),
        ...(typeof request.params.arguments.width === 'number' && { width: request.params.arguments.width }),
        ...(typeof request.params.arguments.height === 'number' && { height: request.params.arguments.height }),
        ...(typeof request.params.arguments.steps === 'number' && { steps: request.params.arguments.steps }),
        ...(typeof request.params.arguments.n === 'number' && { n: request.params.arguments.n }),
        ...(typeof request.params.arguments.response_format === 'string' && { response_format: request.params.arguments.response_format }),
      };
      const config = { ...defaultConfig, ...args };

      try {
        // Ensure model is included and format request exactly as API expects
        const requestBody = {
          model: config.model || defaultConfig.model,
          prompt: config.prompt,
          width: config.width || defaultConfig.width,
          height: config.height || defaultConfig.height,
          steps: config.steps || defaultConfig.steps,
          n: config.n || defaultConfig.n,
          response_format: config.response_format || defaultConfig.response_format
        };

        const response = await axios.post(
          this.API_ENDPOINT,
          requestBody,
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
          }
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      } catch (error) {
        if (axios.isAxiosError(error)) {
          return {
            content: [
              {
                type: 'text',
                text: `API Error: ${error.response?.data?.message || error.message}`,
              },
            ],
            isError: true,
          };
        }
        throw error;
      }
    };
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, this.listToolsHandler);
    this.server.setRequestHandler(CallToolRequestSchema, this.callToolHandler);
  }

  async handleRequest(request: Request): Promise<Response> {
    try {
      const body = await request.json();

      // Handle request based on method
      let result;
      if (body.method === 'list_tools') {
        result = await this.listToolsHandler(body);
      } else if (body.method === 'call_tool') {
        result = await this.callToolHandler(body);
      } else {
        throw new Error(`Unknown method: ${body.method}`);
      }

      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err) {
      const error = err as Error;
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }
}

interface Env {
  TOGETHER_API_KEY: string;
  AI: any; // Cloudflare Workers AI binding
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const server = new ImageGenerationServer(env.TOGETHER_API_KEY);
    return server.handleRequest(request);
  }
};
