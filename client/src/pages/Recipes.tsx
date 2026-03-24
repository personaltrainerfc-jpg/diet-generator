import { useState, useMemo, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { BookOpen, Plus, Trash2, Loader2, ChefHat, Flame, Sparkles, Search, UtensilsCrossed, Coffee, Cookie, Salad, Moon, ChevronDown, ChevronsUpDown } from "lucide-react";

type IngredientForm = { name: string; quantity: string; calories: number; protein: number; carbs: number; fats: number };
const emptyIngredient: IngredientForm = { name: "", quantity: "", calories: 0, protein: 0, carbs: 0, fats: 0 };

const categoryLabels: Record<string, { label: string; icon: typeof Coffee }> = {
  all: { label: "Todas", icon: UtensilsCrossed },
  desayuno: { label: "Desayuno", icon: Coffee },
  snack_manana: { label: "Snack AM", icon: Cookie },
  comida: { label: "Comida", icon: Salad },
  snack_tarde: { label: "Snack PM", icon: Cookie },
  cena: { label: "Cena", icon: Moon },
  mis_recetas: { label: "Mis Recetas", icon: ChefHat },
};

export default function Recipes() {
  const [showCreate, setShowCreate] = useState(false);
  const [recipeName, setRecipeName] = useState("");
  const [ingredients, setIngredients] = useState<IngredientForm[]>([{ ...emptyIngredient }]);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const recipesQuery = trpc.recipe.list.useQuery(undefined, { staleTime: 5 * 60 * 1000 });
  const utils = trpc.useUtils();

  const createMut = trpc.recipe.create.useMutation({
    onSuccess: () => { toast.success("Receta creada"); utils.recipe.list.invalidate(); setShowCreate(false); setRecipeName(""); setIngredients([{ ...emptyIngredient }]); },
    onError: (err) => toast.error(err.message),
  });

  const deleteMut = trpc.recipe.delete.useMutation({
    onSuccess: () => { toast.success("Receta eliminada"); utils.recipe.list.invalidate(); setDeleteConfirm(null); },
    onError: (err) => toast.error(err.message),
  });

  const updateIngredient = (index: number, field: keyof IngredientForm, value: string | number) => {
    setIngredients(prev => { const updated = [...prev]; updated[index] = { ...updated[index], [field]: value }; return updated; });
  };

  const totalMacros = ingredients.reduce((acc, ing) => ({
    calories: acc.calories + (ing.calories || 0), protein: acc.protein + (ing.protein || 0),
    carbs: acc.carbs + (ing.carbs || 0), fats: acc.fats + (ing.fats || 0),
  }), { calories: 0, protein: 0, carbs: 0, fats: 0 });

  const handleCreate = () => {
    if (!recipeName.trim()) { toast.error("Escribe un nombre"); return; }
    const valid = ingredients.filter(i => i.name.trim() && i.quantity.trim());
    if (valid.length === 0) { toast.error("Añade al menos un ingrediente"); return; }
    createMut.mutate({ name: recipeName.trim(), ingredients: valid.map(i => ({ name: i.name.trim(), quantity: i.quantity.trim(), calories: Math.round(i.calories), protein: Math.round(i.protein), carbs: Math.round(i.carbs), fats: Math.round(i.fats) })) });
  };

  // Filter recipes by category and search
  const filteredRecipes = useMemo(() => {
    if (!recipesQuery.data) return [];
    let filtered = recipesQuery.data;

    if (activeCategory === "mis_recetas") {
      filtered = filtered.filter(r => !r.isSystem);
    } else if (activeCategory !== "all") {
      filtered = filtered.filter(r => r.category === activeCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      filtered = filtered.filter(r =>
        r.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(q)
      );
    }

    return filtered;
  }, [recipesQuery.data, activeCategory, searchQuery]);

  const systemCount = recipesQuery.data?.filter(r => r.isSystem).length ?? 0;
  const userCount = recipesQuery.data?.filter(r => !r.isSystem).length ?? 0;

  const toggleExpanded = useCallback((id: number) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    setExpandedIds(new Set(filteredRecipes.map(r => r.id)));
  }, [filteredRecipes]);

  const collapseAll = useCallback(() => {
    setExpandedIds(new Set());
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight uppercase">Biblioteca de Recetas</h1>
          <p className="text-[14px] text-muted-foreground mt-1">
            {systemCount > 0 && <span className="inline-flex items-center gap-1"><Sparkles className="h-3.5 w-3.5 text-emerald-500" />{systemCount} recetas NutriFlow</span>}
            {systemCount > 0 && userCount > 0 && <span className="mx-1.5 text-border">·</span>}
            {userCount > 0 && <span>{userCount} recetas propias</span>}
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2 rounded-xl h-10 shrink-0">
          <Plus className="h-4 w-4" /> Nueva Receta
        </Button>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Buscar recetas por nombre..."
          className="pl-10 rounded-xl h-10"
        />
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(categoryLabels).map(([key, { label, icon: Icon }]) => (
          <button
            key={key}
            onClick={() => setActiveCategory(key)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all border ${
              activeCategory === key
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-card text-muted-foreground border-border/50 hover:bg-secondary hover:text-foreground"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Expand/Collapse all buttons */}
      {filteredRecipes.length > 0 && (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={expandAll} className="gap-1.5 rounded-xl h-8 text-[12px]">
            <ChevronsUpDown className="h-3.5 w-3.5" />Expandir todas
          </Button>
          <Button variant="outline" size="sm" onClick={collapseAll} className="gap-1.5 rounded-xl h-8 text-[12px]">
            <ChevronsUpDown className="h-3.5 w-3.5" />Colapsar todas
          </Button>
          <span className="text-[12px] text-muted-foreground ml-auto">{filteredRecipes.length} recetas</span>
        </div>
      )}

      {/* Recipe grid */}
      {recipesQuery.isLoading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : filteredRecipes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecipes.map(recipe => {
            const isSystem = !!recipe.isSystem;
            const isExpanded = expandedIds.has(recipe.id);
            return (
              <Collapsible
                key={recipe.id}
                open={isExpanded}
                onOpenChange={() => toggleExpanded(recipe.id)}
              >
                <div
                  className={`rounded-2xl border shadow-sm hover:shadow-md transition-all group ${
                    isSystem
                      ? "bg-gradient-to-br from-card to-emerald-500/5 border-emerald-500/20 dark:border-emerald-500/15"
                      : "bg-card border-border/50"
                  } text-card-foreground`}
                >
                  {/* Collapsed header - always visible */}
                  <CollapsibleTrigger asChild>
                    <button className="w-full text-left p-5 cursor-pointer">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${
                            isSystem ? "bg-emerald-500/10" : "bg-primary/10"
                          }`}>
                            {isSystem
                              ? <Sparkles className="h-4.5 w-4.5 text-emerald-500" />
                              : <ChefHat className="h-4.5 w-4.5 text-primary" />
                            }
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-[14px] leading-tight line-clamp-2">{recipe.name}</h3>
                            {isSystem && (
                              <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                                <Sparkles className="h-2.5 w-2.5" />NutriFlow
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronDown className={`h-4 w-4 text-muted-foreground shrink-0 mt-1 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                      </div>
                      {recipe.category && isSystem && (
                        <div className="mb-2.5">
                          <Badge variant="outline" className="rounded-full text-[10px] font-medium capitalize border-border/50">
                            {categoryLabels[recipe.category]?.label ?? recipe.category}
                          </Badge>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-1.5">
                        <Badge variant="secondary" className="rounded-full gap-1 text-[11px] font-medium"><Flame className="h-3 w-3 text-orange-500" />{recipe.totalCalories} kcal</Badge>
                        <Badge variant="secondary" className="rounded-full gap-1 text-[11px] font-medium text-red-600 dark:text-red-400">P {recipe.totalProtein}g</Badge>
                        <Badge variant="secondary" className="rounded-full gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">C {recipe.totalCarbs}g</Badge>
                        <Badge variant="secondary" className="rounded-full gap-1 text-[11px] font-medium text-blue-600 dark:text-blue-400">G {recipe.totalFats}g</Badge>
                      </div>
                    </button>
                  </CollapsibleTrigger>

                  {/* Expanded content - ingredients */}
                  <CollapsibleContent>
                    <div className="px-5 pb-5">
                      <Separator className="mb-3" />
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Ingredientes</p>
                      {recipe.ingredients && recipe.ingredients.length > 0 ? (
                        <div className="space-y-1.5">
                          {recipe.ingredients.map((ing: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between text-[12px] py-1 px-2 rounded-lg bg-secondary/40">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="font-medium truncate">{ing.name}</span>
                                <span className="text-muted-foreground shrink-0">{ing.quantity}</span>
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-muted-foreground shrink-0">
                                <span>{ing.calories}kcal</span>
                                <span className="text-red-500">P{ing.protein}g</span>
                                <span className="text-amber-500">C{ing.carbs}g</span>
                                <span className="text-blue-500">G{ing.fats}g</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[12px] text-muted-foreground italic">Sin ingredientes detallados</p>
                      )}
                      {/* Delete button for user recipes */}
                      {!isSystem && (
                        <div className="mt-3 pt-3 border-t border-border/30">
                          <button
                            onClick={(e) => { e.stopPropagation(); setDeleteConfirm(recipe.id); }}
                            className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />Eliminar receta
                          </button>
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })}
        </div>
      ) : (
        <div className="bg-card text-card-foreground rounded-2xl border border-border/50 shadow-sm flex flex-col items-center justify-center py-16 text-center">
          <div className="h-16 w-16 rounded-2xl bg-secondary flex items-center justify-center mb-4"><BookOpen className="h-8 w-8 text-muted-foreground/40" /></div>
          {searchQuery.trim() ? (
            <>
              <h3 className="text-[17px] font-semibold mb-1">Sin resultados</h3>
              <p className="text-[13px] text-muted-foreground mb-5 max-w-xs">No se encontraron recetas que coincidan con "{searchQuery}".</p>
              <Button variant="outline" onClick={() => setSearchQuery("")} className="gap-2 rounded-xl">Limpiar búsqueda</Button>
            </>
          ) : activeCategory === "mis_recetas" ? (
            <>
              <h3 className="text-[17px] font-semibold mb-1">No tienes recetas propias</h3>
              <p className="text-[13px] text-muted-foreground mb-5 max-w-xs">Crea tu primera receta para poder incluirla en las dietas que generes.</p>
              <Button onClick={() => setShowCreate(true)} className="gap-2 rounded-xl"><Plus className="h-4 w-4" />Crear mi primera receta</Button>
            </>
          ) : (
            <>
              <h3 className="text-[17px] font-semibold mb-1">No hay recetas en esta categoría</h3>
              <p className="text-[13px] text-muted-foreground mb-5 max-w-xs">Prueba con otra categoría o crea una receta nueva.</p>
            </>
          )}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[17px]"><ChefHat className="h-5 w-5 text-primary" />Nueva Receta</DialogTitle>
            <DialogDescription className="text-[13px]">Añade los ingredientes con sus macros para que la IA pueda incorporar esta receta.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="font-medium text-[13px]">Nombre de la receta</Label>
              <Input value={recipeName} onChange={e => setRecipeName(e.target.value)} placeholder="Ej: Pollo al curry con arroz basmati" className="rounded-xl" />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="font-medium text-[13px]">Ingredientes</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => setIngredients([...ingredients, { ...emptyIngredient }])} className="gap-1 rounded-xl h-8 text-[12px]"><Plus className="h-3 w-3" />Añadir</Button>
              </div>
              {ingredients.map((ing, idx) => (
                <div key={idx} className="p-3 rounded-xl border border-border/50 bg-secondary/30 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <Input value={ing.name} onChange={e => updateIngredient(idx, "name", e.target.value)} placeholder="Ingrediente" className="h-8 text-[13px] rounded-lg" />
                      <Input value={ing.quantity} onChange={e => updateIngredient(idx, "quantity", e.target.value)} placeholder="Cantidad (ej: 150g)" className="h-8 text-[13px] rounded-lg" />
                    </div>
                    {ingredients.length > 1 && (
                      <button onClick={() => setIngredients(ingredients.filter((_, i) => i !== idx))} className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all shrink-0">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {(["calories", "protein", "carbs", "fats"] as const).map(field => (
                      <div key={field} className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground uppercase">{field === "calories" ? "Kcal" : field === "protein" ? "Prot" : field === "carbs" ? "Carbs" : "Grasas"}</Label>
                        <Input type="number" value={ing[field] || ""} onChange={e => updateIngredient(idx, field, Number(e.target.value))} min={0} className="h-7 text-[12px] text-center rounded-lg" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
              <p className="text-[12px] font-medium text-muted-foreground mb-1">Totales:</p>
              <div className="flex flex-wrap gap-3 text-[13px] font-semibold">
                <span className="text-orange-500">{totalMacros.calories} kcal</span>
                <span className="text-red-500">P {totalMacros.protein}g</span>
                <span className="text-amber-500">C {totalMacros.carbs}g</span>
                <span className="text-blue-500">G {totalMacros.fats}g</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)} className="rounded-xl">Cancelar</Button>
            <Button onClick={handleCreate} disabled={createMut.isPending} className="gap-2 rounded-xl">
              {createMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}Crear Receta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteConfirm !== null} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Eliminar receta</DialogTitle>
            <DialogDescription className="text-[13px]">Esta acción no se puede deshacer.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="rounded-xl">Cancelar</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && deleteMut.mutate({ id: deleteConfirm })} disabled={deleteMut.isPending} className="rounded-xl">
              {deleteMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
