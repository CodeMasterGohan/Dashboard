# 🦅 Dashboard

A production-grade, self-hosted homepage and service discovery dashboard. Built with a modular, event-driven plugin architecture, it dynamically discovers services via Docker, ingests manual endpoints, extracts rich metadata, and intelligently enriches service descriptions.

## ✨ Features

- **Event-Driven Plugin Architecture**: Highly extensible design with explicitly declared capabilities, lifecycle hooks, and isolated contexts.
- **Docker Auto-Discovery**: Automatically populates services by reading `docker.sock` and evaluating container labels.
- **Automated Metadata Pipeline**: Normalizes URLs, securely fetches HTML profiles, and reliably extracts titles, descriptions, and favicons (falling back to host roots when necessary).
- **AI-Powered Enrichment**: Optionally utilizes Google's Gemini models to formulate concise, factual (`≤ 20 words`) descriptions when an endpoint provides insufficient metadata.
- **Sophisticated Dark UI**: A responsive, highly polished minimalist aesthetic designed to be lightweight and readable.
- **Proxy-Ready Security**: Designed for edge protection. This dashboard deliberately omits native authentication—it is designed to sit safely behind a reverse proxy (e.g., NGINX, Traefik, Authelia, or Authentik).

## 🛠️ Architecture Overview

The system is split into two primary layers seamlessly integrated through Express and Vite:
1. **Frontend (React + Tailwind)**: A high-performance, polling-based interface that maintains real-time synchronization with the backend state.
2. **Backend (Node.js/Express + Plugin Engine)**: An IO-bound asynchronous event engine. All heavy lifting—HTTP fetching, Docker orchestration, AI inference—is pushed natively to `PluginEngine`.

### Core Plugins included:
- `CoreServiceManager`: Handles base routing, manual insertions, and database storage.
- `DockerDiscovery`: Hooks into `/var/run/docker.sock` mapping containers to service nodes.
- `MetadataExtractor`: Uses `cheerio` to fetch HTTP targets and evaluate OG tagging/DOM trees.
- `AIEnrichment`: Acts gracefully upon poor metadata by summarizing the service intelligently.

## 🚀 Getting Started

### Prerequisites
- Node.js `v18+`
- (Optional) Docker daemon running and accessible at `/var/run/docker.sock`
- (Optional) Gemini API Key for AI enrichments

### Installation
1. Clone the repository to your local machine.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set your environment variables (copy `.env.example` to `.env`):
   ```bash
   GEMINI_API_KEY="your_api_key_here"
   ```

### Running the Application

**Development Mode (Hot Reloading + TSX)**
```bash
npm run dev
```

**Production Build**
```bash
npm run build
npm start
```
*Note: Make sure your host running the Node process has read-access to the Docker socket if using Docker Discovery.*

## 🐳 Docker Discovery Integration

The `DockerDiscovery` plugin automatically indexes containers based on predefined Docker Labels. Add these labels to your containerized services to have them appear on the dashboard automatically:

| Label | Required | Description |
| :--- | :--- | :--- |
| `homepage.enabled` | **Yes**¹ | Must be set to `true`. |
| `homepage.name` | No | Overrides the automatic container name rendering. |
| `homepage.url` | No | Creates a hyperlink to the service. E.g., `https://plex.lan` |
| `homepage.group` | No | Categorizes the service in the UI. Defaults to `Docker`. |

*¹ If `homepage.url` is present, the service is also automatically discovered.*

**Example `docker-compose.yml` for a target service:**
```yaml
services:
  jellyfin:
    image: jellyfin/jellyfin
    labels:
      - "homepage.enabled=true"
      - "homepage.name=Jellyfin Media"
      - "homepage.url=http://192.168.1.10:8096"
      - "homepage.group=Media & Entertainment"
```

## 🧩 Building Plugins

New capabilities should be built as plugins, not core hacks. To create a plugin, implement the `PluginDefinition` structural contract:

```typescript
import { PluginDefinition } from './src/types.ts';

export const myCustomPlugin: PluginDefinition = {
  name: 'MyCustomPlugin',
  version: '1.0.0',
  priority: 10,
  capabilities: ['network:http'], // capabilities declare permissions structure
  hooks: {
    // Hook into specific system lifecycle events
    ON_START: async (payload, ctx) => {
       // logic goes here
    },
    SERVICE_REGISTER: async (payload, ctx) => {
       // logic goes here
    }
  }
};
```
*Register the plugin inside `server.ts` before initialization:*
`engine.registerPlugin(myCustomPlugin);`

## 🔒 Security

By design:
- SSRF risks are mitigated natively through timeout-bounded (3s max) metadata network calls.
- The Dashboard handles **zero authentication**. Secure this application behind an authenticating reverse proxy (like NGINX + Authelia).
- Plugins must explicitly declare capabilities isolating side effects from local execution streams.
