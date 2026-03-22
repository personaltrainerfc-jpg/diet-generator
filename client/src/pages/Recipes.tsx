import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { BookOpen, Plus, Trash2, Loader2, ChefHat, Flame, Beef, Wheat, Droplets } from "lucide-react";

type IngredientForm = { name: string; quantity: string; calories: number; protein: number; carbs: number; fats: number };
const emptyIngredient: IngredientForm = { name: "", quantity: "", calories: 0, protein: 0, carbs: 0, fats: 0 };

export default function Recipes() {
  const [showCreate, setShowCreate] = useState(false);
  const [recipeName, setRecipeName] = useState("");
  const [ingredients, setIngredients] = useState<IngredientForm[]>([{ ...emptyIngredient }]);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const recipesQuery = trpc.recipe.list.useQuery();
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight uppercase">Mis Recetas</h1>
          <p className="text-[14px] text-muted-foreground mt-1">Crea y gestiona tus recetas para incluirlas en las dietas.</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2 rounded-xl h-10">
          <Plus className="h-4 w-4" /> Nueva Receta
        </Button>
      </div>

      {recipesQuery.isLoading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : recipesQuery.data && recipesQuery.data.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recipesQuery.data.map(recipe => (
            <div key={recipe.id} className="bg-card text-card-foreground rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-all p-5 group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center"><ChefHat className="h-4.5 w-4.5 text-primary" /></div>
                  <h3 className="font-semibold text-[15px]">{recipe.name}</h3>
                </div>
                <button onClick={() => setDeleteConfirm(recipe.id)} className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="rounded-full gap-1 text-[12px] font-medium"><Flame className="h-3 w-3 text-orange-500" />{recipe.totalCalories} kcal</Badge>
                <Badge variant="secondary" className="rounded-full gap-1 text-[12px] font-medium text-red-600 dark:text-red-400">P {recipe.totalProtein}g</Badge>
                <Badge variant="secondary" className="rounded-full gap-1 text-[12px] font-medium text-amber-600 dark:text-amber-400">C {recipe.totalCarbs}g</Badge>
                <Badge variant="secondary" className="rounded-full gap-1 text-[12px] font-medium text-blue-600 dark:text-blue-400">G {recipe.totalFats}g</Badge>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-card text-card-foreground rounded-2xl border border-border/50 shadow-sm flex flex-col items-center justify-center py-16 text-center">
          <div className="h-16 w-16 rounded-2xl bg-secondary flex items-center justify-center mb-4"><BookOpen className="h-8 w-8 text-muted-foreground/40" /></div>
          <h3 className="text-[17px] font-semibold mb-1">No tienes recetas</h3>
          <p className="text-[13px] text-muted-foreground mb-5 max-w-xs">Crea tu primera receta para poder incluirla en las dietas que generes.</p>
          <Button onClick={() => setShowCreate(true)} className="gap-2 rounded-xl"><Plus className="h-4 w-4" />Crear mi primera receta</Button>
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
            <Separator className="opacity-50" />
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
