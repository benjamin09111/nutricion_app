import * as path from "path";
import * as fs from "fs";
import { MarketPrice } from "@/features/foods";

export function getDietBaseFoods(): MarketPrice[] {
  try {
    const filePath = path.resolve(process.cwd(), "dietabase.csv");

    if (!fs.existsSync(filePath)) {
      console.error("Diet base file not found at:", filePath);
      return [];
    }

    const fileContent = fs.readFileSync(filePath, "utf-8");
    const lines = fileContent.split("\n");

    return lines
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
          precioPromedio: 0, // No price in this base file for now
          tags: [],
        };
      });
  } catch (error) {
    console.error("Error reading diet base foods:", error);
    return [];
  }
}
