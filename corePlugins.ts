import * as cheerio from 'cheerio';
import { v4 as uuidv4 } from 'uuid';
import type { PluginDefinition, ServiceEntry } from './src/types.ts';
import Docker from 'dockerode';
import { GoogleGenAI } from '@google/genai';

export const coreServicePlugin: PluginDefinition = {
  name: 'CoreServiceManager',
  version: '1.0.0',
  priority: 100,
  capabilities: [],
  hooks: {
    USER_ADD_SERVICE: async (payload, ctx) => {
      const newService: ServiceEntry = {
        id: uuidv4(),
        name: payload.name || payload.url.split('//')[1]?.split('/')[0] || 'Unknown Service',
        url: payload.url,
        group: payload.group || 'General',
        status: 'unknown',
        source: 'manual',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      // Emit register to let other plugins intercept if needed
      await ctx.emit('SERVICE_REGISTER', { input: newService, source: 'manual' });
    },
    SERVICE_REGISTER: async (payload, ctx) => {
      // Actually add the service
      const input = payload.input as ServiceEntry;
      if (!input.id) input.id = uuidv4();
      input.createdAt = input.createdAt || Date.now();
      input.updatedAt = input.updatedAt || Date.now();
      
      ctx.addService(input);
      
      // Kick off metadata fetch synchronously but without awaiting if it takes long,
      // actually we await to keep event order, but emit is bounded.
      await ctx.emit('METADATA_FETCH_START', { service: input });
    }
  }
};

export const metadataExtractPlugin: PluginDefinition = {
  name: 'MetadataExtractor',
  version: '1.0.0',
  priority: 50,
  timeout: 5000,
  capabilities: ['network:http'],
  hooks: {
    METADATA_FETCH_START: async ({ service }, ctx) => {
      if (!ctx.hasCapability('network:http')) return;
      if (!service.url || !service.url.startsWith('http')) return;

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        
        const res = await fetch(service.url, { signal: controller.signal });
        clearTimeout(timeout);
        
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const html = await res.text();
        const $ = cheerio.load(html);
        
        const title = $('title').text() || $('meta[property="og:title"]').attr('content') || service.name;
        const description = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || '';
        
        let icon = $('link[rel="icon"]').attr('href') || $('link[rel="shortcut icon"]').attr('href');
        if (icon && !icon.startsWith('http')) {
          const urlObj = new URL(service.url);
          icon = new URL(icon, urlObj.origin).href;
        }
        if (!icon) {
          const urlObj = new URL(service.url);
          icon = `${urlObj.origin}/favicon.ico`;
        }

        const updates = { 
          name: service.source === 'manual' && !service.metadata?.originalName ? title : service.name,
          description: description || service.description,
          icon,
          metadata: { ...service.metadata, title, description } 
        };
        
        ctx.updateService(service.id, updates);
        await ctx.emit('METADATA_FETCH_COMPLETE', { service: { ...service, ...updates }, metadata: updates.metadata });
      } catch (err) {
        console.error(`Metadata fetch failed for ${service.url}:`, err);
        ctx.updateService(service.id, { status: 'offline' });
      }
    },
    METADATA_FETCH_COMPLETE: async ({ service }, ctx) => {
      // If AI capability exists and description is poor, trigger enrich
      if (!service.description || service.description.length < 10) {
        // Enqueue enrichment non-blocking
        setTimeout(() => {
          ctx.emit('SERVICE_ENRICH', { service });
        }, 100);
      }
    }
  }
};

export const dockerDiscoveryPlugin: PluginDefinition = {
  name: 'DockerDiscovery',
  version: '1.0.0',
  priority: 10,
  timeout: 5000,
  capabilities: ['docker:read'],
  hooks: {
    ON_START: async (_, ctx) => {
      if (!ctx.hasCapability('docker:read')) return;
      try {
        const docker = new Docker({ socketPath: '/var/run/docker.sock' });
        const containers = await docker.listContainers();
        await ctx.emit('DOCKER_DISCOVERED', { containers });
      } catch (e) {
        console.warn('Docker discovery failed (expected if not running in Docker or lacking socket access):', (e as Error).message);
      }
    },
    DOCKER_DISCOVERED: async ({ containers }, ctx) => {
      for (const container of containers) {
        const labels = container.Labels || {};
        const enabled = labels['homepage.enabled'] === 'true';
        if (enabled || labels['homepage.url']) {
          const name = labels['homepage.name'] || container.Names[0].replace('/', '');
          const url = labels['homepage.url'] || '';
          const group = labels['homepage.group'] || 'Docker';
          
          await ctx.emit('SERVICE_REGISTER', {
            input: {
              id: container.Id,
              name,
              url,
              group,
              status: container.State === 'running' ? 'online' : 'offline',
              source: 'docker',
              createdAt: Date.now(),
              updatedAt: Date.now()
            },
            source: 'docker'
          });
        }
      }
    }
  }
};

export const aiEnrichmentPlugin: PluginDefinition = {
  name: 'AIEnrichment',
  version: '1.0.0',
  priority: 5,
  timeout: 10000,
  capabilities: ['ai:inference'],
  hooks: {
    SERVICE_ENRICH: async ({ service }, ctx) => {
      if (!ctx.hasCapability('ai:inference')) return;
      if (!process.env.GEMINI_API_KEY) return;
      
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const prompt = `Based on the following website information, write a precise, factual, under 20-word description of the service. Do not invent features.
Title: ${service.metadata?.title || service.name}
Description: ${service.metadata?.description || ''}
URL: ${service.url}`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });

        const enhancedDesc = response.text?.trim() || '';
        if (enhancedDesc) {
          ctx.updateService(service.id, { 
            description: enhancedDesc,
            metadata: { ...service.metadata, aiEnriched: true }
          });
        }
      } catch (err) {
        console.error('AI Enrichment failed:', err);
      }
    }
  }
};
