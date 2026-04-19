import { describe, it, expect } from "vitest";

// We need to test the sanitizeAlternatives logic.
// Since the functions are defined in routers.ts at module level, we'll replicate the logic here for unit testing.
// This ensures the rules are correct independently of the LLM.

const NO_ALT_PATTERNS = [
  "aceite", "vinagre", "sal", "pimienta", "especias", "orégano", "comino",
  "pimentón", "cúrcuma", "canela", "ajo en polvo", "cebolla en polvo",
  "perejil", "albahaca", "romero", "tomillo", "laurel", "eneldo",
  "café", "infusión", "té", "agua", "caldo",
];
const VEGETABLE_PATTERNS = [
  "brócoli", "brocoli", "espinaca", "judía", "judias", "calabacín", "calabacin",
  "tomate", "lechuga", "pimiento", "berenjena", "coliflor", "acelga",
  "pepino", "zanahoria", "cebolla", "ajo", "champiñón", "champiñon",
  "seta", "alcachofa", "espárrago", "esparrago", "rábano", "rabano",
  "rúcula", "rucula", "remolacha", "nabo", "puerro", "apio",
  "col ", "repollo", "lombarda", "canónigo", "canonigo",
  "berro", "endivia", "escarola", "guisante", "habas",
  "verdura", "hortaliza", "ensalada", "mix de hojas",
];

function isNoAltFood(name: string): boolean {
  const lower = name.toLowerCase();
  return NO_ALT_PATTERNS.some(p => {
    const idx = lower.indexOf(p);
    if (idx === -1) return false;
    const before = idx === 0 || /[\s,.(\-\/]/.test(lower[idx - 1]);
    const after = (idx + p.length) >= lower.length || /[\s,.)\-\/]/.test(lower[idx + p.length]);
    return before && after;
  });
}

function isVegetableFood(name: string): boolean {
  const lower = name.toLowerCase();
  return VEGETABLE_PATTERNS.some(p => lower.includes(p));
}

function sanitizeAlternatives(food: any): any {
  const name = (food.name || "").toString();
  if (isNoAltFood(name)) {
    return {
      ...food,
      alternativeName: null,
      alternativeQuantity: null,
      alternativeCalories: null,
      alternativeProtein: null,
      alternativeCarbs: null,
      alternativeFats: null,
    };
  }
  if (isVegetableFood(name)) {
    return {
      ...food,
      alternativeName: "Otra verdura u hortaliza al gusto",
      alternativeQuantity: food.quantity,
      alternativeCalories: food.calories,
      alternativeProtein: food.protein,
      alternativeCarbs: food.carbs,
      alternativeFats: food.fats,
    };
  }
  return food;
}

describe("isNoAltFood", () => {
  it("should detect aceite de oliva", () => {
    expect(isNoAltFood("Aceite de oliva virgen extra")).toBe(true);
  });
  it("should detect aceite de coco", () => {
    expect(isNoAltFood("Aceite de coco")).toBe(true);
  });
  it("should detect café", () => {
    expect(isNoAltFood("Café solo")).toBe(true);
  });
  it("should detect sal", () => {
    expect(isNoAltFood("Sal")).toBe(true);
  });
  it("should NOT detect pollo", () => {
    expect(isNoAltFood("Pechuga de pollo")).toBe(false);
  });
  it("should NOT detect arroz", () => {
    expect(isNoAltFood("Arroz blanco")).toBe(false);
  });
});

describe("isVegetableFood", () => {
  it("should detect brócoli", () => {
    expect(isVegetableFood("Brócoli al vapor")).toBe(true);
  });
  it("should detect espinacas", () => {
    expect(isVegetableFood("Espinacas frescas")).toBe(true);
  });
  it("should detect judías verdes", () => {
    expect(isVegetableFood("Judías verdes")).toBe(true);
  });
  it("should detect calabacín", () => {
    expect(isVegetableFood("Calabacín a la plancha")).toBe(true);
  });
  it("should detect tomate", () => {
    expect(isVegetableFood("Tomate cherry")).toBe(true);
  });
  it("should detect lechuga", () => {
    expect(isVegetableFood("Lechuga iceberg")).toBe(true);
  });
  it("should detect pimiento", () => {
    expect(isVegetableFood("Pimiento rojo")).toBe(true);
  });
  it("should detect champiñón", () => {
    expect(isVegetableFood("Champiñón laminado")).toBe(true);
  });
  it("should detect ensalada", () => {
    expect(isVegetableFood("Ensalada mixta")).toBe(true);
  });
  it("should NOT detect pollo", () => {
    expect(isVegetableFood("Pechuga de pollo")).toBe(false);
  });
  it("should NOT detect arroz", () => {
    expect(isVegetableFood("Arroz blanco")).toBe(false);
  });
  it("should NOT detect salmón", () => {
    expect(isVegetableFood("Salmón a la plancha")).toBe(false);
  });
});

describe("sanitizeAlternatives", () => {
  it("should nullify alternative for aceite de oliva", () => {
    const food = {
      name: "Aceite de oliva virgen extra",
      quantity: "10g",
      calories: 90,
      protein: 0,
      carbs: 0,
      fats: 10,
      alternativeName: "Aceite de coco",
      alternativeQuantity: "10g",
      alternativeCalories: 90,
      alternativeProtein: 0,
      alternativeCarbs: 0,
      alternativeFats: 10,
    };
    const result = sanitizeAlternatives(food);
    expect(result.alternativeName).toBeNull();
    expect(result.alternativeQuantity).toBeNull();
    expect(result.alternativeCalories).toBeNull();
    expect(result.alternativeProtein).toBeNull();
    expect(result.alternativeCarbs).toBeNull();
    expect(result.alternativeFats).toBeNull();
  });

  it("should nullify alternative for café", () => {
    const food = {
      name: "Café con leche",
      quantity: "200ml",
      calories: 50,
      protein: 3,
      carbs: 5,
      fats: 2,
      alternativeName: "Té verde",
      alternativeQuantity: "200ml",
      alternativeCalories: 2,
      alternativeProtein: 0,
      alternativeCarbs: 0,
      alternativeFats: 0,
    };
    const result = sanitizeAlternatives(food);
    expect(result.alternativeName).toBeNull();
  });

  it("should set generic alternative for brócoli", () => {
    const food = {
      name: "Brócoli al vapor",
      quantity: "150g",
      calories: 51,
      protein: 4,
      carbs: 7,
      fats: 1,
      alternativeName: "Coliflor",
      alternativeQuantity: "200g",
      alternativeCalories: 50,
      alternativeProtein: 4,
      alternativeCarbs: 8,
      alternativeFats: 0,
    };
    const result = sanitizeAlternatives(food);
    expect(result.alternativeName).toBe("Otra verdura u hortaliza al gusto");
    expect(result.alternativeQuantity).toBe("150g");
    expect(result.alternativeCalories).toBe(51);
    expect(result.alternativeProtein).toBe(4);
    expect(result.alternativeCarbs).toBe(7);
    expect(result.alternativeFats).toBe(1);
  });

  it("should set generic alternative for espinacas with same macros", () => {
    const food = {
      name: "Espinacas frescas",
      quantity: "100g",
      calories: 23,
      protein: 3,
      carbs: 4,
      fats: 0,
      alternativeName: "Acelgas",
      alternativeQuantity: "120g",
      alternativeCalories: 25,
      alternativeProtein: 2,
      alternativeCarbs: 5,
      alternativeFats: 0,
    };
    const result = sanitizeAlternatives(food);
    expect(result.alternativeName).toBe("Otra verdura u hortaliza al gusto");
    expect(result.alternativeQuantity).toBe("100g");
    expect(result.alternativeCalories).toBe(23);
    expect(result.alternativeProtein).toBe(3);
  });

  it("should NOT modify alternative for pollo (protein)", () => {
    const food = {
      name: "Pechuga de pollo a la plancha",
      quantity: "150g",
      calories: 165,
      protein: 31,
      carbs: 0,
      fats: 4,
      alternativeName: "Pechuga de pavo",
      alternativeQuantity: "150g",
      alternativeCalories: 160,
      alternativeProtein: 30,
      alternativeCarbs: 0,
      alternativeFats: 3,
    };
    const result = sanitizeAlternatives(food);
    expect(result.alternativeName).toBe("Pechuga de pavo");
    expect(result.alternativeQuantity).toBe("150g");
  });

  it("should NOT modify alternative for arroz (carb)", () => {
    const food = {
      name: "Arroz blanco hervido",
      quantity: "80g",
      calories: 104,
      protein: 2,
      carbs: 23,
      fats: 0,
      alternativeName: "Pasta integral",
      alternativeQuantity: "80g",
      alternativeCalories: 100,
      alternativeProtein: 4,
      alternativeCarbs: 20,
      alternativeFats: 1,
    };
    const result = sanitizeAlternatives(food);
    expect(result.alternativeName).toBe("Pasta integral");
  });

  it("should set generic alternative for judías verdes", () => {
    const food = {
      name: "Judías verdes salteadas",
      quantity: "200g",
      calories: 62,
      protein: 4,
      carbs: 8,
      fats: 2,
      alternativeName: "Brócoli",
      alternativeQuantity: "200g",
      alternativeCalories: 68,
      alternativeProtein: 6,
      alternativeCarbs: 10,
      alternativeFats: 1,
    };
    const result = sanitizeAlternatives(food);
    expect(result.alternativeName).toBe("Otra verdura u hortaliza al gusto");
    expect(result.alternativeQuantity).toBe("200g");
    expect(result.alternativeCalories).toBe(62);
  });
});
