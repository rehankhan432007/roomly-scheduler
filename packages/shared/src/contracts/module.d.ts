import type { Express, Router } from 'express';
import type { Knex } from 'knex';
import type { ServiceMap } from './services.js';
export interface JobDef {
    name: string;
    intervalMs: number;
    run(ctx: ModuleContext): Promise<void>;
}
export interface ServiceRegistry {
    get<K extends keyof ServiceMap>(name: K): ServiceMap[K];
    has(name: keyof ServiceMap): boolean;
    provide<K extends keyof ServiceMap>(name: K, impl: ServiceMap[K], opts?: {
        stub?: boolean;
    }): void;
}
export interface ModuleContext {
    app: Express;
    router: Router;
    db: Knex;
    config: Record<string, unknown>;
    logger: unknown;
    services: ServiceRegistry;
}
export interface ApiModule {
    name: string;
    part: 1 | 2 | 3 | 4;
    provides?: (keyof ServiceMap)[];
    requires?: (keyof ServiceMap)[];
    register(ctx: ModuleContext): void | Promise<void>;
    jobs?: JobDef[];
}
//# sourceMappingURL=module.d.ts.map