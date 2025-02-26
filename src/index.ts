#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';

import * as fs from 'fs/promises';
import * as path from 'path';

interface GenerateImageArgs {
  prompt: string;
  model?: string;
  width?: number;
  height?: number;
  steps?: number;
  n?: number;
  response_format?: string;
  image_path?: string;
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
  public readonly server: Server;
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
        version: '0.1.4',
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
              image_path: {
                type: 'string',
                description: 'Optional path to save the generated image as PNG',
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

const requestBody = {
  ...defaultConfig,
  prompt: request.params.arguments.prompt,
  ...(request.params.arguments.model && { model: request.params.arguments.model }),
  ...(request.params.arguments.width && { width: request.params.arguments.width }),
  ...(request.params.arguments.height && { height: request.params.arguments.height }),
  ...(request.params.arguments.steps && { steps: request.params.arguments.steps }),
  ...(request.params.arguments.n && { n: request.params.arguments.n }),
  ...(request.params.arguments.response_format && { response_format: request.params.arguments.response_format })
};

try {

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

        // If image_path is provided, save the image
        if (request.params.arguments.image_path && response.data.data?.[0]?.b64_json) {
          try {
            const imageBuffer = Buffer.from(response.data.data[0].b64_json, 'base64');
            const outputPath = path.resolve(request.params.arguments.image_path);
            await fs.writeFile(outputPath, imageBuffer);
            
            return {
              content: [
                {
                  type: 'text',
                  text: `Image saved successfully to: ${outputPath}\n\n${JSON.stringify(response.data, null, 2)}`,
                },
              ],
            };
          } catch (error) {
            throw new McpError(
              ErrorCode.InternalError,
              `Failed to save image: ${error instanceof Error ? error.message : String(error)}`
            );
          }
        }

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

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

// Get API key from environment variable
const API_KEY = process.env.TOGETHER_API_KEY;
if (!API_KEY) {
  throw new Error('TOGETHER_API_KEY environment variable is required');
}

// Create and run server
const server = new ImageGenerationServer(API_KEY);
const transport = new StdioServerTransport();
server.server.connect(transport).catch(console.error);
console.error('Together Image Generation MCP server running on stdio');
