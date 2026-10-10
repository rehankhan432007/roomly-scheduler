import type { ServiceMap } from '@meetmaze/shared/contracts';
import { ApiError } from '@meetmaze/shared/core';
import { logger } from './logger.js';

type K = keyof ServiceMap;

interface RegistryEntry {
  impl: ServiceMap[K];
  stub: boolean;
}

export class ServiceRegistryImpl {
  private map = new Map<K, RegistryEntry>();

  provide<T extends K>(name: T, impl: ServiceMap[T], opts?: { stub?: boolean }): void {
    if (this.map.has(name)) {
      throw new Error(`Service "${name}" is already registered`);
    }
    this.map.set(name, { impl: impl as ServiceMap[K], stub: opts?.stub ?? false });
    logger.debug({ service: name, stub: opts?.stub ?? false }, 'Service registered');
  }

  get<T extends K>(name: T): ServiceMap[T] {
    const entry = this.map.get(name);
    if (!entry) {
      throw new ApiError(500, 'INTERNAL', `Service "${name}" not registered`);
    }
    return entry.impl as ServiceMap[T];
  }

  has(name: K): boolean {
    return this.map.has(name);
  }

  list(): { name: K; stub: boolean }[] {
    return [...this.map.entries()].map(([name, e]) => ({ name, stub: e.stub }));
  }
}
