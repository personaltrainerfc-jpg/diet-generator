import PDFDocument from "pdfkit";

interface DietFood {
  name: string;
  quantity: string;
  unit?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fats?: number;
  alternativeName?: string | null;
  alternativeQuantity?: string | null;
}

interface DietMeal {
  mealName: string;
  description?: string;
  foods: DietFood[];
}

interface DietMenu {
  menuNumber: number;
  meals: DietMeal[];
}

interface DietData {
  name: string;
  totalCalories: number;
  mealsPerDay: number;
  proteinPercent: number;
  carbsPercent: number;
  fatsPercent: number;
  macros?: { protein: number; carbs: number; fat: number };
  menus: DietMenu[];
}

export function generateDietPDF(diet: DietData, showMacros: boolean): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 40, bottom: 40, left: 40, right: 40 },
      bufferPages: true,
    });

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = doc.page.width - 80; // 40 margin each side
    const green = "#16a34a";
    const darkText = "#1a1a2e";
    const grayText = "#6b7280";
    const lightBg = "#f0fdf4";

    // ── Header ──
    doc.fontSize(22).fillColor(green).font("Helvetica-Bold").text(diet.name, { align: "center" });
    doc.moveDown(0.3);
    doc.fontSize(11).fillColor(grayText).font("Helvetica").text(
      `Plan nutricional generado con NutriFlow · ${new Date().toLocaleDateString("es-ES")}`,
      { align: "center" }
    );

    if (showMacros) {
      doc.moveDown(0.3);
      doc.fontSize(12).fillColor(darkText).font("Helvetica-Bold").text(
        `${diet.totalCalories} kcal/día · ${diet.mealsPerDay} comidas/día · P:${diet.proteinPercent}% C:${diet.carbsPercent}% G:${diet.fatsPercent}%`,
        { align: "center" }
      );
      if (diet.macros) {
        doc.moveDown(0.2);
        doc.fontSize(10).fillColor(grayText).font("Helvetica").text(
          `Proteína: ${diet.macros.protein}g · Carbohidratos: ${diet.macros.carbs}g · Grasas: ${diet.macros.fat}g`,
          { align: "center" }
        );
      }
    } else {
      doc.moveDown(0.3);
      doc.fontSize(12).fillColor(darkText).font("Helvetica-Bold").text(
        `${diet.mealsPerDay} comidas/día · ${diet.menus?.length || 0} días`,
        { align: "center" }
      );
    }

    // Separator line
    doc.moveDown(0.5);
    const lineY = doc.y;
    doc.moveTo(40, lineY).lineTo(doc.page.width - 40, lineY).strokeColor(green).lineWidth(2).stroke();
    doc.moveDown(0.8);

    // ── Menus / Days ──
    for (const menu of diet.menus || []) {
      // Check if we need a new page (if less than 120pt left)
      if (doc.y > doc.page.height - 120) {
        doc.addPage();
      }

      // Day header
      const dayY = doc.y;
      doc.save();
      doc.roundedRect(40, dayY, pageWidth, 28, 4).fillColor(lightBg).fill();
      doc.restore();
      doc.rect(40, dayY, 4, 28).fillColor(green).fill();
      doc.fontSize(13).fillColor(darkText).font("Helvetica-Bold")
        .text(`Día ${menu.menuNumber}`, 52, dayY + 7);
      doc.y = dayY + 36;

      // Meals
      for (const meal of menu.meals || []) {
        // Check page break
        if (doc.y > doc.page.height - 100) {
          doc.addPage();
        }

        const mealTotals = (meal.foods || []).reduce(
          (acc, f) => ({
            cal: acc.cal + (f.calories || 0),
            p: acc.p + (f.protein || 0),
            c: acc.c + (f.carbs || 0),
            g: acc.g + (f.fats || 0),
          }),
          { cal: 0, p: 0, c: 0, g: 0 }
        );

        // Meal name
        doc.fontSize(12).fillColor(green).font("Helvetica-Bold")
          .text(meal.mealName, 48, doc.y, { continued: showMacros });
        if (showMacros) {
          doc.fontSize(10).fillColor(grayText).font("Helvetica")
            .text(`  (${mealTotals.cal} kcal)`);
        }

        if (meal.description) {
          doc.fontSize(9).fillColor(grayText).font("Helvetica-Oblique")
            .text(meal.description, 48);
        }

        doc.moveDown(0.2);

        // Foods
        for (const food of meal.foods || []) {
          if (doc.y > doc.page.height - 60) {
            doc.addPage();
          }

          const foodLine = food.name;
          const qtyLine = showMacros
            ? `${food.quantity}${food.unit || ""} · ${food.calories || 0} kcal`
            : `${food.quantity}${food.unit || ""}`;

          doc.fontSize(10).fillColor(darkText).font("Helvetica")
            .text(foodLine, 56, doc.y, { width: pageWidth - 150, continued: false });

          // Right-aligned quantity on same line
          const savedY = doc.y - 12;
          doc.fontSize(10).fillColor(grayText).font("Helvetica")
            .text(qtyLine, 56, savedY, { width: pageWidth - 16, align: "right" });

          // Alternative
          if (food.alternativeName) {
            doc.fontSize(8.5).fillColor("#9ca3af").font("Helvetica-Oblique")
              .text(`Alt: ${food.alternativeName}${food.alternativeQuantity ? ` (${food.alternativeQuantity})` : ""}`, 64);
          }
        }

        // Meal macros
        if (showMacros) {
          doc.moveDown(0.2);
          const macroLineY = doc.y;
          doc.moveTo(48, macroLineY).lineTo(pageWidth + 20, macroLineY).strokeColor("#e5e7eb").lineWidth(0.5).stroke();
          doc.moveDown(0.2);
          doc.fontSize(9).fillColor(grayText).font("Helvetica")
            .text(`P: ${mealTotals.p}g · C: ${mealTotals.c}g · G: ${mealTotals.g}g`, 48);
        }

        doc.moveDown(0.5);
      }

      doc.moveDown(0.3);
    }

    // ── Footer ──
    doc.moveDown(1);
    const footerY = doc.y;
    doc.moveTo(40, footerY).lineTo(doc.page.width - 40, footerY).strokeColor("#e5e7eb").lineWidth(0.5).stroke();
    doc.moveDown(0.4);
    doc.fontSize(8).fillColor("#9ca3af").font("Helvetica")
      .text(`Generado con NutriFlow · ${new Date().toLocaleDateString("es-ES")}`, { align: "center" });

    doc.end();
  });
}
