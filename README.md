# Image Generation MCP Server

A Model Context Protocol (MCP) server that enables seamless generation of high-quality images using the Flux.1 Schnell model via Together AI. This server provides a standardized interface to specify image generation parameters.

## Features

- High-quality image generation powered by the Flux.1 Schnell model
- Support for customizable dimensions (width and height)
- Clear error handling for prompt validation and API issues
- Easy integration with MCP-compatible clients

## Installation

```bash
npm install together-mcp
```

Or run directly:

```bash
npx together-mcp
```

### Configuration

Add to your MCP server configuration:

<summary>Configuration Example</summary>

```json
{
  "mcpServers": {
    "together-image-gen": {
      "command": "npx",
      "args": ["together-mcp -y"],
      "env": {
        "TOGETHER_API_KEY": "<API KEY>"
      }
    }
  }
}
```

## Usage

The server provides one tool: `generate_image`

### Using generate_image

This tool has only one required parameter - the prompt. All other parameters are optional and use sensible defaults if not provided.

#### Parameters

```typescript
{
  // Required
  prompt: string;          // Text description of the image to generate

  // Optional with defaults
  model?: string;          // Default: "black-forest-labs/FLUX.1-schnell-Free"
  width?: number;          // Default: 1024 (min: 128, max: 2048)
  height?: number;         // Default: 768 (min: 128, max: 2048)
  steps?: number;          // Default: 1 (min: 1, max: 100)
  n?: number;             // Default: 1 (max: 4)
  response_format?: string; // Default: "b64_json" (options: ["b64_json", "url"])
}
```

#### Minimal Request Example

Only the prompt is required:

```json
{
  "name": "generate_image",
  "arguments": {
    "prompt": "A serene mountain landscape at sunset"
  }
}
```

#### Full Request Example

Override any defaults by including the parameters:

```json
{
  "name": "generate_image",
  "arguments": {
    "prompt": "A serene mountain landscape at sunset",
    "width": 1024,
    "height": 768,
    "steps": 20,
    "n": 1,
    "response_format": "b64_json",
    "model": "black-forest-labs/FLUX.1-schnell-Free"
  }
}
```

#### Response Format

The response will be a JSON object containing:

```json
{
  "id": string,        // Generation ID
  "model": string,     // Model used
  "object": "list",
  "data": [
    {
      "timings": {
        "inference": number  // Time taken for inference
      },
      "index": number,      // Image index
      "b64_json": string    // Base64 encoded image data (if response_format is "b64_json")
      // OR
      "url": string        // URL to generated image (if response_format is "url")
    }
  ]
}
```

### Default Values

If not specified in the request, these defaults are used:

- model: "black-forest-labs/FLUX.1-schnell-Free"
- width: 1024
- height: 768
- steps: 1
- n: 1
- response_format: "b64_json"

### Important Notes

1. Only the `prompt` parameter is required
2. All optional parameters use defaults if not provided
3. When provided, parameters must meet their constraints (e.g., width/height ranges)
4. Base64 responses can be large - use URL format for larger images

## Prerequisites

- Node.js >= 16
- Together AI API key

## Dependencies

```json
{
  "@modelcontextprotocol/sdk": "0.6.0",
  "axios": "^1.6.7"
}
```

## Development

Clone and build the project:

```bash
git clone https://github.com/manascb1344/together-mcp-server
cd together-mcp-server
npm install
npm run build
```

### Available Scripts

- `npm run build` - Build the TypeScript project
- `npm run watch` - Watch for changes and rebuild
- `npm run inspector` - Run MCP inspector

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a new branch (`feature/my-new-feature`)
3. Commit your changes
4. Push the branch to your fork
5. Open a Pull Request

For significant changes, please open an issue first to discuss your proposed changes.

## License

This project is licensed under the MIT License. See the LICENSE file for details.
