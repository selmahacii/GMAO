'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Wrench,
  Settings,
  Calendar,
  Package,
  Radio,
  BarChart3,
  Bell,
  ChevronLeft,
  ChevronRight,
  Factory,
  Shield,
  Menu,
  Users,
  CreditCard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { PageType } from '@/app/page';

interface SidebarProps {
  currentPage: PageType;
  onPageChange: (page: PageType) => void;
  collapsed: boolean;
  onToggle: () => void;
}

const menuItems: Array<{ id: PageType; label: string; icon: React.ElementType; section?: string }> = [
  { id: 'dashboard', label: 'Tableau de Bord', icon: LayoutDashboard },
  { id: 'work-orders', label: 'Ordres de Travail', icon: Wrench },
  { id: 'assets', label: 'Équipements', icon: Settings },
  { id: 'pm', label: 'Maintenance Préventive', icon: Calendar },
  { id: 'parts', label: 'Pièces de Rechange', icon: Package },
  { id: 'technicians', label: 'Techniciens', icon: Users },
  { id: 'iot', label: 'Supervision IoT', icon: Radio },
  { id: 'analytics', label: 'Analytiques & KPIs', icon: BarChart3 },
  { id: 'alerts', label: 'Alertes', icon: Bell },
  { id: 'pricing', label: 'Tarification', icon: CreditCard },
];

export function Sidebar({ currentPage, onPageChange, collapsed, onToggle }: SidebarProps) {
  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 bg-white dark:bg-zinc-950 border-r border-gray-200 dark:border-zinc-800 flex flex-col transition-all duration-300 shadow-xl',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <Factory className="h-8 w-8 text-green-600" />
              <span className="font-bold text-lg text-gray-900 dark:text-white">GMAO Pro</span>
            </div>
          )}
          <Button variant="ghost" size="sm" onClick={onToggle} className="p-1">
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-4">
          <nav className="space-y-1 px-2">
            {menuItems.map((item) => {
              const isActive = currentPage === item.id;
              const Icon = item.icon;

              const button = (
                <button
                  onClick={() => onPageChange(item.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                    isActive
                      ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-r-4 border-green-600'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                  )}
                >
                  <Icon className={cn('h-5 w-5 flex-shrink-0', isActive && 'text-green-600 dark:text-green-400')} />
                  {!collapsed && <span>{item.label}</span>}
                </button>
              );

              if (collapsed) {
                return (
                  <Tooltip key={item.id}>
                    <TooltipTrigger asChild>{button}</TooltipTrigger>
                    <TooltipContent side="right">{item.label}</TooltipContent>
                  </Tooltip>
                );
              }

              return <div key={item.id}>{button}</div>;
            })}
          </nav>
        </ScrollArea>

        {/* Footer */}
        {!collapsed && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <Shield className="h-4 w-4" />
              <span>GMAO Pro v1.0.0</span>
            </div>
          </div>
        )}
      </aside>
    </TooltipProvider>
  );
}
