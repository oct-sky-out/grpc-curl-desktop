# GRPC Curl Desktop

A desktop gRPC client application built with Electron, React, and TypeScript.

## Features

- ✅ Upload and parse `.proto` files
- ✅ List available gRPC methods
- ✅ Generate dummy JSON data for requests
- ✅ Send gRPC requests and view responses
- ✅ Copy responses to clipboard
- ✅ Error handling with toast notifications
- ✅ Multi-language support (English, Korean, Japanese)
- ✅ Modern UI with Material-UI

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Desktop**: Electron
- **UI Framework**: Material-UI (MUI)
- **Build Tool**: Vite
- **Package Manager**: pnpm
- **Runtime**: Node.js 22
- **gRPC**: @grpc/grpc-js + protobufjs

## Development

### Prerequisites

- Node.js 22+
- pnpm

### Installation

```bash
pnpm install
```

### Development Mode

```bash
pnpm run electron:dev
```

This will start the Vite dev server and launch the Electron app.

### Build

```bash
# Build the renderer process
pnpm run build

# Build the Electron app
pnpm run build:electron
```

### Scripts

- `pnpm dev` - Start Vite dev server
- `pnpm build` - Build for production
- `pnpm electron` - Run Electron app
- `pnpm electron:dev` - Development mode with hot reload
- `pnpm lint` - Run ESLint
- `pnpm typecheck` - Run TypeScript type checking
- `pnpm test` - Run tests

## Usage

1. **Upload Proto File**: Click "Select Proto File" to upload your `.proto` file
2. **Select Method**: Choose a gRPC method from the available methods list
3. **Configure Endpoint**: Set your gRPC server endpoint (default: localhost:50051)
4. **Generate Request**: Use "Generate Dummy" to create sample request data
5. **Send Request**: Click "Send Request" to make the gRPC call
6. **View Response**: See the response in the right panel
7. **Copy Response**: Use the copy button to copy response to clipboard

## Language Support

The application supports:
- 🇺🇸 English
- 🇰🇷 Korean (한국어)
- 🇯🇵 Japanese (日本語)

## License

MIT