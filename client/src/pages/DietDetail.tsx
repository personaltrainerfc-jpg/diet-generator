import { trpc } from "@/lib/trpc";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ArrowLeft, Download, Flame, Beef, Wheat, Droplets,
  Loader2, ArrowLeftRight, UtensilsCrossed, Pencil, Check, X, Search, Replace
} from "lucide-react";
import { useState, useRef, useMemo, useCallback } from "react";
import type { FullMenu, FullMeal, FullFood } from "@shared/types";
import { toast } from "sonner";

// ── Editable Meal Name ──
function EditableMealName({ meal, onSave }: { meal: FullMeal; onSave: (name: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(meal.mealName);

  const handleSave = () => {
    const trimmed = value.trim();
    if (trimmed && trimmed !== meal.mealName) {
      onSave(trimmed);
    }
    setEditing(false);
  };

  const handleCancel = () => {
    setValue(meal.mealName);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1.5">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") handleCancel();
          }}
          className="h-7 text-sm font-semibold w-40"
          autoFocus
        />
        <button onClick={handleSave} className="h-6 w-6 rounded flex items-center justify-center text-green-600 hover:bg-green-50">
          <Check className="h-3.5 w-3.5" />
        </button>
        <button onClick={handleCancel} className="h-6 w-6 rounded flex items-center justify-center text-red-500 hover:bg-red-50">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 group/name">
      <UtensilsCrossed className="h-4 w-4 text-primary" />
      <span className="font-semibold text-base">{meal.mealName}</span>
      <button
        onClick={() => setEditing(true)}
        className="h-5 w-5 rounded flex items-center justify-center text-muted-foreground opacity-0 group-hover/name:opacity-100 hover:text-primary transition-all"
      >
        <Pencil className="h-3 w-3" />
      </button>
    </div>
  );
}

// ── Food Search Dialog ──
function FoodSearchDialog({
  open,
  onClose,
  onSelect,
  currentFoodName,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (food: { name: string; calories: number; protein: number; carbs: number; fats: number }) => void;
  currentFoodName: string;
}) {
  const [query, setQuery] = useState("");
  const { data: results, isLoading } = trpc.foodDb.search.useQuery(
    { query },
    { enabled: query.length >= 2 }
  );

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg">
            Sustituir: <span className="text-primary">{currentFoodName}</span>
          </DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar alimento..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
            autoFocus
          />
        </div>
        <div className="max-h-64 overflow-y-auto space-y-0.5">
          {isLoading && query.length >= 2 && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
          {results && results.length === 0 && query.length >= 2 && (
            <p className="text-sm text-muted-foreground text-center py-6">
              No se encontraron alimentos
            </p>
          )}
          {results?.map((food, i) => (
            <button
              key={`${food.name}-${i}`}
              onClick={() => {
                onSelect(food);
                onClose();
              }}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-muted/70 transition-colors text-left"
            >
              <span className="font-medium text-sm">{food.name}</span>
              <span className="text-xs text-muted-foreground shrink-0 ml-3">
                {food.calories} kcal · P{food.protein}g · C{food.carbs}g · G{food.fats}g
                <span className="text-[10px] ml-1 opacity-60">/100g</span>
              </span>
            </button>
          ))}
          {query.length < 2 && (
            <p className="text-xs text-muted-foreground text-center py-6">
              Escribe al menos 2 caracteres para buscar
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Editable Quantity ──
function EditableQuantity({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState(value);

  const handleSave = () => {
    const trimmed = inputVal.trim();
    if (trimmed && trimmed !== value) {
      onSave(trimmed);
    }
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") { setInputVal(value); setEditing(false); }
          }}
          onBlur={handleSave}
          className="h-5 text-xs w-20 px-1"
          autoFocus
        />
      </div>
    );
  }

  return (
    <button
      onClick={() => { setInputVal(value); setEditing(true); }}
      className="text-xs text-muted-foreground hover:text-primary hover:underline cursor-pointer transition-colors"
      title="Clic para editar cantidad"
    >
      {value}
    </button>
  );
}

// ── Food Row with edit capabilities ──
function FoodRow({ food, onUpdateFood }: {
  food: FullFood;
  onUpdateFood: (foodId: number, data: Record<string, unknown>) => void;
}) {
  const [showAlt, setShowAlt] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const current = showAlt
    ? {
        name: food.alternativeName || food.name,
        quantity: food.alternativeQuantity || food.quantity,
        calories: food.alternativeCalories ?? food.calories,
        protein: food.alternativeProtein ?? food.protein,
        carbs: food.alternativeCarbs ?? food.carbs,
        fats: food.alternativeFats ?? food.fats,
      }
    : {
        name: food.name,
        quantity: food.quantity,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fats: food.fats,
      };

  const hasAlternative = food.alternativeName && food.alternativeName.length > 0;

  const handleFoodReplace = (selected: { name: string; calories: number; protein: number; carbs: number; fats: number }) => {
    // Parse current quantity to get grams
    const qtyMatch = food.quantity.match(/(\d+)/);
    const grams = qtyMatch ? parseInt(qtyMatch[1]) : 100;
    const factor = grams / 100;

    const updateData: Record<string, unknown> = {
      foodId: food.id,
      name: selected.name,
      calories: Math.round(selected.calories * factor),
      protein: Math.round(selected.protein * factor),
      carbs: Math.round(selected.carbs * factor),
      fats: Math.round(selected.fats * factor),
    };
    onUpdateFood(food.id, updateData);
  };

  const handleQuantityChange = (newQuantity: string) => {
    onUpdateFood(food.id, { foodId: food.id, quantity: newQuantity });
  };

  return (
    <>
      <div className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-muted/50 transition-colors group">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-foreground truncate">
              {current.name}
            </span>
            {showAlt && (
              <Badge variant="outline" className="text-[10px] py-0 px-1.5 text-primary border-primary/30">
                ALT
              </Badge>
            )}
          </div>
          <EditableQuantity
            value={current.quantity}
            onSave={handleQuantityChange}
          />
        </div>

        <div className="flex items-center gap-3 shrink-0 text-xs">
          <span className="text-muted-foreground w-14 text-right">{current.calories} kcal</span>
          <span className="text-red-500 w-8 text-right">{current.protein}g</span>
          <span className="text-amber-500 w-8 text-right">{current.carbs}g</span>
          <span className="text-blue-500 w-8 text-right">{current.fats}g</span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* Replace food button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setSearchOpen(true)}
                className="h-7 w-7 rounded-md flex items-center justify-center bg-muted hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
              >
                <Replace className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Sustituir alimento</TooltipContent>
          </Tooltip>

          {/* Toggle alternative */}
          {hasAlternative && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setShowAlt(!showAlt)}
                  className={`h-7 w-7 rounded-md flex items-center justify-center transition-colors shrink-0 ${
                    showAlt
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-primary/10 text-muted-foreground hover:text-primary"
                  }`}
                >
                  <ArrowLeftRight className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                {showAlt ? "Ver alimento original" : "Ver alternativa"}
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>

      <FoodSearchDialog
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelect={handleFoodReplace}
        currentFoodName={food.name}
      />
    </>
  );
}

function MealCard({ meal, onMealNameChange, onUpdateFood }: {
  meal: FullMeal;
  onMealNameChange: (mealId: number, name: string) => void;
  onUpdateFood: (foodId: number, data: Record<string, unknown>) => void;
}) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            <EditableMealName
              meal={meal}
              onSave={(name) => onMealNameChange(meal.id, name)}
            />
          </CardTitle>
          <div className="flex items-center gap-2 text-xs">
            <Badge variant="secondary" className="gap-1 font-normal">
              <Flame className="h-3 w-3 text-orange-500" />
              {meal.calories} kcal
            </Badge>
          </div>
        </div>
        <div className="flex gap-4 text-xs text-muted-foreground mt-1">
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
            P: {meal.protein}g
          </span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            C: {meal.carbs}g
          </span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
            G: {meal.fats}g
          </span>
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="pt-2 pb-3">
        <div className="flex items-center gap-3 py-1.5 px-3 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
          <div className="flex-1">Alimento</div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="w-14 text-right">Kcal</span>
            <span className="w-8 text-right text-red-400">Prot</span>
            <span className="w-8 text-right text-amber-400">Carb</span>
            <span className="w-8 text-right text-blue-400">Gras</span>
          </div>
          <div className="w-16 shrink-0" />
        </div>
        <div className="divide-y divide-border/50">
          {meal.foods.map(food => (
            <FoodRow key={food.id} food={food} onUpdateFood={onUpdateFood} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function MenuView({ menu, onMealNameChange, onUpdateFood }: {
  menu: FullMenu;
  onMealNameChange: (mealId: number, name: string) => void;
  onUpdateFood: (foodId: number, data: Record<string, unknown>) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-orange-50 border border-orange-100">
          <Flame className="h-5 w-5 text-orange-500" />
          <div>
            <p className="text-xs text-muted-foreground">Calorías</p>
            <p className="font-bold text-foreground">{menu.totalCalories}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-100">
          <Beef className="h-5 w-5 text-red-500" />
          <div>
            <p className="text-xs text-muted-foreground">Proteínas</p>
            <p className="font-bold text-foreground">{menu.totalProtein}g</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-50 border border-amber-100">
          <Wheat className="h-5 w-5 text-amber-500" />
          <div>
            <p className="text-xs text-muted-foreground">Carbohidratos</p>
            <p className="font-bold text-foreground">{menu.totalCarbs}g</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-blue-50 border border-blue-100">
          <Droplets className="h-5 w-5 text-blue-500" />
          <div>
            <p className="text-xs text-muted-foreground">Grasas</p>
            <p className="font-bold text-foreground">{menu.totalFats}g</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {menu.meals
          .sort((a, b) => a.mealNumber - b.mealNumber)
          .map(meal => (
            <MealCard
              key={meal.id}
              meal={meal}
              onMealNameChange={onMealNameChange}
              onUpdateFood={onUpdateFood}
            />
          ))}
      </div>
    </div>
  );
}

export default function DietDetail() {
  const [, params] = useRoute("/diet/:id");
  const [, setLocation] = useLocation();
  const dietId = Number(params?.id);
  const [downloading, setDownloading] = useState(false);

  const utils = trpc.useUtils();

  const { data: diet, isLoading, error } = trpc.diet.getById.useQuery(
    { id: dietId },
    { enabled: !isNaN(dietId) }
  );

  const updateMealNameMut = trpc.diet.updateMealName.useMutation({
    onSuccess: () => {
      utils.diet.getById.invalidate({ id: dietId });
      toast.success("Nombre de comida actualizado");
    },
    onError: (err) => toast.error(err.message),
  });

  const updateFoodMut = trpc.diet.updateFood.useMutation({
    onSuccess: () => {
      utils.diet.getById.invalidate({ id: dietId });
      toast.success("Alimento actualizado");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleMealNameChange = useCallback((mealId: number, name: string) => {
    updateMealNameMut.mutate({ mealId, mealName: name });
  }, [updateMealNameMut]);

  const handleUpdateFood = useCallback((foodId: number, data: Record<string, unknown>) => {
    updateFoodMut.mutate(data as any);
  }, [updateFoodMut]);

  const handleDownloadPdf = async () => {
    if (!diet) return;
    setDownloading(true);
    try {
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        throw new Error("No se pudo abrir la ventana de impresión");
      }
      const html = generatePrintHtml(diet);
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
    } catch (e) {
      console.error(e);
    } finally {
      setDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !diet) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <p className="text-muted-foreground">Dieta no encontrada.</p>
        <Button variant="outline" className="mt-4" onClick={() => setLocation("/history")}>
          Volver al historial
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <button
            onClick={() => setLocation("/history")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al historial
          </button>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            {diet.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            {new Date(diet.createdAt).toLocaleDateString("es-ES", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
            {" · "}
            {diet.totalCalories} kcal · {diet.mealsPerDay} comidas/día
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleDownloadPdf}
          disabled={downloading}
          className="shrink-0"
        >
          {downloading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          PDF
        </Button>
      </div>

      {/* Config summary */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary" className="gap-1.5 py-1">
          <Flame className="h-3.5 w-3.5 text-orange-500" />
          {diet.totalCalories} kcal
        </Badge>
        <Badge variant="outline" className="gap-1 py-1 text-red-600 border-red-200">
          Proteínas: {diet.proteinPercent}%
        </Badge>
        <Badge variant="outline" className="gap-1 py-1 text-amber-600 border-amber-200">
          Carbos: {diet.carbsPercent}%
        </Badge>
        <Badge variant="outline" className="gap-1 py-1 text-blue-600 border-blue-200">
          Grasas: {diet.fatsPercent}%
        </Badge>
        {diet.avoidFoods && (diet.avoidFoods as string[]).length > 0 && (
          <Badge variant="destructive" className="gap-1 py-1">
            Evitar: {(diet.avoidFoods as string[]).join(", ")}
          </Badge>
        )}
      </div>

      {/* Menus */}
      {diet.menus.length === 1 ? (
        <MenuView
          menu={diet.menus[0]}
          onMealNameChange={handleMealNameChange}
          onUpdateFood={handleUpdateFood}
        />
      ) : (
        <Tabs defaultValue="1" className="w-full">
          <TabsList className="w-full justify-start flex-wrap h-auto gap-1 p-1">
            {diet.menus
              .sort((a, b) => a.menuNumber - b.menuNumber)
              .map(menu => (
                <TabsTrigger
                  key={menu.id}
                  value={String(menu.menuNumber)}
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Menú {menu.menuNumber}
                </TabsTrigger>
              ))}
          </TabsList>
          {diet.menus
            .sort((a, b) => a.menuNumber - b.menuNumber)
            .map(menu => (
              <TabsContent key={menu.id} value={String(menu.menuNumber)} className="mt-4">
                <MenuView
                  menu={menu}
                  onMealNameChange={handleMealNameChange}
                  onUpdateFood={handleUpdateFood}
                />
              </TabsContent>
            ))}
        </Tabs>
      )}
    </div>
  );
}

/**
 * PDF generation: Only shows meal name, food names, quantities and alternatives.
 * NO calories or macros shown to the end user.
 */
function generatePrintHtml(diet: any): string {
  let menusHtml = "";

  for (const menu of diet.menus.sort((a: any, b: any) => a.menuNumber - b.menuNumber)) {
    let mealsHtml = "";
    for (const meal of menu.meals.sort((a: any, b: any) => a.mealNumber - b.mealNumber)) {
      let foodsHtml = "";
      for (const food of meal.foods) {
        const altText = food.alternativeName
          ? `${food.alternativeName}${food.alternativeQuantity ? ` (${food.alternativeQuantity})` : ""}`
          : "-";
        foodsHtml += `
          <tr>
            <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:14px;font-weight:500;">${food.name}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:14px;text-align:center;color:#555;">${food.quantity}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:13px;color:#777;font-style:italic;">${altText}</td>
          </tr>`;
      }

      mealsHtml += `
        <div style="margin-bottom:24px;">
          <h3 style="font-size:16px;font-weight:700;margin:0 0 10px;color:#222;border-left:3px solid #16a34a;padding-left:10px;">${meal.mealName}</h3>
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr style="background:#f5f5f5;">
                <th style="padding:8px 12px;text-align:left;font-size:11px;text-transform:uppercase;color:#999;font-weight:600;letter-spacing:0.5px;">Alimento</th>
                <th style="padding:8px 12px;text-align:center;font-size:11px;text-transform:uppercase;color:#999;font-weight:600;letter-spacing:0.5px;">Cantidad</th>
                <th style="padding:8px 12px;text-align:left;font-size:11px;text-transform:uppercase;color:#999;font-weight:600;letter-spacing:0.5px;">Alternativa</th>
              </tr>
            </thead>
            <tbody>
              ${foodsHtml}
            </tbody>
          </table>
        </div>`;
    }

    menusHtml += `
      <div style="margin-bottom:36px;page-break-inside:avoid;">
        <h2 style="font-size:20px;font-weight:800;margin:0 0 16px;color:#111;padding-bottom:8px;border-bottom:2px solid #16a34a;">
          Menú ${menu.menuNumber}
        </h2>
        ${mealsHtml}
      </div>`;
  }

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${diet.name}</title>
  <style>
    @media print {
      body { margin: 0; padding: 20px; }
      @page { margin: 1.5cm; }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #1a1a1a;
      max-width: 800px;
      margin: 0 auto;
      padding: 30px 20px;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div style="border-bottom:3px solid #16a34a;padding-bottom:16px;margin-bottom:28px;">
    <h1 style="font-size:26px;font-weight:900;margin:0 0 6px;color:#111;">${diet.name}</h1>
    <p style="font-size:14px;color:#666;margin:0;">
      ${diet.mealsPerDay} comidas al día · ${diet.menus.length} menú(s)
    </p>
  </div>
  ${menusHtml}
  <div style="border-top:1px solid #eee;padding-top:12px;margin-top:24px;">
    <p style="font-size:11px;color:#bbb;text-align:center;">
      Generado con Diet Generator · ${new Date(diet.createdAt).toLocaleDateString("es-ES")}
    </p>
  </div>
</body>
</html>`;
}
