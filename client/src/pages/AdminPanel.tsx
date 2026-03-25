import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Users, Activity, UtensilsCrossed, BookOpen, Search,
  ChevronLeft, ChevronRight, Shield, ShieldOff, Crown,
  Eye, TrendingUp, UserCheck, UserX, BarChart3, Clock,
  ArrowLeft
} from "lucide-react";
import { useLocation } from "wouter";

/* ── Stats Card ── */
function StatCard({ icon: Icon, label, value, sub, color = "#16a34a" }: {
  icon: any; label: string; value: number | string; sub?: string; color?: string;
}) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 flex items-start gap-4">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}15` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-[12px] text-muted-foreground font-medium uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold text-foreground mt-0.5">{value}</p>
        {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

/* ── Plan Badge ── */
function PlanBadge({ plan }: { plan: string }) {
  const colors: Record<string, string> = {
    basic: "bg-gray-100 text-gray-700 border-gray-200",
    pro: "bg-blue-50 text-blue-700 border-blue-200",
    centers: "bg-purple-50 text-purple-700 border-purple-200",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${colors[plan] || colors.basic}`}>
      {plan === "centers" ? "Centers" : plan.charAt(0).toUpperCase() + plan.slice(1)}
    </span>
  );
}

/* ── Trainer Detail Dialog ── */
function TrainerDetailDialog({ trainerId, open, onClose }: { trainerId: number | null; open: boolean; onClose: () => void }) {
  const { data: detail, isLoading } = trpc.admin.getTrainerDetail.useQuery(
    { trainerId: trainerId! },
    { enabled: !!trainerId && open }
  );

  if (!trainerId) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">Detalle del entrenador</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-[#16a34a] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : detail ? (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#16a34a]/10 flex items-center justify-center text-[#16a34a] font-bold text-xl">
                {detail.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg text-foreground">{detail.name}</h3>
                {detail.trainerName && <p className="text-sm text-muted-foreground">{detail.trainerName}</p>}
                <p className="text-sm text-muted-foreground">{detail.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <PlanBadge plan={detail.plan} />
                  <Badge variant={detail.isActive === 1 ? "default" : "destructive"} className="text-[10px]">
                    {detail.isActive === 1 ? "Activo" : "Inactivo"}
                  </Badge>
                  <Badge variant={detail.emailVerified === 1 ? "default" : "secondary"} className="text-[10px]">
                    {detail.emailVerified === 1 ? "Email verificado" : "Sin verificar"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Counts */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-muted/50 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-foreground">{detail.counts.clients}</p>
                <p className="text-[11px] text-muted-foreground">Clientes</p>
              </div>
              <div className="bg-muted/50 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-foreground">{detail.counts.diets}</p>
                <p className="text-[11px] text-muted-foreground">Dietas</p>
              </div>
              <div className="bg-muted/50 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-foreground">{detail.counts.recipes}</p>
                <p className="text-[11px] text-muted-foreground">Recetas</p>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground text-[11px] uppercase tracking-wider">Registro</p>
                <p className="font-medium text-foreground">{new Date(detail.createdAt).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-[11px] uppercase tracking-wider">Ultimo acceso</p>
                <p className="font-medium text-foreground">{new Date(detail.lastSignedIn).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
              </div>
            </div>

            {/* Clients list */}
            {detail.clients.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm text-foreground mb-2">Clientes ({detail.clients.length})</h4>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {detail.clients.map((c: any) => (
                    <div key={c.id} className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2">
                      <div>
                        <p className="text-sm font-medium text-foreground">{c.name}</p>
                        {c.email && <p className="text-[11px] text-muted-foreground">{c.email}</p>}
                      </div>
                      <Badge variant={c.status === "active" ? "default" : "secondary"} className="text-[10px]">
                        {c.status === "active" ? "Activo" : c.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent diets */}
            {detail.recentDiets.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm text-foreground mb-2">Dietas recientes</h4>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {detail.recentDiets.map((d: any) => (
                    <div key={d.id} className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2">
                      <p className="text-sm font-medium text-foreground">{d.name}</p>
                      <span className="text-[11px] text-muted-foreground">{d.totalCalories} kcal</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">No se encontro el entrenador</p>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ── Main Admin Panel ── */
export default function AdminPanel() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedTrainer, setSelectedTrainer] = useState<number | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const limit = 15;

  const { data: stats, isLoading: statsLoading } = trpc.admin.getStats.useQuery();
  const { data: trainersData, isLoading: trainersLoading } = trpc.admin.listTrainers.useQuery({
    search: search || undefined,
    plan: planFilter !== "all" ? planFilter : undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    page,
    limit,
  });

  const utils = trpc.useUtils();

  const toggleActive = trpc.admin.toggleTrainerActive.useMutation({
    onSuccess: (result) => {
      toast.success(result.isActive === 1 ? "Entrenador activado" : "Entrenador desactivado");
      utils.admin.listTrainers.invalidate();
      utils.admin.getStats.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const changePlan = trpc.admin.changePlan.useMutation({
    onSuccess: (result) => {
      toast.success(`Plan cambiado a ${result.plan}`);
      utils.admin.listTrainers.invalidate();
      utils.admin.getStats.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  if (user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground">Acceso denegado</h2>
          <p className="text-muted-foreground mt-2">No tienes permisos para acceder al panel de administracion.</p>
          <Button className="mt-4" onClick={() => navigate("/")}>Volver al inicio</Button>
        </div>
      </div>
    );
  }

  const totalPages = trainersData ? Math.ceil(trainersData.total / limit) : 1;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="rounded-xl">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-500" />
                Panel de Administracion
              </h1>
              <p className="text-[12px] text-muted-foreground">Gestion de entrenadores y metricas de la plataforma</p>
            </div>
          </div>
          <Badge variant="outline" className="text-[11px]">
            {user.name} (Admin)
          </Badge>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Stats Grid */}
        {statsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-5 animate-pulse">
                <div className="h-4 bg-muted rounded w-20 mb-2" />
                <div className="h-8 bg-muted rounded w-12" />
              </div>
            ))}
          </div>
        ) : stats ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={Users} label="Entrenadores" value={stats.totalTrainers} sub={`${stats.activeTrainers} activos`} color="#16a34a" />
              <StatCard icon={UserCheck} label="Clientes totales" value={stats.totalClients} color="#3b82f6" />
              <StatCard icon={UtensilsCrossed} label="Dietas creadas" value={stats.totalDiets} color="#f59e0b" />
              <StatCard icon={BookOpen} label="Recetas" value={stats.totalRecipes} color="#8b5cf6" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={Activity} label="Activos hoy" value={stats.activeToday} color="#ef4444" />
              <StatCard icon={TrendingUp} label="Activos esta semana" value={stats.activeWeek} color="#06b6d4" />
              <StatCard icon={BarChart3} label="Activos este mes" value={stats.activeMonth} color="#ec4899" />
              <StatCard icon={Clock} label="Registros (30d)" value={stats.recentRegistrations} sub={`${stats.verifiedTrainers} verificados`} color="#14b8a6" />
            </div>

            {/* Plan distribution */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="font-semibold text-sm text-foreground mb-3">Distribucion por plan</h3>
              <div className="flex gap-6">
                {stats.planDistribution.map((p: any) => (
                  <div key={p.plan} className="flex items-center gap-2">
                    <PlanBadge plan={p.plan} />
                    <span className="text-lg font-bold text-foreground">{p.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : null}

        {/* Trainers Table */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-border">
            <h3 className="font-semibold text-foreground mb-3">Entrenadores registrados</h3>
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o email..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="pl-9"
                />
              </div>
              <Select value={planFilter} onValueChange={(v) => { setPlanFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los planes</SelectItem>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="centers">Centers</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Activos</SelectItem>
                  <SelectItem value="inactive">Inactivos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {trainersLoading ? (
            <div className="p-8 text-center">
              <div className="w-6 h-6 border-2 border-[#16a34a] border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : trainersData && trainersData.trainers.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-5 py-3 font-medium text-muted-foreground text-[11px] uppercase tracking-wider">Entrenador</th>
                      <th className="text-left px-5 py-3 font-medium text-muted-foreground text-[11px] uppercase tracking-wider">Plan</th>
                      <th className="text-center px-5 py-3 font-medium text-muted-foreground text-[11px] uppercase tracking-wider">Clientes</th>
                      <th className="text-center px-5 py-3 font-medium text-muted-foreground text-[11px] uppercase tracking-wider">Dietas</th>
                      <th className="text-center px-5 py-3 font-medium text-muted-foreground text-[11px] uppercase tracking-wider">Recetas</th>
                      <th className="text-left px-5 py-3 font-medium text-muted-foreground text-[11px] uppercase tracking-wider">Ultimo acceso</th>
                      <th className="text-left px-5 py-3 font-medium text-muted-foreground text-[11px] uppercase tracking-wider">Estado</th>
                      <th className="text-right px-5 py-3 font-medium text-muted-foreground text-[11px] uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trainersData.trainers.map((t: any) => (
                      <tr key={t.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-[#16a34a]/10 flex items-center justify-center text-[#16a34a] font-semibold text-sm shrink-0">
                              {t.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-foreground truncate">{t.name}</p>
                              <p className="text-[11px] text-muted-foreground truncate">{t.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <Select
                            value={t.plan}
                            onValueChange={(v) => changePlan.mutate({ trainerId: t.id, plan: v as any })}
                          >
                            <SelectTrigger className="w-[100px] h-7 text-[11px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="basic">Basic</SelectItem>
                              <SelectItem value="pro">Pro</SelectItem>
                              <SelectItem value="centers">Centers</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-5 py-3 text-center font-medium text-foreground">{t.clientCount}</td>
                        <td className="px-5 py-3 text-center font-medium text-foreground">{t.dietCount}</td>
                        <td className="px-5 py-3 text-center font-medium text-foreground">{t.recipeCount}</td>
                        <td className="px-5 py-3 text-[12px] text-muted-foreground">
                          {new Date(t.lastSignedIn).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-1.5">
                            <div className={`w-2 h-2 rounded-full ${t.isActive === 1 ? "bg-green-500" : "bg-red-400"}`} />
                            <span className="text-[11px] text-muted-foreground">{t.isActive === 1 ? "Activo" : "Inactivo"}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 rounded-lg"
                              onClick={() => { setSelectedTrainer(t.id); setDetailOpen(true); }}
                              title="Ver detalle"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className={`h-7 w-7 rounded-lg ${t.isActive === 1 ? "text-red-500 hover:text-red-600 hover:bg-red-50" : "text-green-500 hover:text-green-600 hover:bg-green-50"}`}
                              onClick={() => toggleActive.mutate({ trainerId: t.id })}
                              title={t.isActive === 1 ? "Desactivar" : "Activar"}
                            >
                              {t.isActive === 1 ? <ShieldOff className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-5 py-3 border-t border-border">
                  <p className="text-[12px] text-muted-foreground">
                    Mostrando {((page - 1) * limit) + 1}-{Math.min(page * limit, trainersData.total)} de {trainersData.total}
                  </p>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-[12px] text-muted-foreground px-2">
                      {page} / {totalPages}
                    </span>
                    <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No se encontraron entrenadores</p>
              {search && <p className="text-[12px] text-muted-foreground mt-1">Prueba con otro termino de busqueda</p>}
            </div>
          )}
        </div>
      </div>

      <TrainerDetailDialog
        trainerId={selectedTrainer}
        open={detailOpen}
        onClose={() => { setDetailOpen(false); setSelectedTrainer(null); }}
      />
    </div>
  );
}
