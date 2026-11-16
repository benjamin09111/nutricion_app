import type { Metadata } from "next";
import ProductAnalyticsClient from "./ProductAnalyticsClient";

export const metadata: Metadata = {
  title: "Analítica de uso",
  robots: { index: false, follow: false },
};

export default function AdminAnalyticsPage() {
  return <ProductAnalyticsClient />;
}
