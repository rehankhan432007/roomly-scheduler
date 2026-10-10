// Backend module system contracts — B10
import type { Express, Router } from 'express';
import type { Knex } from 'knex';
import type { ServiceMap } from './dtos.js';

export interface ServiceRegistry {
  get<K extends keyof ServiceMap>(name: K): ServiceMap[K];
  has(name: keyof ServiceMap): boolean;
  provide<K extends keyof ServiceMap>(name: K, impl: ServiceMap[K], opts?: { stub?: boolean }): void;
}

export interface ModuleContext {
  app: Express;
  router: Router;
  db: Knex;
  config: Record<string, unknown>;
  logger: { info: (...args: unknown[]) => void; warn: (...args: unknown[]) => void; error: (...args: unknown[]) => void; debug: (...args: unknown[]) => void };
  services: ServiceRegistry;
}

export interface JobDef {
  name: string;
  intervalMs: number;
  run: (ctx: ModuleContext) => Promise<void>;
}

export interface ApiModule {
  name: string;
  part: 1 | 2 | 3 | 4;
  provides?: (keyof ServiceMap)[];
  requires?: (keyof ServiceMap)[];
  register(ctx: ModuleContext): void | Promise<void>;
  jobs?: JobDef[];
}
