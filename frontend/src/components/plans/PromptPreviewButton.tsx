"use client";

import { Bug } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface PromptPreviewButtonProps {
  moduleName: string;
  endpoint: string;
  buildPayload: () => unknown;
  expectedOutput: string;
}

export function PromptPreviewButton({
  moduleName,
  endpoint,
  buildPayload,
  expectedOutput,
}: PromptPreviewButtonProps) {
  const handlePreview = () => {
    const payload = buildPayload();

    console.group(`[IA TEST] ${moduleName}`);
    console.log("Endpoint:", endpoint);
    console.log("Método: POST");
    console.log("Body enviado:", payload);
    console.log("Output esperado:", expectedOutput);
    console.groupEnd();
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handlePreview}
      className="h-10 rounded-xl border-amber-200 bg-amber-50 px-4 text-xs font-bold text-amber-700 hover:bg-amber-100"
    >
      <Bug className="mr-2 h-4 w-4" />
      Ver prompt
    </Button>
  );
}
