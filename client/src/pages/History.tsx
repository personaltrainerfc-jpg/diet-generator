import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
import {
  Flame, UtensilsCrossed, Calendar, Trash2, Eye,
  History as HistoryIcon, Loader2, ChefHat
} from "lucide-react";

export default function History() {
  const [, setLocation] = useLocation();
  const { data: diets, isLoading } = trpc.diet.list.useQuery();
  const utils = trpc.useUtils();

  const deleteMutation = trpc.diet.delete.useMutation({
    onSuccess: () => {
      toast.success("Dieta eliminada correctamente");
      utils.diet.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Error al eliminar la dieta");
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
          <HistoryIcon className="h-7 w-7 text-primary" />
          Historial de Dietas
        </h1>
        <p className="text-muted-foreground mt-1">
          Consulta y gestiona todas las dietas que has generado.
        </p>
      </div>

      {!diets || diets.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <ChefHat className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              Sin dietas generadas
            </h3>
            <p className="text-muted-foreground text-sm max-w-sm mb-6">
              Aún no has creado ninguna dieta. Crea tu primera dieta personalizada con IA.
            </p>
            <Button onClick={() => setLocation("/")}>
              Crear primera dieta
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {diets.map(diet => (
            <Card key={diet.id} className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{diet.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(diet.createdAt).toLocaleDateString("es-ES", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLocation(`/diet/${diet.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-1.5" />
                      Ver
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Eliminar dieta</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción eliminará permanentemente la dieta "{diet.name}" y todos sus menús asociados. Esta acción no se puede deshacer.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteMutation.mutate({ id: diet.id })}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="pt-4">
                <div className="flex flex-wrap gap-3">
                  <Badge variant="secondary" className="gap-1.5 py-1">
                    <Flame className="h-3.5 w-3.5 text-orange-500" />
                    {diet.totalCalories} kcal
                  </Badge>
                  <Badge variant="secondary" className="gap-1.5 py-1">
                    <UtensilsCrossed className="h-3.5 w-3.5 text-primary" />
                    {diet.mealsPerDay} comidas/día
                  </Badge>
                  <Badge variant="secondary" className="gap-1.5 py-1">
                    {diet.totalMenus} menú{diet.totalMenus > 1 ? "s" : ""}
                  </Badge>
                  <Badge variant="outline" className="gap-1 py-1 text-red-600 border-red-200">
                    P: {diet.proteinPercent}%
                  </Badge>
                  <Badge variant="outline" className="gap-1 py-1 text-amber-600 border-amber-200">
                    C: {diet.carbsPercent}%
                  </Badge>
                  <Badge variant="outline" className="gap-1 py-1 text-blue-600 border-blue-200">
                    G: {diet.fatsPercent}%
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
