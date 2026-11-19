import * as path from "path";
import * as fs from "fs";
import { MarketPrice, OFFICIAL_MARKET_PRICES } from "@/features/foods";

export function getDietBaseFoods(): MarketPrice[] {
  try {
    const candidatePaths = [
      path.resolve(process.cwd(), "dietabase.csv"),
      path.resolve(process.cwd(), "frontend", "dietabase.csv"),
      path.resolve(__dirname, "../../dietabase.csv"),
      path.resolve(__dirname, "../../../dietabase.csv"),
      path.resolve(__dirname, "../../../../frontend/dietabase.csv"),
    ];

    const filePath = candidatePaths.find((p) => {
      try {
        return fs.existsSync(p);
      } catch {
        return false;
      }
    });

    if (!filePath) {
      console.warn("Diet base CSV file not found in paths, using default catalog fallback.");
      return (OFFICIAL_MARKET_PRICES || []).slice(0, 74) as unknown as MarketPrice[];
    }

    const fileContent = fs.readFileSync(filePath, "utf-8");
    const lines = fileContent.split("\n");

    const parsed = lines
      .filter((line) => line.trim() !== "")
      .map((line, index) => {
        const parts = line.split(",");

        // Expected format: Name, Group, Cal, Prot, Carbs, Fats, Sugar, Fiber, Sodium, Unit, Ratio, Extra
        return {
          id: `base-${index}`,
          producto: parts[0]?.trim() || "",
          grupo: parts[1]?.trim() || "Varios",
          calorias: parseFloat(parts[2]) || 0,
          proteinas: parseFloat(parts[3]) || 0,
          carbohidratos: parseFloat(parts[4]) || 0,
          lipidos: parseFloat(parts[5]) || 0,
          azucares: parseFloat(parts[6]) || 0,
          fibra: parseFloat(parts[7]) || 0,
          sodio: parseFloat(parts[8]) || 0,
          unidad: parts[9]?.trim() || "g",
          precioPromedio: 0,
          tags: [],
        };
      })
      .filter((food) => Boolean(food.producto));

    if (parsed.length > 0) return parsed;
    return (OFFICIAL_MARKET_PRICES || []).slice(0, 74) as unknown as MarketPrice[];
  } catch (error) {
    console.error("Error reading diet base foods, using fallback:", error);
    return (OFFICIAL_MARKET_PRICES || []).slice(0, 74) as unknown as MarketPrice[];
  }
}
