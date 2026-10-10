import type { ServiceMap, ServiceRegistry } from '@meetmaze/shared/contracts';
import { logger } from './logger.js';

const services = new Map<keyof ServiceMap, { impl: ServiceMap[keyof ServiceMap]; stub: boolean }>();

export const serviceRegistry: ServiceRegistry = {
  get<K extends keyof ServiceMap>(name: K): ServiceMap[K] {
    const entry = services.get(name);
    if (!entry) {
      throw new Error(`Service "${name}" is not registered. Check module boot order.`);
    }
    return entry.impl as ServiceMap[K];
  },

  has(name: keyof ServiceMap): boolean {
    return services.has(name);
  },

  provide<K extends keyof ServiceMap>(name: K, impl: ServiceMap[K], opts?: { stub?: boolean }): void {
    const isStub = opts?.stub ?? false;
    if (services.has(name) && !services.get(name)!.stub) {
      logger.warn(`Service "${name}" already provided by a real module; ignoring ${isStub ? 'stub' : 'duplicate'}`);
      return;
    }
    services.set(name, { impl, stub: isStub });
    logger.info(`Service "${name}" ${isStub ? '[STUB]' : '[REAL]'} registered`);
  },
};

export function getRegisteredServices(): Array<{ name: string; stub: boolean }> {
  return Array.from(services.entries()).map(([name, entry]) => ({ name, stub: entry.stub }));
}
