// Frontend feature manifest contracts — B11
import type { ComponentType } from 'react';

export type SlotName =
  | 'header.right'
  | 'client.global'
  | 'owner.global'
  | 'client.home.widgets'
  | 'owner.dashboard.widgets'
  | 'booking.card.actions'
  | 'booking.detail.sections'
  | 'room.detail.sections';

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: string; // lucide icon name
  portal: 'client' | 'owner' | 'both';
  order: number;
  group?: string;
}

export interface FeatureManifest {
  id: string;
  part: 1 | 2 | 3 | 4;
  navItems?: NavItem[];
  slots?: Partial<Record<SlotName, ComponentType<Record<string, unknown>>[]>>;
}
