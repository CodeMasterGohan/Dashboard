import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { PluginEngine } from './pluginEngine.ts';
import { 
  coreServicePlugin, 
  metadataExtractPlugin, 
  dockerDiscoveryPlugin, 
  aiEnrichmentPlugin 
} from './corePlugins.ts';

const app = express();
app.use(express.json());

const PORT = 3000;

// Initialize Plugin System Built
const engine = new PluginEngine();

// Register plugins
engine.registerPlugin(coreServicePlugin);
engine.registerPlugin(metadataExtractPlugin);
engine.registerPlugin(dockerDiscoveryPlugin);
engine.registerPlugin(aiEnrichmentPlugin);

// Start lifecycle
engine.emit('ON_START', {}).catch(console.error);

// API Routes
app.get('/api/services', (req, res) => {
  res.json(engine.getServices());
});

app.post('/api/services', async (req, res) => {
  try {
    const { url, name, group } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    
    await engine.emit('USER_ADD_SERVICE', { url, name, group });
    
    // Quick fetch to return updated list
    res.json(engine.getServices());
  } catch (err) {
    res.status(500).json({ error: 'Failed to add service' });
  }
});

app.delete('/api/services/:id', (req, res) => {
  // Direct deletion for UI purposes, bypass plugin events for now
  engine.getContext(coreServicePlugin).removeService(req.params.id);
  res.json({ success: true });
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
