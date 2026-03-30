import {
  Document,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  Packer,
  ShadingType,
  VerticalAlign,
  TableLayoutType,
  PageOrientation,
} from "docx";

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
  mealNumber: number;
  description?: string;
  notes?: string;
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

// ── Colors ──
const GOLD_BG = "f5c518";
const GOLD_BORDER = "e0b800";
const DARK_TEXT = "1a1a1a";
const GRAY_TEXT = "555555";
const ALT_TEXT = "888888";
const CELL_BORDER = "e8e8e8";
const WHITE = "ffffff";
const ZEBRA_BG = "fafafa";
const FOOTER_TEXT = "cccccc";

const cellBorders = {
  top: { style: BorderStyle.SINGLE, size: 1, color: CELL_BORDER },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: CELL_BORDER },
  left: { style: BorderStyle.SINGLE, size: 1, color: CELL_BORDER },
  right: { style: BorderStyle.SINGLE, size: 1, color: CELL_BORDER },
};

const headerBorders = {
  top: { style: BorderStyle.SINGLE, size: 1, color: GOLD_BORDER },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: GOLD_BORDER },
  left: { style: BorderStyle.SINGLE, size: 1, color: GOLD_BORDER },
  right: { style: BorderStyle.SINGLE, size: 1, color: GOLD_BORDER },
};

export async function generateDietDOCX(diet: DietData): Promise<Buffer> {
  const sortedMenus = [...(diet.menus || [])].sort((a, b) => a.menuNumber - b.menuNumber);
  const numCols = sortedMenus.length;

  // Determine meal rows (max meals across all menus)
  const maxMeals = Math.max(...sortedMenus.map(m => (m.meals || []).length), 0);
  const mealRows: { mealNumber: number; mealName: string }[] = [];
  for (let i = 0; i < maxMeals; i++) {
    let name = `Comida ${i + 1}`;
    for (const menu of sortedMenus) {
      const sorted = [...(menu.meals || [])].sort((a, b) => a.mealNumber - b.mealNumber);
      if (sorted[i]) { name = sorted[i].mealName; break; }
    }
    mealRows.push({ mealNumber: i + 1, mealName: name });
  }

  const colWidthPct = Math.floor(100 / Math.max(numCols, 1));
  const children: (Paragraph | Table)[] = [];

  // ── Title ──
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: diet.name.toUpperCase(),
          bold: true,
          size: 44, // 22pt
          color: DARK_TEXT,
          font: "Calibri",
        }),
      ],
    })
  );

  // ── Grid table ──
  if (numCols > 0 && maxMeals > 0) {
    const tableRows: TableRow[] = [];

    // Header row: Menú 1, Menú 2, ...
    const headerCells: TableCell[] = sortedMenus.map(menu =>
      new TableCell({
        width: { size: colWidthPct, type: WidthType.PERCENTAGE },
        borders: headerBorders,
        shading: { type: ShadingType.SOLID, color: GOLD_BG, fill: GOLD_BG },
        verticalAlign: VerticalAlign.CENTER,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 60, after: 60 },
            children: [
              new TextRun({
                text: `Menú ${menu.menuNumber}`,
                bold: true,
                size: 22, // 11pt
                color: DARK_TEXT,
                font: "Calibri",
              }),
            ],
          }),
        ],
      })
    );
    tableRows.push(new TableRow({ children: headerCells }));

    // Data rows: one per meal slot
    for (let rowIdx = 0; rowIdx < maxMeals; rowIdx++) {
      const isEven = rowIdx % 2 === 0;
      const bgColor = isEven ? WHITE : ZEBRA_BG;

      const dataCells: TableCell[] = sortedMenus.map(menu => {
        const sorted = [...(menu.meals || [])].sort((a, b) => a.mealNumber - b.mealNumber);
        const meal = sorted[rowIdx];

        if (!meal) {
          return new TableCell({
            width: { size: colWidthPct, type: WidthType.PERCENTAGE },
            borders: cellBorders,
            shading: { type: ShadingType.SOLID, color: bgColor, fill: bgColor },
            verticalAlign: VerticalAlign.TOP,
            children: [new Paragraph({ children: [] })],
          });
        }

        const cellParagraphs: Paragraph[] = [];

        // Meal name (bold)
        cellParagraphs.push(
          new Paragraph({
            spacing: { before: 40, after: 20 },
            children: [
              new TextRun({
                text: meal.mealName,
                bold: true,
                size: 20, // 10pt
                color: DARK_TEXT,
                font: "Calibri",
              }),
            ],
          })
        );

        // Description (italic, gray)
        if (meal.description) {
          cellParagraphs.push(
            new Paragraph({
              spacing: { after: 30 },
              children: [
                new TextRun({
                  text: meal.description,
                  italics: true,
                  size: 17, // ~8.5pt
                  color: GRAY_TEXT,
                  font: "Calibri",
                }),
              ],
            })
          );
        }

        // Foods: "Pollo (150g), Arroz (80g), Brócoli (100g)."
        const foodLines = (meal.foods || [])
          .map(f => `${f.name} (${f.quantity}${f.unit && f.unit !== 'g' ? f.unit : ''})`)
          .join(", ");

        if (foodLines) {
          cellParagraphs.push(
            new Paragraph({
              spacing: { after: 20 },
              children: [
                new TextRun({
                  text: foodLines + ".",
                  size: 18, // 9pt
                  color: "333333",
                  font: "Calibri",
                }),
              ],
            })
          );
        }

        // Alternatives: "Alt: Pavo (150g), Quinoa (80g)."
        const altFoods = (meal.foods || [])
          .filter(f => f.alternativeName)
          .map(f => `${f.alternativeName} (${f.alternativeQuantity || f.quantity})`)
          .join(", ");

        if (altFoods) {
          cellParagraphs.push(
            new Paragraph({
              spacing: { before: 30, after: 20 },
              border: {
                top: { style: BorderStyle.DASHED, size: 1, color: "dddddd" },
                bottom: { style: BorderStyle.NONE, size: 0, color: WHITE },
                left: { style: BorderStyle.NONE, size: 0, color: WHITE },
                right: { style: BorderStyle.NONE, size: 0, color: WHITE },
              },
              children: [
                new TextRun({
                  text: "Alt: ",
                  italics: true,
                  size: 17,
                  color: ALT_TEXT,
                  font: "Calibri",
                }),
                new TextRun({
                  text: altFoods + ".",
                  italics: true,
                  size: 17,
                  color: ALT_TEXT,
                  font: "Calibri",
                }),
              ],
            })
          );
        }

        // Notes
        if (meal.notes) {
          cellParagraphs.push(
            new Paragraph({
              spacing: { before: 30, after: 20 },
              border: {
                top: { style: BorderStyle.SINGLE, size: 1, color: "eeeeee" },
                bottom: { style: BorderStyle.NONE, size: 0, color: WHITE },
                left: { style: BorderStyle.NONE, size: 0, color: WHITE },
                right: { style: BorderStyle.NONE, size: 0, color: WHITE },
              },
              children: [
                new TextRun({
                  text: `Nota: ${meal.notes}`,
                  italics: true,
                  size: 16,
                  color: "666666",
                  font: "Calibri",
                }),
              ],
            })
          );
        }

        return new TableCell({
          width: { size: colWidthPct, type: WidthType.PERCENTAGE },
          borders: cellBorders,
          shading: { type: ShadingType.SOLID, color: bgColor, fill: bgColor },
          verticalAlign: VerticalAlign.TOP,
          children: cellParagraphs,
        });
      });

      tableRows.push(new TableRow({ children: dataCells }));
    }

    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        layout: TableLayoutType.FIXED,
        rows: tableRows,
      })
    );
  }

  // ── Footer ──
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 300 },
      children: [
        new TextRun({
          text: "NoLimitPerformance #MetabolicHacking",
          size: 16, // 8pt
          color: FOOTER_TEXT,
          font: "Calibri",
        }),
      ],
    })
  );

  // ── Build document (landscape for grid layout) ──
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 500,
              bottom: 500,
              left: 500,
              right: 500,
            },
            size: {
              orientation: PageOrientation.LANDSCAPE,
            },
          },
        },
        children,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return Buffer.from(buffer);
}
