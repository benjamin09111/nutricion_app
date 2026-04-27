import type { TutorialContentDefinition } from "@/lib/tutorials";

import patients from "./patients.json";
import consultations from "./consultations.json";
import foods from "./foods.json";
import quickDeliverable from "./quickDeliverable.json";
import quickRecipes from "./quickRecipes.json";
import diet from "./diet.json";
import recipes from "./recipes.json";
import cart from "./cart.json";
import deliverable from "./deliverable.json";
import creations from "./creations.json";
import resources from "./resources.json";
import details from "./details.json";
import dishes from "./dishes.json";

export const tutorialContentById: Record<string, TutorialContentDefinition> = {
  patients,
  consultations,
  foods,
  quickDeliverable,
  quickRecipes,
  diet,
  recipes,
  cart,
  deliverable,
  creations,
  resources,
  details,
  dishes,
};

