/**
 * Script para insertar recetas del sistema en la base de datos.
 * Ejecutar con: node seed-recipes.mjs
 * Las recetas se insertan con isSystem=1 y userId=0 para que sean visibles por todos.
 */

const RECIPES = [
  // ── DESAYUNOS (10) ──
  {
    name: "Tostada integral con tomate y jamón serrano",
    category: "desayuno",
    ingredients: [
      { name: "Pan integral", quantity: "60g", calories: 140, protein: 5, carbs: 26, fats: 2 },
      { name: "Tomate rallado", quantity: "80g", calories: 14, protein: 1, carbs: 3, fats: 0 },
      { name: "Jamón serrano", quantity: "40g", calories: 68, protein: 12, carbs: 0, fats: 2 },
      { name: "Aceite de oliva virgen extra", quantity: "5g", calories: 45, protein: 0, carbs: 0, fats: 5 },
    ]
  },
  {
    name: "Bowl de avena con frutos rojos y crema de cacahuete",
    category: "desayuno",
    ingredients: [
      { name: "Avena en copos", quantity: "50g", calories: 185, protein: 7, carbs: 31, fats: 4 },
      { name: "Leche semidesnatada", quantity: "200ml", calories: 92, protein: 6, carbs: 10, fats: 3 },
      { name: "Fresas", quantity: "80g", calories: 26, protein: 1, carbs: 5, fats: 0 },
      { name: "Arándanos", quantity: "50g", calories: 29, protein: 0, carbs: 7, fats: 0 },
      { name: "Crema de cacahuete", quantity: "15g", calories: 88, protein: 4, carbs: 2, fats: 7 },
    ]
  },
  {
    name: "Tortilla francesa con queso y pavo",
    category: "desayuno",
    ingredients: [
      { name: "Huevos", quantity: "2 unidades (120g)", calories: 172, protein: 14, carbs: 1, fats: 12 },
      { name: "Queso Havarti Light", quantity: "30g", calories: 78, protein: 7, carbs: 0, fats: 5 },
      { name: "Pechuga de pavo en lonchas", quantity: "40g", calories: 42, protein: 8, carbs: 1, fats: 1 },
      { name: "Pan integral", quantity: "40g", calories: 93, protein: 4, carbs: 17, fats: 1 },
    ]
  },
  {
    name: "Yogur griego con kiwi, nueces y miel",
    category: "desayuno",
    ingredients: [
      { name: "Yogur griego natural", quantity: "150g", calories: 147, protein: 9, carbs: 6, fats: 10 },
      { name: "Kiwi", quantity: "120g", calories: 62, protein: 1, carbs: 13, fats: 0 },
      { name: "Nueces", quantity: "20g", calories: 131, protein: 3, carbs: 1, fats: 13 },
      { name: "Miel", quantity: "10g", calories: 30, protein: 0, carbs: 8, fats: 0 },
    ]
  },
  {
    name: "Tostada de aguacate con huevo pochado",
    category: "desayuno",
    ingredients: [
      { name: "Pan integral", quantity: "60g", calories: 140, protein: 5, carbs: 26, fats: 2 },
      { name: "Aguacate", quantity: "60g", calories: 96, protein: 1, carbs: 2, fats: 9 },
      { name: "Huevo", quantity: "1 unidad (60g)", calories: 86, protein: 7, carbs: 0, fats: 6 },
      { name: "Tomate cherry", quantity: "50g", calories: 9, protein: 0, carbs: 2, fats: 0 },
    ]
  },
  {
    name: "Sandwich mixto integral con fruta",
    category: "desayuno",
    ingredients: [
      { name: "Pan de molde integral", quantity: "60g", calories: 140, protein: 5, carbs: 24, fats: 2 },
      { name: "Jamón cocido", quantity: "40g", calories: 44, protein: 8, carbs: 1, fats: 1 },
      { name: "Queso Havarti Light", quantity: "30g", calories: 78, protein: 7, carbs: 0, fats: 5 },
      { name: "Manzana", quantity: "150g", calories: 78, protein: 0, carbs: 19, fats: 0 },
    ]
  },
  {
    name: "Bowl de queso fresco batido con frutas y semillas",
    category: "desayuno",
    ingredients: [
      { name: "Queso fresco batido 0%", quantity: "150g", calories: 75, protein: 12, carbs: 6, fats: 0 },
      { name: "Plátano", quantity: "100g", calories: 89, protein: 1, carbs: 21, fats: 0 },
      { name: "Fresas", quantity: "80g", calories: 26, protein: 1, carbs: 5, fats: 0 },
      { name: "Semillas de chía", quantity: "10g", calories: 49, protein: 2, carbs: 1, fats: 3 },
      { name: "Avena en copos", quantity: "20g", calories: 74, protein: 3, carbs: 12, fats: 2 },
    ]
  },
  {
    name: "Huevos revueltos con jamón y tostada",
    category: "desayuno",
    ingredients: [
      { name: "Huevos", quantity: "2 unidades (120g)", calories: 172, protein: 14, carbs: 1, fats: 12 },
      { name: "Jamón serrano", quantity: "30g", calories: 51, protein: 9, carbs: 0, fats: 2 },
      { name: "Pan integral", quantity: "50g", calories: 117, protein: 4, carbs: 22, fats: 1 },
      { name: "Aceite de oliva", quantity: "5g", calories: 45, protein: 0, carbs: 0, fats: 5 },
    ]
  },
  {
    name: "Porridge de avena con mango y coco",
    category: "desayuno",
    ingredients: [
      { name: "Avena en copos", quantity: "50g", calories: 185, protein: 7, carbs: 31, fats: 4 },
      { name: "Bebida de avena", quantity: "200ml", calories: 80, protein: 1, carbs: 14, fats: 2 },
      { name: "Mango", quantity: "100g", calories: 60, protein: 1, carbs: 14, fats: 0 },
      { name: "Coco rallado", quantity: "10g", calories: 65, protein: 1, carbs: 1, fats: 6 },
    ]
  },
  {
    name: "Bagel integral con salmón ahumado y queso crema",
    category: "desayuno",
    ingredients: [
      { name: "Bagel integral", quantity: "80g", calories: 200, protein: 8, carbs: 38, fats: 2 },
      { name: "Salmón ahumado", quantity: "50g", calories: 85, protein: 9, carbs: 0, fats: 5 },
      { name: "Queso crema light", quantity: "30g", calories: 48, protein: 2, carbs: 1, fats: 4 },
      { name: "Pepino", quantity: "30g", calories: 4, protein: 0, carbs: 1, fats: 0 },
    ]
  },

  // ── COMIDAS PRINCIPALES (12) ──
  {
    name: "Pechuga de pollo a la plancha con ensalada mediterránea",
    category: "comida",
    ingredients: [
      { name: "Pechuga de pollo", quantity: "180g", calories: 198, protein: 42, carbs: 0, fats: 2 },
      { name: "Lechuga mixta", quantity: "100g", calories: 15, protein: 1, carbs: 2, fats: 0 },
      { name: "Tomate", quantity: "100g", calories: 18, protein: 1, carbs: 4, fats: 0 },
      { name: "Pepino", quantity: "80g", calories: 10, protein: 0, carbs: 2, fats: 0 },
      { name: "Aceite de oliva virgen extra", quantity: "10g", calories: 90, protein: 0, carbs: 0, fats: 10 },
      { name: "Arroz integral", quantity: "70g", calories: 252, protein: 5, carbs: 53, fats: 2 },
    ]
  },
  {
    name: "Lentejas estofadas con verduras",
    category: "comida",
    ingredients: [
      { name: "Lentejas cocidas", quantity: "200g", calories: 230, protein: 18, carbs: 34, fats: 1 },
      { name: "Zanahoria", quantity: "80g", calories: 33, protein: 1, carbs: 7, fats: 0 },
      { name: "Pimiento rojo", quantity: "60g", calories: 19, protein: 1, carbs: 4, fats: 0 },
      { name: "Cebolla", quantity: "60g", calories: 24, protein: 1, carbs: 5, fats: 0 },
      { name: "Patata", quantity: "100g", calories: 77, protein: 2, carbs: 17, fats: 0 },
      { name: "Aceite de oliva", quantity: "10g", calories: 90, protein: 0, carbs: 0, fats: 10 },
    ]
  },
  {
    name: "Salmón al horno con patatas y espinacas",
    category: "comida",
    ingredients: [
      { name: "Salmón fresco", quantity: "150g", calories: 276, protein: 30, carbs: 0, fats: 17 },
      { name: "Patata", quantity: "200g", calories: 154, protein: 4, carbs: 34, fats: 0 },
      { name: "Espinacas frescas", quantity: "150g", calories: 35, protein: 4, carbs: 2, fats: 1 },
      { name: "Aceite de oliva", quantity: "10g", calories: 90, protein: 0, carbs: 0, fats: 10 },
      { name: "Limón", quantity: "20g", calories: 6, protein: 0, carbs: 2, fats: 0 },
    ]
  },
  {
    name: "Pasta boloñesa con carne picada de ternera",
    category: "comida",
    ingredients: [
      { name: "Pasta integral", quantity: "80g", calories: 280, protein: 10, carbs: 54, fats: 2 },
      { name: "Carne picada de ternera 5%", quantity: "150g", calories: 173, protein: 32, carbs: 0, fats: 5 },
      { name: "Tomate triturado", quantity: "100g", calories: 22, protein: 1, carbs: 4, fats: 0 },
      { name: "Cebolla", quantity: "50g", calories: 20, protein: 1, carbs: 4, fats: 0 },
      { name: "Aceite de oliva", quantity: "10g", calories: 90, protein: 0, carbs: 0, fats: 10 },
    ]
  },
  {
    name: "Garbanzos con espinacas y huevo pochado",
    category: "comida",
    ingredients: [
      { name: "Garbanzos cocidos", quantity: "200g", calories: 328, protein: 18, carbs: 46, fats: 6 },
      { name: "Espinacas", quantity: "150g", calories: 35, protein: 4, carbs: 2, fats: 1 },
      { name: "Huevo", quantity: "1 unidad (60g)", calories: 86, protein: 7, carbs: 0, fats: 6 },
      { name: "Ajo", quantity: "5g", calories: 7, protein: 0, carbs: 2, fats: 0 },
      { name: "Aceite de oliva", quantity: "10g", calories: 90, protein: 0, carbs: 0, fats: 10 },
    ]
  },
  {
    name: "Arroz con verduras salteadas y pollo al curry",
    category: "comida",
    ingredients: [
      { name: "Arroz basmati", quantity: "80g", calories: 280, protein: 6, carbs: 62, fats: 1 },
      { name: "Pechuga de pollo", quantity: "150g", calories: 165, protein: 35, carbs: 0, fats: 2 },
      { name: "Calabacín", quantity: "100g", calories: 17, protein: 1, carbs: 3, fats: 0 },
      { name: "Pimiento rojo", quantity: "80g", calories: 25, protein: 1, carbs: 5, fats: 0 },
      { name: "Curry en polvo", quantity: "3g", calories: 10, protein: 0, carbs: 2, fats: 0 },
      { name: "Aceite de oliva", quantity: "10g", calories: 90, protein: 0, carbs: 0, fats: 10 },
    ]
  },
  {
    name: "Dorada al horno con patata panadera",
    category: "comida",
    ingredients: [
      { name: "Dorada", quantity: "200g", calories: 174, protein: 36, carbs: 0, fats: 3 },
      { name: "Patata", quantity: "200g", calories: 154, protein: 4, carbs: 34, fats: 0 },
      { name: "Cebolla", quantity: "80g", calories: 32, protein: 1, carbs: 7, fats: 0 },
      { name: "Pimiento verde", quantity: "60g", calories: 12, protein: 1, carbs: 2, fats: 0 },
      { name: "Aceite de oliva", quantity: "15g", calories: 135, protein: 0, carbs: 0, fats: 15 },
    ]
  },
  {
    name: "Poke bowl de arroz con atún y aguacate",
    category: "comida",
    ingredients: [
      { name: "Arroz", quantity: "80g", calories: 280, protein: 6, carbs: 62, fats: 1 },
      { name: "Atún fresco", quantity: "120g", calories: 144, protein: 28, carbs: 0, fats: 3 },
      { name: "Aguacate", quantity: "50g", calories: 80, protein: 1, carbs: 2, fats: 7 },
      { name: "Pepino", quantity: "60g", calories: 8, protein: 0, carbs: 2, fats: 0 },
      { name: "Edamame", quantity: "40g", calories: 48, protein: 4, carbs: 3, fats: 2 },
      { name: "Salsa de soja", quantity: "10ml", calories: 6, protein: 1, carbs: 1, fats: 0 },
    ]
  },
  {
    name: "Judías verdes salteadas con jamón y lomo a la plancha",
    category: "comida",
    ingredients: [
      { name: "Judías verdes", quantity: "200g", calories: 62, protein: 4, carbs: 10, fats: 0 },
      { name: "Jamón serrano", quantity: "30g", calories: 51, protein: 9, carbs: 0, fats: 2 },
      { name: "Lomo de cerdo", quantity: "150g", calories: 218, protein: 33, carbs: 0, fats: 9 },
      { name: "Cebolla", quantity: "40g", calories: 16, protein: 0, carbs: 3, fats: 0 },
      { name: "Aceite de oliva", quantity: "10g", calories: 90, protein: 0, carbs: 0, fats: 10 },
    ]
  },
  {
    name: "Ensalada completa de pasta con pollo",
    category: "comida",
    ingredients: [
      { name: "Pasta integral", quantity: "70g", calories: 245, protein: 9, carbs: 47, fats: 2 },
      { name: "Pechuga de pollo", quantity: "130g", calories: 143, protein: 30, carbs: 0, fats: 2 },
      { name: "Tomate cherry", quantity: "80g", calories: 14, protein: 1, carbs: 3, fats: 0 },
      { name: "Queso fresco de vaca light", quantity: "50g", calories: 45, protein: 6, carbs: 2, fats: 1 },
      { name: "Lechuga", quantity: "60g", calories: 9, protein: 1, carbs: 1, fats: 0 },
      { name: "Aceite de oliva", quantity: "10g", calories: 90, protein: 0, carbs: 0, fats: 10 },
    ]
  },
  {
    name: "Berenjenas rellenas gratinadas con carne picada",
    category: "comida",
    ingredients: [
      { name: "Berenjena", quantity: "250g", calories: 63, protein: 3, carbs: 12, fats: 0 },
      { name: "Carne picada de ternera", quantity: "150g", calories: 173, protein: 32, carbs: 0, fats: 5 },
      { name: "Tomate triturado", quantity: "80g", calories: 18, protein: 1, carbs: 3, fats: 0 },
      { name: "Queso rallado", quantity: "30g", calories: 120, protein: 8, carbs: 0, fats: 10 },
      { name: "Cebolla", quantity: "50g", calories: 20, protein: 1, carbs: 4, fats: 0 },
    ]
  },
  {
    name: "Smash burger casera con ensalada",
    category: "comida",
    ingredients: [
      { name: "Carne picada de ternera", quantity: "150g", calories: 173, protein: 32, carbs: 0, fats: 5 },
      { name: "Pan de hamburguesa integral", quantity: "60g", calories: 150, protein: 5, carbs: 26, fats: 3 },
      { name: "Queso cheddar", quantity: "20g", calories: 80, protein: 5, carbs: 0, fats: 7 },
      { name: "Tomate", quantity: "50g", calories: 9, protein: 0, carbs: 2, fats: 0 },
      { name: "Lechuga", quantity: "40g", calories: 6, protein: 0, carbs: 1, fats: 0 },
      { name: "Cebolla caramelizada", quantity: "30g", calories: 18, protein: 0, carbs: 4, fats: 0 },
    ]
  },

  // ── CENAS (10) ──
  {
    name: "Merluza al horno con verduras asadas",
    category: "cena",
    ingredients: [
      { name: "Merluza", quantity: "180g", calories: 144, protein: 32, carbs: 0, fats: 2 },
      { name: "Calabacín", quantity: "120g", calories: 20, protein: 2, carbs: 3, fats: 0 },
      { name: "Pimiento rojo", quantity: "80g", calories: 25, protein: 1, carbs: 5, fats: 0 },
      { name: "Cebolla", quantity: "60g", calories: 24, protein: 1, carbs: 5, fats: 0 },
      { name: "Aceite de oliva", quantity: "10g", calories: 90, protein: 0, carbs: 0, fats: 10 },
    ]
  },
  {
    name: "Tortilla de espinacas con ensalada",
    category: "cena",
    ingredients: [
      { name: "Huevos", quantity: "3 unidades (180g)", calories: 258, protein: 21, carbs: 2, fats: 18 },
      { name: "Espinacas", quantity: "100g", calories: 23, protein: 3, carbs: 1, fats: 0 },
      { name: "Lechuga mixta", quantity: "80g", calories: 12, protein: 1, carbs: 2, fats: 0 },
      { name: "Tomate", quantity: "80g", calories: 14, protein: 1, carbs: 3, fats: 0 },
      { name: "Aceite de oliva", quantity: "10g", calories: 90, protein: 0, carbs: 0, fats: 10 },
    ]
  },
  {
    name: "Lubina a la plancha con ensalada caprese",
    category: "cena",
    ingredients: [
      { name: "Lubina", quantity: "180g", calories: 175, protein: 36, carbs: 0, fats: 3 },
      { name: "Mozzarella fresca", quantity: "60g", calories: 150, protein: 11, carbs: 1, fats: 11 },
      { name: "Tomate", quantity: "100g", calories: 18, protein: 1, carbs: 4, fats: 0 },
      { name: "Aceite de oliva", quantity: "10g", calories: 90, protein: 0, carbs: 0, fats: 10 },
    ]
  },
  {
    name: "Revuelto de setas con jamón y espárragos",
    category: "cena",
    ingredients: [
      { name: "Huevos", quantity: "2 unidades (120g)", calories: 172, protein: 14, carbs: 1, fats: 12 },
      { name: "Champiñones", quantity: "150g", calories: 33, protein: 5, carbs: 3, fats: 0 },
      { name: "Espárragos verdes", quantity: "100g", calories: 20, protein: 2, carbs: 3, fats: 0 },
      { name: "Jamón serrano", quantity: "30g", calories: 51, protein: 9, carbs: 0, fats: 2 },
      { name: "Aceite de oliva", quantity: "5g", calories: 45, protein: 0, carbs: 0, fats: 5 },
    ]
  },
  {
    name: "Ensalada griega con pechuga de pollo",
    category: "cena",
    ingredients: [
      { name: "Pechuga de pollo", quantity: "150g", calories: 165, protein: 35, carbs: 0, fats: 2 },
      { name: "Lechuga", quantity: "80g", calories: 12, protein: 1, carbs: 2, fats: 0 },
      { name: "Tomate", quantity: "80g", calories: 14, protein: 1, carbs: 3, fats: 0 },
      { name: "Queso feta", quantity: "40g", calories: 106, protein: 6, carbs: 1, fats: 8 },
      { name: "Aceitunas negras", quantity: "20g", calories: 23, protein: 0, carbs: 1, fats: 2 },
      { name: "Pepino", quantity: "60g", calories: 8, protein: 0, carbs: 2, fats: 0 },
      { name: "Aceite de oliva", quantity: "10g", calories: 90, protein: 0, carbs: 0, fats: 10 },
    ]
  },
  {
    name: "Fajitas de pollo con verduras",
    category: "cena",
    ingredients: [
      { name: "Pechuga de pollo", quantity: "150g", calories: 165, protein: 35, carbs: 0, fats: 2 },
      { name: "Tortilla de trigo integral", quantity: "60g", calories: 170, protein: 5, carbs: 28, fats: 4 },
      { name: "Pimiento rojo", quantity: "80g", calories: 25, protein: 1, carbs: 5, fats: 0 },
      { name: "Cebolla", quantity: "60g", calories: 24, protein: 1, carbs: 5, fats: 0 },
      { name: "Lechuga", quantity: "40g", calories: 6, protein: 0, carbs: 1, fats: 0 },
      { name: "Aceite de oliva", quantity: "5g", calories: 45, protein: 0, carbs: 0, fats: 5 },
    ]
  },
  {
    name: "Crema de calabacín con pavo a la plancha",
    category: "cena",
    ingredients: [
      { name: "Calabacín", quantity: "300g", calories: 51, protein: 4, carbs: 8, fats: 1 },
      { name: "Pechuga de pavo", quantity: "150g", calories: 158, protein: 34, carbs: 0, fats: 2 },
      { name: "Cebolla", quantity: "50g", calories: 20, protein: 1, carbs: 4, fats: 0 },
      { name: "Quesito light", quantity: "20g", calories: 28, protein: 2, carbs: 1, fats: 2 },
      { name: "Aceite de oliva", quantity: "10g", calories: 90, protein: 0, carbs: 0, fats: 10 },
    ]
  },
  {
    name: "Salmón a la plancha con boniato al horno",
    category: "cena",
    ingredients: [
      { name: "Salmón fresco", quantity: "150g", calories: 276, protein: 30, carbs: 0, fats: 17 },
      { name: "Boniato", quantity: "200g", calories: 172, protein: 3, carbs: 40, fats: 0 },
      { name: "Espinacas", quantity: "100g", calories: 23, protein: 3, carbs: 1, fats: 0 },
      { name: "Aceite de oliva", quantity: "5g", calories: 45, protein: 0, carbs: 0, fats: 5 },
    ]
  },
  {
    name: "Revuelto de gambas con verduras",
    category: "cena",
    ingredients: [
      { name: "Gambas peladas", quantity: "150g", calories: 105, protein: 24, carbs: 0, fats: 1 },
      { name: "Huevos", quantity: "2 unidades (120g)", calories: 172, protein: 14, carbs: 1, fats: 12 },
      { name: "Calabacín", quantity: "100g", calories: 17, protein: 1, carbs: 3, fats: 0 },
      { name: "Pimiento rojo", quantity: "60g", calories: 19, protein: 1, carbs: 4, fats: 0 },
      { name: "Aceite de oliva", quantity: "10g", calories: 90, protein: 0, carbs: 0, fats: 10 },
    ]
  },
  {
    name: "Pizza casera integral de jamón y queso",
    category: "cena",
    ingredients: [
      { name: "Base de pizza integral", quantity: "120g", calories: 288, protein: 10, carbs: 50, fats: 5 },
      { name: "Tomate triturado", quantity: "60g", calories: 13, protein: 1, carbs: 2, fats: 0 },
      { name: "Mozzarella", quantity: "60g", calories: 150, protein: 11, carbs: 1, fats: 11 },
      { name: "Jamón cocido", quantity: "50g", calories: 55, protein: 10, carbs: 1, fats: 1 },
      { name: "Champiñones", quantity: "50g", calories: 11, protein: 2, carbs: 1, fats: 0 },
    ]
  },

  // ── SNACKS (10) ──
  {
    name: "Yogur proteínas con fruta y nueces",
    category: "snack",
    ingredients: [
      { name: "Yogur proteínas", quantity: "120g", calories: 84, protein: 12, carbs: 5, fats: 2 },
      { name: "Fresas", quantity: "100g", calories: 33, protein: 1, carbs: 6, fats: 0 },
      { name: "Nueces", quantity: "15g", calories: 98, protein: 2, carbs: 1, fats: 10 },
    ]
  },
  {
    name: "Batido de proteínas con plátano",
    category: "snack",
    ingredients: [
      { name: "Proteína en polvo (whey)", quantity: "30g", calories: 120, protein: 24, carbs: 3, fats: 1 },
      { name: "Plátano", quantity: "100g", calories: 89, protein: 1, carbs: 21, fats: 0 },
      { name: "Leche de almendras sin azúcar", quantity: "250ml", calories: 33, protein: 1, carbs: 1, fats: 3 },
    ]
  },
  {
    name: "Tostada de pavo con queso fresco",
    category: "snack",
    ingredients: [
      { name: "Pan integral", quantity: "40g", calories: 93, protein: 4, carbs: 17, fats: 1 },
      { name: "Pechuga de pavo en lonchas", quantity: "40g", calories: 42, protein: 8, carbs: 1, fats: 1 },
      { name: "Queso fresco de vaca light", quantity: "40g", calories: 36, protein: 5, carbs: 2, fats: 1 },
    ]
  },
  {
    name: "Manzana con crema de cacahuete",
    category: "snack",
    ingredients: [
      { name: "Manzana", quantity: "150g", calories: 78, protein: 0, carbs: 19, fats: 0 },
      { name: "Crema de cacahuete", quantity: "15g", calories: 88, protein: 4, carbs: 2, fats: 7 },
    ]
  },
  {
    name: "Mix de frutos secos y chocolate negro",
    category: "snack",
    ingredients: [
      { name: "Almendras", quantity: "15g", calories: 87, protein: 3, carbs: 1, fats: 8 },
      { name: "Nueces", quantity: "10g", calories: 65, protein: 2, carbs: 1, fats: 6 },
      { name: "Chocolate negro >85%", quantity: "15g", calories: 83, protein: 2, carbs: 4, fats: 7 },
    ]
  },
  {
    name: "Tortitas de arroz con jamón y aguacate",
    category: "snack",
    ingredients: [
      { name: "Tortitas de arroz", quantity: "30g", calories: 117, protein: 2, carbs: 25, fats: 1 },
      { name: "Jamón serrano", quantity: "30g", calories: 51, protein: 9, carbs: 0, fats: 2 },
      { name: "Aguacate", quantity: "30g", calories: 48, protein: 1, carbs: 1, fats: 5 },
    ]
  },
  {
    name: "Yogur griego con miel y semillas de calabaza",
    category: "snack",
    ingredients: [
      { name: "Yogur griego natural", quantity: "125g", calories: 123, protein: 8, carbs: 5, fats: 8 },
      { name: "Miel", quantity: "10g", calories: 30, protein: 0, carbs: 8, fats: 0 },
      { name: "Semillas de calabaza", quantity: "15g", calories: 83, protein: 4, carbs: 2, fats: 7 },
    ]
  },
  {
    name: "Plátano con nueces de Brasil",
    category: "snack",
    ingredients: [
      { name: "Plátano", quantity: "120g", calories: 107, protein: 1, carbs: 25, fats: 0 },
      { name: "Nueces de Brasil", quantity: "20g", calories: 132, protein: 3, carbs: 1, fats: 13 },
    ]
  },
  {
    name: "Hummus con palitos de zanahoria y pepino",
    category: "snack",
    ingredients: [
      { name: "Hummus", quantity: "60g", calories: 100, protein: 3, carbs: 8, fats: 6 },
      { name: "Zanahoria", quantity: "100g", calories: 41, protein: 1, carbs: 9, fats: 0 },
      { name: "Pepino", quantity: "80g", calories: 10, protein: 0, carbs: 2, fats: 0 },
    ]
  },
  {
    name: "Queso fresco batido con arándanos y avena",
    category: "snack",
    ingredients: [
      { name: "Queso fresco batido 0%", quantity: "100g", calories: 50, protein: 8, carbs: 4, fats: 0 },
      { name: "Arándanos", quantity: "80g", calories: 46, protein: 1, carbs: 11, fats: 0 },
      { name: "Avena en copos", quantity: "15g", calories: 56, protein: 2, carbs: 9, fats: 1 },
    ]
  },
];

// Generate SQL statements
const statements = [];

for (const recipe of RECIPES) {
  const totalCalories = recipe.ingredients.reduce((s, i) => s + i.calories, 0);
  const totalProtein = recipe.ingredients.reduce((s, i) => s + i.protein, 0);
  const totalCarbs = recipe.ingredients.reduce((s, i) => s + i.carbs, 0);
  const totalFats = recipe.ingredients.reduce((s, i) => s + i.fats, 0);

  const escapedName = recipe.name.replace(/'/g, "''");
  statements.push(
    `INSERT INTO recipes (userId, name, totalCalories, totalProtein, totalCarbs, totalFats, category, isSystem) VALUES (0, '${escapedName}', ${totalCalories}, ${totalProtein}, ${totalCarbs}, ${totalFats}, '${recipe.category}', 1);`
  );

  for (const ing of recipe.ingredients) {
    const escapedIngName = ing.name.replace(/'/g, "''");
    const escapedQty = ing.quantity.replace(/'/g, "''");
    statements.push(
      `INSERT INTO recipe_ingredients (recipeId, name, quantity, calories, protein, carbs, fats) VALUES (LAST_INSERT_ID(), '${escapedIngName}', '${escapedQty}', ${ing.calories}, ${ing.protein}, ${ing.carbs}, ${ing.fats});`
    );
  }
}

// Output SQL
console.log(statements.join("\n"));
