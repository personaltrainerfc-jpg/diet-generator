import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, Apple, Loader2 } from "lucide-react";

export default function CustomFoods() {
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fats, setFats] = useState("");

  const utils = trpc.useUtils();
  const { data: foods, isLoading } = trpc.customFood.list.useQuery();

  const createMut = trpc.customFood.create.useMutation({
    onSuccess: () => {
      utils.customFood.list.invalidate();
      toast.success("Alimento personalizado creado");
      resetForm();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMut = trpc.customFood.delete.useMutation({
    onSuccess: () => {
      utils.customFood.list.invalidate();
      toast.success("Alimento eliminado");
    },
    onError: (err) => toast.error(err.message),
  });

  const resetForm = () => {
    setShowAdd(false);
    setName("");
    setCalories("");
    setProtein("");
    setCarbs("");
    setFats("");
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    createMut.mutate({
      name: name.trim(),
      caloriesPer100g: parseInt(calories) || 0,
      proteinPer100g: parseInt(protein) || 0,
      carbsPer100g: parseInt(carbs) || 0,
      fatsPer100g: parseInt(fats) || 0,
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Alimentos Personalizados
          </h1>
          <p className="text-muted-foreground mt-1">
            Crea alimentos con macros personalizados para usar en tus dietas.
          </p>
        </div>
        <Button onClick={() => { resetForm(); setShowAdd(true); }} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Nuevo
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : foods && foods.length > 0 ? (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted">
                <th className="text-left px-4 py-3 font-medium">Alimento</th>
                <th className="text-right px-3 py-3 font-medium text-orange-600">Kcal</th>
                <th className="text-right px-3 py-3 font-medium text-red-600">Prot</th>
                <th className="text-right px-3 py-3 font-medium text-amber-600">Carbs</th>
                <th className="text-right px-3 py-3 font-medium text-blue-600">Grasas</th>
                <th className="text-right px-3 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {foods.map((f: any, i: number) => (
                <tr key={f.id} className={i % 2 === 0 ? "bg-background" : "bg-muted/30"}>
                  <td className="px-4 py-3 font-medium">
                    <div className="flex items-center gap-2">
                      <Apple className="h-3.5 w-3.5 text-green-600" />
                      {f.name}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">{f.caloriesPer100g}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{f.proteinPer100g}g</td>
                  <td className="px-3 py-3 text-right tabular-nums">{f.carbsPer100g}g</td>
                  <td className="px-3 py-3 text-right tabular-nums">{f.fatsPer100g}g</td>
                  <td className="px-3 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => deleteMut.mutate({ id: f.id })}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-2 bg-muted/50 text-xs text-muted-foreground">
            Valores por cada 100g
          </div>
        </div>
      ) : (
        <Card className="shadow-sm">
          <CardContent className="py-12 text-center">
            <Apple className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground">No tienes alimentos personalizados.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Crea alimentos con macros específicos para incluirlos en tus dietas.
            </p>
          </CardContent>
        </Card>
      )}

      <Dialog open={showAdd} onOpenChange={(v) => { if (!v) resetForm(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Apple className="h-5 w-5 text-primary" />
              Nuevo Alimento Personalizado
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="font-medium">Nombre *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Tortitas de arroz marca X"
                autoFocus
              />
            </div>
            <p className="text-xs text-muted-foreground">Valores nutricionales por cada 100g:</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Calorías (kcal)</Label>
                <Input
                  type="number"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  placeholder="0"
                  min={0}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Proteínas (g)</Label>
                <Input
                  type="number"
                  value={protein}
                  onChange={(e) => setProtein(e.target.value)}
                  placeholder="0"
                  min={0}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Carbohidratos (g)</Label>
                <Input
                  type="number"
                  value={carbs}
                  onChange={(e) => setCarbs(e.target.value)}
                  placeholder="0"
                  min={0}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Grasas (g)</Label>
                <Input
                  type="number"
                  value={fats}
                  onChange={(e) => setFats(e.target.value)}
                  placeholder="0"
                  min={0}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={resetForm}>Cancelar</Button>
              <Button
                onClick={handleSubmit}
                disabled={!name.trim() || createMut.isPending}
              >
                {createMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Crear
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
