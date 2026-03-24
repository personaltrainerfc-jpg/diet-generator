import { useState, useCallback, useMemo } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Loader2, ArrowLeft, ArrowLeftRight, Download, Copy, RefreshCw,
  Trash2, Plus, Search, ShoppingCart, Flame, Beef, Wheat, Droplets,
  Pencil, StickyNote, Settings2, BookOpen, FileDown, ClipboardCopy,
  AlertCircle, Pill, Save, Eye, EyeOff, GripVertical, FileStack,
} from "lucide-react";
import type { FullDiet, FullMenu, FullMeal, FullFood } from "@shared/types";
import { LOGO_URL } from "@shared/constants";
import SupplementsPanel from "./Supplements";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// ── Editable Meal Name ──
function EditableMealName({ meal, onSave }: { meal: FullMeal; onSave: (name: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(meal.mealName);

  const handleSave = () => {
    const trimmed = value.trim();
    if (trimmed && trimmed !== meal.mealName) onSave(trimmed);
    setEditing(false);
  };

  if (editing) {
    return (
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") { setValue(meal.mealName); setEditing(false); } }}
        onBlur={handleSave}
        className="h-8 text-[15px] font-semibold w-48 rounded-lg"
        autoFocus
      />
    );
  }
  return (
    <button onClick={() => { setValue(meal.mealName); setEditing(true); }} className="text-[15px] font-semibold text-card-foreground hover:text-primary transition-colors">
      {meal.mealName}
    </button>
  );
}

// ── Food Search Dialog ──
function FoodSearchDialog({ open, onClose, onSelect, currentFoodName }: {
  open: boolean; onClose: () => void;
  onSelect: (food: { name: string; calories: number; protein: number; carbs: number; fats: number }) => void;
  currentFoodName: string;
}) {
  const [query, setQuery] = useState("");
  const { data: results, isLoading } = trpc.foodDb.search.useQuery({ query }, { enabled: query.length >= 2 });

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { setQuery(""); onClose(); } }}>
      <DialogContent className="max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-[17px] font-semibold">
            Sustituir: <span className="text-primary">{currentFoodName}</span>
          </DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar alimento..." value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9 rounded-xl" autoFocus />
        </div>
        <div className="max-h-64 overflow-y-auto space-y-0.5">
          {isLoading && query.length >= 2 && <div className="flex items-center justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>}
          {results && results.length === 0 && query.length >= 2 && <p className="text-sm text-muted-foreground text-center py-6">No se encontraron alimentos</p>}
          {results?.map((food, i) => (
            <button key={`${food.name}-${i}`} onClick={() => { onSelect(food); setQuery(""); onClose(); }}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-secondary/80 transition-all text-left">
              <span className="font-medium text-[13px]">{food.name}</span>
              <span className="text-[11px] text-muted-foreground shrink-0 ml-3">
                {food.calories} kcal · P{food.protein}g · C{food.carbs}g · G{food.fats}g
                <span className="text-[10px] ml-1 opacity-50">/100g</span>
              </span>
            </button>
          ))}
          {query.length < 2 && <p className="text-[12px] text-muted-foreground text-center py-6">Escribe al menos 2 caracteres</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Add Food Dialog ──
function AddFoodDialog({ open, onClose, onAdd }: {
  open: boolean; onClose: () => void;
  onAdd: (food: { name: string; quantity: string; calories: number; protein: number; carbs: number; fats: number }) => void;
}) {
  const [query, setQuery] = useState("");
  const [selectedFood, setSelectedFood] = useState<{ name: string; calories: number; protein: number; carbs: number; fats: number } | null>(null);
  const [grams, setGrams] = useState(100);
  const { data: results, isLoading } = trpc.foodDb.search.useQuery({ query }, { enabled: query.length >= 2 });

  const handleAdd = () => {
    if (!selectedFood) return;
    const factor = grams / 100;
    onAdd({
      name: selectedFood.name, quantity: `${grams}g`,
      calories: Math.round(selectedFood.calories * factor), protein: Math.round(selectedFood.protein * factor),
      carbs: Math.round(selectedFood.carbs * factor), fats: Math.round(selectedFood.fats * factor),
    });
    setQuery(""); setSelectedFood(null); setGrams(100); onClose();
  };

  const handleClose = () => { setQuery(""); setSelectedFood(null); setGrams(100); onClose(); };
  const previewFactor = grams / 100;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-lg rounded-2xl">
        <DialogHeader><DialogTitle className="text-[17px] font-semibold">Añadir alimento</DialogTitle></DialogHeader>
        {!selectedFood ? (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar alimento..." value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9 rounded-xl" autoFocus />
            </div>
            <div className="max-h-64 overflow-y-auto space-y-0.5">
              {isLoading && query.length >= 2 && <div className="flex items-center justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>}
              {results && results.length === 0 && query.length >= 2 && <p className="text-sm text-muted-foreground text-center py-6">No se encontraron alimentos</p>}
              {results?.map((food, i) => (
                <button key={`${food.name}-${i}`} onClick={() => setSelectedFood(food)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-secondary/80 transition-all text-left">
                  <span className="font-medium text-[13px]">{food.name}</span>
                  <span className="text-[11px] text-muted-foreground shrink-0 ml-3">{food.calories} kcal · P{food.protein}g · C{food.carbs}g · G{food.fats}g</span>
                </button>
              ))}
              {query.length < 2 && <p className="text-[12px] text-muted-foreground text-center py-6">Escribe al menos 2 caracteres</p>}
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-secondary/50">
              <p className="font-semibold text-[14px]">{selectedFood.name}</p>
              <p className="text-[12px] text-muted-foreground mt-0.5">Por 100g: {selectedFood.calories} kcal · P{selectedFood.protein}g · C{selectedFood.carbs}g · G{selectedFood.fats}g</p>
            </div>
            <div className="space-y-2">
              <label className="text-[13px] font-medium">Cantidad (gramos)</label>
              <Input type="number" value={grams} onChange={(e) => setGrams(Math.max(1, Number(e.target.value)))} min={1} max={2000} className="w-32 rounded-xl" autoFocus />
            </div>
            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
              <p className="text-[11px] font-medium text-muted-foreground mb-1.5">Macros para {grams}g:</p>
              <div className="flex gap-4 text-[13px]">
                <span className="text-orange-500">{Math.round(selectedFood.calories * previewFactor)} kcal</span>
                <span className="text-red-500">P: {Math.round(selectedFood.protein * previewFactor)}g</span>
                <span className="text-amber-500">C: {Math.round(selectedFood.carbs * previewFactor)}g</span>
                <span className="text-blue-500">G: {Math.round(selectedFood.fats * previewFactor)}g</span>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSelectedFood(null)} className="rounded-xl"><ArrowLeft className="h-4 w-4 mr-1" /> Volver</Button>
              <Button onClick={handleAdd} className="rounded-xl"><Plus className="h-4 w-4 mr-1" /> Añadir</Button>
            </div>
          </div>
        )}
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
    if (trimmed && trimmed !== value) onSave(trimmed);
    setEditing(false);
  };

  if (editing) {
    return (
      <Input value={inputVal} onChange={(e) => setInputVal(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") { setInputVal(value); setEditing(false); } }}
        onBlur={handleSave} className="h-5 text-[12px] w-24 px-1.5 rounded-lg" autoFocus />
    );
  }
  return (
    <button onClick={() => { setInputVal(value); setEditing(true); }}
      className="text-[12px] text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1" title="Clic para editar cantidad">
      {value}
      <Pencil className="h-2.5 w-2.5 opacity-0 group-hover/food:opacity-50" />
    </button>
  );
}

// ── Food Row ──
function FoodRow({ food, mealName, onUpdateFood, onDeleteFood }: {
  food: FullFood; mealName: string;
  onUpdateFood: (foodId: number, data: Record<string, unknown>) => void;
  onDeleteFood: (foodId: number) => void;
}) {
  const [showAlt, setShowAlt] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const current = showAlt
    ? { name: food.alternativeName || food.name, quantity: food.alternativeQuantity || food.quantity,
        calories: food.alternativeCalories ?? food.calories, protein: food.alternativeProtein ?? food.protein,
        carbs: food.alternativeCarbs ?? food.carbs, fats: food.alternativeFats ?? food.fats }
    : { name: food.name, quantity: food.quantity, calories: food.calories, protein: food.protein,
        carbs: food.carbs, fats: food.fats };

  const hasAlternative = food.alternativeName && food.alternativeName.length > 0;

  const handleFoodReplace = (selected: { name: string; calories: number; protein: number; carbs: number; fats: number }) => {
    const qtyMatch = food.quantity.match(/(\d+)/);
    const grams = qtyMatch ? parseInt(qtyMatch[1]) : 100;
    const factor = grams / 100;
    onUpdateFood(food.id, {
      foodId: food.id, name: selected.name,
      calories: Math.round(selected.calories * factor), protein: Math.round(selected.protein * factor),
      carbs: Math.round(selected.carbs * factor), fats: Math.round(selected.fats * factor),
      generateAlternative: true, mealName: mealName,
    });
  };

  return (
    <>
      <div className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-secondary/60 transition-all group/food">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-[13px] text-card-foreground truncate">{current.name}</span>
            {showAlt && <Badge variant="outline" className="text-[9px] py-0 px-1.5 text-primary border-primary/20 rounded-full">ALT</Badge>}
          </div>
          <EditableQuantity value={current.quantity} onSave={(v) => onUpdateFood(food.id, { foodId: food.id, quantity: v, recalcFromDb: true })} />
        </div>
        <div className="flex items-center gap-3 shrink-0 text-[12px] tabular-nums">
          <span className="text-muted-foreground w-14 text-right">{current.calories} kcal</span>
          <span className="text-red-500 w-7 text-right">{current.protein}g</span>
          <span className="text-amber-500 w-7 text-right">{current.carbs}g</span>
          <span className="text-blue-500 w-7 text-right">{current.fats}g</span>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <Tooltip><TooltipTrigger asChild>
            <button onClick={() => setSearchOpen(true)} className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all opacity-0 group-hover/food:opacity-100">
              <Search className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger><TooltipContent>Sustituir</TooltipContent></Tooltip>
          {hasAlternative && (
            <Tooltip><TooltipTrigger asChild>
              <button onClick={() => setShowAlt(!showAlt)} className={`h-7 w-7 rounded-lg flex items-center justify-center transition-all ${showAlt ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-primary hover:bg-primary/10"}`}>
                <ArrowLeftRight className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger><TooltipContent>{showAlt ? "Ver original" : "Ver alternativa"}</TooltipContent></Tooltip>
          )}
          <Tooltip><TooltipTrigger asChild>
            <button onClick={() => onDeleteFood(food.id)} className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover/food:opacity-100">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger><TooltipContent>Eliminar</TooltipContent></Tooltip>
        </div>
      </div>
      <FoodSearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} onSelect={handleFoodReplace} currentFoodName={food.name} />
    </>
  );
}

// ── Meal Notes ──
function MealNotes({ meal, onSave }: { meal: FullMeal; onSave: (notes: string | null) => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(meal.notes || "");

  const handleSave = () => { onSave(value.trim() || null); setEditing(false); };

  if (editing) {
    return (
      <div className="mt-3 space-y-2">
        <Textarea value={value} onChange={(e) => setValue(e.target.value)} placeholder="Instrucciones de preparación, notas..." className="text-[12px] min-h-[60px] resize-none rounded-xl" autoFocus />
        <div className="flex gap-1.5 justify-end">
          <Button variant="outline" size="sm" className="h-7 text-[12px] rounded-lg" onClick={() => { setValue(meal.notes || ""); setEditing(false); }}>Cancelar</Button>
          <Button size="sm" className="h-7 text-[12px] rounded-lg" onClick={handleSave}>Guardar</Button>
        </div>
      </div>
    );
  }

  if (meal.notes) {
    return (
      <button onClick={() => setEditing(true)} className="mt-3 w-full text-left p-3 rounded-xl bg-amber-500/5 border border-amber-500/15 hover:border-amber-500/30 transition-all group/notes">
        <div className="flex items-start gap-2">
          <StickyNote className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-[12px] text-muted-foreground leading-relaxed whitespace-pre-wrap">{meal.notes}</p>
          <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover/notes:opacity-100 shrink-0 mt-0.5" />
        </div>
      </button>
    );
  }

  return (
    <button onClick={() => setEditing(true)} className="mt-3 w-full py-1.5 rounded-xl text-[11px] text-muted-foreground/50 hover:text-muted-foreground hover:bg-secondary/50 transition-all flex items-center justify-center gap-1">
      <StickyNote className="h-3 w-3" /> Añadir notas
    </button>
  );
}

// ── Meal Card ──
function MealCard({ meal, onMealNameChange, onUpdateFood, onDeleteFood, onDeleteMeal, onAddFood, onRegenerateMeal, onUpdateNotes, onUpdateDescription, onCopyMeal, onSaveAsRecipe, onAddRecipe, isDeletable, isRegenerating }: {
  meal: FullMeal; onMealNameChange: (mealId: number, name: string) => void;
  onUpdateFood: (foodId: number, data: Record<string, unknown>) => void;
  onDeleteFood: (foodId: number) => void; onDeleteMeal: (mealId: number) => void;
  onAddFood: (mealId: number, food: { name: string; quantity: string; calories: number; protein: number; carbs: number; fats: number }) => void;
  onRegenerateMeal: (mealId: number) => void; onUpdateNotes: (mealId: number, notes: string | null) => void;
  onUpdateDescription: (mealId: number, description: string | null) => void;
  onCopyMeal?: (mealId: number) => void; onSaveAsRecipe?: (mealId: number) => void;
  onAddRecipe?: (mealId: number) => void;
  isDeletable: boolean; isRegenerating: boolean;
}) {
  const [addFoodOpen, setAddFoodOpen] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  const [descValue, setDescValue] = useState(meal.description || "");

  // Calculate real totals from foods instead of trusting stored meal-level values
  const realTotals = useMemo(() => {
    if (!meal.foods || meal.foods.length === 0) return { calories: meal.calories, protein: meal.protein, carbs: meal.carbs, fats: meal.fats };
    return meal.foods.reduce(
      (acc, f) => ({
        calories: acc.calories + (f.calories || 0),
        protein: acc.protein + (f.protein || 0),
        carbs: acc.carbs + (f.carbs || 0),
        fats: acc.fats + (f.fats || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );
  }, [meal.foods, meal.calories, meal.protein, meal.carbs, meal.fats]);

  return (
    <div className="bg-card rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-shadow group/meal overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between">
          <EditableMealName meal={meal} onSave={(name) => onMealNameChange(meal.id, name)} />
          <div className="flex items-center gap-1.5">
            <div className="px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 text-[12px] font-semibold tabular-nums">
              {realTotals.calories} kcal
            </div>
            {onSaveAsRecipe && (
              <Tooltip><TooltipTrigger asChild>
                <button onClick={() => onSaveAsRecipe(meal.id)} className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-green-600 hover:bg-green-500/10 transition-all opacity-0 group-hover/meal:opacity-100">
                  <Save className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger><TooltipContent>Guardar como receta</TooltipContent></Tooltip>
            )}
            {onCopyMeal && (
              <Tooltip><TooltipTrigger asChild>
                <button onClick={() => onCopyMeal(meal.id)} className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all opacity-0 group-hover/meal:opacity-100">
                  <ClipboardCopy className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger><TooltipContent>Copiar a otro menú</TooltipContent></Tooltip>
            )}
            <Tooltip><TooltipTrigger asChild>
              <button onClick={() => onRegenerateMeal(meal.id)} disabled={isRegenerating}
                className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all opacity-0 group-hover/meal:opacity-100 disabled:opacity-50">
                {isRegenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              </button>
            </TooltipTrigger><TooltipContent>Regenerar comida</TooltipContent></Tooltip>
            {isDeletable && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover/meal:opacity-100">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-2xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Eliminar comida</AlertDialogTitle>
                    <AlertDialogDescription>¿Eliminar "{meal.mealName}" y todos sus alimentos?</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDeleteMeal(meal.id)} className="bg-red-600 hover:bg-red-700 rounded-xl">Eliminar</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
        {/* Macro pills */}
        <div className="flex gap-3 mt-2 text-[12px]">
          <span className="flex items-center gap-1 text-muted-foreground"><span className="h-1.5 w-1.5 rounded-full bg-red-400" />P: {realTotals.protein}g</span>
          <span className="flex items-center gap-1 text-muted-foreground"><span className="h-1.5 w-1.5 rounded-full bg-amber-400" />C: {realTotals.carbs}g</span>
          <span className="flex items-center gap-1 text-muted-foreground"><span className="h-1.5 w-1.5 rounded-full bg-blue-400" />G: {realTotals.fats}g</span>
        </div>
        {/* Description */}
        {editingDesc ? (
          <div className="mt-2 flex items-center gap-1.5">
            <Input value={descValue} onChange={(e) => setDescValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { onUpdateDescription(meal.id, descValue.trim() || null); setEditingDesc(false); } if (e.key === "Escape") { setDescValue(meal.description || ""); setEditingDesc(false); } }}
              onBlur={() => { onUpdateDescription(meal.id, descValue.trim() || null); setEditingDesc(false); }}
              placeholder="Ej: Pechuga a la plancha con arroz y ensalada..." className="h-7 text-[13px] italic rounded-lg" autoFocus maxLength={500} />
          </div>
        ) : meal.description ? (
          <button onClick={() => { setDescValue(meal.description || ""); setEditingDesc(true); }}
            className="mt-2 w-full text-left text-[13px] text-muted-foreground italic border-l-2 border-primary/20 pl-2.5 hover:bg-secondary/40 rounded-r-lg py-0.5 transition-all group/desc">
            {meal.description}
            <Pencil className="h-3 w-3 inline ml-1.5 opacity-0 group-hover/desc:opacity-100 transition-opacity" />
          </button>
        ) : (
          <button onClick={() => { setDescValue(""); setEditingDesc(true); }}
            className="mt-2 w-full py-1 rounded-xl text-[11px] text-muted-foreground/40 hover:text-muted-foreground hover:bg-secondary/40 transition-all flex items-center justify-center gap-1">
            <Pencil className="h-3 w-3" /> Añadir descripción
          </button>
        )}
      </div>

      {/* Divider */}
      <div className="mx-5"><Separator className="opacity-50" /></div>

      {/* Foods */}
      <div className="px-5 pt-2 pb-4">
        <div className="flex items-center gap-3 py-1.5 px-3 text-[10px] uppercase tracking-wider text-muted-foreground/70 font-medium">
          <div className="flex-1">Alimento</div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="w-14 text-right">Kcal</span>
            <span className="w-7 text-right text-red-400">Prot</span>
            <span className="w-7 text-right text-amber-400">Carb</span>
            <span className="w-7 text-right text-blue-400">Gras</span>
          </div>
          <div className="w-[5rem] shrink-0" />
        </div>
        <div className="divide-y divide-border/30">
          {meal.foods.map(food => (
            <FoodRow key={food.id} food={food} mealName={meal.mealName} onUpdateFood={onUpdateFood} onDeleteFood={onDeleteFood} />
          ))}
        </div>
        <div className="flex gap-2 mt-3">
          <button onClick={() => setAddFoodOpen(true)}
            className="flex-1 py-2.5 rounded-xl border border-dashed border-border/60 text-[12px] text-muted-foreground hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Añadir alimento
          </button>
          {onAddRecipe && (
            <button onClick={() => onAddRecipe(meal.id)}
              className="flex-1 py-2.5 rounded-xl border border-dashed border-emerald-500/40 text-[12px] text-muted-foreground hover:border-emerald-500 hover:text-emerald-600 transition-all flex items-center justify-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5" /> Añadir receta
            </button>
          )}
        </div>
        <MealNotes meal={meal} onSave={(notes) => onUpdateNotes(meal.id, notes)} />
      </div>

      <AddFoodDialog open={addFoodOpen} onClose={() => setAddFoodOpen(false)} onAdd={(food) => onAddFood(meal.id, food)} />
    </div>
  );
}

// ── Add Meal Dialog ──
function AddMealDialog({ open, onClose, onAdd, isLoading }: {
  open: boolean; onClose: () => void; onAdd: (name: string) => void; isLoading: boolean;
}) {
  const [name, setName] = useState("");
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v && !isLoading) { setName(""); onClose(); } }}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader><DialogTitle className="text-[17px] font-semibold">Añadir comida</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-[13px] font-medium text-card-foreground mb-1.5 block">Nombre</label>
            <Input placeholder="Ej: Merienda, Pre-entreno..." value={name} onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !isLoading) { onAdd(name.trim() || "Nueva comida"); } }}
              disabled={isLoading} autoFocus className="rounded-xl" />
          </div>
          <p className="text-[12px] text-muted-foreground">Se generará automáticamente con alimentos y macros proporcionales.</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={isLoading} className="rounded-xl">Cancelar</Button>
            <Button onClick={() => onAdd(name.trim() || "Nueva comida")} disabled={isLoading} className="rounded-xl">
              {isLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generando...</> : <><Plus className="h-4 w-4 mr-2" />Añadir</>}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Menu View ──
// ── Sortable Meal Card Wrapper ──
function SortableMealCard({ meal, ...props }: { meal: FullMeal } & Omit<Parameters<typeof MealCard>[0], 'meal'>) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: meal.id });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 50 : undefined, opacity: isDragging ? 0.5 : 1 };
  return (
    <div ref={setNodeRef} style={style} className="relative group/sortable">
      <div {...attributes} {...listeners} className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-10 cursor-grab active:cursor-grabbing p-1 rounded-lg bg-background/80 border border-border/40 opacity-0 group-hover/sortable:opacity-100 transition-opacity shadow-sm" title="Arrastrar para reordenar">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      <MealCard meal={meal} {...props} />
    </div>
  );
}

function MenuView({ menu, onMealNameChange, onUpdateFood, onDeleteFood, onDeleteMeal, onAddMeal, onAddFood, onRegenerateMeal, onUpdateNotes, onUpdateDescription, onCopyMeal, onSaveAsRecipe, onAddRecipe, onReorderMeals, addingMeal, regeneratingMealId }: {
  menu: FullMenu; onMealNameChange: (mealId: number, name: string) => void;
  onUpdateFood: (foodId: number, data: Record<string, unknown>) => void;
  onDeleteFood: (foodId: number) => void; onDeleteMeal: (mealId: number) => void;
  onAddMeal: (menuId: number, mealName: string) => void;
  onAddFood: (mealId: number, food: { name: string; quantity: string; calories: number; protein: number; carbs: number; fats: number }) => void;
  onRegenerateMeal: (mealId: number) => void; onUpdateNotes: (mealId: number, notes: string | null) => void;
  onUpdateDescription: (mealId: number, description: string | null) => void;
  onCopyMeal?: (mealId: number) => void; onSaveAsRecipe?: (mealId: number) => void;
  onAddRecipe?: (mealId: number) => void;
  onReorderMeals?: (menuId: number, mealIds: number[]) => void;
  addingMeal: boolean; regeneratingMealId: number | null;
}) {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const sortedMeals = [...menu.meals].sort((a, b) => a.mealNumber - b.mealNumber);
  const canDeleteMeal = sortedMeals.length > 1;

  // Calculate real menu totals from all foods across all meals
  const menuTotals = useMemo(() => {
    return menu.meals.reduce(
      (acc, meal) => {
        const mealSum = (meal.foods || []).reduce(
          (mAcc, f) => ({
            calories: mAcc.calories + (f.calories || 0),
            protein: mAcc.protein + (f.protein || 0),
            carbs: mAcc.carbs + (f.carbs || 0),
            fats: mAcc.fats + (f.fats || 0),
          }),
          { calories: 0, protein: 0, carbs: 0, fats: 0 }
        );
        return {
          calories: acc.calories + mealSum.calories,
          protein: acc.protein + mealSum.protein,
          carbs: acc.carbs + mealSum.carbs,
          fats: acc.fats + mealSum.fats,
        };
      },
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );
  }, [menu.meals]);

  return (
    <div className="space-y-5">
      {/* Macro summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Flame, label: "Calorías", value: menuTotals.calories, unit: "", color: "orange" },
          { icon: Beef, label: "Proteínas", value: `${menuTotals.protein}g`, unit: "", color: "red" },
          { icon: Wheat, label: "Carbohidratos", value: `${menuTotals.carbs}g`, unit: "", color: "amber" },
          { icon: Droplets, label: "Grasas", value: `${menuTotals.fats}g`, unit: "", color: "blue" },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-${color}-500/8 border border-${color}-500/10`}>
            <Icon className={`h-5 w-5 text-${color}-500`} />
            <div>
              <p className="text-[11px] text-muted-foreground">{label}</p>
              <p className="font-bold text-[15px] text-card-foreground tabular-nums">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Meals with drag & drop */}
      <DndContext sensors={useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }), useSensor(KeyboardSensor))} collisionDetection={closestCenter}
        onDragEnd={(event: DragEndEvent) => {
          const { active, over } = event;
          if (over && active.id !== over.id) {
            const oldIndex = sortedMeals.findIndex(m => m.id === active.id);
            const newIndex = sortedMeals.findIndex(m => m.id === over.id);
            const newOrder = arrayMove(sortedMeals, oldIndex, newIndex);
            onReorderMeals?.(menu.id, newOrder.map(m => m.id));
          }
        }}>
        <SortableContext items={sortedMeals.map(m => m.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {sortedMeals.map(meal => (
              <SortableMealCard key={meal.id} meal={meal} onMealNameChange={onMealNameChange} onUpdateFood={onUpdateFood}
                onDeleteFood={onDeleteFood} onDeleteMeal={onDeleteMeal} onAddFood={onAddFood} onRegenerateMeal={onRegenerateMeal}
                onUpdateNotes={onUpdateNotes} onUpdateDescription={onUpdateDescription} onCopyMeal={onCopyMeal}
                onSaveAsRecipe={onSaveAsRecipe} onAddRecipe={onAddRecipe} isDeletable={canDeleteMeal} isRegenerating={regeneratingMealId === meal.id} />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Add meal */}
      <Button variant="outline" className="w-full border-dashed border-2 hover:border-primary hover:text-primary rounded-2xl h-12" onClick={() => setAddDialogOpen(true)} disabled={addingMeal}>
        {addingMeal ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generando...</> : <><Plus className="h-4 w-4 mr-2" />Añadir comida</>}
      </Button>

      <AddMealDialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} onAdd={(name) => { setAddDialogOpen(false); onAddMeal(menu.id, name); }} isLoading={addingMeal} />
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
  const [regeneratingMealId, setRegeneratingMealId] = useState<number | null>(null);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [duplicateName, setDuplicateName] = useState("");
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateTags, setTemplateTags] = useState("");
  const [showAdjustMacros, setShowAdjustMacros] = useState(false);
  const [showCopyMeal, setShowCopyMeal] = useState(false);
  const [copyMealId, setCopyMealId] = useState<number | null>(null);
  const [copyTargetMenuIds, setCopyTargetMenuIds] = useState<Set<number>>(new Set());
  const [copyReplaceMealNumber, setCopyReplaceMealNumber] = useState<number | undefined>(undefined);
  const [showGuide, setShowGuide] = useState(false);
  const [guideContent, setGuideContent] = useState<string | null>(null);
  const [adjustCalories, setAdjustCalories] = useState(2000);
  const [adjustProtein, setAdjustProtein] = useState(30);
  const [adjustCarbs, setAdjustCarbs] = useState(45);
  const [adjustFats, setAdjustFats] = useState(25);
  const [showSummary, setShowSummary] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [instructionsText, setInstructionsText] = useState("");
  const [showSupplements, setShowSupplements] = useState(false);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [recipeMealId, setRecipeMealId] = useState<number | null>(null);
  const [hiddenMenuIds, setHiddenMenuIds] = useState<Set<number>>(new Set());
  const toggleMenuVisibility = useCallback((menuId: number) => {
    setHiddenMenuIds(prev => {
      const next = new Set(prev);
      if (next.has(menuId)) next.delete(menuId); else next.add(menuId);
      return next;
    });
  }, []);

  const utils = trpc.useUtils();

  const { data: diet, isLoading, error } = trpc.diet.getById.useQuery({ id: dietId }, { enabled: !isNaN(dietId), staleTime: 10 * 60 * 1000 });

  const updateMealNameMut = trpc.diet.updateMealName.useMutation({ onSuccess: () => { utils.diet.getById.invalidate({ id: dietId }); toast.success("Nombre actualizado"); }, onError: (err) => toast.error(err.message) });
  const updateFoodMut = trpc.diet.updateFood.useMutation({ onSuccess: () => { utils.diet.getById.invalidate({ id: dietId }); toast.success("Alimento actualizado"); }, onError: (err) => toast.error(err.message) });
  const addFoodMut = trpc.diet.addFood.useMutation({ onMutate: () => toast.info("Añadiendo alimento..."), onSuccess: () => { utils.diet.getById.invalidate({ id: dietId }); toast.success("Alimento añadido"); }, onError: (err) => toast.error(err.message) });
  const deleteFoodMut = trpc.diet.deleteFood.useMutation({ onSuccess: () => { utils.diet.getById.invalidate({ id: dietId }); toast.success("Eliminado"); }, onError: (err) => toast.error(err.message) });
  const deleteMealMut = trpc.diet.deleteMeal.useMutation({ onSuccess: () => { utils.diet.getById.invalidate({ id: dietId }); toast.success("Comida eliminada"); }, onError: (err) => toast.error(err.message) });
  const addMealMut = trpc.diet.addMeal.useMutation({ onSuccess: () => { utils.diet.getById.invalidate({ id: dietId }); toast.success("Comida añadida"); }, onError: (err) => toast.error(err.message) });
  const duplicateMut = trpc.diet.duplicate.useMutation({ onSuccess: (data) => { toast.success("Dieta duplicada"); setLocation(`/diet/${data.dietId}`); }, onError: (err) => toast.error(err.message) });
  const saveTemplateMut = trpc.clientMgmt.createTemplate.useMutation({ onSuccess: () => { toast.success("Plantilla guardada"); setShowTemplateDialog(false); }, onError: (err) => toast.error(err.message) });
  const regenerateMealMut = trpc.diet.regenerateMeal.useMutation({
    onMutate: (vars) => { setRegeneratingMealId(vars.mealId); toast.info("Regenerando..."); },
    onSuccess: () => { utils.diet.getById.invalidate({ id: dietId }); toast.success("Comida regenerada"); setRegeneratingMealId(null); },
    onError: (err) => { toast.error(err.message); setRegeneratingMealId(null); },
  });
  const updateNotesMut = trpc.diet.updateMealNotes.useMutation({ onSuccess: () => { utils.diet.getById.invalidate({ id: dietId }); }, onError: (err) => toast.error(err.message) });
  const redoDietMut = trpc.diet.redoDiet.useMutation({ onMutate: () => toast.info("Rehaciendo dieta..."), onSuccess: () => { utils.diet.getById.invalidate({ id: dietId }); toast.success("Dieta rehecha"); }, onError: (err) => toast.error(err.message) });
  const updateDescriptionMut = trpc.diet.updateMealDescription.useMutation({ onSuccess: () => { utils.diet.getById.invalidate({ id: dietId }); }, onError: (err) => toast.error(err.message) });
  const saveAsRecipeMut = trpc.mealAction.saveAsRecipe.useMutation({ onSuccess: () => toast.success("Guardada como receta"), onError: (err) => toast.error(err.message) });
  const adjustMacrosMut = trpc.dietAdjust.adjustMacros.useMutation({ onMutate: () => toast.info("Ajustando macros..."), onSuccess: () => { utils.diet.getById.invalidate({ id: dietId }); toast.success("Macros ajustados"); setShowAdjustMacros(false); }, onError: (err) => toast.error(err.message) });
  const copyMealMut = trpc.dietAdjust.copyMeal.useMutation({ onSuccess: () => { utils.diet.getById.invalidate({ id: dietId }); toast.success("Comida copiada"); setShowCopyMeal(false); setCopyMealId(null); }, onError: (err) => toast.error(err.message) });
  const copyMealMultiMut = trpc.dietAdjust.copyMealToMultiple.useMutation({ onSuccess: (data) => { utils.diet.getById.invalidate({ id: dietId }); toast.success(`Comida copiada a ${data.copied} menú${data.copied > 1 ? "s" : ""}`); setShowCopyMeal(false); setCopyMealId(null); setCopyTargetMenuIds(new Set()); }, onError: (err) => toast.error(err.message) });
  const addRecipeToMealMut = trpc.mealAction.addRecipeToMeal.useMutation({
    onMutate: () => toast.info("Añadiendo receta..."),
    onSuccess: (data) => { utils.diet.getById.invalidate({ id: dietId }); toast.success(`Receta añadida (${data.addedCount} alimentos)`); setShowRecipeModal(false); setRecipeMealId(null); },
    onError: (err) => toast.error(err.message),
  });
  const generateGuideMut = trpc.dietAdjust.generateGuide.useMutation({ onMutate: () => toast.info("Generando guía..."), onSuccess: (data) => { setGuideContent(data.content); setShowGuide(true); }, onError: (err) => toast.error(err.message) });
  const reorderMealsMut = trpc.mealAction.reorderMeals.useMutation({ onSuccess: () => { utils.diet.getById.invalidate({ id: dietId }); toast.success("Comidas reordenadas"); }, onError: (err) => toast.error(err.message) });

  const handleMealNameChange = useCallback((mealId: number, name: string) => { updateMealNameMut.mutate({ mealId, mealName: name }); }, [updateMealNameMut]);
  const handleUpdateFood = useCallback((foodId: number, data: Record<string, unknown>) => { updateFoodMut.mutate(data as any); }, [updateFoodMut]);
  const handleAddFood = useCallback((mealId: number, food: { name: string; quantity: string; calories: number; protein: number; carbs: number; fats: number }) => { addFoodMut.mutate({ mealId, ...food }); }, [addFoodMut]);
  const handleDeleteFood = useCallback((foodId: number) => { deleteFoodMut.mutate({ foodId }); }, [deleteFoodMut]);
  const handleDeleteMeal = useCallback((mealId: number) => { deleteMealMut.mutate({ mealId }); }, [deleteMealMut]);
  const handleAddMeal = useCallback((menuId: number, mealName: string) => { addMealMut.mutate({ menuId, mealName }); }, [addMealMut]);
  const handleRegenerateMeal = useCallback((mealId: number) => { regenerateMealMut.mutate({ mealId }); }, [regenerateMealMut]);
  const handleUpdateNotes = useCallback((mealId: number, notes: string | null) => { updateNotesMut.mutate({ mealId, notes }); }, [updateNotesMut]);
  const handleUpdateDescription = useCallback((mealId: number, description: string | null) => { updateDescriptionMut.mutate({ mealId, description }); }, [updateDescriptionMut]);
  const handleSaveAsRecipe = useCallback((mealId: number) => { saveAsRecipeMut.mutate({ mealId }); }, [saveAsRecipeMut]);
  const handleAddRecipe = useCallback((mealId: number) => { setRecipeMealId(mealId); setShowRecipeModal(true); }, []);
  const handleReorderMeals = useCallback((menuId: number, mealIds: number[]) => { reorderMealsMut.mutate({ menuId, mealIds }); }, [reorderMealsMut]);
  const handleCopyMeal = (mealId: number) => { setCopyMealId(mealId); setCopyTargetMenuIds(new Set()); setCopyReplaceMealNumber(undefined); setShowCopyMeal(true); };
  const toggleCopyTarget = useCallback((menuId: number) => {
    setCopyTargetMenuIds(prev => {
      const next = new Set(prev);
      if (next.has(menuId)) next.delete(menuId); else next.add(menuId);
      return next;
    });
  }, []);
  const handleOpenAdjustMacros = () => { if (diet) { setAdjustCalories(diet.totalCalories); setAdjustProtein(diet.proteinPercent); setAdjustCarbs(diet.carbsPercent); setAdjustFats(diet.fatsPercent); setShowAdjustMacros(true); } };

  const handleDownloadPdf = async () => {
    if (!diet) return;
    setDownloading(true);
    try {
      const printWindow = window.open("", "_blank");
      if (!printWindow) throw new Error("No se pudo abrir la ventana");
      const html = generateGridPdfHtml(diet);
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.onload = () => printWindow.print();
    } catch (e) { console.error(e); toast.error("Error al generar el PDF"); }
    finally { setDownloading(false); }
  };

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (error || !diet) return (
    <div className="max-w-4xl mx-auto text-center py-20">
      <p className="text-muted-foreground">Dieta no encontrada.</p>
      <Button variant="outline" className="mt-4 rounded-xl" onClick={() => setLocation("/history")}>Volver al historial</Button>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="space-y-1">
          <button onClick={() => setLocation("/history")} className="flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors mb-2">
            <ArrowLeft className="h-4 w-4" /> Volver
          </button>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground uppercase">{diet.name}</h1>
          <p className="text-[13px] text-muted-foreground">{diet.totalCalories} kcal · {diet.mealsPerDay} comidas/día</p>
        </div>
        <div className="flex gap-1.5 shrink-0 flex-wrap justify-end">
          <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" onClick={handleOpenAdjustMacros} className="rounded-xl h-9 w-9"><Settings2 className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Ajustar macros</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" onClick={() => generateGuideMut.mutate({ dietId })} disabled={generateGuideMut.isPending} className="rounded-xl h-9 w-9">
            {generateGuideMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookOpen className="h-4 w-4" />}
          </Button></TooltipTrigger><TooltipContent>Guía nutricional</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" onClick={() => { setInstructionsText(""); setShowInstructions(true); }} className="rounded-xl h-9 w-9"><FileDown className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Instrucciones PDF</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" onClick={() => setShowSupplements(true)} className="rounded-xl h-9 w-9"><Pill className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Suplementos</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild>
            <Button variant="outline" onClick={() => redoDietMut.mutate({ id: dietId })} disabled={redoDietMut.isPending} className="gap-1.5 rounded-xl h-9">
              {redoDietMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              <span className="hidden sm:inline text-[13px]">Rehacer</span>
            </Button>
          </TooltipTrigger><TooltipContent>Regenerar dieta</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" onClick={() => { setDuplicateName(diet.name + " (copia)"); setShowDuplicateDialog(true); }} disabled={duplicateMut.isPending} className="rounded-xl h-9 w-9">
            {duplicateMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
          </Button></TooltipTrigger><TooltipContent>Duplicar</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" onClick={() => { setTemplateName(diet.name); setTemplateTags(""); setShowTemplateDialog(true); }} className="rounded-xl h-9 w-9"><FileStack className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Guardar como plantilla</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" onClick={() => setShowShoppingList(true)} className="rounded-xl h-9 w-9"><ShoppingCart className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Lista de la compra</TooltipContent></Tooltip>
          <Button variant="outline" onClick={handleDownloadPdf} disabled={downloading} className="rounded-xl h-9">
            {downloading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            <span className="text-[13px]">PDF</span>
          </Button>
        </div>
      </div>

      {/* Config badges */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary" className="gap-1.5 py-1 rounded-full"><Flame className="h-3.5 w-3.5 text-orange-500" />{diet.totalCalories} kcal</Badge>
        <Badge variant="outline" className="gap-1 py-1 rounded-full text-red-600 dark:text-red-400 border-red-200 dark:border-red-800">Prot: {diet.proteinPercent}%</Badge>
        <Badge variant="outline" className="gap-1 py-1 rounded-full text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800">Carbs: {diet.carbsPercent}%</Badge>
        <Badge variant="outline" className="gap-1 py-1 rounded-full text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800">Grasas: {diet.fatsPercent}%</Badge>
        {diet.avoidFoods && (diet.avoidFoods as string[]).length > 0 && (
          <Badge variant="destructive" className="gap-1 py-1 rounded-full">Evitar: {(diet.avoidFoods as string[]).join(", ")}</Badge>
        )}
      </div>

      {/* Weekly Summary */}
      {diet.menus.length > 1 && (
        <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
          <button className="w-full px-5 py-4 flex items-center justify-between" onClick={() => setShowSummary(!showSummary)}>
            <span className="flex items-center gap-2 text-[15px] font-semibold"><Flame className="h-4 w-4 text-orange-500" />Resumen Semanal</span>
            <span className="text-[12px] text-muted-foreground">{showSummary ? "Ocultar" : "Ver"}</span>
          </button>
          {showSummary && (
            <div className="px-5 pb-4">
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Menú</th>
                      <th className="text-right py-2 px-2 font-medium text-orange-600">Kcal</th>
                      <th className="text-right py-2 px-2 font-medium text-red-600">Prot</th>
                      <th className="text-right py-2 px-2 font-medium text-amber-600">Carbs</th>
                      <th className="text-right py-2 px-2 font-medium text-blue-600">Grasas</th>
                      <th className="text-right py-2 pl-2 font-medium text-muted-foreground">Comidas</th>
                      <th className="text-center py-2 pl-2 font-medium text-muted-foreground w-10"><Eye className="h-3.5 w-3.5 mx-auto" /></th>
                    </tr>
                  </thead>
                  <tbody>
                    {diet.menus.sort((a: any, b: any) => a.menuNumber - b.menuNumber).map((menu: any) => {
                      const isHidden = hiddenMenuIds.has(menu.id);
                      const totals = menu.meals.reduce((acc: any, meal: any) => {
                        meal.foods.forEach((f: any) => { acc.cal += f.calories || 0; acc.prot += f.protein || 0; acc.carbs += f.carbs || 0; acc.fats += f.fats || 0; });
                        return acc;
                      }, { cal: 0, prot: 0, carbs: 0, fats: 0 });
                      return (
                        <tr key={menu.id} className={`border-b border-border/30 last:border-0 transition-opacity ${isHidden ? "opacity-40" : ""}`}>
                          <td className="py-2 pr-4 font-medium">Menú {menu.menuNumber}</td>
                          <td className="py-2 px-2 text-right tabular-nums">{Math.round(totals.cal)}</td>
                          <td className="py-2 px-2 text-right tabular-nums">{Math.round(totals.prot)}g</td>
                          <td className="py-2 px-2 text-right tabular-nums">{Math.round(totals.carbs)}g</td>
                          <td className="py-2 px-2 text-right tabular-nums">{Math.round(totals.fats)}g</td>
                          <td className="py-2 pl-2 text-right text-muted-foreground">{menu.meals.length}</td>
                          <td className="py-2 pl-2 text-center">
                            <button onClick={() => toggleMenuVisibility(menu.id)} className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all mx-auto">
                              {isHidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Dialogs ── */}
      <Dialog open={showShoppingList} onOpenChange={setShowShoppingList}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto rounded-2xl">
          <DialogHeader><DialogTitle className="flex items-center gap-2 text-[17px]"><ShoppingCart className="h-5 w-5 text-primary" />Lista de la Compra</DialogTitle></DialogHeader>
          <ShoppingListContent dietId={dietId} dietName={diet.name} />
        </DialogContent>
      </Dialog>

      <Dialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader><DialogTitle className="flex items-center gap-2 text-[17px]"><Copy className="h-5 w-5 text-primary" />Duplicar Dieta</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-[13px] font-medium">Nombre de la nueva dieta</label>
              <Input value={duplicateName} onChange={(e) => setDuplicateName(e.target.value)} placeholder="Ej: Dieta Juan Pérez" autoFocus className="rounded-xl"
                onKeyDown={(e) => { if (e.key === "Enter" && duplicateName.trim()) { duplicateMut.mutate({ id: dietId, name: duplicateName.trim() }); setShowDuplicateDialog(false); } }} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDuplicateDialog(false)} className="rounded-xl">Cancelar</Button>
              <Button onClick={() => { if (duplicateName.trim()) { duplicateMut.mutate({ id: dietId, name: duplicateName.trim() }); setShowDuplicateDialog(false); } }} disabled={!duplicateName.trim() || duplicateMut.isPending} className="rounded-xl">
                {duplicateMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Copy className="h-4 w-4 mr-2" />}Duplicar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Save as Template Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader><DialogTitle className="flex items-center gap-2 text-[17px]"><FileStack className="h-5 w-5 text-primary" />Guardar como Plantilla</DialogTitle></DialogHeader>
          <p className="text-[13px] text-muted-foreground -mt-1">Guarda esta dieta como plantilla reutilizable para futuros clientes.</p>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-[13px] font-medium">Nombre de la plantilla</label>
              <Input value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="Ej: Definición mujer 60kg" autoFocus className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <label className="text-[13px] font-medium">Etiquetas <span className="text-muted-foreground font-normal">(separadas por coma, opcional)</span></label>
              <Input value={templateTags} onChange={(e) => setTemplateTags(e.target.value)} placeholder="Ej: definición, mujer, 60kg" className="rounded-xl" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowTemplateDialog(false)} className="rounded-xl">Cancelar</Button>
              <Button
                onClick={() => {
                  if (templateName.trim()) {
                    saveTemplateMut.mutate({
                      dietId,
                      name: templateName.trim(),
                      tags: templateTags ? templateTags.split(",").map(t => t.trim()).filter(Boolean) : undefined,
                    });
                  }
                }}
                disabled={!templateName.trim() || saveTemplateMut.isPending}
                className="rounded-xl"
              >
                {saveTemplateMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileStack className="h-4 w-4 mr-2" />}Guardar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAdjustMacros} onOpenChange={setShowAdjustMacros}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader><DialogTitle className="flex items-center gap-2 text-[17px]"><Settings2 className="h-5 w-5 text-primary" />Ajustar Macros</DialogTitle></DialogHeader>
          <div className="space-y-5 pt-2">
            <div className="space-y-2">
              <Label className="font-medium text-[13px]">Calorías: {adjustCalories} kcal</Label>
              <Slider value={[adjustCalories]} onValueChange={([v]) => setAdjustCalories(v)} min={800} max={5000} step={50} />
              <div className="flex justify-between text-[11px] text-muted-foreground"><span>800</span><span>5000</span></div>
            </div>
            <div className="space-y-2">
              <Label className="font-medium text-[13px]">Proteínas: {adjustProtein}%</Label>
              <Slider value={[adjustProtein]} onValueChange={([v]) => { setAdjustProtein(v); const r = 100 - v; const ratio = adjustCarbs + adjustFats > 0 ? adjustCarbs / (adjustCarbs + adjustFats) : 0.5; setAdjustCarbs(Math.round(r * ratio)); setAdjustFats(r - Math.round(r * ratio)); }} min={10} max={60} step={1} />
            </div>
            <div className="space-y-2">
              <Label className="font-medium text-[13px]">Carbohidratos: {adjustCarbs}%</Label>
              <Slider value={[adjustCarbs]} onValueChange={([v]) => { setAdjustCarbs(v); setAdjustFats(100 - adjustProtein - v); }} min={5} max={100 - adjustProtein - 5} step={1} />
            </div>
            <div className="space-y-2">
              <Label className="font-medium text-[13px]">Grasas: {adjustFats}%</Label>
              <div className="h-2 rounded-full bg-blue-200 dark:bg-blue-800"><div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${adjustFats}%` }} /></div>
            </div>
            {adjustProtein + adjustCarbs + adjustFats !== 100 && (
              <p className="text-[12px] text-destructive flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5" />Deben sumar 100% (actual: {adjustProtein + adjustCarbs + adjustFats}%)</p>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAdjustMacros(false)} className="rounded-xl">Cancelar</Button>
              <Button onClick={() => adjustMacrosMut.mutate({ dietId, totalCalories: adjustCalories, proteinPercent: adjustProtein, carbsPercent: adjustCarbs, fatsPercent: adjustFats })}
                disabled={adjustProtein + adjustCarbs + adjustFats !== 100 || adjustMacrosMut.isPending} className="rounded-xl">
                {adjustMacrosMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Settings2 className="h-4 w-4 mr-2" />}Aplicar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showCopyMeal} onOpenChange={(v) => { if (!v) { setShowCopyMeal(false); setCopyMealId(null); setCopyTargetMenuIds(new Set()); } }}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader><DialogTitle className="flex items-center gap-2 text-[17px]"><ClipboardCopy className="h-5 w-5 text-primary" />Copiar Comida</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="font-medium text-[13px]">Menús destino <span className="text-muted-foreground font-normal">(selecciona uno o varios)</span></Label>
              <div className="flex flex-wrap gap-2">
                {diet.menus.map(m => {
                  const isSource = copyMealId ? diet.menus.find(menu => menu.meals.some(meal => meal.id === copyMealId))?.id === m.id : false;
                  const isSelected = copyTargetMenuIds.has(m.id);
                  return (
                    <button key={m.id} disabled={isSource} onClick={() => toggleCopyTarget(m.id)}
                      className={`px-3 py-1.5 rounded-xl text-[13px] font-medium border transition-all flex items-center gap-1.5 ${
                        isSource ? "opacity-40 cursor-not-allowed border-border/50 text-muted-foreground" :
                        isSelected ? "bg-primary text-primary-foreground border-primary" :
                        "border-border/50 text-foreground hover:border-primary/50 hover:bg-primary/5"}`}>
                      {isSelected && <span className="text-[11px]">&#10003;</span>}
                      Menú {m.menuNumber}
                      {isSource && <span className="text-[10px]">(origen)</span>}
                    </button>
                  );
                })}
              </div>
              {copyTargetMenuIds.size > 1 && <p className="text-[11px] text-muted-foreground">{copyTargetMenuIds.size} menús seleccionados</p>}
            </div>
            {copyTargetMenuIds.size > 0 && (
              <div className="space-y-2">
                <Label className="font-medium text-[13px]">Reemplazar (opcional)</Label>
                <div className="flex flex-wrap gap-2">
                  <Button variant={copyReplaceMealNumber === undefined ? "default" : "outline"} size="sm" onClick={() => setCopyReplaceMealNumber(undefined)} className="rounded-xl text-[12px]">Añadir nueva</Button>
                  {(() => {
                    const firstTargetId = Array.from(copyTargetMenuIds)[0];
                    const firstTarget = diet.menus.find(m => m.id === firstTargetId);
                    return firstTarget?.meals.map(meal => (
                      <Button key={meal.id} variant={copyReplaceMealNumber === meal.mealNumber ? "default" : "outline"} size="sm" onClick={() => setCopyReplaceMealNumber(meal.mealNumber)} className="rounded-xl text-[12px]">{meal.mealName}</Button>
                    ));
                  })()}
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setShowCopyMeal(false); setCopyTargetMenuIds(new Set()); }} className="rounded-xl">Cancelar</Button>
              <Button onClick={() => {
                if (!copyMealId || copyTargetMenuIds.size === 0) return;
                const ids = Array.from(copyTargetMenuIds);
                if (ids.length === 1) {
                  copyMealMut.mutate({ mealId: copyMealId, targetMenuId: ids[0], replaceMealNumber: copyReplaceMealNumber });
                } else {
                  copyMealMultiMut.mutate({ mealId: copyMealId, targetMenuIds: ids, replaceMealNumber: copyReplaceMealNumber });
                }
              }} disabled={copyTargetMenuIds.size === 0 || copyMealMut.isPending || copyMealMultiMut.isPending} className="rounded-xl">
                {(copyMealMut.isPending || copyMealMultiMut.isPending) ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ClipboardCopy className="h-4 w-4 mr-2" />}
                Copiar{copyTargetMenuIds.size > 1 ? ` a ${copyTargetMenuIds.size} menús` : ""}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showGuide} onOpenChange={setShowGuide}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl">
          <DialogHeader><DialogTitle className="flex items-center gap-2 text-[17px]"><BookOpen className="h-5 w-5 text-primary" />Guía Nutricional</DialogTitle></DialogHeader>
          {guideContent ? <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-[13px] leading-relaxed">{guideContent}</div>
            : <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>}
        </DialogContent>
      </Dialog>

      <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader><DialogTitle className="flex items-center gap-2 text-[17px]"><FileDown className="h-5 w-5 text-primary" />Instrucciones PDF</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-[13px] text-muted-foreground">Instrucciones personalizadas que aparecerán al final del PDF.</p>
            <Textarea value={instructionsText} onChange={(e) => setInstructionsText(e.target.value)} placeholder="Ej: Beber mínimo 2L de agua al día..." rows={5} className="resize-none rounded-xl text-[13px]" maxLength={3000} />
            {instructionsText.length > 0 && <p className="text-[11px] text-muted-foreground text-right">{instructionsText.length}/3000</p>}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowInstructions(false)} className="rounded-xl">Cancelar</Button>
              <Button onClick={() => {
                const printWindow = window.open("", "_blank");
                if (!printWindow) { toast.error("No se pudo abrir la ventana"); return; }
                printWindow.document.write(generateGridPdfHtml(diet, instructionsText || undefined));
                printWindow.document.close();
                printWindow.onload = () => printWindow.print();
                setShowInstructions(false);
              }} className="rounded-xl"><Download className="h-4 w-4 mr-2" />Generar PDF</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showSupplements} onOpenChange={setShowSupplements}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader><DialogTitle className="flex items-center gap-2 text-[17px]"><Pill className="h-5 w-5 text-primary" />Suplementos</DialogTitle></DialogHeader>
          <SupplementsPanel dietId={dietId} />
        </DialogContent>
      </Dialog>

      {/* Menus */}
      {diet.menus.length === 1 ? (
        <MenuView menu={diet.menus[0]} onMealNameChange={handleMealNameChange} onUpdateFood={handleUpdateFood} onDeleteFood={handleDeleteFood}
          onDeleteMeal={handleDeleteMeal} onAddMeal={handleAddMeal} onAddFood={handleAddFood} onRegenerateMeal={handleRegenerateMeal}
          onUpdateNotes={handleUpdateNotes} onUpdateDescription={handleUpdateDescription} onSaveAsRecipe={handleSaveAsRecipe}
          onAddRecipe={handleAddRecipe} onReorderMeals={handleReorderMeals} addingMeal={addMealMut.isPending} regeneratingMealId={regeneratingMealId} />
      ) : (
        <Tabs defaultValue="1" className="w-full">
          <TabsList className="w-full justify-start flex-wrap h-auto gap-1 p-1 rounded-2xl bg-secondary/50">
            {diet.menus.sort((a, b) => a.menuNumber - b.menuNumber).filter(m => !hiddenMenuIds.has(m.id)).map(menu => (
              <TabsTrigger key={menu.id} value={String(menu.menuNumber)} className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-xl text-[13px]">
                Menú {menu.menuNumber}
              </TabsTrigger>
            ))}
            {hiddenMenuIds.size > 0 && (
              <span className="text-[11px] text-muted-foreground flex items-center gap-1 px-2"><EyeOff className="h-3 w-3" />{hiddenMenuIds.size} oculto{hiddenMenuIds.size > 1 ? "s" : ""}</span>
            )}
          </TabsList>
          {diet.menus.sort((a, b) => a.menuNumber - b.menuNumber).filter(m => !hiddenMenuIds.has(m.id)).map(menu => (
            <TabsContent key={menu.id} value={String(menu.menuNumber)} className="mt-4">
              <MenuView menu={menu} onMealNameChange={handleMealNameChange} onUpdateFood={handleUpdateFood} onDeleteFood={handleDeleteFood}
                onDeleteMeal={handleDeleteMeal} onAddMeal={handleAddMeal} onAddFood={handleAddFood} onRegenerateMeal={handleRegenerateMeal}
                onUpdateNotes={handleUpdateNotes} onUpdateDescription={handleUpdateDescription} onCopyMeal={handleCopyMeal}
                onSaveAsRecipe={handleSaveAsRecipe} onAddRecipe={handleAddRecipe} onReorderMeals={handleReorderMeals}
                addingMeal={addMealMut.isPending} regeneratingMealId={regeneratingMealId} />
            </TabsContent>
          ))}
        </Tabs>
      )}

      {/* Add Recipe to Meal Dialog */}
      <Dialog open={showRecipeModal} onOpenChange={(v) => { if (!v) { setShowRecipeModal(false); setRecipeMealId(null); } }}>
        <DialogContent className="max-w-lg rounded-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader><DialogTitle className="flex items-center gap-2 text-[17px]"><BookOpen className="h-5 w-5 text-emerald-500" />Añadir receta a comida</DialogTitle></DialogHeader>
          <AddRecipeToMealContent mealId={recipeMealId} onSelect={(recipeId) => { if (recipeMealId) addRecipeToMealMut.mutate({ mealId: recipeMealId, recipeId }); }} isLoading={addRecipeToMealMut.isPending} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Add Recipe To Meal Content ──
function AddRecipeToMealContent({ mealId, onSelect, isLoading }: { mealId: number | null; onSelect: (recipeId: number) => void; isLoading: boolean }) {
  const { data: recipes, isLoading: loadingRecipes } = trpc.recipe.list.useQuery(undefined, { enabled: !!mealId });
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const filtered = useMemo(() => {
    if (!recipes) return [];
    return recipes.filter(r => {
      const matchSearch = !search || r.name.toLowerCase().includes(search.toLowerCase());
      const matchCat = category === "all" || r.category === category;
      return matchSearch && matchCat;
    });
  }, [recipes, search, category]);

  const categories = [
    { value: "all", label: "Todas" },
    { value: "desayuno", label: "Desayuno" },
    { value: "snack_manana", label: "Snack AM" },
    { value: "comida", label: "Comida" },
    { value: "snack_tarde", label: "Snack PM" },
    { value: "cena", label: "Cena" },
  ];

  if (loadingRecipes) return <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  if (!recipes || recipes.length === 0) return <p className="text-center text-muted-foreground py-8 text-sm">No tienes recetas guardadas.</p>;

  return (
    <div className="flex flex-col gap-3 overflow-hidden">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar receta..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 rounded-xl" />
      </div>
      <div className="flex gap-1.5 flex-wrap">
        {categories.map(c => (
          <button key={c.value} onClick={() => setCategory(c.value)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${category === c.value ? "bg-primary text-primary-foreground" : "bg-secondary/60 text-muted-foreground hover:bg-secondary"}`}>
            {c.label}
          </button>
        ))}
      </div>
      <div className="overflow-y-auto max-h-[45vh] space-y-1.5 pr-1">
        {filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-6 text-sm">Sin resultados</p>
        ) : filtered.map(recipe => (
          <button key={recipe.id} onClick={() => onSelect(recipe.id)} disabled={isLoading}
            className="w-full text-left px-4 py-3 rounded-xl border border-border/50 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all flex items-center justify-between gap-3 disabled:opacity-50">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium truncate">{recipe.name}</span>
                {recipe.isSystem === 1 && <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-emerald-500/30 text-emerald-600 shrink-0">NF</Badge>}
              </div>
              <div className="flex gap-3 mt-0.5 text-[11px] text-muted-foreground">
                <span>{recipe.totalCalories} kcal</span>
                <span>P:{recipe.totalProtein}g</span>
                <span>C:{recipe.totalCarbs}g</span>
                <span>G:{recipe.totalFats}g</span>
              </div>
            </div>
            <Plus className="h-4 w-4 text-emerald-500 shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Shopping List Content ──
function ShoppingListContent({ dietId, dietName }: { dietId: number; dietName: string }) {
  const { data, isLoading } = trpc.diet.shoppingList.useQuery({ id: dietId });

  const handleDownloadShoppingPdf = () => {
    if (!data) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) { toast.error("No se pudo abrir la ventana"); return; }
    printWindow.document.write(generateShoppingListPdfHtml(data.dietName, data.items));
    printWindow.document.close();
    printWindow.onload = () => printWindow.print();
  };

  if (isLoading) return <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!data || data.items.length === 0) return <p className="text-muted-foreground text-center py-4">No hay alimentos.</p>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-muted-foreground">{data.items.length} alimentos en "{data.dietName}"</p>
        <Button variant="outline" size="sm" onClick={handleDownloadShoppingPdf} className="gap-1.5 rounded-xl"><FileDown className="h-3.5 w-3.5" />PDF</Button>
      </div>
      <div className="rounded-2xl overflow-hidden border border-border/50">
        <table className="w-full text-[13px]">
          <thead><tr className="bg-secondary/50">
            <th className="text-left px-4 py-2.5 font-medium">Alimento</th>
            <th className="text-right px-4 py-2.5 font-medium">Cantidad</th>
            <th className="text-right px-4 py-2.5 font-medium">Usos</th>
          </tr></thead>
          <tbody>
            {data.items.map((item, i) => (
              <tr key={i} className={i % 2 === 0 ? "bg-background" : "bg-secondary/20"}>
                <td className="px-4 py-2">{item.name}</td>
                <td className="px-4 py-2 text-right font-medium tabular-nums">{item.totalQuantity}</td>
                <td className="px-4 py-2 text-right text-muted-foreground">{item.appearances}x</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── PDF Functions ──
function generateShoppingListPdfHtml(dietName: string, items: { name: string; totalQuantity: string; appearances: number }[]): string {
  const rows = items.map((item, i) =>
    `<tr style="background:${i % 2 === 0 ? '#fff' : '#f9f9f9'};">
      <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:13px;">
        <span style="display:inline-block;width:16px;height:16px;border:2px solid #ccc;border-radius:3px;margin-right:10px;vertical-align:middle;"></span>
        ${item.name}
      </td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;font-weight:600;font-size:13px;">${item.totalQuantity}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;color:#888;font-size:12px;">${item.appearances}x</td>
    </tr>`
  ).join("");

  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Lista de la Compra - ${dietName}</title>
<style>@media print{body{margin:0;padding:10px}@page{margin:1.5cm}}body{font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',Roboto,sans-serif;color:#1a1a1a;margin:0 auto;padding:20px;max-width:700px}</style>
</head><body>
<div style="text-align:center;margin-bottom:24px;">
  <img src="${LOGO_URL}" alt="NoLimitPerformance" style="height:60px;margin:0 auto 10px;display:block;" />
  <h1 style="font-size:20px;font-weight:800;margin:0 0 4px;text-transform:uppercase;letter-spacing:1px;">Lista de la Compra</h1>
  <p style="font-size:12px;color:#888;margin:0;">${dietName} · ${items.length} alimentos</p>
</div>
<table style="width:100%;border-collapse:collapse;">
  <thead><tr style="background:#f5c518;">
    <th style="text-align:left;padding:10px 12px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Alimento</th>
    <th style="text-align:right;padding:10px 12px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Cantidad</th>
    <th style="text-align:right;padding:10px 12px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Usos</th>
  </tr></thead>
  <tbody>${rows}</tbody>
</table>
<div style="text-align:center;margin-top:20px;"><p style="font-size:9px;color:#ccc;">NoLimitPerformance #MetabolicHacking</p></div>
</body></html>`;
}

function generateGridPdfHtml(diet: any, instructions?: string): string {
  const sortedMenus = [...diet.menus].sort((a: any, b: any) => a.menuNumber - b.menuNumber);
  const maxMeals = Math.max(...sortedMenus.map((m: any) => m.meals.length));
  const mealRows: { mealNumber: number; mealName: string }[] = [];

  for (let i = 0; i < maxMeals; i++) {
    let name = `Comida ${i + 1}`;
    for (const menu of sortedMenus) {
      const sorted = [...menu.meals].sort((a: any, b: any) => a.mealNumber - b.mealNumber);
      if (sorted[i]) { name = sorted[i].mealName; break; }
    }
    mealRows.push({ mealNumber: i + 1, mealName: name });
  }

  const colWidth = Math.floor(100 / (sortedMenus.length + 0.001));

  const headerCells = sortedMenus.map((menu: any) =>
    `<th style="background:#f5c518;color:#1a1a1a;padding:10px 8px;font-size:13px;font-weight:700;text-align:center;border:1px solid #e0b800;width:${colWidth}%;">Menú ${menu.menuNumber}</th>`
  ).join("");

  const bodyRows = mealRows.map((mealRow, idx) => {
    const cells = sortedMenus.map((menu: any) => {
      const sorted = [...menu.meals].sort((a: any, b: any) => a.mealNumber - b.mealNumber);
      const meal = sorted[idx];
      if (!meal) return `<td style="padding:12px 10px;border:1px solid #e8e8e8;vertical-align:top;background:#fff;"></td>`;

      const foodLines = meal.foods.map((f: any) => `${f.name} (${f.quantity})`).join(", ");
      const altFoods = meal.foods.filter((f: any) => f.alternativeName).map((f: any) => `${f.alternativeName} (${f.alternativeQuantity || f.quantity})`).join(", ");

      let cellContent = `<div style="margin-bottom:2px;"><strong style="font-size:12px;color:#1a1a1a;">${meal.mealName}</strong></div>`;
      if (meal.description) cellContent += `<div style="font-size:10px;color:#555;font-style:italic;margin-bottom:4px;">${meal.description}</div>`;
      cellContent += `<div style="font-size:11px;color:#333;line-height:1.5;">${foodLines}.</div>`;
      if (altFoods) cellContent += `<div style="font-size:10px;color:#888;font-style:italic;margin-top:4px;border-top:1px dashed #ddd;padding-top:3px;">Alt: ${altFoods}.</div>`;
      if (meal.notes) cellContent += `<div style="font-size:9px;color:#666;margin-top:4px;border-top:1px solid #eee;padding-top:3px;font-style:italic;">📝 ${meal.notes}</div>`;

      return `<td style="padding:10px;border:1px solid #e8e8e8;vertical-align:top;background:${idx % 2 === 0 ? '#fff' : '#fafafa'};">${cellContent}</td>`;
    }).join("");
    return `<tr>${cells}</tr>`;
  }).join("");

  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>${diet.name}</title>
<style>@media print{body{margin:0;padding:10px}@page{margin:1cm;size:landscape}table{page-break-inside:avoid}}body{font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',Roboto,sans-serif;color:#1a1a1a;margin:0 auto;padding:20px;line-height:1.4;max-width:1200px}</style>
</head><body>
<div style="text-align:center;margin-bottom:20px;">
  <img src="${LOGO_URL}" alt="NoLimitPerformance" style="height:80px;margin:0 auto 10px;display:block;" />
  <h1 style="font-size:22px;font-weight:900;margin:0;color:#111;text-transform:uppercase;letter-spacing:1px;">${diet.name}</h1>
</div>
<table style="width:100%;border-collapse:collapse;table-layout:fixed;">
  <thead><tr>${headerCells}</tr></thead>
  <tbody>${bodyRows}</tbody>
</table>
${instructions ? `<div style="margin-top:24px;padding:16px;border:1px solid #e8e8e8;border-radius:12px;background:#fafafa;">
  <h3 style="font-size:14px;font-weight:700;margin:0 0 8px;color:#1a1a1a;text-transform:uppercase;letter-spacing:0.5px;">Instrucciones</h3>
  <p style="font-size:12px;color:#333;line-height:1.6;margin:0;white-space:pre-wrap;">${instructions}</p>
</div>` : ''}
<div style="text-align:center;margin-top:16px;"><p style="font-size:9px;color:#ccc;">NoLimitPerformance #MetabolicHacking</p></div>
</body></html>`;
}
