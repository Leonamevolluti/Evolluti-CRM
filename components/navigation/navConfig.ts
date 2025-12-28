import type { ComponentType } from 'react';
import {
  Inbox,
  KanbanSquare,
  Users,
  CheckSquare,
  MoreHorizontal,
} from 'lucide-react';

export type PrimaryNavId = 'inbox' | 'boards' | 'contacts' | 'activities' | 'more';

export interface PrimaryNavItem {
  id: PrimaryNavId;
  label: string;
  /** Route to navigate. For "more", this is omitted because it opens a menu/sheet. */
  href?: string;
  icon: ComponentType<{ className?: string }>;
}

export const PRIMARY_NAV: PrimaryNavItem[] = [
  { id: 'inbox', label: 'Inbox', href: '/inbox', icon: Inbox },
  { id: 'boards', label: 'Boards', href: '/boards', icon: KanbanSquare },
  { id: 'contacts', label: 'Contatos', href: '/contacts', icon: Users },
  { id: 'activities', label: 'Atividades', href: '/activities', icon: CheckSquare },
  { id: 'more', label: 'Mais', icon: MoreHorizontal },
];
