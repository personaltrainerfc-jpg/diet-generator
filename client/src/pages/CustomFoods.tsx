import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
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
    onSuccess: () => { utils.customFood.list.invalidate(); toast.success("Alimento creado"); resetForm(); },
    onError: (err) => toast.error(err.message),
  });

  const deleteMut = trpc.customFood.delete.useMutation({
    onSuccess: () => { utils.customFood.list.invalidate(); toast.success("Eliminado"); },
    onError: (err) => toast.error(err.message),
  });

  const resetForm = () => { setShowAdd(false); setName(""); setCalories(""); setProtein(""); setCarbs(""); setFats(""); };

  const handleSubmit = () => {
    if (!name.trim()) { toast.error("El nombre es obligatorio"); return; }
    createMut.mutate({ name: name.trim(), caloriesPer100g: parseInt(calories) || 0, proteinPer100g: parseInt(protein) || 0, carbsPer100g: parseInt(carbs) || 0, fatsPer100g: parseInt(fats) || 0 });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight uppercase">Alimentos Personalizados</h1>
          <p className="text-[14px] text-muted-foreground mt-1">Crea alimentos con macros personalizados para usar en tus dietas.</p>
        </div>
        <Button onClick={() => { resetForm(); setShowAdd(true); }} className="gap-1.5 rounded-xl h-10">
          <Plus className="h-4 w-4" /> Nuevo
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : foods && foods.length > 0 ? (
        <div className="bg-card text-card-foreground rounded-2xl border border-border/50 shadow-sm overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left px-5 py-3.5 font-semibold text-[12px] uppercase tracking-wider text-muted-foreground">Alimento</th>
                <th className="text-right px-3 py-3.5 font-semibold text-[12px] uppercase tracking-wider text-orange-500">Kcal</th>
                <th className="text-right px-3 py-3.5 font-semibold text-[12px] uppercase tracking-wider text-red-500">Prot</th>
                <th className="text-right px-3 py-3.5 font-semibold text-[12px] uppercase tracking-wider text-amber-500">Carbs</th>
                <th className="text-right px-3 py-3.5 font-semibold text-[12px] uppercase tracking-wider text-blue-500">Grasas</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody>
              {foods.map((f: any) => (
                <tr key={f.id} className="border-b border-border/30 last:border-0 hover:bg-secondary/50 transition-colors group">
                  <td className="px-5 py-3.5 font-medium">
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0"><Apple className="h-3.5 w-3.5 text-green-600" /></div>
                      {f.name}
                    </div>
                  </td>
                  <td className="px-3 py-3.5 text-right tabular-nums font-medium">{f.caloriesPer100g}</td>
                  <td className="px-3 py-3.5 text-right tabular-nums">{f.proteinPer100g}g</td>
                  <td className="px-3 py-3.5 text-right tabular-nums">{f.carbsPer100g}g</td>
                  <td className="px-3 py-3.5 text-right tabular-nums">{f.fatsPer100g}g</td>
                  <td className="px-3 py-3.5 text-right">
                    <button onClick={() => deleteMut.mutate({ id: f.id })} className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-5 py-2.5 bg-secondary/30 text-[11px] text-muted-foreground font-medium">Valores por cada 100g</div>
        </div>
      ) : (
        <div className="bg-card text-card-foreground rounded-2xl border border-border/50 shadow-sm flex flex-col items-center justify-center py-16 text-center">
          <div className="h-16 w-16 rounded-2xl bg-secondary flex items-center justify-center mb-4"><Apple className="h-8 w-8 text-muted-foreground/40" /></div>
          <h3 className="text-[17px] font-semibold mb-1">No tienes alimentos</h3>
          <p className="text-[13px] text-muted-foreground mb-5 max-w-xs">Crea alimentos con macros específicos para incluirlos en tus dietas.</p>
          <Button onClick={() => { resetForm(); setShowAdd(true); }} className="gap-2 rounded-xl"><Plus className="h-4 w-4" />Crear alimento</Button>
        </div>
      )}

      <Dialog open={showAdd} onOpenChange={(v) => { if (!v) resetForm(); }}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[17px]"><Apple className="h-5 w-5 text-primary" />Nuevo Alimento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="font-medium text-[13px]">Nombre *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Tortitas de arroz marca X" autoFocus className="rounded-xl" />
            </div>
            <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Valores por 100g</p>
            <div className="grid grid-cols-2 gap-3">
              {([["Calorías (kcal)", calories, setCalories], ["Proteínas (g)", protein, setProtein], ["Carbohidratos (g)", carbs, setCarbs], ["Grasas (g)", fats, setFats]] as const).map(([label, val, setter]) => (
                <div key={label} className="space-y-1">
                  <Label className="text-[12px] text-muted-foreground">{label}</Label>
                  <Input type="number" value={val} onChange={(e) => (setter as any)(e.target.value)} placeholder="0" min={0} className="rounded-xl" />
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={resetForm} className="rounded-xl">Cancelar</Button>
              <Button onClick={handleSubmit} disabled={!name.trim() || createMut.isPending} className="rounded-xl">
                {createMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Crear
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
