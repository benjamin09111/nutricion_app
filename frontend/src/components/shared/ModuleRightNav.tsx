import React from 'react';
import { ActionDock, ActionDockItem } from '@/components/ui/ActionDock';

interface ModuleRightNavProps {
    items: ActionDockItem[];
    className?: string;
}

export function ModuleRightNav({ items, className }: ModuleRightNavProps) {
    return (
        <ActionDock items={items} className={className} />
    );
}
