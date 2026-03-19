import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { toast } from "sonner";
import { useLocation } from "wouter";
import { useState } from "react";
import {
  Flame, UtensilsCrossed, Trash2, Eye,
  Loader2, ChefHat, Copy, ChevronRight
} from "lucide-react";

export default function History() {
  const [, setLocation] = useLocation();
  const { data: diets, isLoading } = trpc.diet.list.useQuery();
  const utils = trpc.useUtils();
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [duplicateName, setDuplicateName] = useState("");
  const [duplicatingDietId, setDuplicatingDietId] = useState<number | null>(null);

  const deleteMutation = trpc.diet.delete.useMutation({
    onSuccess: () => {
      toast.success("Dieta eliminada");
      utils.diet.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Error al eliminar");
    },
  });

  const duplicateMutation = trpc.diet.duplicate.useMutation({
    onSuccess: (data) => {
      toast.success("Dieta duplicada");
      utils.diet.list.invalidate();
      setLocation(`/diet/${data.dietId}`);
    },
    onError: (error) => {
      toast.error(error.message || "Error al duplicar");
    },
  });

  const handleDuplicateClick = (dietId: number, dietName: string) => {
    setDuplicatingDietId(dietId);
    setDuplicateName(dietName + " (copia)");
    setShowDuplicateDialog(true);
  };

  const handleDuplicateConfirm = () => {
    if (duplicatingDietId && duplicateName.trim()) {
      duplicateMutation.mutate({ id: duplicatingDietId, name: duplicateName.trim() });
      setShowDuplicateDialog(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-8">
      <div className="pt-2">
        <h1 className="text-[28px] font-bold tracking-tight text-foreground">Historial</h1>
        <p className="text-[15px] text-muted-foreground mt-1">
          {diets && diets.length > 0 ? `${diets.length} dieta${diets.length > 1 ? "s" : ""} generada${diets.length > 1 ? "s" : ""}` : "Consulta y gestiona tus dietas."}
        </p>
      </div>

      {!diets || diets.length === 0 ? (
        <div className="rounded-2xl bg-card border border-border/50 p-10 flex flex-col items-center text-center">
          <div className="h-14 w-14 rounded-2xl bg-accent flex items-center justify-center mb-4">
            <ChefHat className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="text-[17px] font-semibold text-foreground mb-1">Sin dietas</h3>
          <p className="text-[14px] text-muted-foreground max-w-xs mb-5">
            Crea tu primera dieta personalizada con inteligencia artificial.
          </p>
          <Button onClick={() => setLocation("/")} className="rounded-xl h-10 px-5 text-[13px] font-medium">
            Crear primera dieta
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {diets.map(diet => (
            <div
              key={diet.id}
              className="rounded-2xl bg-card border border-border/50 p-4 hover:bg-accent/30 transition-colors duration-200 cursor-pointer group"
              onClick={() => setLocation(`/diet/${diet.id}`)}
            >
              <div className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-[15px] font-semibold text-foreground truncate">{diet.name}</h3>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="flex items-center gap-1 text-[12px] text-muted-foreground">
                      <Flame className="h-3 w-3 text-orange-500" />
                      {diet.totalCalories} kcal
                    </span>
                    <span className="flex items-center gap-1 text-[12px] text-muted-foreground">
                      <UtensilsCrossed className="h-3 w-3" />
                      {diet.mealsPerDay} comidas
                    </span>
                    <span className="text-[12px] text-muted-foreground">
                      {diet.totalMenus} menu{diet.totalMenus > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="text-[11px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 font-medium">P {diet.proteinPercent}%</span>
                    <span className="text-[11px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 font-medium">C {diet.carbsPercent}%</span>
                    <span className="text-[11px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-medium">G {diet.fatsPercent}%</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => handleDuplicateClick(diet.id, diet.name)}
                    disabled={duplicateMutation.isPending}
                    className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-accent transition-colors duration-200 text-muted-foreground hover:text-foreground"
                    title="Duplicar"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button
                        className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors duration-200 text-muted-foreground hover:text-destructive"
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-2xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-[17px]">Eliminar dieta</AlertDialogTitle>
                        <AlertDialogDescription className="text-[14px]">
                          Se eliminara permanentemente "{diet.name}" y todos sus menus. Esta accion no se puede deshacer.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteMutation.mutate({ id: diet.id })}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
                        >
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Duplicate Dialog */}
      <Dialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-[17px] font-semibold">Duplicar Dieta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-foreground">Nombre de la nueva dieta</label>
              <Input
                value={duplicateName}
                onChange={(e) => setDuplicateName(e.target.value)}
                placeholder="Ej: Dieta Juan Perez"
                className="rounded-xl h-10 text-[14px]"
                autoFocus
                onKeyDown={(e) => { if (e.key === "Enter") handleDuplicateConfirm(); }}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDuplicateDialog(false)} className="rounded-xl h-9 text-[13px]">
                Cancelar
              </Button>
              <Button
                onClick={handleDuplicateConfirm}
                disabled={!duplicateName.trim() || duplicateMutation.isPending}
                className="rounded-xl h-9 text-[13px]"
              >
                {duplicateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
                Duplicar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
