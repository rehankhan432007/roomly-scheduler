// Nav builder — builds navigation items from feature manifests
import type { NavItem } from '@meetmaze/shared/contracts';
import { features } from './features.generated';

export function getNavItems(role: 'CLIENT' | 'OWNER'): NavItem[] {
  const items: NavItem[] = [];

  for (const feature of features) {
    if (feature.navItems) {
      for (const item of feature.navItems) {
        if (item.portal === 'both' || item.portal === role.toLowerCase()) {
          items.push(item);
        }
      }
    }
  }

  return items.sort((a, b) => a.order - b.order);
}
