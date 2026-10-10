// Service registry implementation
import type { ServiceMap, ServiceRegistry as IServiceRegistry } from '@meetmaze/shared/contracts';
import { logger } from './logger.js';

interface RegistryEntry<K extends keyof ServiceMap> {
  impl: ServiceMap[K];
  stub: boolean;
}

export class ServiceRegistryImpl implements IServiceRegistry {
  private entries = new Map<keyof ServiceMap, RegistryEntry<keyof ServiceMap>>();

  get<K extends keyof ServiceMap>(name: K): ServiceMap[K] {
    const entry = this.entries.get(name);
    if (!entry) {
      throw new Error(`Service "${name}" is not registered. Check module load order.`);
    }
    return entry.impl as ServiceMap[K];
  }

  has(name: keyof ServiceMap): boolean {
    return this.entries.has(name);
  }

  provide<K extends keyof ServiceMap>(name: K, impl: ServiceMap[K], opts?: { stub?: boolean }): void {
    const isStub = opts?.stub ?? false;
    const existing = this.entries.get(name);
    // Real implementation replaces a stub
    if (existing && !existing.stub && !isStub) {
      logger.warn(`Service "${name}" is being re-provided (non-stub). Overwriting.`);
    }
    if (existing && existing.stub && !isStub) {
      logger.info(`Service "${name}": real implementation replacing stub.`);
    }
    if (existing && !existing.stub && isStub) {
      logger.info(`Service "${name}": keeping real implementation over stub.`);
      return; // Don't replace real with stub
    }
    this.entries.set(name, { impl, stub: isStub });
    logger.info(`Service "${name}" registered (${isStub ? 'STUB' : 'real'})`);
  }

  isStubbed(name: keyof ServiceMap): boolean {
    const entry = this.entries.get(name);
    return entry ? entry.stub : true;
  }

  listServices(): { name: string; stub: boolean }[] {
    return Array.from(this.entries.entries()).map(([name, entry]) => ({
      name: name as string,
      stub: entry.stub,
    }));
  }
}

export const serviceRegistry = new ServiceRegistryImpl();
