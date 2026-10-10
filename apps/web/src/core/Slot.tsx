import React, { ErrorInfo } from 'react';
import type { SlotName } from '@meetmaze/shared/contracts';
import { features } from './features.generated';

// Error boundary for slots so one broken widget doesn't crash the page
class SlotErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Slot rendering error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

export function Slot({ name, context }: { name: SlotName; context: Record<string, unknown> }) {
  // Collect components for this slot from all active features
  const components = features.flatMap(f => f.slots?.[name] || []);

  if (components.length === 0) return null;

  return (
    <>
      {components.map((Comp, idx) => (
        <SlotErrorBoundary key={`${name}-${idx}`}>
          <Comp {...context} />
        </SlotErrorBoundary>
      ))}
    </>
  );
}
