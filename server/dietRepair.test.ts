import { describe, it, expect } from "vitest";

// Replica of the repairTruncatedDietJson function from routers.ts for testing
function repairTruncatedDietJson(truncated: string): string {
  let json = truncated.trim();
  
  json = json.replace(/,\s*$/, '');
  
  let quoteCount = 0;
  let esc = false;
  for (const ch of json) {
    if (esc) { esc = false; continue; }
    if (ch === '\\') { esc = true; continue; }
    if (ch === '"') quoteCount++;
  }
  
  if (quoteCount % 2 !== 0) {
    const lastCompleteObj = json.lastIndexOf('},');
    const lastCompleteArr = json.lastIndexOf('],');
    const lastComplete = Math.max(lastCompleteObj, lastCompleteArr);
    if (lastComplete > 0) {
      json = json.slice(0, lastComplete + 1);
    } else {
      json += '"';
    }
  }
  
  json = json.replace(/,\s*$/, '');
  
  const lastCompleteEntry = json.lastIndexOf('},');
  if (lastCompleteEntry > 0) {
    const tail = json.slice(lastCompleteEntry + 1);
    const tOB = (tail.match(/{/g) || []).length;
    const tCB = (tail.match(/}/g) || []).length;
    const tOBr = (tail.match(/\[/g) || []).length;
    const tCBr = (tail.match(/]/g) || []).length;
    if (tOB > tCB || tOBr > tCBr) {
      json = json.slice(0, lastCompleteEntry + 1);
    }
  }
  
  json = json.replace(/,\s*$/, '');
  
  const stack: string[] = [];
  let inStr = false;
  let escaped = false;
  
  for (const ch of json) {
    if (escaped) { escaped = false; continue; }
    if (ch === '\\') { escaped = true; continue; }
    if (ch === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (ch === '{') stack.push('}');
    if (ch === '[') stack.push(']');
    if (ch === '}' || ch === ']') stack.pop();
  }
  
  while (stack.length > 0) {
    json += stack.pop();
  }
  
  return json;
}

describe("repairTruncatedDietJson", () => {
  it("should return valid JSON unchanged", () => {
    const valid = JSON.stringify({ menus: [{ menuNumber: 1, meals: [] }] });
    const result = repairTruncatedDietJson(valid);
    expect(JSON.parse(result)).toEqual({ menus: [{ menuNumber: 1, meals: [] }] });
  });

  it("should close unclosed braces and brackets in correct order", () => {
    // Truncated after a complete food item - missing ]}]}
    const truncated = '{"menus":[{"menuNumber":1,"totalCalories":1600,"totalProtein":156,"totalCarbs":124,"totalFats":44,"meals":[{"mealNumber":1,"mealName":"Desayuno","description":"Tostada con aguacate","calories":400,"protein":20,"carbs":40,"fats":15,"foods":[{"name":"Pan integral","quantity":"60g","calories":150,"protein":5,"carbs":28,"fats":2,"alternativeName":"Pan de centeno","alternativeQuantity":"60g","alternativeCalories":145,"alternativeProtein":5,"alternativeCarbs":27,"alternativeFats":1}';
    const repaired = repairTruncatedDietJson(truncated);
    const parsed = JSON.parse(repaired);
    expect(parsed).toHaveProperty("menus");
    expect(parsed.menus[0]).toHaveProperty("meals");
    expect(parsed.menus[0].meals[0].foods).toHaveLength(1);
  });

  it("should handle truncation mid-second-menu preserving first menu", () => {
    const truncated = '{"menus":[{"menuNumber":1,"totalCalories":1600,"totalProtein":156,"totalCarbs":124,"totalFats":44,"meals":[{"mealNumber":1,"mealName":"Desayuno","description":"Tostada","calories":400,"protein":20,"carbs":40,"fats":15,"foods":[{"name":"Pan","quantity":"60g","calories":150,"protein":5,"carbs":28,"fats":2,"alternativeName":"Centeno","alternativeQuantity":"60g","alternativeCalories":145,"alternativeProtein":5,"alternativeCarbs":27,"alternativeFats":1},{"name":"Aguacate","quantity":"50g","calories":80,"protein":1,"carbs":4,"fats":7,"alternativeName":"Hummus","alternativeQuantity":"40g","alternativeCalories":75,"alternativeProtein":3,"alternativeCarbs":5,"alternativeFats":4}]}]},{"menuNumber":2,"totalCal';
    const repaired = repairTruncatedDietJson(truncated);
    const parsed = JSON.parse(repaired);
    expect(parsed.menus).toHaveLength(1); // Second menu was incomplete
    expect(parsed.menus[0].menuNumber).toBe(1);
    expect(parsed.menus[0].meals[0].foods).toHaveLength(2);
  });

  it("should handle complete JSON with trailing whitespace", () => {
    const json = '{"menus":[]}  \n';
    const repaired = repairTruncatedDietJson(json);
    expect(JSON.parse(repaired)).toEqual({ menus: [] });
  });

  it("should handle truncation after a complete food item with trailing comma", () => {
    const truncated = '{"menus":[{"menuNumber":1,"totalCalories":1600,"totalProtein":156,"totalCarbs":124,"totalFats":44,"meals":[{"mealNumber":1,"mealName":"Desayuno","description":"Test","calories":400,"protein":20,"carbs":40,"fats":15,"foods":[{"name":"Pan","quantity":"60g","calories":150,"protein":5,"carbs":28,"fats":2,"alternativeName":"Centeno","alternativeQuantity":"60g","alternativeCalories":145,"alternativeProtein":5,"alternativeCarbs":27,"alternativeFats":1},';
    const repaired = repairTruncatedDietJson(truncated);
    const parsed = JSON.parse(repaired);
    expect(parsed.menus[0].meals[0].foods).toHaveLength(1);
  });

  it("should handle truncation mid-string (unterminated string)", () => {
    const truncated = '{"menus":[{"menuNumber":1,"totalCalories":1600,"totalProtein":156,"totalCarbs":124,"totalFats":44,"meals":[{"mealNumber":1,"mealName":"Des';
    const repaired = repairTruncatedDietJson(truncated);
    // With no complete entry, it closes the string and structures
    expect(() => JSON.parse(repaired)).not.toThrow();
  });

  it("should handle truncation mid-string with prior complete entries", () => {
    const truncated = '{"menus":[{"menuNumber":1,"totalCalories":1600,"totalProtein":156,"totalCarbs":124,"totalFats":44,"meals":[{"mealNumber":1,"mealName":"Desayuno","description":"Test","calories":400,"protein":20,"carbs":40,"fats":15,"foods":[{"name":"Pan","quantity":"60g","calories":150,"protein":5,"carbs":28,"fats":2,"alternativeName":"Centeno","alternativeQuantity":"60g","alternativeCalories":145,"alternativeProtein":5,"alternativeCarbs":27,"alternativeFats":1}]},{"mealNumber":2,"mealName":"Comida incompleta con texto trun';
    const repaired = repairTruncatedDietJson(truncated);
    const parsed = JSON.parse(repaired);
    expect(parsed.menus[0].meals).toHaveLength(1); // Only the complete meal
    expect(parsed.menus[0].meals[0].mealName).toBe("Desayuno");
  });

  it("should handle deeply nested truncation", () => {
    const truncated = '{"menus":[{"menuNumber":1,"totalCalories":2000,"totalProtein":180,"totalCarbs":200,"totalFats":60,"meals":[{"mealNumber":1,"mealName":"Desayuno","description":"Avena","calories":500,"protein":30,"carbs":60,"fats":15,"foods":[{"name":"Avena","quantity":"60g","calories":220,"protein":8,"carbs":38,"fats":4,"alternativeName":"Muesli","alternativeQuantity":"60g","alternativeCalories":215,"alternativeProtein":7,"alternativeCarbs":36,"alternativeFats":5},{"name":"Leche","quantity":"200ml","calories":90,"protein":6,"carbs":10,"fats":3,"alternativeName":"Bebida soja","alternativeQuantity":"200ml","alternativeCalories":80,"alternativeProtein":7,"alternativeCarbs":4,"alternativeFats":3}]},{"mealNumber":2,"mealName":"Media mañana","description":"Fruta y yogur","calories":250,"protein":15,"carbs":30,"fats":8,"foods":[{"name":"Yogur griego","quantity":"150g","calories":150,"protein":10,"carbs":8,"fats":7,"alternativeName":"Queso fresco","alternativeQuantity":"100g","alternativeCalories":140,"alternativeProtein":12,"alternativeCarbs":3,"alternativeFats":8},{"name":"Plátano","quantity":"120g","calories":100,"protein":1,"carbs":22,"fats":0,"alternativeName":"Manzana","alternativeQuantity":"150g","alternativeCalories":78,"alternativeProtein":0,"alternativeCarbs":20,"alternativeFats":0}]},{"mealNumber":3,"mealName":"Comida","description":"Pollo con arroz y verduras","calories":700,"protein":50,"carbs":70,"fats":20,"foods":[{"name":"Pechuga de pollo","quantity":"180g","calories":200,"protein":42,"carbs":0,"fats":3,"alternativeName":"Pavo","alternativeQuantity":"180g","alternativeCalories":190,"alternativeProtein":40,"alternativeCarbs":0,"alternativeFats":2},{"name":"Arroz integral","quantity":"80g","calories":280,"protein":6,"carbs":60,"fats":2,"alternativeName":"Quinoa","alternativeQuantity":"80g","alternativeCalories":290,"alternativeProtein":11,"alternativeCarbs":52,"alternativeFats":5},{"name":"Brócoli al vapor","quantity":"200g","calories":70,"protein":6,"carbs":14,"fats":1,"alternativeName":"Judías verdes","alternativeQuantity":"200g","alternativeCalories":62,"alternativeProtein":4,"alternativeCarbs":14,"alternativeFats":0}]}]}';
    // This is a complete menu with 3 meals - just missing ]}
    const repaired = repairTruncatedDietJson(truncated);
    const parsed = JSON.parse(repaired);
    expect(parsed.menus).toHaveLength(1);
    expect(parsed.menus[0].meals).toHaveLength(3);
    expect(parsed.menus[0].meals[2].foods).toHaveLength(3);
  });
});
