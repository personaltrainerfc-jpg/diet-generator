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
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft, Download, Flame, Beef, Wheat, Droplets,
  Loader2, ArrowLeftRight, UtensilsCrossed, Pencil, Check, X,
  Search, Plus, Trash2, Copy, ShoppingCart
} from "lucide-react";
import { useState, useCallback } from "react";
import type { FullMenu, FullMeal, FullFood } from "@shared/types";
import { toast } from "sonner";
import { LOGO_URL } from "@shared/constants";

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

// ── Food Search Dialog (for replacing food) ──
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
    <Dialog open={open} onOpenChange={(v) => { if (!v) { setQuery(""); onClose(); } }}>
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
                setQuery("");
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

// ── Add Food Dialog (manual from DB) ──
function AddFoodDialog({
  open,
  onClose,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (food: { name: string; quantity: string; calories: number; protein: number; carbs: number; fats: number }) => void;
}) {
  const [query, setQuery] = useState("");
  const [selectedFood, setSelectedFood] = useState<{ name: string; calories: number; protein: number; carbs: number; fats: number } | null>(null);
  const [grams, setGrams] = useState(100);

  const { data: results, isLoading } = trpc.foodDb.search.useQuery(
    { query },
    { enabled: query.length >= 2 }
  );

  const handleAdd = () => {
    if (!selectedFood) return;
    const factor = grams / 100;
    onAdd({
      name: selectedFood.name,
      quantity: `${grams}g`,
      calories: Math.round(selectedFood.calories * factor),
      protein: Math.round(selectedFood.protein * factor),
      carbs: Math.round(selectedFood.carbs * factor),
      fats: Math.round(selectedFood.fats * factor),
    });
    setQuery("");
    setSelectedFood(null);
    setGrams(100);
    onClose();
  };

  const handleClose = () => {
    setQuery("");
    setSelectedFood(null);
    setGrams(100);
    onClose();
  };

  const previewFactor = grams / 100;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg">Añadir alimento</DialogTitle>
        </DialogHeader>

        {!selectedFood ? (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar alimento en la base de datos..."
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
                <p className="text-sm text-muted-foreground text-center py-6">No se encontraron alimentos</p>
              )}
              {results?.map((food, i) => (
                <button
                  key={`${food.name}-${i}`}
                  onClick={() => setSelectedFood(food)}
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
                <p className="text-xs text-muted-foreground text-center py-6">Escribe al menos 2 caracteres para buscar</p>
              )}
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-muted/50 border">
              <p className="font-semibold text-sm">{selectedFood.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Por 100g: {selectedFood.calories} kcal · P{selectedFood.protein}g · C{selectedFood.carbs}g · G{selectedFood.fats}g
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Cantidad (gramos)</label>
              <Input
                type="number"
                value={grams}
                onChange={(e) => setGrams(Math.max(1, Number(e.target.value)))}
                min={1}
                max={2000}
                className="w-32"
                autoFocus
              />
            </div>

            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-xs font-medium text-muted-foreground mb-1">Macros para {grams}g:</p>
              <div className="flex gap-4 text-sm">
                <span className="text-orange-600 font-semibold">{Math.round(selectedFood.calories * previewFactor)} kcal</span>
                <span className="text-red-500">P: {Math.round(selectedFood.protein * previewFactor)}g</span>
                <span className="text-amber-500">C: {Math.round(selectedFood.carbs * previewFactor)}g</span>
                <span className="text-blue-500">G: {Math.round(selectedFood.fats * previewFactor)}g</span>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSelectedFood(null)}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Volver
              </Button>
              <Button onClick={handleAdd}>
                <Plus className="h-4 w-4 mr-1" /> Añadir
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Editable Quantity (gramos) with auto-recalc ──
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
      <div className="inline-flex items-center gap-1">
        <Input
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") { setInputVal(value); setEditing(false); }
          }}
          onBlur={handleSave}
          className="h-5 text-xs w-24 px-1.5"
          autoFocus
        />
      </div>
    );
  }

  return (
    <button
      onClick={() => { setInputVal(value); setEditing(true); }}
      className="text-xs text-muted-foreground hover:text-primary hover:underline cursor-pointer transition-colors inline-flex items-center gap-1"
      title="Clic para editar cantidad (los macros se recalcularán automáticamente)"
    >
      {value}
      <Pencil className="h-2.5 w-2.5 opacity-0 group-hover/food:opacity-60" />
    </button>
  );
}

// ── Food Row ──
function FoodRow({ food, mealName, onUpdateFood, onDeleteFood }: {
  food: FullFood;
  mealName: string;
  onUpdateFood: (foodId: number, data: Record<string, unknown>) => void;
  onDeleteFood: (foodId: number) => void;
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
      generateAlternative: true,
      mealName: mealName,
    };
    onUpdateFood(food.id, updateData);
  };

  const handleQuantityChange = (newQuantity: string) => {
    // Send with recalcFromDb flag so backend recalculates macros proportionally
    onUpdateFood(food.id, { foodId: food.id, quantity: newQuantity, recalcFromDb: true });
  };

  return (
    <>
      <div className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-muted/50 transition-colors group/food">
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
          {/* Replace food */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setSearchOpen(true)}
                className="h-7 w-7 rounded-md flex items-center justify-center bg-muted hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover/food:opacity-100"
              >
                <Search className="h-3.5 w-3.5" />
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

          {/* Delete food */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onDeleteFood(food.id)}
                className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover/food:opacity-100"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Eliminar alimento</TooltipContent>
          </Tooltip>
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

// ── Meal Card ──
function MealCard({ meal, onMealNameChange, onUpdateFood, onDeleteFood, onDeleteMeal, onAddFood, isDeletable }: {
  meal: FullMeal;
  onMealNameChange: (mealId: number, name: string) => void;
  onUpdateFood: (foodId: number, data: Record<string, unknown>) => void;
  onDeleteFood: (foodId: number) => void;
  onDeleteMeal: (mealId: number) => void;
  onAddFood: (mealId: number, food: { name: string; quantity: string; calories: number; protein: number; carbs: number; fats: number }) => void;
  isDeletable: boolean;
}) {
  const [addFoodOpen, setAddFoodOpen] = useState(false);

  return (
    <Card className="shadow-sm group/meal">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            <EditableMealName
              meal={meal}
              onSave={(name) => onMealNameChange(meal.id, name)}
            />
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1 font-normal text-xs">
              <Flame className="h-3 w-3 text-orange-500" />
              {meal.calories} kcal
            </Badge>
            {isDeletable && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover/meal:opacity-100">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Eliminar comida</AlertDialogTitle>
                    <AlertDialogDescription>
                      ¿Estás seguro de que quieres eliminar "{meal.mealName}" y todos sus alimentos? Esta acción no se puede deshacer.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onDeleteMeal(meal.id)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Eliminar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
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
          <div className="w-[5.5rem] shrink-0" />
        </div>
        <div className="divide-y divide-border/50">
          {meal.foods.map(food => (
            <FoodRow
              key={food.id}
              food={food}
              mealName={meal.mealName}
              onUpdateFood={onUpdateFood}
              onDeleteFood={onDeleteFood}
            />
          ))}
        </div>
        {/* Add food button */}
        <button
          onClick={() => setAddFoodOpen(true)}
          className="w-full mt-2 py-2 rounded-lg border border-dashed border-muted-foreground/30 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" />
          Añadir alimento
        </button>
      </CardContent>

      <AddFoodDialog
        open={addFoodOpen}
        onClose={() => setAddFoodOpen(false)}
        onAdd={(food) => onAddFood(meal.id, food)}
      />
    </Card>
  );
}

// ── Add Meal Dialog ──
function AddMealDialog({ open, onClose, onAdd, isLoading }: {
  open: boolean;
  onClose: () => void;
  onAdd: (name: string) => void;
  isLoading: boolean;
}) {
  const [name, setName] = useState("");

  const handleSubmit = () => {
    const trimmed = name.trim() || "Nueva comida";
    onAdd(trimmed);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v && !isLoading) { setName(""); onClose(); } }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Añadir nueva comida</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">
              Nombre de la comida
            </label>
            <Input
              placeholder="Ej: Merienda, Pre-entreno, Snack..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isLoading) handleSubmit();
              }}
              disabled={isLoading}
              autoFocus
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Se generará automáticamente con alimentos y macros proporcionales al resto del menú.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Añadir comida
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Menu View ──
function MenuView({ menu, onMealNameChange, onUpdateFood, onDeleteFood, onDeleteMeal, onAddMeal, onAddFood, addingMeal }: {
  menu: FullMenu;
  onMealNameChange: (mealId: number, name: string) => void;
  onUpdateFood: (foodId: number, data: Record<string, unknown>) => void;
  onDeleteFood: (foodId: number) => void;
  onDeleteMeal: (mealId: number) => void;
  onAddMeal: (menuId: number, mealName: string) => void;
  onAddFood: (mealId: number, food: { name: string; quantity: string; calories: number; protein: number; carbs: number; fats: number }) => void;
  addingMeal: boolean;
}) {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const sortedMeals = [...menu.meals].sort((a, b) => a.mealNumber - b.mealNumber);
  const canDeleteMeal = sortedMeals.length > 1;

  return (
    <div className="space-y-4">
      {/* Macro summary */}
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

      {/* Meals */}
      <div className="space-y-4">
        {sortedMeals.map(meal => (
          <MealCard
            key={meal.id}
            meal={meal}
            onMealNameChange={onMealNameChange}
            onUpdateFood={onUpdateFood}
            onDeleteFood={onDeleteFood}
            onDeleteMeal={onDeleteMeal}
            onAddFood={onAddFood}
            isDeletable={canDeleteMeal}
          />
        ))}
      </div>

      {/* Add meal button */}
      <Button
        variant="outline"
        className="w-full border-dashed border-2 hover:border-primary hover:text-primary"
        onClick={() => setAddDialogOpen(true)}
        disabled={addingMeal}
      >
        {addingMeal ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Generando comida...
          </>
        ) : (
          <>
            <Plus className="h-4 w-4 mr-2" />
            Añadir comida
          </>
        )}
      </Button>

      <AddMealDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onAdd={(name) => {
          setAddDialogOpen(false);
          onAddMeal(menu.id, name);
        }}
        isLoading={addingMeal}
      />
    </div>
  );
}

// ── Main Page ──
export default function DietDetail() {
  const [, params] = useRoute("/diet/:id");
  const [, setLocation] = useLocation();
  const dietId = Number(params?.id);
  const [downloading, setDownloading] = useState(false);
  const [showShoppingList, setShowShoppingList] = useState(false);

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

  const addFoodMut = trpc.diet.addFood.useMutation({
    onMutate: () => {
      toast.info("Añadiendo alimento y generando alternativa...");
    },
    onSuccess: () => {
      utils.diet.getById.invalidate({ id: dietId });
      toast.success("Alimento añadido con alternativa");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteFoodMut = trpc.diet.deleteFood.useMutation({
    onSuccess: () => {
      utils.diet.getById.invalidate({ id: dietId });
      toast.success("Alimento eliminado");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMealMut = trpc.diet.deleteMeal.useMutation({
    onSuccess: () => {
      utils.diet.getById.invalidate({ id: dietId });
      toast.success("Comida eliminada");
    },
    onError: (err) => toast.error(err.message),
  });

  const addMealMut = trpc.diet.addMeal.useMutation({
    onSuccess: () => {
      utils.diet.getById.invalidate({ id: dietId });
      toast.success("Comida añadida correctamente");
    },
    onError: (err) => toast.error(err.message),
  });

  const duplicateMut = trpc.diet.duplicate.useMutation({
    onSuccess: (data) => {
      toast.success("Dieta duplicada correctamente");
      setLocation(`/diet/${data.dietId}`);
    },
    onError: (err) => toast.error(err.message),
  });

  const handleMealNameChange = useCallback((mealId: number, name: string) => {
    updateMealNameMut.mutate({ mealId, mealName: name });
  }, [updateMealNameMut]);

  const handleUpdateFood = useCallback((foodId: number, data: Record<string, unknown>) => {
    updateFoodMut.mutate(data as any);
  }, [updateFoodMut]);

  const handleAddFood = useCallback((mealId: number, food: { name: string; quantity: string; calories: number; protein: number; carbs: number; fats: number }) => {
    addFoodMut.mutate({ mealId, ...food });
  }, [addFoodMut]);

  const handleDeleteFood = useCallback((foodId: number) => {
    deleteFoodMut.mutate({ foodId });
  }, [deleteFoodMut]);

  const handleDeleteMeal = useCallback((mealId: number) => {
    deleteMealMut.mutate({ mealId });
  }, [deleteMealMut]);

  const handleAddMeal = useCallback((menuId: number, mealName: string) => {
    addMealMut.mutate({ menuId, mealName });
  }, [addMealMut]);

  const handleDownloadPdf = async () => {
    if (!diet) return;
    setDownloading(true);
    try {
      const printWindow = window.open("", "_blank");
      if (!printWindow) throw new Error("No se pudo abrir la ventana de impresión");
      const html = generateGridPdfHtml(diet);
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.onload = () => printWindow.print();
    } catch (e) {
      console.error(e);
      toast.error("Error al generar el PDF");
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
        <div className="flex gap-2 shrink-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => duplicateMut.mutate({ id: dietId })}
                disabled={duplicateMut.isPending}
              >
                {duplicateMut.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Duplicar dieta</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowShoppingList(true)}
              >
                <ShoppingCart className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Lista de la compra</TooltipContent>
          </Tooltip>
          <Button
            variant="outline"
            onClick={handleDownloadPdf}
            disabled={downloading}
          >
            {downloading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            PDF
          </Button>
        </div>
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

      {/* Shopping List Dialog */}
      <Dialog open={showShoppingList} onOpenChange={setShowShoppingList}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              Lista de la Compra
            </DialogTitle>
          </DialogHeader>
          <ShoppingListContent dietId={dietId} />
        </DialogContent>
      </Dialog>

      {/* Menus */}
      {diet.menus.length === 1 ? (
        <MenuView
          menu={diet.menus[0]}
          onMealNameChange={handleMealNameChange}
          onUpdateFood={handleUpdateFood}
          onDeleteFood={handleDeleteFood}
          onDeleteMeal={handleDeleteMeal}
          onAddMeal={handleAddMeal}
          onAddFood={handleAddFood}
          addingMeal={addMealMut.isPending}
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
                  onDeleteFood={handleDeleteFood}
                  onDeleteMeal={handleDeleteMeal}
                  onAddMeal={handleAddMeal}
                  onAddFood={handleAddFood}
                  addingMeal={addMealMut.isPending}
                />
              </TabsContent>
            ))}
        </Tabs>
      )}
    </div>
  );
}

// ── Shopping List Content ──
function ShoppingListContent({ dietId }: { dietId: number }) {
  const { data, isLoading } = trpc.diet.shoppingList.useQuery({ id: dietId });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!data || data.items.length === 0) {
    return <p className="text-muted-foreground text-center py-4">No hay alimentos en esta dieta.</p>;
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {data.items.length} alimentos diferentes en "{data.dietName}"
      </p>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted">
              <th className="text-left px-3 py-2 font-medium">Alimento</th>
              <th className="text-right px-3 py-2 font-medium">Cantidad Total</th>
              <th className="text-right px-3 py-2 font-medium">Apariciones</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, i) => (
              <tr key={i} className={i % 2 === 0 ? "bg-background" : "bg-muted/30"}>
                <td className="px-3 py-2">{item.name}</td>
                <td className="px-3 py-2 text-right font-medium">{item.totalQuantity}</td>
                <td className="px-3 py-2 text-right text-muted-foreground">{item.appearances}x</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * PDF Grid Layout: Columns = Menus, Rows = Meals
 * Similar to the reference PDF with yellow headers and clean grid.
 * Shows only food names, quantities and alternatives (NO calories/macros).
 * Includes NoLimitPerformance logo.
 */
function generateGridPdfHtml(diet: any): string {
  const sortedMenus = [...diet.menus].sort((a: any, b: any) => a.menuNumber - b.menuNumber);

  // Collect all unique meal names across all menus (by mealNumber)
  const maxMeals = Math.max(...sortedMenus.map((m: any) => m.meals.length));
  const mealRows: { mealNumber: number; mealName: string }[] = [];

  for (let i = 0; i < maxMeals; i++) {
    // Find the first menu that has this meal number to get the name
    let name = `Comida ${i + 1}`;
    for (const menu of sortedMenus) {
      const sorted = [...menu.meals].sort((a: any, b: any) => a.mealNumber - b.mealNumber);
      if (sorted[i]) {
        name = sorted[i].mealName;
        break;
      }
    }
    mealRows.push({ mealNumber: i + 1, mealName: name });
  }

  const colWidth = Math.floor(100 / (sortedMenus.length + 0.001));

  // Build header row
  const headerCells = sortedMenus.map((menu: any) =>
    `<th style="background:#f5c518;color:#1a1a1a;padding:10px 8px;font-size:13px;font-weight:700;text-align:center;border:1px solid #e0b800;width:${colWidth}%;">
      Menú ${menu.menuNumber}
    </th>`
  ).join("");

  // Build body rows (one per meal)
  const bodyRows = mealRows.map((mealRow, idx) => {
    const cells = sortedMenus.map((menu: any) => {
      const sorted = [...menu.meals].sort((a: any, b: any) => a.mealNumber - b.mealNumber);
      const meal = sorted[idx];
      if (!meal) {
        return `<td style="padding:12px 10px;border:1px solid #e8e8e8;vertical-align:top;background:#fff;"></td>`;
      }

      const mealName = meal.mealName;
      const foodLines = meal.foods.map((f: any) => {
        let line = `${f.name} (${f.quantity})`;
        return line;
      }).join(", ");

      // Alternative line
      const altFoods = meal.foods
        .filter((f: any) => f.alternativeName)
        .map((f: any) => `${f.alternativeName} (${f.alternativeQuantity || f.quantity})`)
        .join(", ");

      let cellContent = `<div style="margin-bottom:2px;"><strong style="font-size:12px;color:#1a1a1a;">${mealName}</strong></div>`;
      cellContent += `<div style="font-size:11px;color:#333;line-height:1.5;">${foodLines}.</div>`;
      if (altFoods) {
        cellContent += `<div style="font-size:10px;color:#888;font-style:italic;margin-top:4px;border-top:1px dashed #ddd;padding-top:3px;">Alt: ${altFoods}.</div>`;
      }

      return `<td style="padding:10px;border:1px solid #e8e8e8;vertical-align:top;background:${idx % 2 === 0 ? '#fff' : '#fafafa'};">${cellContent}</td>`;
    }).join("");

    return `<tr>${cells}</tr>`;
  }).join("");

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${diet.name}</title>
  <style>
    @media print {
      body { margin: 0; padding: 10px; }
      @page { margin: 1cm; size: landscape; }
      table { page-break-inside: avoid; }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
      color: #1a1a1a;
      margin: 0 auto;
      padding: 20px;
      line-height: 1.4;
      max-width: 1200px;
    }
  </style>
</head>
<body>
  <div style="text-align:center;margin-bottom:20px;">
    <img src="${LOGO_URL}" alt="NoLimitPerformance" style="height:80px;margin:0 auto 10px;display:block;" />
    <h1 style="font-size:22px;font-weight:900;margin:0 0 4px;color:#111;text-transform:uppercase;letter-spacing:1px;">
      ${diet.name}
    </h1>
    <p style="font-size:12px;color:#888;margin:0;">
      ${diet.mealsPerDay} comidas/día · Generado el ${new Date(diet.createdAt).toLocaleDateString("es-ES")}
    </p>
  </div>

  <table style="width:100%;border-collapse:collapse;table-layout:fixed;">
    <thead>
      <tr>${headerCells}</tr>
    </thead>
    <tbody>
      ${bodyRows}
    </tbody>
  </table>

  <div style="text-align:center;margin-top:16px;">
    <p style="font-size:9px;color:#ccc;">NoLimitPerformance #MetabolicHacking</p>
  </div>
</body>
</html>`;
}
