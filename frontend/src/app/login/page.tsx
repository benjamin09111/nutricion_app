import { Suspense } from "react";
import LoginPageClient from "./LoginPageClient";

type Props = {
  searchParams?: Promise<{ autostart?: string; callbackUrl?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const params = (await searchParams) || {};

  return (
    <Suspense fallback={null}>
      <LoginPageClient autoStart={params.autostart === "1"} />
    </Suspense>
  );
}
