import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface TutorialTargetProps {
  id: string;
  children: ReactNode;
  className?: string;
}

export function TutorialTarget({
  id,
  children,
  className,
}: TutorialTargetProps) {
  return (
    <div data-tutorial-id={id} className={cn(className)}>
      {children}
    </div>
  );
}
