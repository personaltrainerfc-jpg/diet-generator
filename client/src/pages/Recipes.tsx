import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  BookOpen, Plus, Trash2, Loader2, ChefHat, Flame, Beef, Wheat, Droplets
} from "lucide-react";

type IngredientForm = {
  name: string;
  quantity: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
};

const emptyIngredient: IngredientForm = {
  name: "", quantity: "", calories: 0, protein: 0, carbs: 0, fats: 0,
};

export default function Recipes() {
  const [showCreate, setShowCreate] = useState(false);
  const [recipeName, setRecipeName] = useState("");
  const [ingredients, setIngredients] = useState<IngredientForm[]>([{ ...emptyIngredient }]);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const recipesQuery = trpc.recipe.list.useQuery();
  const utils = trpc.useUtils();

  const createMut = trpc.recipe.create.useMutation({
    onSuccess: () => {
      toast.success("Receta creada correctamente");
      utils.recipe.list.invalidate();
      setShowCreate(false);
      setRecipeName("");
      setIngredients([{ ...emptyIngredient }]);
    },
    onError: (err) => toast.error(err.message || "Error al crear la receta"),
  });

  const deleteMut = trpc.recipe.delete.useMutation({
    onSuccess: () => {
      toast.success("Receta eliminada");
      utils.recipe.list.invalidate();
      setDeleteConfirm(null);
    },
    onError: (err) => toast.error(err.message || "Error al eliminar"),
  });

  const addIngredient = () => {
    setIngredients([...ingredients, { ...emptyIngredient }]);
  };

  const removeIngredient = (index: number) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((_, i) => i !== index));
    }
  };

  const updateIngredient = (index: number, field: keyof IngredientForm, value: string | number) => {
    setIngredients(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const totalMacros = ingredients.reduce(
    (acc, ing) => ({
      calories: acc.calories + (ing.calories || 0),
      protein: acc.protein + (ing.protein || 0),
      carbs: acc.carbs + (ing.carbs || 0),
      fats: acc.fats + (ing.fats || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  );

  const handleCreate = () => {
    if (!recipeName.trim()) {
      toast.error("Escribe un nombre para la receta");
      return;
    }
    const validIngredients = ingredients.filter(i => i.name.trim() && i.quantity.trim());
    if (validIngredients.length === 0) {
      toast.error("Añade al menos un ingrediente con nombre y cantidad");
      return;
    }
    createMut.mutate({
      name: recipeName.trim(),
      ingredients: validIngredients.map(i => ({
        name: i.name.trim(),
        quantity: i.quantity.trim(),
        calories: Math.round(i.calories),
        protein: Math.round(i.protein),
        carbs: Math.round(i.carbs),
        fats: Math.round(i.fats),
      })),
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Mis Recetas
          </h1>
          <p className="text-muted-foreground mt-1">
            Crea y gestiona tus recetas propias para incluirlas en las dietas generadas.
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nueva Receta
        </Button>
      </div>

      {/* Lista de recetas */}
      {recipesQuery.isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : recipesQuery.data && recipesQuery.data.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recipesQuery.data.map(recipe => (
            <Card key={recipe.id} className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <ChefHat className="h-4 w-4 text-primary" />
                    {recipe.name}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => setDeleteConfirm(recipe.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3 text-sm">
                  <span className="flex items-center gap-1 text-orange-600">
                    <Flame className="h-3.5 w-3.5" />
                    {recipe.totalCalories} kcal
                  </span>
                  <span className="flex items-center gap-1 text-red-500">
                    <Beef className="h-3.5 w-3.5" />
                    P {recipe.totalProtein}g
                  </span>
                  <span className="flex items-center gap-1 text-amber-500">
                    <Wheat className="h-3.5 w-3.5" />
                    C {recipe.totalCarbs}g
                  </span>
                  <span className="flex items-center gap-1 text-blue-500">
                    <Droplets className="h-3.5 w-3.5" />
                    G {recipe.totalFats}g
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-1">No tienes recetas</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Crea tu primera receta para poder incluirla en las dietas que generes.
            </p>
            <Button onClick={() => setShowCreate(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Crear mi primera receta
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Diálogo crear receta */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ChefHat className="h-5 w-5 text-primary" />
              Nueva Receta
            </DialogTitle>
            <DialogDescription>
              Añade los ingredientes con sus macros. Estos valores se usarán cuando la IA incorpore esta receta en un menú.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="font-medium">Nombre de la receta</Label>
              <Input
                value={recipeName}
                onChange={e => setRecipeName(e.target.value)}
                placeholder="Ej: Pollo al curry con arroz basmati"
                className="text-base"
              />
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="font-medium">Ingredientes</Label>
                <Button type="button" variant="outline" size="sm" onClick={addIngredient} className="gap-1">
                  <Plus className="h-3.5 w-3.5" />
                  Añadir
                </Button>
              </div>

              {ingredients.map((ing, idx) => (
                <div key={idx} className="p-3 rounded-lg border border-border bg-muted/30 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <Input
                        value={ing.name}
                        onChange={e => updateIngredient(idx, "name", e.target.value)}
                        placeholder="Nombre del ingrediente"
                        className="h-8 text-sm"
                      />
                      <Input
                        value={ing.quantity}
                        onChange={e => updateIngredient(idx, "quantity", e.target.value)}
                        placeholder="Cantidad (ej: 150g)"
                        className="h-8 text-sm"
                      />
                    </div>
                    {ingredients.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                        onClick={() => removeIngredient(idx)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Calorías</Label>
                      <Input
                        type="number"
                        value={ing.calories || ""}
                        onChange={e => updateIngredient(idx, "calories", Number(e.target.value))}
                        min={0}
                        className="h-7 text-xs text-center"
                        placeholder="kcal"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Proteínas</Label>
                      <Input
                        type="number"
                        value={ing.protein || ""}
                        onChange={e => updateIngredient(idx, "protein", Number(e.target.value))}
                        min={0}
                        className="h-7 text-xs text-center"
                        placeholder="g"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Carbos</Label>
                      <Input
                        type="number"
                        value={ing.carbs || ""}
                        onChange={e => updateIngredient(idx, "carbs", Number(e.target.value))}
                        min={0}
                        className="h-7 text-xs text-center"
                        placeholder="g"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Grasas</Label>
                      <Input
                        type="number"
                        value={ing.fats || ""}
                        onChange={e => updateIngredient(idx, "fats", Number(e.target.value))}
                        min={0}
                        className="h-7 text-xs text-center"
                        placeholder="g"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Totales */}
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-sm font-medium text-foreground mb-1">Totales de la receta:</p>
              <div className="flex flex-wrap gap-3 text-sm">
                <span className="text-orange-600">{totalMacros.calories} kcal</span>
                <span className="text-red-500">P {totalMacros.protein}g</span>
                <span className="text-amber-500">C {totalMacros.carbs}g</span>
                <span className="text-blue-500">G {totalMacros.fats}g</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={createMut.isPending} className="gap-2">
              {createMut.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Crear Receta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo confirmar eliminación */}
      <Dialog open={deleteConfirm !== null} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar receta</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. La receta se eliminará permanentemente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && deleteMut.mutate({ id: deleteConfirm })}
              disabled={deleteMut.isPending}
            >
              {deleteMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
