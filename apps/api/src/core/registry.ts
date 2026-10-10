import type { ServiceMap, ServiceRegistry as IServiceRegistry } from '@meetmaze/shared/contracts';
import { logger } from './logger.js';

export class ServiceRegistry implements IServiceRegistry {
  private services = new Map<keyof ServiceMap, { impl: ServiceMap[keyof ServiceMap]; stub: boolean }>();

  provide<K extends keyof ServiceMap>(name: K, impl: ServiceMap[K], opts?: { stub?: boolean }): void {
    const existing = this.services.get(name);
    if (existing && !existing.stub) {
      logger.warn(`Service "${name}" already provided (real), skipping`);
      return;
    }
    this.services.set(name, { impl, stub: opts?.stub ?? false });
    logger.info(`Service "${name}" registered (${opts?.stub ? 'STUB' : 'real'})`);
  }

  get<K extends keyof ServiceMap>(name: K): ServiceMap[K] {
    const entry = this.services.get(name);
    if (!entry) throw new Error(`Service "${name}" not registered`);
    return entry.impl as ServiceMap[K];
  }

  has(name: keyof ServiceMap): boolean {
    return this.services.has(name);
  }

  getInfo(): { name: string; stub: boolean }[] {
    return Array.from(this.services.entries()).map(([name, { stub }]) => ({ name, stub }));
  }
}

export const serviceRegistry = new ServiceRegistry();
