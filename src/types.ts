/**
 * Domain Models & Plugin Types
 */

export interface ServiceInput {
  url?: string;
  name?: string;
  group?: string;
  [key: string]: any;
}

export interface ServiceEntry {
  id: string;
  name: string;
  url?: string;
  group?: string;
  description?: string;
  icon?: string;
  status: 'online' | 'offline' | 'unknown';
  lastChecked?: number;
  tags?: string[];
  source: 'manual' | 'docker' | 'plugin';
  metadata?: Record<string, any>;
  createdAt: number;
  updatedAt: number;
  order?: number;
}

export type EventType =
  | 'ON_START'
  | 'DOCKER_DISCOVERED'
  | 'SERVICE_REGISTER'
  | 'USER_ADD_SERVICE'
  | 'METADATA_FETCH_START'
  | 'METADATA_FETCH_COMPLETE'
  | 'SERVICE_ENRICH'
  | 'HEALTH_CHECK'
  | 'SERVICE_RENDER';

export interface PluginEventPayload {
  ON_START: {};
  DOCKER_DISCOVERED: { containers: any[] };
  SERVICE_REGISTER: { input: ServiceInput; source: string };
  USER_ADD_SERVICE: { url: string; name?: string; group?: string };
  METADATA_FETCH_START: { service: ServiceEntry };
  METADATA_FETCH_COMPLETE: { service: ServiceEntry; metadata: any };
  SERVICE_ENRICH: { service: ServiceEntry };
  HEALTH_CHECK: { service: ServiceEntry };
  SERVICE_RENDER: { service: ServiceEntry };
}

export interface PluginContext {
  emit: <T extends EventType>(event: T, payload: PluginEventPayload[T]) => Promise<any[]>;
  getServices: () => ServiceEntry[];
  updateService: (id: string, updates: Partial<ServiceEntry>) => void;
  addService: (service: ServiceEntry) => void;
  removeService: (id: string) => void;
  hasCapability: (cap: string) => boolean;
}

export interface PluginDefinition {
  name: string;
  version: string;
  priority?: number;
  timeout?: number;
  capabilities: ('network:http' | 'docker:read' | 'filesystem:read' | 'ai:inference')[];
  hooks: {
    [K in EventType]?: (payload: PluginEventPayload[K], ctx: PluginContext) => Promise<any> | any;
  };
}
