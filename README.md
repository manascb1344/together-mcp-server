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

## Available Tools

The server implements one tool:

### generate_image

Generates an image based on the given textual prompt and optional parameters.

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
