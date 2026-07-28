import React from "react";
import { ActionDock, ActionDockItem } from "@/components/ui/ActionDock";

interface ModuleRightNavProps {
  items: ActionDockItem[];
  className?: string;
  desktopBreakpoint?: "md" | "lg";
}

export function ModuleRightNav({ items, className, desktopBreakpoint }: ModuleRightNavProps) {
  return <ActionDock items={items} className={className} desktopBreakpoint={desktopBreakpoint} />;
}
