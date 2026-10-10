import type { ServiceMap } from './services.js';

export interface JobDef {
  name: string;
  intervalMs: number;
  run: (ctx: ModuleContext) => Promise<void>;
}

export interface ModuleContext {
  app: import('express').Express;
  router: import('express').Router;
  db: import('knex').Knex;
  config: Record<string, unknown>;
  logger: unknown;
  services: ServiceRegistry;
}

export interface ServiceRegistry {
  get<K extends keyof ServiceMap>(name: K): ServiceMap[K];
  has(name: keyof ServiceMap): boolean;
  provide<K extends keyof ServiceMap>(name: K, impl: ServiceMap[K], opts?: { stub?: boolean }): void;
}

export interface ApiModule {
  name: string;
  part: 1 | 2 | 3 | 4;
  provides?: (keyof ServiceMap)[];
  requires?: (keyof ServiceMap)[];
  register(ctx: ModuleContext): void | Promise<void>;
  jobs?: JobDef[];
}
