import { trpc } from "@/lib/trpc";
import { Users, MessageCircle, Activity, TrendingUp, Loader2, ChevronRight, Utensils, Clock } from "lucide-react";
import { useLocation } from "wouter";

export default function TrainerDashboard() {
  const [, setLocation] = useLocation();
  const dashQ = trpc.clientMgmt.dashboard.useQuery();

  if (dashQ.isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  const stats = dashQ.data;

  const statCards = [
    { label: "Clientes Totales", value: stats?.totalClients || 0, icon: Users, color: "text-primary", bg: "bg-primary/10", onClick: () => setLocation("/clients") },
    { label: "Clientes Activos", value: stats?.activeClients || 0, icon: Activity, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Mensajes Sin Leer", value: stats?.unreadMessages || 0, icon: MessageCircle, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Adherencia Hoy", value: stats?.todayAdherence != null ? `${stats.todayAdherence}%` : "—", icon: TrendingUp, color: "text-amber-500", bg: "bg-amber-500/10" },
  ];

  const quickActions = [
    { label: "Ver Clientes", desc: "Gestionar clientes activos", icon: Users, color: "text-primary", bg: "bg-primary/10", path: "/clients" },
    { label: "Nueva Dieta", desc: "Crear plan nutricional", icon: Utensils, color: "text-emerald-500", bg: "bg-emerald-500/10", path: "/" },
    { label: "Historial", desc: "Dietas generadas", icon: Clock, color: "text-blue-500", bg: "bg-blue-500/10", path: "/history" },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight uppercase">Dashboard</h1>
        <p className="text-[14px] text-muted-foreground mt-1">Resumen de tu actividad como entrenador.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map(({ label, value, icon: Icon, color, bg, onClick }) => (
          <div key={label} onClick={onClick} className={`bg-card rounded-2xl border border-border/50 shadow-sm p-4 ${onClick ? "cursor-pointer hover:shadow-md" : ""} transition-all`}>
            <div className={`h-10 w-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <p className="text-[26px] font-bold tracking-tight">{value}</p>
            <p className="text-[12px] text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-[15px] font-semibold mb-3">Acciones Rápidas</h2>
        <div className="space-y-2">
          {quickActions.map(({ label, desc, icon: Icon, color, bg, path }) => (
            <div key={label} onClick={() => setLocation(path)} className="bg-card rounded-2xl border border-border/50 shadow-sm flex items-center gap-4 p-4 cursor-pointer hover:shadow-md transition-all group">
              <div className={`h-11 w-11 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[14px]">{label}</p>
                <p className="text-[12px] text-muted-foreground">{desc}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
