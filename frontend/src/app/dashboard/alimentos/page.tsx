import FoodsClient from "./FoodsClient";
import { OFFICIAL_INGREDIENTS } from "@/features/foods";

export default function FoodsPage() {
  return (
    <div className="space-y-4">
      <FoodsClient initialData={OFFICIAL_INGREDIENTS} />
    </div>
  );
}
