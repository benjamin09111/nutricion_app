"use client";

import { useDashboardShell } from "@/context/DashboardShellContext";

type UseSidebarDockVisibilityOptions = {
  requireCollapsedSidebar?: boolean;
};

export function useSidebarDockVisibility(
  options: UseSidebarDockVisibilityOptions = {},
) {
  const { isSidebarCollapsed } = useDashboardShell();
  const requireCollapsedSidebar = options.requireCollapsedSidebar ?? true;

  return requireCollapsedSidebar ? isSidebarCollapsed : true;
}
