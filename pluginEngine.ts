import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { PluginDefinition, EventType, PluginEventPayload, PluginContext, ServiceEntry } from './src/types.ts';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'services.json');

export class PluginEngine {
  private plugins: PluginDefinition[] = [];
  private services: ServiceEntry[] = [];

  constructor() {
    // Ensure data directory exists
    if (!fs.existsSync(DATA_DIR)) {
      try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      } catch (e) {
        console.error('Failed to create data directory:', e);
      }
    }
    this.loadState();
  }

  private loadState() {
    if (fs.existsSync(DATA_FILE)) {
      try {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        this.services = JSON.parse(raw);
      } catch (e) {
        console.error('Failed to load services data:', e);
      }
    }
  }

  private saveState() {
    fs.writeFileSync(DATA_FILE, JSON.stringify(this.services, null, 2));
  }

  public registerPlugin(plugin: PluginDefinition) {
    this.plugins.push(plugin);
    this.plugins.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    console.log(`Registered plugin: ${plugin.name} v${plugin.version}`);
  }

  public getServices() {
    return [...this.services];
  }

  public getContext(plugin: PluginDefinition): PluginContext {
    return {
      emit: this.emit.bind(this),
      getServices: () => this.getServices(),
      updateService: (id, updates) => {
        const idx = this.services.findIndex(s => s.id === id);
        if (idx !== -1) {
          this.services[idx] = { ...this.services[idx], ...updates, updatedAt: Date.now() };
          this.saveState();
        }
      },
      addService: (service) => {
        if (!this.services.find(s => s.url === service.url && s.url !== undefined)) {
          this.services.push(service);
          this.saveState();
        }
      },
      removeService: (id) => {
        this.services = this.services.filter(s => s.id !== id);
        this.saveState();
      },
      hasCapability: (cap) => plugin.capabilities.includes(cap as any),
    };
  }

  public async emit<T extends EventType>(event: T, payload: PluginEventPayload[T]): Promise<any[]> {
    const results = [];
    for (const plugin of this.plugins) {
      if (plugin.hooks[event]) {
        const timeoutMs = plugin.timeout || 2000;
        try {
          const result = await Promise.race([
            plugin.hooks[event]!(payload as any, this.getContext(plugin)),
            new Promise((_, reject) => setTimeout(() => reject(new Error(`Plugin ${plugin.name} timeout on ${event}`)), timeoutMs))
          ]);
          results.push(result);
        } catch (error) {
          console.error(`Error in plugin ${plugin.name} on event ${event}:`, error);
        }
      }
    }
    return results;
  }
}
