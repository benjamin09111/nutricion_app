"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function DishesClient() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/alimentos");
  }, [router]);

  return null;
}
