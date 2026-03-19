import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, MessageCircle, Activity, TrendingUp, Loader2 } from "lucide-react";
import { useLocation } from "wouter";

export default function TrainerDashboard() {
  const [, setLocation] = useLocation();
  const dashQ = trpc.clientMgmt.dashboard.useQuery();

  if (dashQ.isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const stats = dashQ.data;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Resumen de tu actividad como entrenador</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setLocation("/clients")}>
          <CardContent className="py-5 text-center">
            <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="text-3xl font-bold text-foreground">{stats?.totalClients || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Clientes Totales</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-5 text-center">
            <Activity className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
            <p className="text-3xl font-bold text-foreground">{stats?.activeClients || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Clientes Activos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-5 text-center">
            <MessageCircle className="h-8 w-8 mx-auto mb-2 text-blue-500" />
            <p className="text-3xl font-bold text-foreground">{stats?.unreadMessages || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Mensajes Sin Leer</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-5 text-center">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 text-amber-500" />
            <p className="text-3xl font-bold text-foreground">
              {stats?.todayAdherence != null ? `${stats.todayAdherence}%` : "—"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Adherencia Hoy</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setLocation("/clients")}>
            <CardContent className="py-4 text-center text-sm">
              <Users className="h-5 w-5 mx-auto mb-1.5 text-primary" />
              Ver Clientes
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setLocation("/")}>
            <CardContent className="py-4 text-center text-sm">
              <TrendingUp className="h-5 w-5 mx-auto mb-1.5 text-emerald-500" />
              Nueva Dieta
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setLocation("/history")}>
            <CardContent className="py-4 text-center text-sm">
              <Activity className="h-5 w-5 mx-auto mb-1.5 text-blue-500" />
              Historial
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
