import { trpc } from "@/lib/trpc";
import { Users, MessageCircle, Activity, TrendingUp, Loader2, ChevronRight, Utensils, Clock, AlertTriangle, CheckCircle2, ShieldAlert, RefreshCw, Bell } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useState } from "react";

export default function TrainerDashboard() {
  const [, setLocation] = useLocation();
  const dashQ = trpc.clientMgmt.dashboard.useQuery();
  const alertsQ = trpc.clientMgmt.getAlerts.useQuery();
  const runAnalysisMut = trpc.clientMgmt.runAdherenceAnalysis.useMutation({
    onSuccess: (data) => {
      alertsQ.refetch();
      toast.success(data.alertsCreated > 0 ? `${data.alertsCreated} nuevas alertas detectadas` : "No se detectaron nuevos problemas");
    },
    onError: () => toast.error("Error al analizar adherencia"),
  });
  const resolveAlertMut = trpc.clientMgmt.resolveAdherenceAlert.useMutation({
    onSuccess: () => {
      alertsQ.refetch();
      toast.success("Alerta resuelta");
    },
  });

  if (dashQ.isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  const stats = dashQ.data;
  const alerts = alertsQ.data ?? [];
  const unresolvedAlerts = alerts.filter((a: any) => !a.alert.resolvedAt);

  const statCards = [
    { label: "Clientes Totales", value: stats?.totalClients || 0, icon: Users, color: "text-primary", bg: "bg-primary/10", onClick: () => setLocation("/clients") },
    { label: "Clientes Activos", value: stats?.activeClients || 0, icon: Activity, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Mensajes Sin Leer", value: stats?.unreadMessages || 0, icon: MessageCircle, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Alertas Activas", value: unresolvedAlerts.length, icon: AlertTriangle, color: unresolvedAlerts.length > 0 ? "text-red-500" : "text-amber-500", bg: unresolvedAlerts.length > 0 ? "bg-red-500/10" : "bg-amber-500/10" },
  ];

  const quickActions = [
    { label: "Ver Clientes", desc: "Gestionar clientes activos", icon: Users, color: "text-primary", bg: "bg-primary/10", path: "/clients" },
    { label: "Nueva Dieta", desc: "Crear plan nutricional", icon: Utensils, color: "text-emerald-500", bg: "bg-emerald-500/10", path: "/" },
    { label: "Historial", desc: "Dietas generadas", icon: Clock, color: "text-blue-500", bg: "bg-blue-500/10", path: "/history" },
  ];

  const severityConfig: Record<string, { color: string; bg: string; label: string }> = {
    high: { color: "text-red-500", bg: "bg-red-500/10", label: "Alta" },
    medium: { color: "text-amber-500", bg: "bg-amber-500/10", label: "Media" },
    low: { color: "text-blue-500", bg: "bg-blue-500/10", label: "Baja" },
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight uppercase">Panel de Control</h1>
        <p className="text-[14px] text-muted-foreground mt-1">Resumen de tu actividad como entrenador.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map(({ label, value, icon: Icon, color, bg, onClick }) => (
          <div key={label} onClick={onClick} className={`bg-card text-card-foreground rounded-2xl border border-border/50 shadow-sm p-4 ${onClick ? "cursor-pointer hover:shadow-md" : ""} transition-all`}>
            <div className={`h-10 w-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <p className="text-[26px] font-bold tracking-tight">{value}</p>
            <p className="text-[12px] text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Adherence Alerts Panel */}
      <div className="bg-card text-card-foreground rounded-2xl border border-border/50 shadow-sm">
        <div className="flex items-center justify-between p-4 border-b border-border/30">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-amber-500" />
            <h2 className="text-[15px] font-semibold">Alertas de Adherencia</h2>
            {unresolvedAlerts.length > 0 && (
              <Badge variant="destructive" className="text-[10px] rounded-full px-2 py-0">{unresolvedAlerts.length}</Badge>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => runAnalysisMut.mutate()}
            disabled={runAnalysisMut.isPending}
            className="rounded-xl text-[12px] gap-1.5"
          >
            {runAnalysisMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Analizar
          </Button>
        </div>

        <div className="p-4">
          {alertsQ.isLoading ? (
            <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : unresolvedAlerts.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="h-10 w-10 mx-auto text-emerald-500/30 mb-2" />
              <p className="text-[13px] text-muted-foreground">No hay alertas activas</p>
              <p className="text-[11px] text-muted-foreground/70 mt-1">Pulsa "Analizar" para revisar la adherencia de tus clientes</p>
            </div>
          ) : (
            <div className="space-y-3">
              {unresolvedAlerts.map((item: any) => {
                const sev = severityConfig[item.alert.severity] || severityConfig.low;
                return (
                  <div key={item.alert.id} className="rounded-xl border border-border/40 p-4 hover:bg-accent/5 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={`${sev.bg} ${sev.color} border-0 text-[10px] rounded-full px-2`}>{sev.label}</Badge>
                          <span className="text-[10px] text-muted-foreground">{new Date(item.alert.createdAt).toLocaleDateString("es-ES")}</span>
                        </div>
                        <p className="text-[13px] font-semibold leading-tight">{item.alert.title}</p>
                        <p className="text-[12px] text-muted-foreground mt-1 leading-relaxed">{item.alert.description}</p>
                        {item.alert.suggestion && (
                          <div className="mt-2 rounded-lg bg-primary/5 p-2.5">
                            <p className="text-[11px] text-primary/80 leading-relaxed">
                              <Bell className="h-3 w-3 inline mr-1 -mt-0.5" />
                              {item.alert.suggestion}
                            </p>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => resolveAlertMut.mutate({ alertId: item.alert.id })}
                        disabled={resolveAlertMut.isPending}
                        className="shrink-0 text-[11px] rounded-xl text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                        Resolver
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-[15px] font-semibold mb-3">Acciones Rápidas</h2>
        <div className="space-y-2">
          {quickActions.map(({ label, desc, icon: Icon, color, bg, path }) => (
            <div key={label} onClick={() => setLocation(path)} className="bg-card text-card-foreground rounded-2xl border border-border/50 shadow-sm flex items-center gap-4 p-4 cursor-pointer hover:shadow-md transition-all group">
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
