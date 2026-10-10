// Slot system — renders registered components for a named slot
'use client';

import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import type { SlotName, FeatureManifest } from '@meetmaze/shared/contracts';
import { features } from './features.generated';

// Error boundary for individual slot components
class SlotErrorBoundary extends Component<
  { children: ReactNode; featureId: string; slotName: string },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[Slot] Error in ${this.props.featureId} for slot ${this.props.slotName}:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

interface SlotProps {
  name: SlotName;
  context?: Record<string, unknown>;
}

export function Slot({ name, context = {} }: SlotProps) {
  const components: { featureId: string; Component: React.ComponentType<Record<string, unknown>> }[] = [];

  for (const feature of features) {
    const slotComponents = feature.slots?.[name];
    if (slotComponents) {
      for (const Comp of slotComponents) {
        components.push({ featureId: feature.id, Component: Comp });
      }
    }
  }

  if (components.length === 0) return null;

  return (
    <>
      {components.map(({ featureId, Component }, i) => (
        <SlotErrorBoundary key={`${featureId}-${name}-${i}`} featureId={featureId} slotName={name}>
          <Component {...context} />
        </SlotErrorBoundary>
      ))}
    </>
  );
}
