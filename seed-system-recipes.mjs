/**
 * Seed script: Insert 300 system recipes into the database
 * 60 desayunos, 60 snack_manana, 60 comidas, 60 snack_tarde, 60 cenas
 * 
 * Usage: node seed-system-recipes.mjs
 */

import { readFileSync } from "fs";
import { createConnection } from "mysql2/promise";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load food database for macro lookups
const foodData = JSON.parse(readFileSync(join(__dirname, "shared/foodDatabase.json"), "utf-8"));

// Fallback nutrition data per 100g for ingredients not in the database
const fallbackNutrition = {
  "claras de huevo": { calories: 52, protein: 11, carbs: 0.7, fats: 0.2 },
  "huevo entero": { calories: 155, protein: 13, carbs: 1.1, fats: 11 },
  "huevos": { calories: 155, protein: 13, carbs: 1.1, fats: 11 },
  "copos de avena": { calories: 372, protein: 13, carbs: 60, fats: 7 },
  "avena molida": { calories: 372, protein: 13, carbs: 60, fats: 7 },
  "avena": { calories: 372, protein: 13, carbs: 60, fats: 7 },
  "leche desnatada": { calories: 35, protein: 3.4, carbs: 5, fats: 0.1 },
  "aceite de oliva virgen extra": { calories: 884, protein: 0, carbs: 0, fats: 100 },
  "aceite de oliva": { calories: 884, protein: 0, carbs: 0, fats: 100 },
  "yogur griego 0%": { calories: 59, protein: 10, carbs: 3.6, fats: 0.4 },
  "yogur griego": { calories: 97, protein: 9, carbs: 3.6, fats: 5 },
  "granola sin azúcar": { calories: 420, protein: 10, carbs: 62, fats: 15 },
  "granola": { calories: 420, protein: 10, carbs: 62, fats: 15 },
  "arándanos frescos": { calories: 57, protein: 0.7, carbs: 14, fats: 0.3 },
  "arándanos": { calories: 57, protein: 0.7, carbs: 14, fats: 0.3 },
  "proteína de vainilla en polvo": { calories: 380, protein: 80, carbs: 8, fats: 3 },
  "proteína de chocolate en polvo": { calories: 380, protein: 78, carbs: 10, fats: 4 },
  "proteína en polvo": { calories: 380, protein: 80, carbs: 8, fats: 3 },
  "proteína de caramelo en polvo": { calories: 380, protein: 78, carbs: 10, fats: 4 },
  "miel": { calories: 304, protein: 0.3, carbs: 82, fats: 0 },
  "pan de centeno": { calories: 259, protein: 8.5, carbs: 48, fats: 3.3 },
  "requesón bajo en grasa": { calories: 72, protein: 12, carbs: 3, fats: 1 },
  "requesón": { calories: 98, protein: 11, carbs: 3.4, fats: 4.3 },
  "salmón ahumado": { calories: 117, protein: 18, carbs: 0, fats: 4.5 },
  "mantequilla de cacahuete natural": { calories: 588, protein: 25, carbs: 20, fats: 50 },
  "mantequilla de cacahuete": { calories: 588, protein: 25, carbs: 20, fats: 50 },
  "crema de cacahuete 100%": { calories: 588, protein: 25, carbs: 20, fats: 50 },
  "crema de cacahuete": { calories: 588, protein: 25, carbs: 20, fats: 50 },
  "plátano": { calories: 89, protein: 1.1, carbs: 23, fats: 0.3 },
  "plátano congelado": { calories: 89, protein: 1.1, carbs: 23, fats: 0.3 },
  "plátano maduro": { calories: 89, protein: 1.1, carbs: 23, fats: 0.3 },
  "cacao puro en polvo": { calories: 228, protein: 20, carbs: 13, fats: 14 },
  "cacao puro": { calories: 228, protein: 20, carbs: 13, fats: 14 },
  "pan integral tostado": { calories: 265, protein: 9, carbs: 49, fats: 3.5 },
  "pan integral": { calories: 265, protein: 9, carbs: 49, fats: 3.5 },
  "aguacate": { calories: 160, protein: 2, carbs: 9, fats: 15 },
  "levadura en polvo": { calories: 53, protein: 0, carbs: 28, fats: 0 },
  "fruta de temporada": { calories: 50, protein: 0.5, carbs: 12, fats: 0.2 },
  "fruta fresca de temporada": { calories: 50, protein: 0.5, carbs: 12, fats: 0.2 },
  "kéfir natural": { calories: 65, protein: 3.3, carbs: 4.7, fats: 3.5 },
  "kéfir": { calories: 65, protein: 3.3, carbs: 4.7, fats: 3.5 },
  "frutos rojos congelados": { calories: 50, protein: 1, carbs: 11, fats: 0.3 },
  "frutos rojos": { calories: 50, protein: 1, carbs: 11, fats: 0.3 },
  "frutas del bosque congeladas": { calories: 50, protein: 1, carbs: 11, fats: 0.3 },
  "semillas de lino molido": { calories: 534, protein: 18, carbs: 29, fats: 42 },
  "semillas de lino": { calories: 534, protein: 18, carbs: 29, fats: 42 },
  "lino molido": { calories: 534, protein: 18, carbs: 29, fats: 42 },
  "pan proteico": { calories: 250, protein: 20, carbs: 25, fats: 5 },
  "pechuga de pavo en lonchas": { calories: 105, protein: 22, carbs: 1, fats: 1.5 },
  "pechuga de pavo": { calories: 105, protein: 22, carbs: 1, fats: 1.5 },
  "tomate": { calories: 18, protein: 0.9, carbs: 3.9, fats: 0.2 },
  "tomate triturado natural": { calories: 24, protein: 1, carbs: 4, fats: 0.2 },
  "tomate triturado": { calories: 24, protein: 1, carbs: 4, fats: 0.2 },
  "tomate frito": { calories: 80, protein: 1.3, carbs: 8, fats: 4.5 },
  "tomates cherry": { calories: 18, protein: 0.9, carbs: 3.9, fats: 0.2 },
  "tomates secos en aceite escurridos": { calories: 213, protein: 6, carbs: 24, fats: 10 },
  "manzana": { calories: 52, protein: 0.3, carbs: 14, fats: 0.2 },
  "queso cottage": { calories: 98, protein: 11, carbs: 3.4, fats: 4.3 },
  "espinacas frescas": { calories: 23, protein: 2.9, carbs: 3.6, fats: 0.4 },
  "espinacas baby": { calories: 23, protein: 2.9, carbs: 3.6, fats: 0.4 },
  "espinacas": { calories: 23, protein: 2.9, carbs: 3.6, fats: 0.4 },
  "quark 0%": { calories: 67, protein: 12, carbs: 4, fats: 0.2 },
  "melocotón": { calories: 39, protein: 0.9, carbs: 10, fats: 0.3 },
  "almendras laminadas tostadas": { calories: 597, protein: 21, carbs: 22, fats: 50 },
  "almendras laminadas": { calories: 597, protein: 21, carbs: 22, fats: 50 },
  "almendras crudas": { calories: 579, protein: 21, carbs: 22, fats: 50 },
  "almendras": { calories: 579, protein: 21, carbs: 22, fats: 50 },
  "rúcula": { calories: 25, protein: 2.6, carbs: 3.7, fats: 0.7 },
  "mostaza antigua": { calories: 66, protein: 4, carbs: 6, fats: 3 },
  "mostaza dijon": { calories: 66, protein: 4, carbs: 6, fats: 3 },
  "mostaza": { calories: 66, protein: 4, carbs: 6, fats: 3 },
  "piña congelada": { calories: 50, protein: 0.5, carbs: 13, fats: 0.1 },
  "piña fresca": { calories: 50, protein: 0.5, carbs: 13, fats: 0.1 },
  "piña": { calories: 50, protein: 0.5, carbs: 13, fats: 0.1 },
  "leche de avena sin azúcar": { calories: 40, protein: 1, carbs: 7, fats: 1.5 },
  "leche de avena": { calories: 40, protein: 1, carbs: 7, fats: 1.5 },
  "leche vegetal": { calories: 40, protein: 1, carbs: 7, fats: 1.5 },
  "nueces picadas": { calories: 654, protein: 15, carbs: 14, fats: 65 },
  "nueces": { calories: 654, protein: 15, carbs: 14, fats: 65 },
  "pasas": { calories: 299, protein: 3, carbs: 79, fats: 0.5 },
  "kiwi": { calories: 61, protein: 1.1, carbs: 15, fats: 0.5 },
  "tortilla de maíz": { calories: 218, protein: 5.7, carbs: 44, fats: 2.8 },
  "tortilla integral": { calories: 240, protein: 7, carbs: 38, fats: 6 },
  "tortilla integral pequeña": { calories: 240, protein: 7, carbs: 38, fats: 6 },
  "frambuesas": { calories: 52, protein: 1.2, carbs: 12, fats: 0.7 },
  "copos de avena cocidos": { calories: 68, protein: 2.5, carbs: 12, fats: 1.4 },
  "copos de avena crudos": { calories: 372, protein: 13, carbs: 60, fats: 7 },
  "copos de avena tostados": { calories: 390, protein: 13, carbs: 62, fats: 7 },
  "sardinas al natural escurridas": { calories: 208, protein: 25, carbs: 0, fats: 11 },
  "sardinas en aceite de oliva escurridas": { calories: 220, protein: 24, carbs: 0, fats: 14 },
  "pulpa de açaí congelada": { calories: 70, protein: 1, carbs: 4, fats: 5 },
  "coco rallado sin azúcar": { calories: 660, protein: 6, carbs: 24, fats: 62 },
  "queso fresco": { calories: 175, protein: 12, carbs: 1.5, fats: 13 },
  "queso fresco light": { calories: 100, protein: 12, carbs: 3, fats: 4 },
  "mantequilla de almendra natural": { calories: 614, protein: 21, carbs: 19, fats: 56 },
  "mantequilla de almendra": { calories: 614, protein: 21, carbs: 19, fats: 56 },
  "mantequilla de almendra 100%": { calories: 614, protein: 21, carbs: 19, fats: 56 },
  "pera": { calories: 57, protein: 0.4, carbs: 15, fats: 0.1 },
  "queso crema light": { calories: 150, protein: 7, carbs: 5, fats: 11 },
  "queso crema": { calories: 215, protein: 6, carbs: 4, fats: 20 },
  "tofu sedoso": { calories: 55, protein: 5, carbs: 2, fats: 3 },
  "tofu firme": { calories: 144, protein: 15, carbs: 3, fats: 8 },
  "fresas frescas": { calories: 32, protein: 0.7, carbs: 8, fats: 0.3 },
  "fresas": { calories: 32, protein: 0.7, carbs: 8, fats: 0.3 },
  "fresas congeladas": { calories: 35, protein: 0.7, carbs: 8, fats: 0.3 },
  "pan de espelta": { calories: 260, protein: 10, carbs: 48, fats: 2 },
  "queso de cabra fresco": { calories: 268, protein: 18, carbs: 1, fats: 21 },
  "queso de cabra": { calories: 268, protein: 18, carbs: 1, fats: 21 },
  "alubias negras cocidas": { calories: 132, protein: 9, carbs: 24, fats: 0.5 },
  "alubias blancas cocidas": { calories: 139, protein: 10, carbs: 25, fats: 0.5 },
  "salsa de tomate": { calories: 29, protein: 1, carbs: 6, fats: 0.2 },
  "zanahoria": { calories: 41, protein: 0.9, carbs: 10, fats: 0.2 },
  "pepino": { calories: 15, protein: 0.7, carbs: 3.6, fats: 0.1 },
  "pepino rallado": { calories: 15, protein: 0.7, carbs: 3.6, fats: 0.1 },
  "apio": { calories: 16, protein: 0.7, carbs: 3, fats: 0.2 },
  "pimiento rojo": { calories: 31, protein: 1, carbs: 6, fats: 0.3 },
  "pimiento verde": { calories: 20, protein: 0.9, carbs: 4.6, fats: 0.2 },
  "hummus": { calories: 166, protein: 8, carbs: 14, fats: 10 },
  "skyr natural": { calories: 63, protein: 11, carbs: 4, fats: 0.2 },
  "skyr": { calories: 63, protein: 11, carbs: 4, fats: 0.2 },
  "semillas de chía": { calories: 486, protein: 17, carbs: 42, fats: 31 },
  "mango fresco": { calories: 60, protein: 0.8, carbs: 15, fats: 0.4 },
  "mango congelado": { calories: 60, protein: 0.8, carbs: 15, fats: 0.4 },
  "mango": { calories: 60, protein: 0.8, carbs: 15, fats: 0.4 },
  "tortitas de arroz": { calories: 387, protein: 8, carbs: 82, fats: 3 },
  "atún al natural escurrido": { calories: 116, protein: 26, carbs: 0, fats: 1 },
  "atún al natural": { calories: 116, protein: 26, carbs: 0, fats: 1 },
  "jamón york": { calories: 105, protein: 18, carbs: 1, fats: 3 },
  "jamón york en taquitos": { calories: 105, protein: 18, carbs: 1, fats: 3 },
  "edamame cocido sin vaina": { calories: 121, protein: 12, carbs: 9, fats: 5 },
  "edamame cocido": { calories: 121, protein: 12, carbs: 9, fats: 5 },
  "edamame": { calories: 121, protein: 12, carbs: 9, fats: 5 },
  "sésamo tostado": { calories: 573, protein: 17, carbs: 23, fats: 50 },
  "sésamo": { calories: 573, protein: 17, carbs: 23, fats: 50 },
  "avellanas picadas": { calories: 628, protein: 15, carbs: 17, fats: 61 },
  "avellanas": { calories: 628, protein: 15, carbs: 17, fats: 61 },
  "pipas de girasol": { calories: 584, protein: 21, carbs: 20, fats: 51 },
  "semillas de calabaza": { calories: 559, protein: 30, carbs: 11, fats: 49 },
  "queso de Burgos": { calories: 174, protein: 15, carbs: 2, fats: 11 },
  "mejillones al natural escurridos": { calories: 86, protein: 12, carbs: 4, fats: 2 },
  "mejillones frescos con concha": { calories: 86, protein: 12, carbs: 4, fats: 2 },
  "gelatina sin azúcar": { calories: 335, protein: 84, carbs: 0, fats: 0 },
  "queso cottage": { calories: 98, protein: 11, carbs: 3.4, fats: 4.3 },
  "pepinillos en vinagre": { calories: 11, protein: 0.3, carbs: 2.3, fats: 0.2 },
  "pepinillo": { calories: 11, protein: 0.3, carbs: 2.3, fats: 0.2 },
  "pepinillos": { calories: 11, protein: 0.3, carbs: 2.3, fats: 0.2 },
  "maíz cocido": { calories: 96, protein: 3.4, carbs: 21, fats: 1.3 },
  "maíz para palomitas": { calories: 375, protein: 11, carbs: 74, fats: 4.5 },
  "espresso": { calories: 2, protein: 0.1, carbs: 0, fats: 0 },
  "espresso frío": { calories: 2, protein: 0.1, carbs: 0, fats: 0 },
  "queso ricotta": { calories: 174, protein: 11, carbs: 3, fats: 13 },
  "queso light rallado": { calories: 200, protein: 25, carbs: 2, fats: 10 },
  "pechuga de pollo": { calories: 165, protein: 31, carbs: 0, fats: 3.6 },
  "pechuga de pollo asada": { calories: 165, protein: 31, carbs: 0, fats: 3.6 },
  "pechuga de pollo cocida y fría": { calories: 165, protein: 31, carbs: 0, fats: 3.6 },
  "pechuga de pollo en trozos": { calories: 165, protein: 31, carbs: 0, fats: 3.6 },
  "pechuga de pollo en cubos": { calories: 165, protein: 31, carbs: 0, fats: 3.6 },
  "pechuga de pollo desmigada": { calories: 165, protein: 31, carbs: 0, fats: 3.6 },
  "muslos de pollo en crudo": { calories: 177, protein: 20, carbs: 0, fats: 10 },
  "pollo": { calories: 165, protein: 31, carbs: 0, fats: 3.6 },
  "arroz integral en crudo": { calories: 362, protein: 7.5, carbs: 76, fats: 2.7 },
  "arroz integral": { calories: 362, protein: 7.5, carbs: 76, fats: 2.7 },
  "arroz jazmín en crudo": { calories: 360, protein: 7, carbs: 79, fats: 0.6 },
  "arroz basmati en crudo": { calories: 354, protein: 8, carbs: 77, fats: 0.8 },
  "arroz en crudo": { calories: 360, protein: 7, carbs: 79, fats: 0.6 },
  "arroz": { calories: 130, protein: 2.7, carbs: 28, fats: 0.3 },
  "brócoli": { calories: 34, protein: 2.8, carbs: 7, fats: 0.4 },
  "lomo de salmón fresco": { calories: 208, protein: 20, carbs: 0, fats: 13 },
  "salmón fresco": { calories: 208, protein: 20, carbs: 0, fats: 13 },
  "salmón": { calories: 208, protein: 20, carbs: 0, fats: 13 },
  "patata": { calories: 77, protein: 2, carbs: 17, fats: 0.1 },
  "patata cocida": { calories: 77, protein: 2, carbs: 17, fats: 0.1 },
  "espárragos trigueros": { calories: 20, protein: 2.2, carbs: 3.9, fats: 0.1 },
  "espárragos": { calories: 20, protein: 2.2, carbs: 3.9, fats: 0.1 },
  "quinoa en crudo": { calories: 368, protein: 14, carbs: 64, fats: 6 },
  "quinoa": { calories: 120, protein: 4.4, carbs: 21, fats: 1.9 },
  "pechuga de pavo en filete grueso": { calories: 105, protein: 22, carbs: 1, fats: 1.5 },
  "mozzarella light": { calories: 200, protein: 24, carbs: 3, fats: 10 },
  "lentejas pardinas cocidas": { calories: 116, protein: 9, carbs: 20, fats: 0.4 },
  "lentejas rojas en crudo": { calories: 358, protein: 25, carbs: 60, fats: 1.1 },
  "cebolla": { calories: 40, protein: 1.1, carbs: 9, fats: 0.1 },
  "cebolla roja": { calories: 40, protein: 1.1, carbs: 9, fats: 0.1 },
  "lomo de cerdo en medallones": { calories: 143, protein: 26, carbs: 0, fats: 3.5 },
  "solomillo de cerdo": { calories: 143, protein: 26, carbs: 0, fats: 3.5 },
  "batata": { calories: 86, protein: 1.6, carbs: 20, fats: 0.1 },
  "boniato": { calories: 86, protein: 1.6, carbs: 20, fats: 0.1 },
  "lomo de merluza": { calories: 82, protein: 17, carbs: 0, fats: 1.3 },
  "merluza en lomo": { calories: 82, protein: 17, carbs: 0, fats: 1.3 },
  "merluza": { calories: 82, protein: 17, carbs: 0, fats: 1.3 },
  "coliflor": { calories: 25, protein: 1.9, carbs: 5, fats: 0.3 },
  "coliflor rallada": { calories: 25, protein: 1.9, carbs: 5, fats: 0.3 },
  "garbanzos cocidos": { calories: 164, protein: 9, carbs: 27, fats: 2.6 },
  "pimiento asado": { calories: 31, protein: 1, carbs: 6, fats: 0.3 },
  "queso feta": { calories: 264, protein: 14, carbs: 4, fats: 21 },
  "queso feta desmenuzado": { calories: 264, protein: 14, carbs: 4, fats: 21 },
  "solomillo de ternera en tiras": { calories: 158, protein: 28, carbs: 0, fats: 5 },
  "filete de ternera": { calories: 158, protein: 28, carbs: 0, fats: 5 },
  "ternera cocida desmigada": { calories: 158, protein: 28, carbs: 0, fats: 5 },
  "carne picada de ternera": { calories: 250, protein: 17, carbs: 0, fats: 20 },
  "carne picada de pavo": { calories: 150, protein: 20, carbs: 0, fats: 8 },
  "salsa de soja reducida en sodio": { calories: 53, protein: 8, carbs: 5, fats: 0 },
  "salsa de soja": { calories: 53, protein: 8, carbs: 5, fats: 0 },
  "jengibre fresco": { calories: 80, protein: 1.8, carbs: 18, fats: 0.8 },
  "jengibre": { calories: 80, protein: 1.8, carbs: 18, fats: 0.8 },
  "pasta integral en crudo": { calories: 348, protein: 13, carbs: 68, fats: 2.5 },
  "pasta integral cocida fría": { calories: 131, protein: 5, carbs: 25, fats: 1.1 },
  "pasta integral": { calories: 348, protein: 13, carbs: 68, fats: 2.5 },
  "caballa limpia": { calories: 205, protein: 19, carbs: 0, fats: 14 },
  "leche de coco light": { calories: 50, protein: 0.5, carbs: 2, fats: 4 },
  "leche de coco": { calories: 197, protein: 2, carbs: 3, fats: 21 },
  "curry en polvo": { calories: 325, protein: 14, carbs: 55, fats: 14 },
  "dorada entera limpia": { calories: 100, protein: 20, carbs: 0, fats: 2 },
  "dorada": { calories: 100, protein: 20, carbs: 0, fats: 2 },
  "comino": { calories: 375, protein: 18, carbs: 44, fats: 22 },
  "cúrcuma": { calories: 354, protein: 8, carbs: 65, fats: 10 },
  "pimentón": { calories: 282, protein: 14, carbs: 54, fats: 13 },
  "pimentón ahumado": { calories: 282, protein: 14, carbs: 54, fats: 13 },
  "pimentón dulce": { calories: 282, protein: 14, carbs: 54, fats: 13 },
  "vinagre": { calories: 18, protein: 0, carbs: 0.6, fats: 0 },
  "vinagre balsámico": { calories: 88, protein: 0.5, carbs: 17, fats: 0 },
  "conejo en trozos": { calories: 136, protein: 21, carbs: 0, fats: 5.5 },
  "champiñones": { calories: 22, protein: 3.1, carbs: 3.3, fats: 0.3 },
  "champiñones laminados": { calories: 22, protein: 3.1, carbs: 3.3, fats: 0.3 },
  "vino blanco": { calories: 82, protein: 0.1, carbs: 2.6, fats: 0 },
  "calabacín": { calories: 17, protein: 1.2, carbs: 3.1, fats: 0.3 },
  "guisantes": { calories: 81, protein: 5, carbs: 14, fats: 0.4 },
  "bacalao desalado": { calories: 82, protein: 18, carbs: 0, fats: 0.7 },
  "bacalao": { calories: 82, protein: 18, carbs: 0, fats: 0.7 },
  "aceitunas": { calories: 115, protein: 0.8, carbs: 6, fats: 11 },
  "berenjena": { calories: 25, protein: 1, carbs: 6, fats: 0.2 },
  "chorizo ibérico": { calories: 455, protein: 24, carbs: 2, fats: 38 },
  "queso parmesano": { calories: 392, protein: 36, carbs: 4, fats: 26 },
  "queso parmesano rallado": { calories: 392, protein: 36, carbs: 4, fats: 26 },
  "lechuga": { calories: 15, protein: 1.4, carbs: 2.9, fats: 0.2 },
  "lechuga romana": { calories: 17, protein: 1.2, carbs: 3.3, fats: 0.3 },
  "lechuga iceberg": { calories: 14, protein: 0.9, carbs: 3, fats: 0.1 },
  "caldo de pollo casero": { calories: 15, protein: 2, carbs: 0.5, fats: 0.5 },
  "caldo de pollo": { calories: 15, protein: 2, carbs: 0.5, fats: 0.5 },
  "caldo de ternera casero": { calories: 15, protein: 2, carbs: 0.5, fats: 0.5 },
  "caldo de verduras": { calories: 10, protein: 0.3, carbs: 2, fats: 0.1 },
  "caldo de pescado": { calories: 10, protein: 1, carbs: 0.5, fats: 0.2 },
  "caldo": { calories: 15, protein: 2, carbs: 0.5, fats: 0.5 },
  "fideos de konjac": { calories: 10, protein: 0, carbs: 3, fats: 0 },
  "puerro": { calories: 61, protein: 1.5, carbs: 14, fats: 0.3 },
  "gambas peladas": { calories: 85, protein: 18, carbs: 1, fats: 0.5 },
  "contramuslos de pollo sin piel": { calories: 177, protein: 20, carbs: 0, fats: 10 },
  "coles de Bruselas": { calories: 43, protein: 3.4, carbs: 9, fats: 0.3 },
  "pasta de miso blanco": { calories: 199, protein: 12, carbs: 26, fats: 6 },
  "alga wakame seca": { calories: 45, protein: 3, carbs: 9, fats: 0.6 },
  "lubina en filetes": { calories: 97, protein: 18, carbs: 0, fats: 2.5 },
  "lubina": { calories: 97, protein: 18, carbs: 0, fats: 2.5 },
  "calabaza": { calories: 26, protein: 1, carbs: 7, fats: 0.1 },
  "sepia limpia": { calories: 79, protein: 16, carbs: 1, fats: 0.7 },
  "gazpacho casero": { calories: 40, protein: 0.7, carbs: 4, fats: 2.5 },
  "jamón ibérico": { calories: 241, protein: 31, carbs: 0, fats: 13 },
  "jamón ibérico en tiras": { calories: 241, protein: 31, carbs: 0, fats: 13 },
  "jamón ibérico en lonchas": { calories: 241, protein: 31, carbs: 0, fats: 13 },
  "jamón serrano": { calories: 241, protein: 31, carbs: 0, fats: 13 },
  "jamón serrano en taquitos": { calories: 241, protein: 31, carbs: 0, fats: 13 },
  "pasta de curry verde": { calories: 100, protein: 2, carbs: 8, fats: 7 },
  "dátiles medjool": { calories: 277, protein: 1.8, carbs: 75, fats: 0.2 },
  "aceite de coco": { calories: 862, protein: 0, carbs: 0, fats: 100 },
  "rabanitos": { calories: 16, protein: 0.7, carbs: 3.4, fats: 0.1 },
  "levadura nutricional": { calories: 325, protein: 50, carbs: 36, fats: 4 },
  "queso manchego semicurado": { calories: 392, protein: 26, carbs: 0.5, fats: 32 },
  "sal gorda": { calories: 0, protein: 0, carbs: 0, fats: 0 },
  "harina de maíz": { calories: 361, protein: 7, carbs: 76, fats: 3.4 },
  "rape en rodajas": { calories: 76, protein: 15, carbs: 0, fats: 1.5 },
  "rape": { calories: 76, protein: 15, carbs: 0, fats: 1.5 },
  "bok choy": { calories: 13, protein: 1.5, carbs: 2.2, fats: 0.2 },
  "judías blancas cocidas": { calories: 139, protein: 10, carbs: 25, fats: 0.5 },
  "alcaparras": { calories: 23, protein: 2.4, carbs: 5, fats: 0.9 },
  "queso manchego": { calories: 392, protein: 26, carbs: 0.5, fats: 32 },
  "leche desnatada fría": { calories: 35, protein: 3.4, carbs: 5, fats: 0.1 },
  "salsa picante": { calories: 11, protein: 0.5, carbs: 2, fats: 0.1 },
  "salsa brava": { calories: 80, protein: 1.3, carbs: 8, fats: 4.5 },
  "aove": { calories: 884, protein: 0, carbs: 0, fats: 100 },
  "aove (para confitar)": { calories: 884, protein: 0, carbs: 0, fats: 100 },
  "aove (para el pil-pil)": { calories: 884, protein: 0, carbs: 0, fats: 100 },
  "couscous": { calories: 376, protein: 13, carbs: 77, fats: 0.6 },
  "couscous en crudo": { calories: 376, protein: 13, carbs: 77, fats: 0.6 },
  "filetes de panga": { calories: 92, protein: 15, carbs: 0, fats: 3.5 },
  "panga": { calories: 92, protein: 15, carbs: 0, fats: 3.5 },
};

// Zero-calorie items to skip
const zeroCalItems = new Set([
  "canela", "canela al gusto", "stevia", "pimienta negra", "pimienta",
  "orégano", "eneldo", "sal", "perejil fresco", "perejil", "ajo en polvo",
  "sal negra kala namak", "romero", "albahaca fresca", "albahaca",
  "tomillo fresco", "tomillo", "hierbas provenzales", "cilantro fresco",
  "cilantro", "nuez moscada", "cebollino", "cebollino fresco picado",
  "cebolleta verde", "extracto de vainilla", "menta fresca picada", "menta",
  "hierbabuena fresca", "eneldo fresco", "sal marina en escamas",
  "salsa picante al gusto", "zumo de medio limón", "medio limón en rodajas",
  "1 diente de ajo", "2 dientes de ajo", "3 dientes de ajo",
  "pimentón picante", "comino", "sal, pimienta", "sal, pimienta negra",
  "pimentón ahumado", "pimentón", "pimentón dulce y picante", "pimentón de la vera",
  "guindilla (opcional)", "guindilla", "curry en polvo", "hielo",
  "zumo de medio limón", "zumo de media lima", "menta fresca",
  "sal gruesa", "pimienta negra molida",
]);

function lookupNutrition(ingredientName) {
  const normalized = ingredientName.toLowerCase().trim();
  
  // Skip zero-calorie items
  if (zeroCalItems.has(normalized)) return null;
  
  // Check fallback first (more specific names)
  if (fallbackNutrition[normalized]) return fallbackNutrition[normalized];
  
  // Search in food database (per 100g)
  const normalizedSearch = normalized.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const match = foodData.find(f => {
    const fn = f.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return fn === normalizedSearch || fn.includes(normalizedSearch) || normalizedSearch.includes(fn);
  });
  
  if (match) return { calories: match.calories, protein: match.protein, carbs: match.carbs, fats: match.fats };
  
  // Try partial match
  const words = normalizedSearch.split(" ").filter(w => w.length > 3);
  for (const word of words) {
    const partialMatch = foodData.find(f => {
      const fn = f.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      return fn.includes(word);
    });
    if (partialMatch) return { calories: partialMatch.calories, protein: partialMatch.protein, carbs: partialMatch.carbs, fats: partialMatch.fats };
  }
  
  console.warn(`  ⚠ No nutrition data for: "${ingredientName}" - using minimal defaults`);
  return { calories: 20, protein: 1, carbs: 3, fats: 0.5 };
}

function parseQuantityGrams(quantityStr) {
  // Extract grams from strings like "200g", "80g pechuga...", "5ml aceite..."
  const gMatch = quantityStr.match(/(\d+)g\b/);
  if (gMatch) return parseInt(gMatch[1]);
  
  const mlMatch = quantityStr.match(/(\d+)ml\b/);
  if (mlMatch) return parseInt(mlMatch[1]); // ml ≈ g for most liquids
  
  // For items like "2 huevos (120g)"
  const parenMatch = quantityStr.match(/\((\d+)g\)/);
  if (parenMatch) return parseInt(parenMatch[1]);
  
  return 0; // Will be skipped
}

function parseIngredientLine(line) {
  // Parse "5 claras de huevo (175g)" → { name: "claras de huevo", grams: 175 }
  // Parse "50g copos de avena finos" → { name: "copos de avena finos", grams: 50 }
  // Parse "100ml leche desnatada" → { name: "leche desnatada", grams: 100 }
  
  line = line.trim();
  if (!line) return null;
  
  // Pattern: "Xg name" or "Xml name"
  const gPattern = /^(\d+)g\s+(.+)$/;
  const mlPattern = /^(\d+)ml\s+(.+)$/;
  
  let match = line.match(gPattern);
  if (match) return { name: match[2].trim(), grams: parseInt(match[1]), quantity: `${match[1]}g` };
  
  match = line.match(mlPattern);
  if (match) return { name: match[2].trim(), grams: parseInt(match[1]), quantity: `${match[1]}ml` };
  
  // Pattern: "N name (Xg)" like "5 claras de huevo (175g)"
  const countPattern = /^(\d+)\s+(.+?)\s*\((\d+)g\)$/;
  match = line.match(countPattern);
  if (match) return { name: match[2].trim(), grams: parseInt(match[3]), quantity: `${match[1]} unidades (${match[3]}g)` };
  
  // Pattern: "N name" without grams (like "2 huevos")
  const simpleCountPattern = /^(\d+)\s+(.+)$/;
  match = line.match(simpleCountPattern);
  if (match) {
    const name = match[2].trim();
    // Try to estimate grams
    if (name.includes("huevo")) return { name, grams: parseInt(match[1]) * 60, quantity: `${match[1]} unidades` };
    if (name.includes("clara")) return { name, grams: parseInt(match[1]) * 35, quantity: `${match[1]} unidades` };
    return { name, grams: 30 * parseInt(match[1]), quantity: `${match[1]} unidades` };
  }
  
  // Items like "canela al gusto", "stevia", etc - zero calorie
  return { name: line, grams: 0, quantity: "al gusto" };
}

function calculateIngredientMacros(ingredient) {
  if (ingredient.grams === 0) {
    const nutrition = lookupNutrition(ingredient.name);
    if (!nutrition) return null;
    return { name: ingredient.name, quantity: ingredient.quantity, calories: 0, protein: 0, carbs: 0, fats: 0 };
  }
  
  const nutrition = lookupNutrition(ingredient.name);
  if (!nutrition) return null;
  
  const factor = ingredient.grams / 100;
  return {
    name: ingredient.name,
    quantity: ingredient.quantity,
    calories: Math.round(nutrition.calories * factor),
    protein: Math.round(nutrition.protein * factor),
    carbs: Math.round(nutrition.carbs * factor),
    fats: Math.round(nutrition.fats * factor),
  };
}

// ═══════════════════════════════════════════════════════
// All 150 recipes organized by category
// ═══════════════════════════════════════════════════════

const allRecipes = [
  // ── DESAYUNO (60) ──
  { category: "desayuno", name: "Tortilla de claras con avena y canela", ingredients: "5 claras de huevo (175g), 1 huevos enteros (60g), 50g copos de avena finos, 100ml leche desnatada, canela al gusto, stevia, 5ml AOVE" },
  { category: "desayuno", name: "Bowl de yogur griego con granola y arándanos", ingredients: "250g yogur griego 0%, 40g granola sin azúcar, 80g arándanos frescos, 30g proteína de vainilla en polvo, 5ml miel (opcional)" },
  { category: "desayuno", name: "Tostadas de centeno con requesón y salmón ahumado", ingredients: "2 rebanadas pan de centeno (60g), 150g requesón bajo en grasa, 80g salmón ahumado, zumo de medio limón, eneldo, pimienta negra" },
  { category: "desayuno", name: "Overnight oats con proteína y mantequilla de cacahuete", ingredients: "60g copos de avena, 200ml leche desnatada, 30g proteína de chocolate en polvo, 15g mantequilla de cacahuete natural, 60g plátano, 5g cacao puro" },
  { category: "desayuno", name: "Huevos revueltos con espinacas y queso cottage", ingredients: "3 huevos enteros (180g), 3 claras de huevo (105g), 80g queso cottage, 60g espinacas frescas, ajo en polvo, sal, pimienta, 5ml AOVE" },
  { category: "desayuno", name: "Batido de proteína con avena, plátano y cacao", ingredients: "30g proteína de vainilla en polvo, 40g copos de avena, 1 plátano congelado (120g), 5g cacao puro, 300ml leche desnatada, hielo" },
  { category: "desayuno", name: "Tostada integral con aguacate, huevo pochado y pimentón", ingredients: "2 tostadas integrales (60g), 80g aguacate, 2 huevos (120g), sal, pimentón ahumado, zumo de medio limón" },
  { category: "desayuno", name: "Pancakes de avena y claras", ingredients: "60g avena molida, 4 claras de huevo (140g), 1 huevos enteros (60g), 5g levadura en polvo, canela, stevia, 80g fruta de temporada para acompañar" },
  { category: "desayuno", name: "Bol de kéfir con frutos rojos y semillas de lino", ingredients: "250ml kéfir natural, 100g frutos rojos congelados, 10g semillas de lino molido, stevia" },
  { category: "desayuno", name: "Tostada de pan proteico con pavo y tomate", ingredients: "2 rebanadas pan proteico (60g), 80g pechuga de pavo en lonchas, 1 tomate mediano (120g), orégano, 5ml AOVE" },
  { category: "desayuno", name: "Porridge de avena con manzana rallada y canela", ingredients: "60g copos de avena, 250ml leche desnatada, 1 manzana (150g), canela, 5ml miel" },
  { category: "desayuno", name: "Crepes proteicos de plátano y huevo", ingredients: "2 huevos enteros (120g), 1 plátano maduro (120g)" },
  { category: "desayuno", name: "Bol de quark con melocotón y almendras laminadas", ingredients: "200g quark 0%, 1 melocotón (150g), 15g almendras laminadas tostadas, canela" },
  { category: "desayuno", name: "Tostada de centeno con huevo a la plancha y rúcula", ingredients: "2 rebanadas pan de centeno (60g), 2 huevos enteros (120g), 30g rúcula, 10g mostaza antigua, pimienta negra" },
  { category: "desayuno", name: "Batido verde con espinacas, proteína y piña", ingredients: "30g proteína de vainilla en polvo, 40g espinacas baby, 100g piña congelada, 200ml leche de avena sin azúcar" },
  { category: "desayuno", name: "Muesli casero con yogur griego y kiwi", ingredients: "50g copos de avena crudos, 10g nueces picadas, 10g pasas, 200g yogur griego 0%, 1 kiwi (80g)" },
  { category: "desayuno", name: "Wrap de tortilla de maíz con huevos, aguacate y salsa picante", ingredients: "2 huevos enteros (120g), 80g aguacate, 1 tortilla de maíz (40g), salsa picante al gusto, cilantro fresco" },
  { category: "desayuno", name: "Tosta de centeno con crema de cacahuete y plátano", ingredients: "2 rebanadas pan de centeno (60g), 15g crema de cacahuete 100%, 60g plátano, canela" },
  { category: "desayuno", name: "Bol de proteína con cacao, avena y frambuesas", ingredients: "30g proteína de chocolate en polvo, 40g copos de avena cocidos, 80g frambuesas, 5g cacao puro" },
  { category: "desayuno", name: "Huevos al horno con tomate y orégano", ingredients: "2 huevos enteros (120g), 150g tomate triturado natural, orégano, 1 diente de ajo, 5ml AOVE, sal" },
  { category: "desayuno", name: "Tostada de pan proteico con sardinas y tomate fresco", ingredients: "2 rebanadas pan proteico (60g), 90g sardinas al natural, 1 tomate (120g), 5ml AOVE, pimienta" },
  { category: "desayuno", name: "Smoothie bowl de açaí con granola y coco", ingredients: "100g pulpa de açaí congelada, 30g proteína en polvo, 100ml leche vegetal, 30g granola, 10g coco rallado sin azúcar" },
  { category: "desayuno", name: "Tortilla francesa con queso fresco y hierbas", ingredients: "2 huevos enteros (120g), 2 claras, 40g queso fresco, perejil fresco, cebollino, sal, pimienta" },
  { category: "desayuno", name: "Bol de avena proteica con mantequilla de almendra y pera", ingredients: "60g copos de avena, 30g proteína de vainilla en polvo, 1 pera (150g), 15g mantequilla de almendra natural" },
  { category: "desayuno", name: "Tostada proteica con salmón y pepino", ingredients: "2 rebanadas pan proteico (60g), 100g salmón ahumado, 100g pepino, 40g queso crema light, eneldo" },
  { category: "desayuno", name: "Revuelto de tofu con cúrcuma y espinacas", ingredients: "200g tofu sedoso, 60g espinacas frescas, 3g cúrcuma, ajo en polvo, sal negra kala namak, 5ml AOVE" },
  { category: "desayuno", name: "Bol de granola casera con leche y fresas", ingredients: "40g copos de avena tostados, canela, stevia, 200ml leche desnatada, 80g fresas frescas" },
  { category: "desayuno", name: "Tostada de espelta con queso de cabra, nueces y miel", ingredients: "2 rebanadas pan de espelta (60g), 60g queso de cabra fresco, 15g nueces, 5ml miel" },
  { category: "desayuno", name: "Burrito de desayuno con claras, alubias negras y salsa", ingredients: "4 claras de huevo (140g), 60g alubias negras cocidas, 1 tortilla integral (40g), 50g salsa de tomate, comino" },
  { category: "desayuno", name: "Parfait de yogur griego, proteína y crumble de avena", ingredients: "200g yogur griego 0%, 30g proteína en polvo, 30g copos de avena, canela, stevia, 80g frutos rojos" },
  { category: "desayuno", name: "Tostada de pan de centeno con hummus y huevo duro", ingredients: "2 rebanadas pan de centeno (60g), 60g hummus, 2 huevos duros (120g), pimentón ahumado, sal" },
  { category: "desayuno", name: "Bol de avena con coco rallado, mango y proteína", ingredients: "60g copos de avena cocidos, 30g proteína de vainilla en polvo, 80g mango, 10g coco rallado sin azúcar, 200ml leche de coco light" },
  { category: "desayuno", name: "Tostada de espelta con mantequilla de almendra y frambuesas", ingredients: "2 rebanadas pan de espelta (60g), 20g mantequilla de almendra 100%, 80g frambuesas frescas, canela" },
  { category: "desayuno", name: "Revuelto de claras con salmón y aguacate", ingredients: "4 claras de huevo (140g), 1 huevos enteros (60g), 80g salmón ahumado, 80g aguacate, sal, pimienta, 5ml AOVE" },
  { category: "desayuno", name: "Porridge de avena con pera, jengibre y nueces", ingredients: "60g copos de avena, 250ml leche desnatada, 1 pera (150g), 3g jengibre fresco rallado, 15g nueces, canela" },
  { category: "desayuno", name: "Bowl de skyr con plátano, cacao y almendras", ingredients: "200g skyr natural, 30g proteína de chocolate en polvo, 1 plátano (120g), 5g cacao puro, 15g almendras crudas" },
  { category: "desayuno", name: "Tostada integral con ricotta, higos y miel", ingredients: "2 rebanadas pan integral (60g), 80g ricotta, 2 higos frescos (80g), 5ml miel, canela" },
  { category: "desayuno", name: "Batido de proteína con zanahoria, jengibre y naranja", ingredients: "30g proteína de vainilla en polvo, 1 zanahoria (80g), 80g naranja, 3g jengibre, 250ml leche vegetal, hielo" },
  { category: "desayuno", name: "Huevos al plato con chorizo ibérico y pimiento", ingredients: "2 huevos enteros (120g), 30g chorizo ibérico, 80g pimiento rojo, 1 tomate (100g), sal, 5ml AOVE" },
  { category: "desayuno", name: "Bol de queso cottage con piña y semillas de calabaza", ingredients: "200g queso cottage, 100g piña fresca, 10g semillas de calabaza, stevia" },
  { category: "desayuno", name: "Tostada de centeno con sardinas, tomate y alcaparras", ingredients: "2 rebanadas pan de centeno (60g), 80g sardinas en AOVE, 1 tomate (120g), 15g alcaparras, pimienta negra" },
  { category: "desayuno", name: "Wrap de tortilla integral con huevos, jamón y espinacas", ingredients: "1 tortilla integral (40g), 2 huevos revueltos (120g), 50g jamón york, 40g espinacas baby, mostaza, sal" },
  { category: "desayuno", name: "Bol de muesli remojado con kéfir y kiwi", ingredients: "50g copos de avena remojados en 150ml kéfir toda la noche, 1 kiwi (80g), 10g semillas de lino, stevia" },
  { category: "desayuno", name: "Tortilla de claras con pimiento rojo y cebolla", ingredients: "5 claras de huevo (175g), 1 huevos enteros (60g), 80g pimiento rojo, ½ cebolla (70g) pochada, sal, pimienta, 5ml AOVE" },
  { category: "desayuno", name: "Batido de proteína con mantequilla de cacahuete y plátano", ingredients: "30g proteína de chocolate en polvo, 15g mantequilla de cacahuete, 1 plátano congelado (120g), 250ml leche desnatada, hielo" },
  { category: "desayuno", name: "Tostada proteica con queso crema, pepino y eneldo", ingredients: "2 rebanadas pan proteico (60g), 60g queso crema light, 100g pepino, eneldo fresco, sal, pimienta" },
  { category: "desayuno", name: "Bol de yogur griego con mango, coco y semillas de chía", ingredients: "250g yogur griego 0%, 80g mango, 10g coco rallado, 10g semillas de chía, stevia" },
  { category: "desayuno", name: "Huevos Benedict ligeros con jamón serrano y espinacas", ingredients: "2 huevos pochados (120g), 50g jamón serrano, 60g espinacas salteadas, 2 rebanadas pan integral (60g), 50g yogur griego + limón de salsa" },
  { category: "desayuno", name: "Overnight oats con manzana, canela y nueces", ingredients: "60g copos de avena, 200ml leche desnatada, 1 manzana rallada (150g), 15g nueces, canela, stevia" },
  { category: "desayuno", name: "Bol proteico de cacao con frambuesas y avena", ingredients: "30g proteína de chocolate en polvo, 200g yogur griego 0%, 30g copos de avena crudos, 80g frambuesas, 5g cacao puro" },
  { category: "desayuno", name: "Tostada de pan de semillas con aguacate y anchoas", ingredients: "2 rebanadas pan de semillas (60g), 80g aguacate, 4 anchoas en aceite (20g), zumo de medio limón, pimienta negra" },
  { category: "desayuno", name: "Crepes de avena con requesón y frutos rojos", ingredients: "60g avena molida, 2 huevos (120g), 100ml leche, 150g requesón, 80g frutos rojos" },
  { category: "desayuno", name: "Batido de proteína con espirulina, piña y jengibre", ingredients: "30g proteína de vainilla en polvo, 3g espirulina en polvo, 100g piña congelada, 3g jengibre, 250ml agua de coco" },
  { category: "desayuno", name: "Bol de quark con melocotón asado y canela", ingredients: "200g quark 0%, 1 melocotón (150g) asado al horno con canela y stevia, 15g almendras laminadas" },
  { category: "desayuno", name: "Tostada de centeno con pavo, mostaza antigua y rúcula", ingredients: "2 rebanadas pan de centeno (60g), 80g pavo en lonchas, 10g mostaza antigua, 30g rúcula, pimienta negra" },
  { category: "desayuno", name: "Gachas de avena con proteína, cacao y avellanas", ingredients: "60g copos de avena, 250ml leche desnatada, 30g proteína de chocolate en polvo, 10g avellanas picadas, 5g cacao puro" },
  { category: "desayuno", name: "Bol de kéfir con semillas de hemp y plátano", ingredients: "250ml kéfir natural, 15g semillas de hemp (cáñamo), 1 plátano (120g), canela, stevia" },
  { category: "desayuno", name: "Tostada integral con queso feta, tomate seco y orégano", ingredients: "2 rebanadas pan integral (60g), 50g queso feta desmenuzado, 20g tomates secos en aceite escurridos, orégano, 5ml AOVE" },
  { category: "desayuno", name: "Revuelto de claras con champiñones, ajo y perejil", ingredients: "5 claras de huevo (175g), 1 huevos enteros (60g), 150g champiñones laminados, 2 dientes ajo, perejil fresco, sal, 5ml AOVE" },
  { category: "desayuno", name: "Parfait de skyr, proteína, granola y melocotón", ingredients: "200g skyr, 30g proteína de vainilla en polvo, 25g granola sin azúcar, 1 melocotón (150g) en capas" },
  // ── SNACK MAÑANA (60) ──
  { category: "snack_manana", name: "Tarro de cottage con fruta y nueces", ingredients: "200g queso cottage, 1 manzana o pera (150g), 20g nueces, canela" },
  { category: "snack_manana", name: "Huevos duros con sal de hierbas", ingredients: "2 huevos enteros (120g), sal con tomillo y ajo en polvo, pimienta negra" },
  { category: "snack_manana", name: "Crudités con hummus de pimiento rojo", ingredients: "1 zanahoria (80g), 100g pepino, 2 tallos apio (60g), 80g pimiento rojo, 100g hummus, pimentón ahumado" },
  { category: "snack_manana", name: "Skyr con chía y mango", ingredients: "200g skyr natural, 10g semillas de chía, 80g mango fresco o congelado, stevia" },
  { category: "snack_manana", name: "Tortitas de arroz con aguacate y pavo", ingredients: "3 tortitas de arroz (30g), 80g aguacate, 80g pechuga de pavo en lonchas, zumo de medio limón, sal, pimienta" },
  { category: "snack_manana", name: "Batido proteico de fresa y vainilla", ingredients: "30g proteína de vainilla en polvo, 100g fresas congeladas, 250ml leche desnatada, hielo" },
  { category: "snack_manana", name: "Atún al natural con palitos de zanahoria", ingredients: "120g atún al natural, 2 zanahorias (160g), zumo de medio limón" },
  { category: "snack_manana", name: "Lonchas de pavo enrolladas con queso fresco", ingredients: "80g pechuga de pavo en lonchas, 40g queso fresco light, pimienta negra, 20g rúcula" },
  { category: "snack_manana", name: "Manzana con canela y almendras", ingredients: "1 manzana grande (180g), 10 almendras crudas (12g), canela" },
  { category: "snack_manana", name: "Mini bol de edamame con sal y sésamo", ingredients: "100g edamame cocido (sin vaina), sal marina en escamas, 5g sésamo tostado, zumo de medio limón" },
  { category: "snack_manana", name: "Yogur griego con cacao y avellanas", ingredients: "200g yogur griego 0%, 5g cacao puro en polvo, 10g avellanas picadas, stevia" },
  { category: "snack_manana", name: "Rebanada de centeno con crema de cacahuete", ingredients: "1 rebanada pan de centeno (30g), 10g crema de cacahuete 100%, canela" },
  { category: "snack_manana", name: "Mix de frutos secos y semillas", ingredients: "10g almendras crudas, 10g nueces, 5g pipas de girasol, 5g semillas de calabaza" },
  { category: "snack_manana", name: "Rodajas de pepino con queso de Burgos y orégano", ingredients: "1 pepino (200g), 100g queso de Burgos, orégano, sal, 5ml AOVE" },
  { category: "snack_manana", name: "Pudding de chía express", ingredients: "30g semillas de chía, 200ml leche desnatada, extracto de vainilla, stevia" },
  { category: "snack_manana", name: "Mejillones al natural con tostada de centeno", ingredients: "80g mejillones al natural, 1 rebanada pan de centeno (30g), zumo de medio limón, pimienta" },
  { category: "snack_manana", name: "Queso fresco con tomate y orégano", ingredients: "150g queso fresco, 1 tomate mediano (120g), orégano, 5ml AOVE, sal" },
  { category: "snack_manana", name: "Palitos de apio con queso crema y cebollino", ingredients: "3 tallos apio (90g), 60g queso crema light, cebollino fresco picado, sal" },
  { category: "snack_manana", name: "Gelatina proteica con fruta fresca", ingredients: "1 sobre gelatina sin azúcar (10g), 30g proteína en polvo, 200ml agua, 80g fruta fresca de temporada" },
  { category: "snack_manana", name: "Tosta de centeno con sardinas en AOVE", ingredients: "1 rebanada pan de centeno (30g), 80g sardinas en aceite de oliva, 1 tomate (80g), pimienta" },
  { category: "snack_manana", name: "Bol de cottage con pepino y menta", ingredients: "200g queso cottage, 100g pepino rallado, menta fresca picada, sal, pimienta" },
  { category: "snack_manana", name: "Apio con guacamole simple", ingredients: "3 tallos apio (90g), 1 aguacate maduro (150g), zumo de medio limón, sal, ajo en polvo" },
  { category: "snack_manana", name: "Mini tortilla de jamón york en microondas", ingredients: "3 claras de huevo (105g), 1 huevos enteros (60g), 40g jamón york en taquitos, sal" },
  { category: "snack_manana", name: "Plátano con mantequilla de almendra", ingredients: "1 plátano mediano (120g), 10g mantequilla de almendra 100%" },
  { category: "snack_manana", name: "Rollito de lechuga con atún y maíz", ingredients: "3 hojas grandes lechuga romana, 120g atún al natural, 40g maíz cocido, 20g pepinillo, 10g mostaza" },
  { category: "snack_manana", name: "Café proteico (protein coffee)", ingredients: "1 espresso (30ml), 1 scoop proteína vainilla o caramelo (30g), 150ml leche desnatada fría, hielo" },
  { category: "snack_manana", name: "Pepino relleno de ricotta y salmón", ingredients: "1 pepino mediano (200g), 80g queso ricotta, 40g salmón ahumado, eneldo fresco" },
  { category: "snack_manana", name: "Rodajas de pavo con pepinillo", ingredients: "80g pechuga de pavo en lonchas, 5 pepinillos en vinagre (50g), 10g mostaza" },
  { category: "snack_manana", name: "Kéfir bebible con canela", ingredients: "200ml kéfir natural, canela, stevia" },
  { category: "snack_manana", name: "Bol de maíz tostado con parmesano", ingredients: "80g maíz cocido, 10g queso parmesano rallado, pimentón ahumado" },
  { category: "snack_manana", name: "Bol de skyr con semillas de calabaza y arándanos", ingredients: "200g skyr natural, 10g semillas de calabaza, 80g arándanos frescos, stevia" },
  { category: "snack_manana", name: "Rollito de pavo con queso crema y pepino", ingredients: "80g pavo en lonchas, 40g queso crema light, ½ pepino (80g) en bastones, pimienta negra" },
  { category: "snack_manana", name: "Tosta de centeno con queso cottage y tomate cherry", ingredients: "1 rebanada pan de centeno (30g), 100g queso cottage, 6 tomates cherry (60g), sal, orégano" },
  { category: "snack_manana", name: "Puñado de pistachos y una mandarina", ingredients: "30g pistachos sin sal, 1 mandarina (100g)" },
  { category: "snack_manana", name: "Bol de requesón con canela y manzana", ingredients: "200g requesón, 1 manzana (150g) en cubos, canela, stevia" },
  { category: "snack_manana", name: "Minibol de edamame con salsa de soja y sésamo", ingredients: "120g edamame cocido sin vaina, 10ml salsa de soja reducida en sodio, 5g sésamo tostado, zumo de medio limón" },
  { category: "snack_manana", name: "Lata de caballa al natural con tostada de centeno", ingredients: "100g caballa al natural, 1 rebanada pan de centeno (30g), zumo de medio limón, pimienta" },
  { category: "snack_manana", name: "Vasito de yogur griego con semillas de lino y naranja", ingredients: "200g yogur griego 0%, 10g semillas de lino molido, 80g naranja, stevia" },
  { category: "snack_manana", name: "Pepino con atún y mostaza", ingredients: "1 pepino (200g) en rodajas, 80g atún al natural escurrido, 10g mostaza, pimienta" },
  { category: "snack_manana", name: "Tortita de arroz con queso fresco y jamón ibérico", ingredients: "2 tortitas de arroz (20g), 60g queso fresco, 30g jamón ibérico en lonchas" },
  { category: "snack_manana", name: "Batido express de proteína con leche y canela", ingredients: "30g proteína de vainilla en polvo, 250ml leche desnatada, canela, hielo" },
  { category: "snack_manana", name: "Bol de cottage con pepinillo, cebollino y pimienta", ingredients: "200g queso cottage, 30g pepinillo en vinagre picado, cebollino fresco, pimienta negra, sal" },
  { category: "snack_manana", name: "Mix de almendras, arándanos secos y coco", ingredients: "15g almendras crudas, 10g arándanos secos sin azúcar, 5g coco rallado sin azúcar" },
  { category: "snack_manana", name: "Rollito de salmón ahumado con queso crema", ingredients: "80g salmón ahumado, 40g queso crema light, eneldo, zumo de medio limón, pimienta negra" },
  { category: "snack_manana", name: "Bol de kéfir con avena cruda y pera", ingredients: "200ml kéfir natural, 30g copos de avena crudos, 1 pera (150g) en cubos, canela" },
  { category: "snack_manana", name: "Tomates cherry con mozzarella light y albahaca", ingredients: "150g tomates cherry, 80g mozzarella light, albahaca fresca, sal, 5ml AOVE, pimienta" },
  { category: "snack_manana", name: "Mini brocheta de pavo, queso y uvas", ingredients: "60g pavo en taquitos, 40g queso manchego en dados, 6 uvas (60g), palillos" },
  { category: "snack_manana", name: "Vasito de gazpacho con jamón", ingredients: "200ml gazpacho casero (tomate, pepino, pimiento, ajo, AOVE, vinagre), 20g jamón serrano en taquitos" },
  { category: "snack_manana", name: "Rebanada de espelta con ricotta y fresas", ingredients: "1 rebanada pan de espelta (30g), 60g ricotta, 60g fresas en rodajas, stevia" },
  { category: "snack_manana", name: "Huevo duro con salsa de yogur y curry", ingredients: "2 huevos duros (120g), 50g yogur griego, 3g curry en polvo, sal, zumo de medio limón" },
  { category: "snack_manana", name: "Bastones de zanahoria con crema de aguacate", ingredients: "2 zanahorias (160g) en bastones, 1 aguacate (150g), zumo de medio limón, sal, ajo en polvo" },
  { category: "snack_manana", name: "Bol de quark con arándanos y avena tostada", ingredients: "200g quark 0%, 80g arándanos, 20g copos de avena tostados en sartén seca, stevia" },
  { category: "snack_manana", name: "Lonchas de jamón serrano con aceitunas", ingredients: "60g jamón serrano, 20g aceitunas verdes, pimienta negra" },
  { category: "snack_manana", name: "Tosta proteica con sardinas y pimiento asado", ingredients: "1 rebanada pan proteico (30g), 80g sardinas al natural, 40g pimiento asado, sal, pimienta" },
  { category: "snack_manana", name: "Minibol de maíz con feta y tomate cherry", ingredients: "80g maíz cocido, 30g queso feta, 6 tomates cherry (60g), 5ml AOVE, sal" },
  { category: "snack_manana", name: "Batido de kéfir con plátano y cacao", ingredients: "200ml kéfir, 1 plátano (120g), 5g cacao puro, stevia, hielo" },
  { category: "snack_manana", name: "Palitos de apio con hummus y pimentón", ingredients: "3 tallos apio (90g), 80g hummus, pimentón ahumado" },
  { category: "snack_manana", name: "Rollito de lechuga con gambas y limón", ingredients: "3 hojas lechuga romana, 100g gambas cocidas, zumo de medio limón, sal, pimienta, 5ml AOVE" },
  { category: "snack_manana", name: "Tarro de yogur con copos de espelta y melocotón", ingredients: "200g yogur griego 0%, 30g copos de espelta crudos, 1 melocotón (150g) en cubos, canela" },
  { category: "snack_manana", name: "Minibol de alubias blancas con atún y cebolla", ingredients: "100g alubias blancas cocidas, 80g atún al natural escurrido, ¼ cebolla roja (40g), perejil, 5ml AOVE, sal" },
  // ── COMIDA (60) ──
  { category: "comida", name: "Pollo a la plancha con arroz integral y brócoli", ingredients: "200g pechuga de pollo, 80g arroz integral en crudo, 200g brócoli, 2 dientes ajo, zumo de medio limón, orégano, sal, 10ml AOVE" },
  { category: "comida", name: "Salmón al horno con espárragos y patata", ingredients: "200g lomo de salmón fresco, 150g patata, 150g espárragos trigueros, eneldo, zumo de medio limón, sal, 10ml AOVE" },
  { category: "comida", name: "Bol de quinoa con atún, aguacate y tomate", ingredients: "80g quinoa en crudo, 160g atún al natural escurrido (2 latas), 80g aguacate, 1 tomate grande (150g), 40g maíz cocido, 100g pepino, zumo de medio limón, comino, sal, 10ml AOVE" },
  { category: "comida", name: "Pechuga de pavo rellena con espinacas y queso", ingredients: "200g pechuga de pavo en filete grueso, 60g espinacas frescas, 50g mozzarella light, sal, pimienta, ajo en polvo, orégano" },
  { category: "comida", name: "Lentejas con verduras y huevo pochado", ingredients: "150g lentejas pardinas cocidas, 70g cebolla, 1 zanahoria (80g), 1 diente ajo, 100g tomate triturado, pimentón dulce, 2 huevos (120g), sal, 10ml AOVE" },
  { category: "comida", name: "Lomo de cerdo al air fryer con batata", ingredients: "200g lomo de cerdo en medallones, 150g batata, pimentón ahumado, ajo en polvo, romero, sal, 10ml AOVE" },
  { category: "comida", name: "Merluza con puré de coliflor y espinacas", ingredients: "250g merluza en lomo, 300g coliflor, 80g espinacas frescas, sal, pimienta, nuez moscada, 10ml AOVE" },
  { category: "comida", name: "Ensalada de garbanzos con pollo, pimiento asado y feta", ingredients: "150g garbanzos cocidos, 150g pechuga de pollo asada, 100g pimiento asado, 30g queso feta, 10ml AOVE, 10ml vinagre, sal" },
  { category: "comida", name: "Wok de ternera con verduras y soja", ingredients: "180g solomillo de ternera en tiras, 80g pimiento rojo, 70g cebolla, 1 zanahoria (80g), 100g brócoli, 20ml salsa de soja reducida en sodio, 5g jengibre fresco, 10ml AOVE" },
  { category: "comida", name: "Pasta integral con pollo y tomate casero", ingredients: "80g pasta integral en crudo, 150g pechuga de pollo, 200g tomate triturado natural, 2 dientes ajo, albahaca fresca, sal, 10ml AOVE" },
  { category: "comida", name: "Caballa al horno con patata y cherry", ingredients: "250g caballa limpia, 150g patata, 100g tomates cherry, 2 dientes ajo, perejil fresco, sal, 10ml AOVE" },
  { category: "comida", name: "Bol de arroz con salmón teriyaki", ingredients: "80g arroz jazmín en crudo, 180g salmón fresco, 20ml salsa de soja, 5ml miel, 5g jengibre fresco, 5g sésamo, 60g edamame cocido" },
  { category: "comida", name: "Tortilla de patata y verduras al horno", ingredients: "4 huevos enteros (240g), 3 claras, 150g patata cocida, 80g pimiento rojo, 1 cebolla (100g), sal, 10ml AOVE" },
  { category: "comida", name: "Pollo al curry con arroz basmati", ingredients: "200g pechuga de pollo en trozos, 10g curry en polvo, 100ml leche de coco light, 70g cebolla, 80g arroz basmati en crudo, sal, 10ml AOVE" },
  { category: "comida", name: "Dorada a la sal con verduras asadas", ingredients: "1 dorada entera limpia (~300g), 1kg sal gorda, 80g pimiento rojo, 1 cebolla (100g), 10ml AOVE" },
  { category: "comida", name: "Bowl de garbanzos especiados con tzatziki", ingredients: "200g garbanzos cocidos, 5g comino, 5g cúrcuma, pimentón, 100g yogur griego, 80g pepino rallado, 1 diente ajo, eneldo, sal, 10ml AOVE" },
  { category: "comida", name: "Ensalada de pasta con atún, maíz y huevo", ingredients: "80g pasta integral cocida fría, 120g atún al natural escurrido, 40g maíz cocido, 2 huevos duros (120g), 1 tomate (120g), 10g mostaza, 10ml AOVE" },
  { category: "comida", name: "Conejo guisado con champiñones", ingredients: "250g conejo en trozos, 150g champiñones, 100ml vino blanco, hierbas provenzales, 70g cebolla, 2 dientes ajo, sal, 10ml AOVE" },
  { category: "comida", name: "Espaguetis de calabacín con albóndigas de pavo", ingredients: "3 calabacines medianos (450g), 200g carne picada de pavo, 1 huevos enteros (60g), 2 dientes ajo, 200g tomate triturado, perejil, sal, 10ml AOVE" },
  { category: "comida", name: "Arroz frito con pollo y verduras", ingredients: "80g arroz en crudo, 180g pechuga de pollo, 1 zanahoria (80g), 60g guisantes, 1 huevos batidos (60g), 20ml salsa de soja, 5g jengibre fresco, 10ml AOVE" },
  { category: "comida", name: "Bacalao confitado con pisto", ingredients: "200g bacalao desalado, 100g calabacín, 80g pimiento rojo, 1 tomate (120g), 70g cebolla, sal, 30ml AOVE (para confitar)" },
  { category: "comida", name: "Ensalada templada de espinacas, pollo y huevo", ingredients: "80g espinacas frescas, 180g pechuga de pollo a la plancha, 2 huevos duros (120g), 100g tomates cherry, 10ml AOVE, 10ml vinagre balsámico, sal" },
  { category: "comida", name: "Pechuga de pollo en papillote", ingredients: "200g pechuga de pollo, zumo de medio limón, tomillo fresco, 2 dientes ajo, sal, pimienta, 10ml AOVE" },
  { category: "comida", name: "Alubias blancas con chorizo y espinacas", ingredients: "200g alubias blancas cocidas, 40g chorizo ibérico, 80g espinacas frescas, 150ml caldo de verduras, pimentón dulce, sal, 5ml AOVE" },
  { category: "comida", name: "Filete de ternera con rúcula y parmesano", ingredients: "180g filete de ternera, 60g rúcula, 15g parmesano, 100g tomates cherry, 10ml AOVE, 10ml vinagre balsámico, sal, pimienta" },
  { category: "comida", name: "Pollo desmigado con boniato y salsa de yogur", ingredients: "200g muslos de pollo (peso en crudo), 150g boniato, 100g yogur griego, 1 diente ajo, zumo de medio limón, eneldo, sal" },
  { category: "comida", name: "Hamburguesa de ternera casera con ensalada", ingredients: "180g carne picada de ternera, 1 huevos enteros (60g), 2 dientes ajo, perejil, sal, pimienta, 60g lechuga, 1 tomate (120g), 10g mostaza" },
  { category: "comida", name: "Caldo de pollo con fideos konjac y verduras", ingredients: "400ml caldo de pollo casero, 150g fideos de konjac, 1 zanahoria (80g), 1 tallo apio, 60g puerro, 100g pechuga de pollo desmigada, sal" },
  { category: "comida", name: "Solomillo de cerdo con mostaza y puré de coliflor", ingredients: "200g solomillo de cerdo, 15g mostaza dijon, 100ml caldo de pollo, 300g coliflor, sal, pimienta, nuez moscada, 10ml AOVE" },
  { category: "comida", name: "Ensalada de arroz integral, pollo y verduras asadas", ingredients: "80g arroz integral en crudo, 180g pechuga de pollo, 1 pimiento rojo (160g), 1 berenjena pequeña (150g), 20g aceitunas, comino, sal, 10ml AOVE" },
  { category: "comida", name: "Pollo al horno con patatas panaderas y cebolla", ingredients: "200g muslos de pollo sin piel, 200g patata en rodajas finas, 1 cebolla (100g), 2 dientes ajo, romero, sal, 15ml AOVE" },
  { category: "comida", name: "Atún a la plancha con ensalada de judías y tomate", ingredients: "200g lomo de atún fresco, 150g judías verdes cocidas, 1 tomate (120g), 60g cebolla roja, 10ml AOVE, sal, pimienta" },
  { category: "comida", name: "Poke bowl de salmón con arroz, edamame y mango", ingredients: "80g arroz de sushi cocido, 150g salmón fresco en cubos marinado en 15ml soja + 5ml sésamo, 60g edamame, 60g mango, 80g aguacate, 5g sésamo" },
  { category: "comida", name: "Pollo tandoori al horno con arroz basmati", ingredients: "200g pechuga de pollo, 80g arroz basmati, 100g yogur griego, 10g pasta tandoori, zumo de medio limón, cilantro fresco, sal" },
  { category: "comida", name: "Rape con salsa de azafrán y arroz blanco", ingredients: "250g rape en medallones, 80g arroz blanco, 1 sobre azafrán, 70g cebolla, 100ml caldo de pescado, sal, 10ml AOVE" },
  { category: "comida", name: "Ensalada de espinacas con salmón, aguacate y nueces", ingredients: "80g espinacas baby, 180g salmón a la plancha, 80g aguacate, 15g nueces, 100g tomates cherry, 10ml AOVE, 10ml limón, sal" },
  { category: "comida", name: "Ternera guisada con zanahorias y patata", ingredients: "200g ternera para guisar en trozos, 1 zanahoria (80g), 150g patata, 70g cebolla, 200ml caldo de carne, tomillo, sal, 10ml AOVE" },
  { category: "comida", name: "Brochetas de gambas y verduras al horno", ingredients: "200g gambas peladas, 80g pimiento rojo, 100g calabacín, 70g cebolla, pimentón, ajo en polvo, sal, 10ml AOVE" },
  { category: "comida", name: "Bowl de arroz con pollo tikka masala casero", ingredients: "80g arroz basmati, 200g pechuga pollo, 150g tomate triturado, 100ml leche de coco light, 10g pasta tikka masala, 70g cebolla, 2 dientes ajo, sal, 10ml AOVE" },
  { category: "comida", name: "Lubina al horno con fenicio y patata", ingredients: "250g lubina en filetes, 1 bulbo de hinojo (150g), 150g patata, zumo de medio limón, tomillo, sal, 15ml AOVE" },
  { category: "comida", name: "Ensalada niçoise", ingredients: "2 huevos duros (120g), 120g atún al natural escurrido, 80g judías verdes cocidas, 1 tomate (120g), 6 aceitunas negras (30g), 80g patata cocida, 10ml AOVE, 10ml vinagre, sal" },
  { category: "comida", name: "Muslos de pollo al limón con couscous y menta", ingredients: "2 muslos pollo sin piel (~280g), 80g couscous en crudo, zumo de medio limón, menta fresca, 70g cebolla, 2 dientes ajo, sal, 10ml AOVE" },
  { category: "comida", name: "Merluza en salsa verde con almejas", ingredients: "250g lomo de merluza, 100g almejas limpias, perejil fresco, 2 dientes ajo, 100ml vino blanco, 5g harina de maíz, sal, 15ml AOVE" },
  { category: "comida", name: "Bol de quinoa con salmón, espinacas y limón", ingredients: "80g quinoa en crudo, 180g salmón a la plancha, 80g espinacas salteadas, zumo de medio limón, sal, 10ml AOVE" },
  { category: "comida", name: "Carne picada de pavo con berenjena y tomate al horno", ingredients: "200g carne picada de pavo, 1 berenjena (200g), 200g tomate triturado, 2 dientes ajo, orégano, sal, 10ml AOVE" },
  { category: "comida", name: "Ensalada de lentejas con pimiento asado y atún", ingredients: "150g lentejas cocidas, 100g pimiento asado, 120g atún al natural escurrido, 60g cebolla roja, perejil, 10ml AOVE, 10ml vinagre, sal" },
  { category: "comida", name: "Dorada al horno con costra de hierbas", ingredients: "1 dorada (~300g), perejil, tomillo, romero, 2 dientes ajo, zumo de medio limón, 30g pan rallado integral, sal, 15ml AOVE" },
  { category: "comida", name: "Pollo asado entero al horno (ración)", ingredients: "250g cuarto trasero de pollo, 2 dientes ajo, romero, tomillo, zumo de medio limón, sal, pimienta, 15ml AOVE" },
  { category: "comida", name: "Pasta de legumbres con gambas y calabacín", ingredients: "80g pasta de lentejas o garbanzos, 150g gambas peladas, 1 calabacín (200g), 2 dientes ajo, 100g tomate cherry, sal, 10ml AOVE" },
  { category: "comida", name: "Bol de boniato asado con pollo, feta y granada", ingredients: "150g boniato asado, 180g pechuga de pollo, 30g queso feta, 40g granada, 30g rúcula, 10ml AOVE, sal" },
  { category: "comida", name: "Pulpo a la gallega con patata cocida", ingredients: "200g pulpo cocido, 150g patata cocida, pimentón dulce y picante, sal gruesa, 15ml AOVE" },
  { category: "comida", name: "Fideuà de marisco ligera", ingredients: "80g fideos finos, 100g gambas, 100g mejillones, 100g sepia, 200ml caldo de pescado, 70g cebolla, 1 tomate (100g), 2 dientes ajo, sal, 10ml AOVE" },
  { category: "comida", name: "Bol de arroz integral con huevo, edamame y salsa de soja", ingredients: "80g arroz integral, 1 huevo frito (60g), 80g edamame, 20ml salsa de soja, 5g sésamo, cebolleta verde, 5ml AOVE" },
  { category: "comida", name: "Pechuga de pollo rellena de queso y pimiento del piquillo", ingredients: "200g pechuga de pollo, 40g queso mozzarella light, 60g pimientos del piquillo, sal, pimienta, ajo en polvo" },
  { category: "comida", name: "Ensalada de arroz salvaje con salmón y espárragos", ingredients: "80g arroz salvaje en crudo, 180g salmón a la plancha, 100g espárragos blancos, 10ml AOVE, zumo de medio limón, eneldo, sal" },
  { category: "comida", name: "Hamburguesa de salmón casera con ensalada", ingredients: "180g salmón fresco triturado, 1 huevo (60g), 20g pan rallado integral, eneldo, zumo de medio limón, sal, 60g lechuga, 1 tomate (100g), 10g mostaza" },
  { category: "comida", name: "Pollo con salsa de miso y verduras al wok", ingredients: "200g pechuga de pollo, 15g pasta de miso, 5ml miel, 10ml salsa de soja, 100g brócoli, 1 zanahoria (80g), 5g jengibre, 10ml AOVE" },
  { category: "comida", name: "Garbanzos con bacalao y espinacas", ingredients: "200g garbanzos cocidos, 150g bacalao desalado, 80g espinacas, 2 dientes ajo, pimentón, 150ml caldo, sal, 10ml AOVE" },
  { category: "comida", name: "Bol de cuscús con pollo, limón y hierbas", ingredients: "80g couscous, 180g pechuga de pollo a la plancha, zumo de medio limón, menta, perejil, ¼ cebolla roja (40g), 10ml AOVE, sal" },
  { category: "comida", name: "Solomillo de ternera con patata al vapor y judías verdes", ingredients: "180g solomillo de ternera, 150g patata, 150g judías verdes, sal, pimienta, romero, 10ml AOVE" },
  // ── SNACK TARDE (60) ──
  { category: "snack_tarde", name: "Tosta de pan proteico con pavo y pepinillo", ingredients: "2 rebanadas pan proteico (60g), 80g pechuga de pavo en lonchas, 30g pepinillos en vinagre, 10g mostaza, 20g rúcula" },
  { category: "snack_tarde", name: "Manzana con mantequilla de almendra y canela", ingredients: "1 manzana grande (180g), 15g mantequilla de almendra 100%, canela" },
  { category: "snack_tarde", name: "Mini tortilla de claras con queso y orégano", ingredients: "3 claras de huevo (105g), 1 huevos enteros (60g), 20g queso light rallado, orégano, sal, pimienta" },
  { category: "snack_tarde", name: "Pudding de chía con cacao y frambuesas", ingredients: "30g semillas de chía, 200ml leche desnatada, 5g cacao puro, stevia, 30g proteína en polvo, 80g frambuesas" },
  { category: "snack_tarde", name: "Edamame con sal marina y sésamo", ingredients: "150g edamame cocido, sal marina en escamas, 5g sésamo tostado, zumo de medio limón" },
  { category: "snack_tarde", name: "Jamón ibérico con nueces", ingredients: "50g jamón ibérico en lonchas, 20g nueces" },
  { category: "snack_tarde", name: "Yogur griego con avena y canela", ingredients: "200g yogur griego 0%, 30g copos de avena crudos, canela, stevia" },
  { category: "snack_tarde", name: "Batido de proteína de chocolate con leche de avena", ingredients: "30g proteína de chocolate en polvo, 250ml leche de avena sin azúcar, hielo" },
  { category: "snack_tarde", name: "Tostada de centeno con aguacate y tomate seco", ingredients: "1 rebanada pan de centeno (30g), 80g aguacate, 20g tomates secos en aceite escurridos, sal, pimienta" },
  { category: "snack_tarde", name: "Dados de queso manchego con nueces", ingredients: "40g queso manchego semicurado, 20g nueces" },
  { category: "snack_tarde", name: "Bol de skyr con granola y kiwi", ingredients: "200g skyr natural, 25g granola, 1 kiwi (80g)" },
  { category: "snack_tarde", name: "Barrita casera de avena y dátil", ingredients: "100g copos de avena, 4 dátiles medjool (60g), 30g proteína en polvo, 10g cacao puro, 10ml aceite de coco" },
  { category: "snack_tarde", name: "Pepino con queso crema y salmón", ingredients: "1 pepino mediano (200g), 60g queso crema light, 50g salmón ahumado" },
  { category: "snack_tarde", name: "Rollito integral con atún y hummus", ingredients: "1 tortilla integral (40g), 50g hummus, 80g espinacas baby, 120g atún al natural escurrido" },
  { category: "snack_tarde", name: "Café proteico frío con canela", ingredients: "30ml espresso frío, 30g proteína de caramelo en polvo, 150ml leche desnatada, canela, hielo" },
  { category: "snack_tarde", name: "Bol de requesón con piña y coco", ingredients: "200g requesón, 80g piña fresca en cubos, 10g coco rallado sin azúcar" },
  { category: "snack_tarde", name: "Mini wrap con jamón serrano y rúcula", ingredients: "1 tortilla integral pequeña (30g), 50g jamón serrano, 30g rúcula, 1 tomate (80g), 10g mostaza" },
  { category: "snack_tarde", name: "Compota de manzana con proteína", ingredients: "2 manzanas (300g), canela, 30g proteína de vainilla en polvo" },
  { category: "snack_tarde", name: "Chips de garbanzos al horno", ingredients: "200g garbanzos cocidos, 10ml AOVE, sal, pimentón ahumado, comino" },
  { category: "snack_tarde", name: "Gelatina de frutas con yogur", ingredients: "1 sobre gelatina sin azúcar (10g), 80g frutas del bosque congeladas, 100g yogur griego" },
  { category: "snack_tarde", name: "Tosta de espelta con hummus y rabanitos", ingredients: "2 rebanadas pan de espelta (60g), 60g hummus, 5 rabanitos (60g), sal, eneldo" },
  { category: "snack_tarde", name: "Tiritas de pollo frío con salsa de yogur", ingredients: "100g pechuga de pollo cocida y fría, 100g yogur griego, 1 diente ajo, zumo de medio limón, eneldo, sal" },
  { category: "snack_tarde", name: "Kéfir con frutos rojos y lino molido", ingredients: "200ml kéfir natural, 80g frutos rojos, 10g lino molido" },
  { category: "snack_tarde", name: "Palomitas caseras con levadura nutricional", ingredients: "30g maíz para palomitas, 5ml AOVE, sal, 10g levadura nutricional" },
  { category: "snack_tarde", name: "Tartine de centeno con queso de cabra y pera", ingredients: "1 rebanada pan de centeno (30g), 40g queso de cabra fresco, 80g pera, 5ml miel, 10g nueces" },
  { category: "snack_tarde", name: "Bol de maíz asado con feta y hierbabuena", ingredients: "100g maíz cocido, 30g queso feta desmenuzado, hierbabuena fresca" },
  { category: "snack_tarde", name: "Smoothie de proteína, espinacas y jengibre", ingredients: "30g proteína de vainilla en polvo, 40g espinacas frescas, 3g jengibre fresco, 200ml leche vegetal, hielo" },
  { category: "snack_tarde", name: "Huevo cocido con salsa brava express", ingredients: "2 huevos duros (120g), 30g tomate frito, pimentón picante, ajo en polvo" },
  { category: "snack_tarde", name: "Dátiles rellenos de mantequilla de cacahuete", ingredients: "4 dátiles medjool (60g), 20g mantequilla de cacahuete 100%" },
  { category: "snack_tarde", name: "Bol de arroz de coliflor con atún y aguacate", ingredients: "200g coliflor rallada, 120g atún al natural escurrido, 80g aguacate, sal, 5ml AOVE" },
  { category: "snack_tarde", name: "Bol de skyr con fresas y semillas de hemp", ingredients: "200g skyr natural, 80g fresas, 15g semillas de hemp, stevia" },
  { category: "snack_tarde", name: "Tosta de centeno con aguacate y huevo duro", ingredients: "1 rebanada pan de centeno (30g), 80g aguacate, 1 huevos duros (60g), sal, pimentón" },
  { category: "snack_tarde", name: "Lata de mejillones con limón y pimienta", ingredients: "80g mejillones al natural, zumo de medio limón, pimienta negra" },
  { category: "snack_tarde", name: "Bol de requesón con membrillo y nueces", ingredients: "200g requesón, 30g membrillo (en pequeña cantidad), 15g nueces" },
  { category: "snack_tarde", name: "Rodajas de rábano con queso crema y cebollino", ingredients: "8 rábanos (80g), 60g queso crema light, cebollino fresco picado, sal" },
  { category: "snack_tarde", name: "Batido de proteína con leche de almendra y canela", ingredients: "30g proteína de vainilla en polvo, 250ml leche de almendra sin azúcar, canela, hielo" },
  { category: "snack_tarde", name: "Mini bol de garbanzos tostados y especiados", ingredients: "100g garbanzos cocidos tostados en air fryer, pimentón, comino, ajo en polvo, sal" },
  { category: "snack_tarde", name: "Rollito de jamón ibérico con higo fresco", ingredients: "50g jamón ibérico, 2 higos frescos (80g), pimienta negra" },
  { category: "snack_tarde", name: "Vasito de pudding de proteína y vainilla", ingredients: "30g proteína de vainilla en polvo, 200ml leche desnatada, 10g semillas de chía, stevia, extracto de vainilla" },
  { category: "snack_tarde", name: "Apio y zanahoria con salsa tzatziki", ingredients: "2 tallos apio (60g), 1 zanahoria (80g), 100g yogur griego + ½ pepino rallado + eneldo + ajo + sal de tzatziki" },
  { category: "snack_tarde", name: "Bol de yogur griego con piña y coco", ingredients: "200g yogur griego 0%, 80g piña en cubos, 10g coco rallado sin azúcar, stevia" },
  { category: "snack_tarde", name: "Mini wrap de centeno con queso feta y pepino", ingredients: "1 tortilla de centeno pequeña (30g), 50g queso feta desmenuzado, 80g pepino, eneldo, pimienta" },
  { category: "snack_tarde", name: "Vasito de compota de pera con canela sin azúcar", ingredients: "2 peras (300g) cocidas con canela y stevia, 1 scoop proteína vainilla (30g) mezclado al enfriar" },
  { category: "snack_tarde", name: "Tomate con anchoas y alcaparras", ingredients: "2 tomates medianos (240g), 6 anchoas en aceite (30g), 15g alcaparras, 5ml AOVE, orégano" },
  { category: "snack_tarde", name: "Bol de avena fría con proteína y arándanos", ingredients: "40g copos de avena remojados en 150ml leche, 30g proteína de vainilla en polvo, 80g arándanos" },
  { category: "snack_tarde", name: "Dados de pavo con pepinillo y mostaza", ingredients: "100g pavo en tacos, 30g pepinillos, 15g mostaza de Dijon, pimienta" },
  { category: "snack_tarde", name: "Cracker de centeno con queso de cabra y nueces", ingredients: "2 crackers de centeno (20g), 50g queso de cabra fresco, 10g nueces, 5ml miel" },
  { category: "snack_tarde", name: "Bol de maíz con guacamole y lima", ingredients: "100g maíz cocido, 1 aguacate (150g), zumo de media lima, sal, cilantro, ajo en polvo" },
  { category: "snack_tarde", name: "Batido de kéfir con mango y jengibre", ingredients: "200ml kéfir, 80g mango, 3g jengibre fresco, stevia, hielo" },
  { category: "snack_tarde", name: "Rollito de espinacas con hummus y zanahoria", ingredients: "1 tortilla integral (40g), 60g hummus, 40g espinacas baby, 60g zanahoria rallada" },
  { category: "snack_tarde", name: "Bol de cottage con pepino, tomate y orégano", ingredients: "200g queso cottage, 100g pepino, 1 tomate (100g), orégano, sal, 5ml AOVE" },
  { category: "snack_tarde", name: "Pera con queso manchego y nueces", ingredients: "1 pera (150g), 40g queso manchego en láminas, 10g nueces" },
  { category: "snack_tarde", name: "Tosta proteica con crema de cacahuete y plátano", ingredients: "1 rebanada pan proteico (30g), 15g crema de cacahuete 100%, 60g plátano, canela" },
  { category: "snack_tarde", name: "Vasito de gelatina de naranja con fruta", ingredients: "1 sobre gelatina sin azúcar naranja (10g), 80g naranja en gajos, 50g yogur griego encima" },
  { category: "snack_tarde", name: "Bol de kéfir con semillas de chía y kiwi", ingredients: "200ml kéfir, 10g semillas de chía, 1 kiwi (80g), stevia" },
  { category: "snack_tarde", name: "Chips de kale al horno con sal y levadura nutricional", ingredients: "80g kale fresco, 5ml AOVE, sal, 10g levadura nutricional, ajo en polvo" },
  { category: "snack_tarde", name: "Mini bol de arroz integral con atún y maíz", ingredients: "80g arroz integral cocido frío, 80g atún al natural, 30g maíz, sal, 5ml AOVE" },
  { category: "snack_tarde", name: "Smoothie de aguacate, espinacas y proteína", ingredients: "80g aguacate, 40g espinacas, 30g proteína de vainilla en polvo, 200ml leche vegetal, hielo" },
  { category: "snack_tarde", name: "Tortita de arroz con ricotta y melocotón", ingredients: "2 tortitas de arroz (20g), 60g ricotta, 1 melocotón (150g), canela, stevia" },
  { category: "snack_tarde", name: "Bol de edamame con salsa ponzu y sésamo", ingredients: "150g edamame cocido sin vaina, 15ml salsa ponzu, 5g sésamo tostado, cebolleta verde" },
  // ── CENA (60) ──
  { category: "cena", name: "Merluza al horno con verduras", ingredients: "250g lomo de merluza, 80g pimiento rojo, 70g cebolla, 100g calabacín, zumo de medio limón, perejil, pimentón dulce, sal, 10ml AOVE" },
  { category: "cena", name: "Revuelto de gambas con champiñones y ajo", ingredients: "150g gambas peladas, 150g champiñones laminados, 3 huevos enteros (180g), 3 dientes ajo, perejil fresco, sal, 10ml AOVE" },
  { category: "cena", name: "Ensalada de pollo, espinacas y huevo duro", ingredients: "180g pechuga de pollo asada, 80g espinacas baby, 2 huevos duros (120g), 80g aguacate, 100g tomates cherry, zumo de medio limón, sal, 10ml AOVE" },
  { category: "cena", name: "Contramuslos al air fryer con coles de Bruselas", ingredients: "2 contramuslos de pollo sin piel (~280g), 150g coles de Bruselas, ajo en polvo, pimentón ahumado, 15g mostaza dijon, sal, 10ml AOVE" },
  { category: "cena", name: "Tortilla española de claras con cebolla y pimiento", ingredients: "6 claras de huevo (210g), 2 huevos enteros (120g), 1 cebolla (100g), 80g pimiento rojo, 150g patata cocida, sal, 10ml AOVE" },
  { category: "cena", name: "Sopa de miso con tofu, wakame y edamame", ingredients: "15g pasta de miso blanco, 150g tofu firme, 500ml caldo de verduras, 5g alga wakame seca, 100g edamame cocido, cebolleta verde, 5g sésamo" },
  { category: "cena", name: "Lubina a la plancha con ensalada de tomate y albahaca", ingredients: "250g lubina en filetes, 2 tomates maduros (240g), albahaca fresca, 10ml AOVE, 10ml vinagre balsámico, sal" },
  { category: "cena", name: "Tortilla de claras rellena de atún y tomate", ingredients: "4 claras de huevo (140g), 1 huevos enteros (60g), 120g atún al natural escurrido, 1 tomate mediano (120g), orégano, sal" },
  { category: "cena", name: "Crema de calabaza con pollo desmigado", ingredients: "500g calabaza, 1 cebolla (100g), 300ml caldo de verduras, 3g cúrcuma, 5g jengibre fresco, 150g pechuga de pollo cocida desmigada, sal, 10ml AOVE" },
  { category: "cena", name: "Bacalao a la plancha con pisto", ingredients: "200g bacalao desalado, 100g calabacín, 80g pimiento rojo, 1 tomate (120g), 70g cebolla, sal, 10ml AOVE" },
  { category: "cena", name: "Ensalada de garbanzos con pepino y feta", ingredients: "150g garbanzos cocidos, 1 pepino (200g), 30g queso feta, eneldo fresco, zumo de medio limón, sal, 10ml AOVE" },
  { category: "cena", name: "Salmón al vapor con bok choy y jengibre", ingredients: "200g lomo de salmón, 200g bok choy, 10g jengibre fresco, 20ml salsa de soja reducida en sodio, 5g sésamo tostado" },
  { category: "cena", name: "Caldo de ternera con fideos konjac y verduras", ingredients: "400ml caldo de ternera casero, 150g fideos de konjac, 1 zanahoria (80g), 1 tallo apio, 60g puerro, 100g ternera cocida desmigada, sal" },
  { category: "cena", name: "Pechuga de pavo a la plancha con champiñones", ingredients: "200g pechuga de pavo, 200g champiñones, 2 dientes ajo, perejil fresco, 50ml vino blanco, sal, 10ml AOVE" },
  { category: "cena", name: "Ensalada de rúcula con salmón ahumado y aguacate", ingredients: "80g rúcula, 100g salmón ahumado, 80g aguacate, 15g alcaparras, zumo de medio limón, sal, 10ml AOVE" },
  { category: "cena", name: "Dorada al horno con cherry y tomillo", ingredients: "1 dorada entera limpia (~300g), 100g tomates cherry, tomillo fresco, zumo de medio limón, sal, 10ml AOVE" },
  { category: "cena", name: "Huevos al plato con tomate, pimiento y jamón", ingredients: "2 huevos enteros (120g), 150g tomate triturado, 70g pimiento verde, 30g jamón serrano, sal, 5ml AOVE" },
  { category: "cena", name: "Crema de lentejas rojas con comino y coco", ingredients: "200g lentejas rojas en crudo, 70g cebolla, 2 dientes ajo, 5g comino, 5g cúrcuma, 100ml leche de coco, 300ml caldo, sal, 5ml AOVE" },
  { category: "cena", name: "Sepia a la plancha con ajo, perejil y limón", ingredients: "250g sepia limpia, 3 dientes ajo, perejil fresco, zumo de medio limón, sal, 10ml AOVE" },
  { category: "cena", name: "Wrap de lechuga con pollo y guacamole", ingredients: "4 hojas grandes lechuga iceberg, 180g pechuga de pollo cocida, 1 aguacate (150g), 2 tomates (200g), 60g cebolla, cilantro fresco, zumo de medio limón, sal" },
  { category: "cena", name: "Gazpacho proteico con huevo duro y jamón", ingredients: "300ml gazpacho casero (tomate, pepino, pimiento, ajo, AOVE, vinagre), 2 huevos duros (120g), 30g jamón serrano en taquitos" },
  { category: "cena", name: "Pollo con salsa de yogur, limón y comino al horno", ingredients: "200g pollo (muslos o pechuga), 100g yogur griego, zumo de medio limón, 5g comino, 2 dientes ajo, sal, pimienta" },
  { category: "cena", name: "Ensalada de judías blancas con atún y cebolla roja", ingredients: "200g judías blancas cocidas, 120g atún al natural escurrido, 60g cebolla roja, perejil fresco, 10ml AOVE, 10ml vinagre, sal" },
  { category: "cena", name: "Rape a la plancha con salsa verde", ingredients: "250g rape en rodajas, perejil fresco, 2 dientes ajo, 150ml caldo de pescado, 5g harina de maíz, sal, 15ml AOVE" },
  { category: "cena", name: "Revuelto de espárragos con jamón ibérico", ingredients: "200g espárragos trigueros, 40g jamón ibérico en tiras, 3 huevos enteros (180g), 2 claras, sal, 10ml AOVE" },
  { category: "cena", name: "Brochetas de pollo y verduras al horno", ingredients: "180g pechuga de pollo en cubos, 80g pimiento rojo, 70g cebolla, 100g calabacín, pimentón ahumado, 2 dientes ajo, sal, 10ml AOVE" },
  { category: "cena", name: "Sopa de pollo casera con verduras y arroz", ingredients: "400ml caldo de pollo casero, 1 zanahoria (80g), 1 tallo apio, 60g puerro, 150g pechuga de pollo desmigada, 30g arroz en crudo, sal" },
  { category: "cena", name: "Ensalada de espinacas con fresas, feta y nueces", ingredients: "80g espinacas frescas, 100g fresas, 30g queso feta, 15g nueces, 10ml AOVE, 10ml vinagre balsámico" },
  { category: "cena", name: "Mejillones al vapor con vino blanco y limón", ingredients: "500g mejillones frescos con concha, 100ml vino blanco, 2 dientes ajo, zumo de medio limón, perejil fresco" },
  { category: "cena", name: "Pollo con curry verde y espinacas", ingredients: "200g pechuga de pollo en trozos, 150g espinacas frescas, 10g pasta de curry verde, 100ml leche de coco light, 150ml caldo de pollo, sal, 5ml AOVE" },
  { category: "cena", name: "Panga al horno con tomate, aceitunas y alcaparras", ingredients: "250g filetes de panga, 150g tomate triturado, 20g aceitunas negras, 15g alcaparras, orégano, sal, 10ml AOVE" },
  { category: "cena", name: "Revuelto de espinacas, queso feta y tomate cherry", ingredients: "4 claras de huevo (140g), 2 huevos enteros (120g), 80g espinacas, 30g queso feta, 80g tomates cherry, sal, 5ml AOVE" },
  { category: "cena", name: "Ensalada de pepino, tomate, cebolla roja y atún", ingredients: "1 pepino (200g), 2 tomates (240g), 60g cebolla roja, 120g atún al natural, perejil, 10ml AOVE, 10ml vinagre, sal" },
  { category: "cena", name: "Almejas al vapor con ajo y vino blanco", ingredients: "400g almejas limpias, 3 dientes ajo, 100ml vino blanco, perejil fresco, sal, 10ml AOVE" },
  { category: "cena", name: "Pechuga de pollo con salsa de mostaza y champiñones", ingredients: "200g pechuga de pollo, 150g champiñones, 15g mostaza dijon, 100ml caldo de pollo, sal, pimienta, 5ml AOVE" },
  { category: "cena", name: "Ensalada de wakame con tofu, sésamo y jengibre", ingredients: "30g alga wakame rehidratada, 150g tofu firme en cubos, 5g sésamo, 5g jengibre fresco, 20ml salsa de soja, 5ml vinagre de arroz" },
  { category: "cena", name: "Crema de puerros con vieiras a la plancha", ingredients: "2 puerros (200g), 300ml caldo de verduras, 2 vieiras (100g), sal, nuez moscada, 10ml AOVE" },
  { category: "cena", name: "Lomo de cerdo en salsa de naranja con judías verdes", ingredients: "200g lomo de cerdo, 1 naranja (zumo y ralladura), 150g judías verdes, 100ml caldo, sal, pimienta, 5ml AOVE" },
  { category: "cena", name: "Ensalada griega con pollo a la plancha", ingredients: "180g pechuga de pollo, 1 tomate (120g), 1 pepino (150g), 60g cebolla roja, 40g queso feta, 10g aceitunas kalamata, 10ml AOVE, orégano" },
  { category: "cena", name: "Sopa de tomate asado con albahaca y huevo", ingredients: "400g tomates asados triturados, 1 cebolla (100g), 2 dientes ajo, albahaca fresca, 200ml caldo, 2 huevos pochados (120g), sal, 10ml AOVE" },
  { category: "cena", name: "Caballa a la plancha con ensalada de remolacha y naranja", ingredients: "250g caballa limpia, 100g remolacha cocida, 1 naranja (80g), 30g rúcula, 10ml AOVE, sal, pimienta" },
  { category: "cena", name: "Rollitos de pechuga de pavo con espárragos y queso", ingredients: "200g pechuga de pavo en filetes finos, 6 espárragos verdes (60g), 40g queso mozzarella light, sal, pimienta, ajo en polvo" },
  { category: "cena", name: "Gazpacho de sandía con gambas y menta", ingredients: "300g sandía, 1 tomate (100g), 80g pepino, 100g gambas cocidas, menta fresca, zumo de medio limón, sal, 5ml AOVE" },
  { category: "cena", name: "Bacalao al pil-pil con pimientos del piquillo", ingredients: "200g bacalao desalado, 3 dientes ajo, 60g pimientos del piquillo, sal, 30ml AOVE (para el pil-pil)" },
  { category: "cena", name: "Ensalada de rúcula con pera, nueces y parmesano", ingredients: "80g rúcula, 1 pera (150g), 15g nueces, 20g parmesano en lascas, 10ml AOVE, 10ml vinagre balsámico, sal" },
  { category: "cena", name: "Pechuga de pollo al paprika con brócoli al vapor", ingredients: "200g pechuga de pollo, 10g pimentón de la Vera, 200g brócoli, 2 dientes ajo, zumo de medio limón, sal, 10ml AOVE" },
  { category: "cena", name: "Caldo depurativo de verduras con huevo pochado", ingredients: "500ml caldo de verduras casero (cebolla, zanahoria, apio, puerro), 2 huevos pochados (120g), sal, perejil" },
  { category: "cena", name: "Sepia con guisantes y cebolla", ingredients: "250g sepia limpia, 100g guisantes frescos o congelados, 1 cebolla (100g), 2 dientes ajo, 50ml vino blanco, sal, 10ml AOVE" },
  { category: "cena", name: "Ensalada de judías verdes con atún, huevo y patata", ingredients: "150g judías verdes cocidas, 120g atún al natural, 2 huevos duros (120g), 100g patata cocida, 10ml AOVE, 10ml vinagre, sal" },
  { category: "cena", name: "Muslos de pollo deshuesados con salsa de tomate casera", ingredients: "250g muslos de pollo deshuesados, 200g tomate triturado, 70g cebolla, 2 dientes ajo, orégano, sal, 10ml AOVE" },
  { category: "cena", name: "Crema de brócoli con queso cottage", ingredients: "400g brócoli, 1 cebolla (100g), 300ml caldo de verduras, 100g queso cottage, sal, pimienta, nuez moscada, 5ml AOVE" },
  { category: "cena", name: "Boquerones a la plancha con limón y ajo", ingredients: "250g boquerones limpios, 3 dientes ajo, zumo de medio limón, perejil, sal, 10ml AOVE" },
  { category: "cena", name: "Wrap de lechuga con atún, aguacate y maíz", ingredients: "4 hojas lechuga iceberg, 120g atún al natural, 80g aguacate, 40g maíz cocido, 10g mostaza, sal, limón" },
  { category: "cena", name: "Pollo al ajillo con champiñones", ingredients: "200g contramuslos de pollo sin piel, 6 dientes ajo, 150g champiñones, 100ml vino blanco, sal, pimienta, 15ml AOVE" },
  { category: "cena", name: "Ensalada templada de lentejas con huevo pochado y espinacas", ingredients: "150g lentejas cocidas, 2 huevos pochados (120g), 60g espinacas baby, 60g cebolla roja, 10ml AOVE, 10ml vinagre, sal" },
  { category: "cena", name: "Gambas al ajillo con ensalada verde", ingredients: "200g gambas peladas, 4 dientes ajo, guindilla (opcional), 80g lechuga, 1 tomate (100g), sal, 15ml AOVE" },
  { category: "cena", name: "Pechuga de pavo al horno con manzana y mostaza", ingredients: "200g pechuga de pavo, 1 manzana (150g) en gajos, 15g mostaza dijon, romero, sal, pimienta, 5ml AOVE" },
  { category: "cena", name: "Caldo de pescado con fideos konjac y almejas", ingredients: "400ml caldo de pescado casero, 150g fideos de konjac, 150g almejas limpias, perejil, 2 dientes ajo, sal, 5ml AOVE" },
  { category: "cena", name: "Ensalada de remolacha con queso de cabra y nueces", ingredients: "150g remolacha cocida, 40g queso de cabra fresco, 15g nueces, 30g rúcula, 10ml AOVE, 10ml vinagre balsámico, sal" },
  { category: "cena", name: "Tortilla de claras con espárragos y queso manchego", ingredients: "5 claras de huevo (175g), 1 huevos enteros (60g), 100g espárragos trigueros salteados, 25g queso manchego rallado, sal, pimienta, 5ml AOVE" },
];

// ═══════════════════════════════════════════════════════
// Main execution
// ═══════════════════════════════════════════════════════

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("❌ DATABASE_URL not set. Run this from the project directory.");
    process.exit(1);
  }

  console.log(`📦 Processing ${allRecipes.length} recipes...`);
  
  // Parse and calculate macros for all recipes
  const processedRecipes = [];
  
  for (const recipe of allRecipes) {
    const ingredientStrings = recipe.ingredients.split(",").map(s => s.trim());
    const parsedIngredients = [];
    let totalCal = 0, totalProt = 0, totalCarbs = 0, totalFats = 0;
    
    for (const ingStr of ingredientStrings) {
      const parsed = parseIngredientLine(ingStr);
      if (!parsed) continue;
      
      const macros = calculateIngredientMacros(parsed);
      if (!macros) continue;
      
      parsedIngredients.push(macros);
      totalCal += macros.calories;
      totalProt += macros.protein;
      totalCarbs += macros.carbs;
      totalFats += macros.fats;
    }
    
    processedRecipes.push({
      name: recipe.name,
      category: recipe.category,
      totalCalories: totalCal,
      totalProtein: totalProt,
      totalCarbs: totalCarbs,
      totalFats: totalFats,
      ingredients: parsedIngredients,
    });
  }
  
  console.log(`✅ Processed ${processedRecipes.length} recipes`);
  
  // Connect to database
  const connection = await createConnection(dbUrl);
  console.log("🔗 Connected to database");
  
  try {
    // Delete existing system recipes first
    await connection.execute("DELETE FROM recipe_ingredients WHERE recipeId IN (SELECT id FROM recipes WHERE isSystem = 1)");
    await connection.execute("DELETE FROM recipes WHERE isSystem = 1");
    console.log("🗑️  Cleared existing system recipes");
    
    let insertedCount = 0;
    
    for (const recipe of processedRecipes) {
      // Insert recipe
      const [result] = await connection.execute(
        "INSERT INTO recipes (userId, name, totalCalories, totalProtein, totalCarbs, totalFats, category, isSystem) VALUES (NULL, ?, ?, ?, ?, ?, ?, 1)",
        [recipe.name, recipe.totalCalories, recipe.totalProtein, recipe.totalCarbs, recipe.totalFats, recipe.category]
      );
      
      const recipeId = result.insertId;
      
      // Insert ingredients
      for (const ing of recipe.ingredients) {
        await connection.execute(
          "INSERT INTO recipe_ingredients (recipeId, name, quantity, calories, protein, carbs, fats) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [recipeId, ing.name, ing.quantity, ing.calories, ing.protein, ing.carbs, ing.fats]
        );
      }
      
      insertedCount++;
    }
    
    console.log(`\n🎉 Successfully inserted ${insertedCount} system recipes!`);
    
    // Verify counts per category
    const [counts] = await connection.execute(
      "SELECT category, COUNT(*) as count FROM recipes WHERE isSystem = 1 GROUP BY category ORDER BY category"
    );
    console.log("\n📊 Recipes per category:");
    for (const row of counts) {
      console.log(`   ${row.category}: ${row.count}`);
    }
    
    const [total] = await connection.execute("SELECT COUNT(*) as total FROM recipes WHERE isSystem = 1");
    console.log(`\n   TOTAL: ${total[0].total}`);
    
  } finally {
    await connection.end();
    console.log("\n🔌 Database connection closed");
  }
}

main().catch(err => {
  console.error("❌ Error:", err);
  process.exit(1);
});
