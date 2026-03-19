import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Loader2, CalendarDays, ChevronLeft, ChevronRight, AlertTriangle, CheckCircle2, Clock, User } from "lucide-react";
import { useLocation } from "wouter";

const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export default function CalendarView() {
  const [, navigate] = useLocation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const clientsQ = trpc.clientMgmt.list.useQuery();
  const clients = clientsQ.data || [];

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDow = (firstDay.getDay() + 6) % 7; // Monday = 0
    const days: (number | null)[] = [];
    for (let i = 0; i < startDow; i++) days.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(d);
    while (days.length % 7 !== 0) days.push(null);
    return days;
  }, [year, month]);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  // Client events (diet assignments, inactivity alerts)
  const clientEvents = useMemo(() => {
    const events: Record<string, { type: string; client: string; clientId: number; detail: string }[]> = {};
    clients.forEach((c: any) => {
      // Diet assignment date
      if (c.createdAt) {
        const d = new Date(c.createdAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        if (!events[key]) events[key] = [];
        events[key].push({ type: "new", client: c.name, clientId: c.id, detail: "Nuevo cliente" });
      }
    });
    return events;
  }, [clients]);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => setCurrentDate(new Date());

  // Clients needing attention (no recent activity)
  const needsAttention = useMemo(() => {
    const now = Date.now();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    return clients.filter((c: any) => {
      const lastActivity = c.updatedAt ? new Date(c.updatedAt).getTime() : (c.createdAt ? new Date(c.createdAt).getTime() : 0);
      return (now - lastActivity) > sevenDays;
    });
  }, [clients]);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight uppercase">CALENDARIO</h1>
          <p className="text-[14px] text-muted-foreground mt-1">Planificación y seguimiento de tus clientes</p>
        </div>
        <Button variant="outline" onClick={goToday} className="rounded-xl text-[13px]">Hoy</Button>
      </div>

      <div className="grid lg:grid-cols-[1fr_300px] gap-6">
        {/* Calendar */}
        <div className="bg-card rounded-2xl border border-border/50 p-5">
          <div className="flex items-center justify-between mb-5">
            <Button variant="ghost" size="icon" onClick={prevMonth} className="h-8 w-8 rounded-lg">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-[17px] font-semibold">{MONTHS[month]} {year}</h2>
            <Button variant="ghost" size="icon" onClick={nextMonth} className="h-8 w-8 rounded-lg">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {WEEKDAYS.map((d) => (
              <div key={d} className="text-center text-[11px] font-medium text-muted-foreground py-1">{d}</div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, i) => {
              if (day === null) return <div key={i} className="aspect-square" />;
              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const isToday = dateStr === todayStr;
              const dayEvents = clientEvents[dateStr] || [];

              return (
                <div key={i} className={`aspect-square rounded-xl p-1 flex flex-col items-center justify-start transition-colors ${
                  isToday ? "bg-primary/10 border-2 border-primary" : "hover:bg-accent/50"
                }`}>
                  <span className={`text-[12px] font-medium ${isToday ? "text-primary font-bold" : ""}`}>{day}</span>
                  {dayEvents.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                      {dayEvents.slice(0, 3).map((ev, j) => (
                        <div key={j} className={`w-1.5 h-1.5 rounded-full ${
                          ev.type === "new" ? "bg-emerald-500" : ev.type === "review" ? "bg-blue-500" : "bg-amber-500"
                        }`} title={`${ev.client}: ${ev.detail}`} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex gap-4 mt-4 pt-3 border-t border-border/30">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[11px] text-muted-foreground">Nuevo cliente</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-[11px] text-muted-foreground">Revisión</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-[11px] text-muted-foreground">Cambio de plan</span>
            </div>
          </div>
        </div>

        {/* Sidebar: Alerts */}
        <div className="space-y-4">
          {/* Needs attention */}
          <div className="bg-card rounded-2xl border border-border/50 p-4">
            <h3 className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />Necesitan atención
            </h3>
            {clientsQ.isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mx-auto" />
            ) : needsAttention.length === 0 ? (
              <div className="text-center py-4">
                <CheckCircle2 className="h-6 w-6 text-emerald-500 mx-auto mb-1" />
                <p className="text-[12px] text-muted-foreground">Todos los clientes al día</p>
              </div>
            ) : (
              <div className="space-y-2">
                {needsAttention.slice(0, 8).map((c: any) => {
                  const daysSince = Math.floor((Date.now() - new Date(c.updatedAt || c.createdAt).getTime()) / (1000 * 60 * 60 * 24));
                  return (
                    <button key={c.id} onClick={() => navigate(`/clients/${c.id}`)} className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-accent/50 transition-colors text-left">
                      <div className="w-7 h-7 rounded-full bg-amber-500/10 flex items-center justify-center">
                        <User className="h-3.5 w-3.5 text-amber-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium truncate">{c.name}</p>
                        <p className="text-[10px] text-amber-500">{daysSince}d sin actividad</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick stats */}
          <div className="bg-card rounded-2xl border border-border/50 p-4">
            <h3 className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />Resumen
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 rounded-lg bg-secondary/30">
                <span className="text-[12px] text-muted-foreground">Total clientes</span>
                <span className="text-[14px] font-semibold">{clients.length}</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-lg bg-secondary/30">
                <span className="text-[12px] text-muted-foreground">Activos (7d)</span>
                <span className="text-[14px] font-semibold text-emerald-500">{clients.length - needsAttention.length}</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-lg bg-secondary/30">
                <span className="text-[12px] text-muted-foreground">Inactivos (+7d)</span>
                <span className="text-[14px] font-semibold text-amber-500">{needsAttention.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
