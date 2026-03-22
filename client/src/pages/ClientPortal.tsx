import { useState, useMemo, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, LogIn, Send, Trophy, CheckCircle2, XCircle, MinusCircle, ArrowLeft, MessageSquare, Calendar, Award, User, Utensils, TrendingUp, Camera, Plus, ImageIcon, Droplets, Moon, Heart, ShoppingCart, ChefHat, Clock, Bell, FileDown, ChevronDown, Bot, Activity } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ArchetypeSelector from "@/components/ArchetypeSelector";
import { ARCHETYPES, MASCOT_URLS, EMPTY_STATE_MESSAGES, type ArchetypeId } from "@shared/constants";

// ── Client Portal: Login + Dashboard ──
export default function ClientPortal() {
  const [accessCode, setAccessCode] = useState("");
  const [session, setSession] = useState<{ clientId: number; name: string; accessCode: string; archetype?: string | null } | null>(() => {
    try {
      const saved = localStorage.getItem("clientPortalSession");
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const loginMut = trpc.clientPortal.loginByCode.useMutation({
    onSuccess: (data) => {
      const s = { clientId: data.clientId, name: data.name, accessCode, archetype: data.archetype };
      setSession(s);
      localStorage.setItem("clientPortalSession", JSON.stringify(s));
      toast.success(`Bienvenido/a, ${data.name}`);
    },
    onError: (e) => toast.error(e.message),
  });

  const setArchetypeMut = trpc.clientPortal.setArchetype.useMutation({
    onSuccess: (data) => {
      if (session) {
        const updated = { ...session, archetype: data.archetype };
        setSession(updated);
        localStorage.setItem("clientPortalSession", JSON.stringify(updated));
        toast.success("\u00a1Personaje seleccionado!");
      }
    },
    onError: (e) => toast.error(e.message),
  });

  const handleLogin = () => {
    if (!accessCode.trim()) return;
    loginMut.mutate({ accessCode: accessCode.trim() });
  };

  const handleLogout = () => {
    setSession(null);
    localStorage.removeItem("clientPortalSession");
    setAccessCode("");
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663395627355/JuA5L95oAvQY6eqfSgbwUN/nutriflow_logo_43762e41.webp" alt="NutriFlow" className="h-20 object-contain mx-auto mb-4" />
            <h1 className="text-2xl font-bold tracking-tight uppercase">Portal del Cliente</h1>
            <p className="text-muted-foreground text-sm mt-2">Introduce tu código de acceso para ver tu plan nutricional</p>
          </div>
          <div className="space-y-3">
            <Input
              placeholder="Código de acceso"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              className="h-12 text-center text-lg tracking-widest font-mono rounded-xl"
            />
            <Button
              onClick={handleLogin}
              disabled={!accessCode.trim() || loginMut.isPending}
              className="w-full h-12 rounded-xl text-[15px] font-semibold"
            >
              {loginMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <LogIn className="h-4 w-4 mr-2" />}
              Acceder
            </Button>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-6">
            Tu entrenador te proporcionará el código de acceso
          </p>
        </div>
      </div>
    );
  }

  // Show archetype onboarding if no archetype selected
  if (!session.archetype) {
    return (
      <ArchetypeSelector
        clientName={session.name}
        isPending={setArchetypeMut.isPending}
        onSelect={(archetype) => {
          setArchetypeMut.mutate({
            clientId: session.clientId,
            accessCode: session.accessCode,
            archetype,
          });
        }}
      />
    );
  }

  return <ClientDashboard session={session} onLogout={handleLogout} />;
}

// ── Client Dashboard (after login) ──
// Helper: get dynamic greeting based on time of day
function getGreeting(name: string, archetype?: ArchetypeId): string {
  const hour = new Date().getHours();
  const greetings: Record<string, Record<string, string>> = {
    agil: { morning: `\u00a1Buenos d\u00edas, ${name}! Hoy es un gran d\u00eda para superarte.`, afternoon: `\u00a1Buenas tardes, ${name}! Sigue con esa energ\u00eda.`, evening: `Buenas noches, ${name}. Descansa bien para ma\u00f1ana.` },
    flora: { morning: `\u00a1Buenos d\u00edas, ${name}! Empieza el d\u00eda con equilibrio.`, afternoon: `\u00a1Buenas tardes, ${name}! \u00bfC\u00f3mo va tu d\u00eda?`, evening: `Buenas noches, ${name}. Cu\u00eddate mucho.` },
    bruto: { morning: `\u00a1Arriba, ${name}! Hoy toca darlo todo.`, afternoon: `\u00a1${name}! La fuerza no descansa.`, evening: `Buenas noches, ${name}. Los m\u00fasculos crecen descansando.` },
    roca: { morning: `\u00a1Buenos d\u00edas, ${name}! Otro d\u00eda m\u00e1s sin rendirse.`, afternoon: `\u00a1Sigue as\u00ed, ${name}! La constancia es tu arma.`, evening: `Buenas noches, ${name}. Ma\u00f1ana m\u00e1s y mejor.` },
  };
  const timeKey = hour < 12 ? "morning" : hour < 20 ? "afternoon" : "evening";
  return archetype && greetings[archetype] ? greetings[archetype][timeKey] : `\u00a1Hola, ${name}!`;
}

function ClientDashboard({ session, onLogout }: { session: { clientId: number; name: string; accessCode: string; archetype?: string | null }; onLogout: () => void }) {
  const [tab, setTab] = useState<string>("diet");

  const profileQ = trpc.clientPortal.getProfile.useQuery({ clientId: session.clientId, accessCode: session.accessCode });
  const dietQ = trpc.clientPortal.getActiveDiet.useQuery({ clientId: session.clientId, accessCode: session.accessCode });

  const archetype = (session.archetype || profileQ.data?.archetype) as ArchetypeId | undefined;
  const archetypeData = archetype ? ARCHETYPES.find(a => a.id === archetype) : null;
  const accentColor = archetypeData?.accentColor || "#6BCB77";

  const tabs = [
    { id: "diet", label: "Mi Dieta", icon: Utensils },
    { id: "tracking", label: "Seguimiento", icon: TrendingUp },
    { id: "wellness", label: "Bienestar", icon: Heart },
    { id: "weekend", label: "Fin de Semana", icon: Calendar },
    { id: "shopping", label: "Compra", icon: ShoppingCart },
    { id: "chat", label: "Chat", icon: MessageSquare },
    { id: "assistant", label: "Asistente", icon: Bot },
    { id: "activity", label: "Actividad", icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-background" data-archetype={archetype || undefined}>
      {/* Header with mascot */}
      <div className="sticky top-0 z-40 backdrop-blur-xl border-b border-border/50" style={{ backgroundColor: "rgba(11,13,24,0.85)" }}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {archetypeData ? (
              <img src={archetypeData.image} alt={archetypeData.name} className="h-12 w-12 object-contain drop-shadow-lg" />
            ) : (
              <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663395627355/JuA5L95oAvQY6eqfSgbwUN/nutriflow_logo_43762e41.webp" alt="NutriFlow" className="h-12 object-contain" />
            )}
            <div>
              <h1 className="text-[17px] font-semibold tracking-tight uppercase" style={{ color: accentColor }}>{session.name}</h1>
              {profileQ.data?.goal && <p className="text-[12px] text-muted-foreground">{profileQ.data.goal}</p>}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onLogout} className="text-[13px] text-muted-foreground">
            Cerrar sesi\u00f3n
          </Button>
        </div>
      </div>

      {/* Greeting banner with mascot */}
      {tab === "diet" && archetypeData && (
        <div className="max-w-2xl mx-auto px-4 pt-4">
          <div className="relative rounded-2xl overflow-hidden p-4" style={{ background: `linear-gradient(135deg, ${accentColor}15, ${accentColor}05)`, border: `1px solid ${accentColor}20` }}>
            <div className="flex items-center gap-4">
              <img src={archetypeData.image} alt={archetypeData.name} className="h-16 w-16 object-contain drop-shadow-lg flex-shrink-0" />
              <div>
                <p className="text-[15px] font-semibold text-foreground">{getGreeting(session.name, archetype)}</p>
                <p className="text-[12px] text-muted-foreground mt-0.5">Tu compa\u00f1ero <span style={{ color: accentColor }} className="font-semibold">{archetypeData.name}</span> te acompa\u00f1a</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab bar */}
      <div className="sticky top-[57px] z-30 backdrop-blur-xl border-b border-border/50" style={{ backgroundColor: "rgba(11,13,24,0.85)" }}>
        <div className="max-w-2xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-[13px] font-medium border-b-2 transition-colors whitespace-nowrap ${
                tab === t.id ? "text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
              style={tab === t.id ? { borderBottomColor: accentColor, color: accentColor } : undefined}
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
        {tab === "diet" && <DietTab dietQ={dietQ} session={session} archetype={archetype} accentColor={accentColor} />}
        {tab === "tracking" && <TrackingTab session={session} dietId={dietQ.data?.id} />}
        {tab === "wellness" && <WellnessTab session={session} />}
        {tab === "weekend" && <WeekendTab session={session} />}
        {tab === "shopping" && <ShoppingTab session={session} archetype={archetype} />}
        {tab === "chat" && <ChatTab session={session} />}
        {tab === "assistant" && <AssistantTab session={session} archetype={archetype} accentColor={accentColor} />}
        {tab === "activity" && <ActivityTab session={session} accentColor={accentColor} />}
      </div>

      {/* Mobile bottom nav with archetype accent */}
      <div className="fixed bottom-0 left-0 right-0 backdrop-blur-xl border-t border-border/50 md:hidden safe-area-bottom" style={{ backgroundColor: "rgba(11,13,24,0.92)" }}>
        <div className="flex justify-around py-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex flex-col items-center gap-0.5 px-3 py-1 transition-colors"
              style={{ color: tab === t.id ? accentColor : "rgba(255,255,255,0.4)" }}
            >
              <t.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{t.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Diet Tab ──
function DietTab({ dietQ, session, archetype, accentColor }: { dietQ: any; session: { clientId: number; name: string; accessCode: string }; archetype?: ArchetypeId; accentColor?: string }) {
  const [recipeSteps, setRecipeSteps] = useState<{ mealName: string; steps: string } | null>(null);
  const recipeStepsMut = trpc.clientPortal.getRecipeSteps.useMutation({
    onSuccess: (data, vars) => setRecipeSteps({ mealName: vars.mealName, steps: data }),
    onError: (e) => toast.error(e.message),
  });
  const [exportingPdf, setExportingPdf] = useState(false);
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set());
  const [expandedMeals, setExpandedMeals] = useState<Set<string>>(new Set());
  const toggleDay = (idx: number) => setExpandedDays(prev => { const next = new Set(prev); next.has(idx) ? next.delete(idx) : next.add(idx); return next; });
  const toggleMeal = (key: string) => setExpandedMeals(prev => { const next = new Set(prev); next.has(key) ? next.delete(key) : next.add(key); return next; });
  if (dietQ.isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (!dietQ.data) {
    const emptyMsg = archetype && EMPTY_STATE_MESSAGES[archetype] ? EMPTY_STATE_MESSAGES[archetype].diet : "Tu entrenador a\u00fan no te ha asignado un plan nutricional";
    const mascotImg = archetype ? ARCHETYPES.find(a => a.id === archetype)?.image : null;
    return (
      <div className="text-center py-16">
        {mascotImg ? (
          <img src={mascotImg} alt="" className="h-24 w-24 object-contain mx-auto mb-4 opacity-60" />
        ) : (
          <Utensils className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
        )}
        <p className="text-[15px] font-medium">Sin dieta asignada</p>
        <p className="text-[13px] text-muted-foreground mt-1 max-w-xs mx-auto">{emptyMsg}</p>
      </div>
    );
  }

  const diet = dietQ.data;
  return (
    <div className="space-y-4">
      <div className="bg-card rounded-2xl border border-border/50 p-4">
        <h2 className="text-[17px] font-semibold">{diet.name}</h2>
        <div className="flex gap-4 mt-2 text-[13px] text-muted-foreground">
          <span>{diet.totalCalories} kcal</span>
          <span>{diet.mealsPerDay} comidas/día</span>
        </div>
      </div>

      {diet.menus?.map((menu: any, mi: number) => {
        const dayExpanded = expandedDays.has(mi);
        const dayTotals = (menu.meals || []).reduce((acc: any, meal: any) => {
          const mealT = (meal.foods || []).reduce((a: any, f: any) => ({ cal: a.cal + (f.calories||0), p: a.p + (f.protein||0) }), { cal: 0, p: 0 });
          return { cal: acc.cal + mealT.cal, p: acc.p + mealT.p };
        }, { cal: 0, p: 0 });
        return (
          <div key={mi} className="bg-card rounded-2xl border border-border/50 overflow-hidden">
            <button onClick={() => toggleDay(mi)} className="w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[13px] font-bold ${dayExpanded ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>{mi + 1}</div>
                <div className="text-left">
                  <h3 className="text-[14px] font-semibold">Día {mi + 1}</h3>
                  <p className="text-[11px] text-muted-foreground">{(menu.meals || []).length} comidas · {dayTotals.cal} kcal</p>
                </div>
              </div>
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${dayExpanded ? 'rotate-180' : ''}`} />
            </button>
            {dayExpanded && (
              <div className="px-4 pb-4 space-y-2">
                {menu.meals?.map((meal: any, mealIdx: number) => {
                  const mealKey = `${mi}-${mealIdx}`;
                  const mealExpanded = expandedMeals.has(mealKey);
                  const mealTotals = (meal.foods || []).reduce(
                    (acc: any, f: any) => ({ calories: acc.calories + (f.calories || 0), protein: acc.protein + (f.protein || 0), carbs: acc.carbs + (f.carbs || 0), fats: acc.fats + (f.fats || 0) }),
                    { calories: 0, protein: 0, carbs: 0, fats: 0 }
                  );
                  return (
                    <div key={mealIdx} className="rounded-xl border border-border/30 overflow-hidden">
                      <button onClick={() => toggleMeal(mealKey)} className="w-full flex items-center justify-between p-3 hover:bg-secondary/20 transition-colors">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-semibold">{meal.mealName}</span>
                          {meal.description && <span className="text-[11px] text-primary/60 italic hidden sm:inline">{meal.description}</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-muted-foreground">{mealTotals.calories} kcal</span>
                          <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${mealExpanded ? 'rotate-180' : ''}`} />
                        </div>
                      </button>
                      {mealExpanded && (
                        <div className="px-3 pb-3 border-t border-border/20">
                          <div className="space-y-1.5 mt-2">
                            {meal.foods?.map((food: any, fi: number) => (
                              <div key={fi} className="flex items-center justify-between text-[13px]">
                                <span>{food.name}</span>
                                <span className="text-muted-foreground">{food.quantity}{food.unit}</span>
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-3 mt-3 pt-2 border-t border-border/30 text-[11px] text-muted-foreground">
                            <span>P: {mealTotals.protein}g</span>
                            <span>C: {mealTotals.carbs}g</span>
                            <span>G: {mealTotals.fats}g</span>
                          </div>
                          <Button variant="ghost" size="sm" className="mt-2 gap-1.5 text-[12px] text-primary h-7 px-2"
                            onClick={() => recipeStepsMut.mutate({ clientId: session.clientId, accessCode: session.accessCode, mealName: meal.mealName, foods: (meal.foods || []).map((f: any) => ({ name: f.name, quantity: f.quantity })) })}
                            disabled={recipeStepsMut.isPending}
                          >
                            {recipeStepsMut.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <ChefHat className="h-3 w-3" />}
                            Preparación
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Export PDF button */}
      <Button
        variant="outline" className="w-full gap-2 rounded-xl h-11 mt-4"
        onClick={() => {
          setExportingPdf(true);
          try {
            const d = diet;
            let html = `<html><head><meta charset="utf-8"><style>body{font-family:'Plus Jakarta Sans',sans-serif;padding:20px;color:#1a1a2e}h1{color:#6BCB77;font-size:24px}h2{color:#333;font-size:18px;margin-top:20px}h3{font-size:15px;margin-top:12px;color:#555}.meal{background:#f8f9fa;border-radius:8px;padding:12px;margin:8px 0}.food{display:flex;justify-content:space-between;padding:4px 0;font-size:13px;border-bottom:1px solid #eee}.macros{display:flex;gap:16px;font-size:12px;color:#666;margin-top:8px;padding-top:8px;border-top:1px solid #ddd}.header-info{display:flex;gap:24px;font-size:14px;color:#555;margin-bottom:16px}</style></head><body>`;
            html += `<h1>NUTRIFLOW - ${d.name}</h1>`;
            html += `<div class="header-info"><span>${d.totalCalories} kcal/día</span><span>${d.mealsPerDay} comidas/día</span><span>P:${d.proteinPercent}% C:${d.carbsPercent}% G:${d.fatsPercent}%</span></div>`;
            for (const menu of d.menus || []) {
              html += `<h2>Día ${menu.menuNumber}</h2>`;
              for (const meal of menu.meals || []) {
                const totals = (meal.foods || []).reduce((a: any, f: any) => ({ cal: a.cal + (f.calories||0), p: a.p + (f.protein||0), c: a.c + (f.carbs||0), g: a.g + (f.fats||0) }), { cal:0, p:0, c:0, g:0 });
                html += `<div class="meal"><h3>${meal.mealName} (${totals.cal} kcal)</h3>`;
                for (const food of meal.foods || []) {
                  html += `<div class="food"><span>${food.name}</span><span>${food.quantity} | ${food.calories}kcal</span></div>`;
                  if (food.alternativeName) html += `<div class="food" style="color:#888;font-style:italic"><span>↻ ${food.alternativeName}</span><span>${food.alternativeQuantity}</span></div>`;
                }
                html += `<div class="macros"><span>Proteína: ${totals.p}g</span><span>Carbos: ${totals.c}g</span><span>Grasas: ${totals.g}g</span></div></div>`;
              }
            }
            html += `<p style="text-align:center;color:#999;margin-top:32px;font-size:11px">Generado con NutriFlow</p></body></html>`;
            const blob = new Blob([html], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = `${d.name.replace(/\s+/g, '_')}_NutriFlow.html`; a.click();
            URL.revokeObjectURL(url);
            toast.success("Dieta exportada");
          } catch { toast.error("Error al exportar"); }
          setExportingPdf(false);
        }}
        disabled={exportingPdf}
      >
        <FileDown className="h-4 w-4" />
        Exportar Dieta
      </Button>

      {/* Recipe Steps Dialog */}
      <Dialog open={!!recipeSteps} onOpenChange={() => setRecipeSteps(null)}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader><DialogTitle className="text-[17px]"><ChefHat className="h-4 w-4 inline mr-2" />{recipeSteps?.mealName}</DialogTitle></DialogHeader>
          <div className="text-[13px] leading-relaxed whitespace-pre-line">{recipeSteps?.steps}</div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Adherence Tab ──
function AdherenceTab({ session, dietId }: { session: { clientId: number; accessCode: string }; dietId?: number }) {
  const [todayStatus, setTodayStatus] = useState<string>("");
  const [notes, setNotes] = useState("");
  const today = useMemo(() => new Date().toISOString().split("T")[0], []);

  const adherenceMut = trpc.clientPortal.logAdherence.useMutation({
    onSuccess: () => toast.success("Adherencia registrada"),
    onError: (e) => toast.error(e.message),
  });

  const statusOptions = [
    { value: 1, label: "Cumplida", icon: CheckCircle2, color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
    { value: 0, label: "No cumplida", icon: XCircle, color: "text-red-400 bg-red-500/10 border-red-500/20" },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-2xl border border-border/50 p-5">
        <h3 className="text-[15px] font-semibold mb-1">Registro de hoy</h3>
        <p className="text-[12px] text-muted-foreground mb-4">{new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}</p>

        <div className="grid grid-cols-2 gap-2 mb-4">
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTodayStatus(String(opt.value))}
              className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${
                todayStatus === String(opt.value) ? opt.color + " border-2" : "border-border/50 text-muted-foreground hover:bg-accent/50"
              }`}
            >
              <opt.icon className="h-4 w-4" />
              <span className="text-[13px] font-medium">{opt.label}</span>
            </button>
          ))}
        </div>

        <Textarea
          placeholder="Notas opcionales..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="rounded-xl text-[13px] mb-3"
          rows={2}
        />

        <Button
          onClick={() => {
            if (!todayStatus || !dietId) return;
            adherenceMut.mutate({
              clientId: session.clientId,
              accessCode: session.accessCode,
              dietId,
              date: today,
              mealNumber: 0,
              completed: Number(todayStatus),
              notes: notes || undefined,
            });
          }}
          disabled={!todayStatus || !dietId || adherenceMut.isPending}
          className="w-full rounded-xl"
        >
          {adherenceMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Registrar
        </Button>
      </div>
    </div>
  );
}

// ── Chat Tab ──
function ChatTab({ session }: { session: { clientId: number; name: string; accessCode: string } }) {
  const [msg, setMsg] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const messagesQ = trpc.clientPortal.getMessages.useQuery({ clientId: session.clientId, accessCode: session.accessCode });
  const sendMut = trpc.clientPortal.sendMessage.useMutation({
    onSuccess: () => { setMsg(""); messagesQ.refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const messages = useMemo(() => (messagesQ.data || []).slice().reverse(), [messagesQ.data]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
        <div className="p-4 border-b border-border/50">
          <h3 className="text-[15px] font-semibold">Chat con tu entrenador</h3>
        </div>

        <div className="h-[400px] overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <MessageSquare className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-[13px] text-muted-foreground">Aún no hay mensajes</p>
            </div>
          )}
          {messages.map((m: any) => (
            <div key={m.id} className={`flex ${m.senderType === "client" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] px-3.5 py-2 rounded-2xl text-[13px] ${
                m.senderType === "client"
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "bg-accent text-accent-foreground rounded-bl-md"
              }`}>
                {m.message}
                <div className={`text-[10px] mt-1 ${m.senderType === "client" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                  {new Date(m.createdAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <div className="p-3 border-t border-border/50 flex gap-2">
          <Input
            placeholder="Escribe un mensaje..."
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && msg.trim()) {
                e.preventDefault();
                sendMut.mutate({ clientId: session.clientId, accessCode: session.accessCode, message: msg.trim() });
              }
            }}
            className="rounded-xl text-[13px]"
          />
          <Button
            size="icon"
            onClick={() => {
              if (msg.trim()) sendMut.mutate({ clientId: session.clientId, accessCode: session.accessCode, message: msg.trim() });
            }}
            disabled={!msg.trim() || sendMut.isPending}
            className="rounded-xl shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Progress Tab (Metrics + Photos) ──
function ProgressTab({ session }: { session: { clientId: number; name: string; accessCode: string } }) {
  const [subTab, setSubTab] = useState<"metrics" | "photos">("metrics");
  const [showAddMetric, setShowAddMetric] = useState(false);
  const [showAddPhoto, setShowAddPhoto] = useState(false);
  const [metricForm, setMetricForm] = useState({
    date: new Date().toISOString().split("T")[0],
    weight: "", waist: "", hips: "", chest: "", arms: "",
  });
  const [photoForm, setPhotoForm] = useState<{ photoType: string; date: string; notes: string; file: File | null }>({
    photoType: "front", date: new Date().toISOString().split("T")[0], notes: "", file: null,
  });

  const measurementsQ = trpc.clientPortal.getMeasurements.useQuery({ clientId: session.clientId, accessCode: session.accessCode });
  const photosQ = trpc.clientPortal.getPhotos.useQuery({ clientId: session.clientId, accessCode: session.accessCode });
  const addMetricMut = trpc.clientPortal.addMeasurement.useMutation({
    onSuccess: () => { toast.success("M\u00e9tricas registradas"); measurementsQ.refetch(); setShowAddMetric(false); setMetricForm({ date: new Date().toISOString().split("T")[0], weight: "", waist: "", hips: "", chest: "", arms: "" }); },
    onError: (e) => toast.error(e.message),
  });
  const uploadPhotoMut = trpc.clientPortal.uploadPhoto.useMutation({
    onSuccess: () => { toast.success("Foto subida"); photosQ.refetch(); setShowAddPhoto(false); setPhotoForm({ photoType: "front", date: new Date().toISOString().split("T")[0], notes: "", file: null }); },
    onError: (e) => toast.error(e.message),
  });

  const measurements = measurementsQ.data || [];
  const photos = photosQ.data || [];

  // Simple chart for metrics
  const renderMiniChart = (values: number[], label: string, unit: string, color: string) => {
    if (values.length < 2) return null;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    return (
      <div className="bg-card rounded-xl border border-border/50 p-3">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[12px] font-medium text-muted-foreground">{label}</span>
          <span className="text-[14px] font-semibold">{values[values.length - 1]}{unit}</span>
        </div>
        <div className="flex items-end gap-[2px] h-10">
          {values.slice(-12).map((v, i) => (
            <div key={i} className="flex-1 rounded-t" style={{ height: `${Math.max(10, ((v - min) / range) * 100)}%`, backgroundColor: color, opacity: i === values.slice(-12).length - 1 ? 1 : 0.5 }} />
          ))}
        </div>
      </div>
    );
  };

  const weightVals = measurements.filter((m: any) => m.weight).map((m: any) => m.weight / 1000);
  const waistVals = measurements.filter((m: any) => m.waist).map((m: any) => m.waist / 10);
  const hipsVals = measurements.filter((m: any) => m.hips).map((m: any) => m.hips / 10);
  const chestVals = measurements.filter((m: any) => m.chest).map((m: any) => m.chest / 10);
  const armsVals = measurements.filter((m: any) => m.arms).map((m: any) => m.arms / 10);

  const photoTypeLabels: Record<string, string> = { front: "Frente", side: "Perfil", back: "Espalda", other: "Otra" };

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex gap-2">
        <button onClick={() => setSubTab("metrics")} className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-medium transition-colors ${subTab === "metrics" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
          <TrendingUp className="h-3.5 w-3.5" />M\u00e9tricas
        </button>
        <button onClick={() => setSubTab("photos")} className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-medium transition-colors ${subTab === "photos" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
          <Camera className="h-3.5 w-3.5" />Fotos
        </button>
      </div>

      {subTab === "metrics" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-[15px] font-semibold">MI PROGRESO</h3>
            <Button size="sm" onClick={() => setShowAddMetric(true)} className="gap-1.5 rounded-xl h-8 text-[12px]">
              <Plus className="h-3.5 w-3.5" />Registrar
            </Button>
          </div>

          {/* Charts */}
          {measurements.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {renderMiniChart(weightVals, "Peso", "kg", "#6BCB77")}
              {renderMiniChart(waistVals, "Cintura", "cm", "#4D96FF")}
              {renderMiniChart(hipsVals, "Cadera", "cm", "#FF6B6B")}
              {renderMiniChart(chestVals, "Pecho", "cm", "#FFD93D")}
              {renderMiniChart(armsVals, "Brazos", "cm", "#C084FC")}
            </div>
          ) : (
            <div className="text-center py-12">
              <TrendingUp className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-[15px] font-medium">Sin registros a\u00fan</p>
              <p className="text-[13px] text-muted-foreground mt-1">Registra tus medidas para ver tu evoluci\u00f3n</p>
            </div>
          )}

          {/* History */}
          {measurements.length > 0 && (
            <div className="bg-card rounded-2xl border border-border/50 p-4 space-y-3">
              <h4 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider">Historial</h4>
              <div className="space-y-2">
                {measurements.slice(0, 10).map((m: any) => (
                  <div key={m.id} className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/30">
                    <span className="text-[12px] text-muted-foreground">{new Date(m.date).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}</span>
                    <div className="flex gap-3 text-[12px]">
                      {m.weight && <span className="font-medium">{(m.weight / 1000).toFixed(1)}kg</span>}
                      {m.waist && <span>{(m.waist / 10).toFixed(1)}cm cin</span>}
                      {m.hips && <span>{(m.hips / 10).toFixed(1)}cm cad</span>}
                      {m.chest && <span>{(m.chest / 10).toFixed(1)}cm pec</span>}
                      {m.arms && <span>{(m.arms / 10).toFixed(1)}cm bra</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {subTab === "photos" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-[15px] font-semibold">FOTOS DE SEGUIMIENTO</h3>
            <Button size="sm" onClick={() => setShowAddPhoto(true)} className="gap-1.5 rounded-xl h-8 text-[12px]">
              <Camera className="h-3.5 w-3.5" />Subir foto
            </Button>
          </div>

          {photos.length > 0 ? (
            <div className="space-y-4">
              {/* Group by date */}
              {Object.entries(
                photos.reduce((acc: Record<string, any[]>, p: any) => {
                  const d = new Date(p.date).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
                  if (!acc[d]) acc[d] = [];
                  acc[d].push(p);
                  return acc;
                }, {})
              ).map(([date, datePhotos]) => (
                <div key={date}>
                  <p className="text-[12px] font-medium text-muted-foreground mb-2">{date}</p>
                  <div className="grid grid-cols-3 gap-2">
                    {(datePhotos as any[]).map((p: any) => (
                      <div key={p.id} className="relative aspect-[3/4] rounded-xl overflow-hidden border border-border/50">
                        <img src={p.photoUrl} alt={photoTypeLabels[p.photoType] || p.photoType} className="w-full h-full object-cover" />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                          <span className="text-[10px] text-white font-medium">{photoTypeLabels[p.photoType] || p.photoType}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <ImageIcon className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-[15px] font-medium">Sin fotos a\u00fan</p>
              <p className="text-[13px] text-muted-foreground mt-1">Sube fotos de seguimiento para ver tu transformaci\u00f3n</p>
            </div>
          )}
        </div>
      )}

      {/* Add Metric Dialog */}
      <Dialog open={showAddMetric} onOpenChange={setShowAddMetric}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader><DialogTitle className="text-[17px]">Registrar M\u00e9tricas</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label className="text-[13px]">Fecha</Label><Input type="date" value={metricForm.date} onChange={(e) => setMetricForm(f => ({ ...f, date: e.target.value }))} className="rounded-xl" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-[13px]">Peso (kg)</Label><Input type="number" step="0.1" value={metricForm.weight} onChange={(e) => setMetricForm(f => ({ ...f, weight: e.target.value }))} placeholder="75.5" className="rounded-xl" /></div>
              <div className="space-y-1.5"><Label className="text-[13px]">Cintura (cm)</Label><Input type="number" step="0.1" value={metricForm.waist} onChange={(e) => setMetricForm(f => ({ ...f, waist: e.target.value }))} placeholder="80" className="rounded-xl" /></div>
              <div className="space-y-1.5"><Label className="text-[13px]">Cadera (cm)</Label><Input type="number" step="0.1" value={metricForm.hips} onChange={(e) => setMetricForm(f => ({ ...f, hips: e.target.value }))} placeholder="95" className="rounded-xl" /></div>
              <div className="space-y-1.5"><Label className="text-[13px]">Pecho (cm)</Label><Input type="number" step="0.1" value={metricForm.chest} onChange={(e) => setMetricForm(f => ({ ...f, chest: e.target.value }))} placeholder="100" className="rounded-xl" /></div>
              <div className="space-y-1.5"><Label className="text-[13px]">Brazos (cm)</Label><Input type="number" step="0.1" value={metricForm.arms} onChange={(e) => setMetricForm(f => ({ ...f, arms: e.target.value }))} placeholder="35" className="rounded-xl" /></div>
            </div>
            <Button
              onClick={() => {
                addMetricMut.mutate({
                  clientId: session.clientId, accessCode: session.accessCode,
                  date: metricForm.date,
                  weight: metricForm.weight ? Math.round(parseFloat(metricForm.weight) * 1000) : undefined,
                  waist: metricForm.waist ? Math.round(parseFloat(metricForm.waist) * 10) : undefined,
                  hips: metricForm.hips ? Math.round(parseFloat(metricForm.hips) * 10) : undefined,
                  chest: metricForm.chest ? Math.round(parseFloat(metricForm.chest) * 10) : undefined,
                  arms: metricForm.arms ? Math.round(parseFloat(metricForm.arms) * 10) : undefined,
                });
              }}
              disabled={addMetricMut.isPending}
              className="w-full rounded-xl h-11"
            >
              {addMetricMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Guardar M\u00e9tricas
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Photo Dialog */}
      <Dialog open={showAddPhoto} onOpenChange={setShowAddPhoto}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader><DialogTitle className="text-[17px]">Subir Foto de Seguimiento</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-[13px]">Tipo de foto</Label>
              <Select value={photoForm.photoType} onValueChange={(v) => setPhotoForm(f => ({ ...f, photoType: v }))}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="front">Frente</SelectItem>
                  <SelectItem value="side">Perfil</SelectItem>
                  <SelectItem value="back">Espalda</SelectItem>
                  <SelectItem value="other">Otra</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label className="text-[13px]">Fecha</Label><Input type="date" value={photoForm.date} onChange={(e) => setPhotoForm(f => ({ ...f, date: e.target.value }))} className="rounded-xl" /></div>
            <div className="space-y-1.5">
              <Label className="text-[13px]">Foto</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  if (file && file.size > 5 * 1024 * 1024) { toast.error("M\u00e1ximo 5MB"); return; }
                  setPhotoForm(f => ({ ...f, file }));
                }}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5"><Label className="text-[13px]">Notas (opcional)</Label><Input value={photoForm.notes} onChange={(e) => setPhotoForm(f => ({ ...f, notes: e.target.value }))} placeholder="Ej: Semana 4" className="rounded-xl" /></div>
            <Button
              onClick={async () => {
                if (!photoForm.file) { toast.error("Selecciona una foto"); return; }
                const reader = new FileReader();
                reader.onload = () => {
                  const base64 = (reader.result as string).split(",")[1];
                  uploadPhotoMut.mutate({
                    clientId: session.clientId, accessCode: session.accessCode,
                    photoBase64: base64,
                    photoType: photoForm.photoType as any,
                    date: photoForm.date,
                    notes: photoForm.notes || undefined,
                  });
                };
                reader.readAsDataURL(photoForm.file);
              }}
              disabled={!photoForm.file || uploadPhotoMut.isPending}
              className="w-full rounded-xl h-11"
            >
              {uploadPhotoMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Subir Foto
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Achievements Tab ──
function AchievementsTab({ session }: { session: { clientId: number; accessCode: string } }) {
  const achievementsQ = trpc.clientPortal.getAchievements.useQuery({ clientId: session.clientId, accessCode: session.accessCode });
  const achievements = achievementsQ.data || [];

  return (
    <div className="space-y-4">
      {achievements.length === 0 ? (
        <div className="text-center py-16">
          <Trophy className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-[15px] font-medium">Sin logros aún</p>
          <p className="text-[13px] text-muted-foreground mt-1">Sigue con tu plan y desbloquearás logros</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {achievements.map((a: any) => (
            <div key={a.id} className={`bg-card rounded-xl border p-4 flex items-center gap-3 ${
              a.unlockedAt ? "border-amber-500/30 bg-amber-500/5" : "border-border/50 opacity-60"
            }`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                a.unlockedAt ? "bg-amber-500/20" : "bg-muted"
              }`}>
                {a.icon || "🏆"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold">{a.name}</p>
                {a.description && <p className="text-[12px] text-muted-foreground">{a.description}</p>}
              </div>
              {a.unlockedAt && (
                <span className="text-[11px] text-amber-600 font-medium">
                  {new Date(a.unlockedAt).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Tracking Tab (Adherence + Progress + Metrics + Photos) ──
function TrackingTab({ session, dietId }: { session: { clientId: number; name: string; accessCode: string }; dietId?: number }) {
  const [section, setSection] = useState<"adherence" | "metrics" | "photos">("adherence");
  const [todayStatus, setTodayStatus] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [showAddMetric, setShowAddMetric] = useState(false);
  const [showAddPhoto, setShowAddPhoto] = useState(false);
  const today = useMemo(() => new Date().toISOString().split("T")[0], []);
  const [metricForm, setMetricForm] = useState({
    date: new Date().toISOString().split("T")[0],
    weight: "", waist: "", hips: "", chest: "", arms: "",
  });
  const [photoForm, setPhotoForm] = useState<{ photoType: string; date: string; notes: string; file: File | null }>({
    photoType: "front", date: new Date().toISOString().split("T")[0], notes: "", file: null,
  });

  const adherenceMut = trpc.clientPortal.logAdherence.useMutation({
    onSuccess: () => toast.success("Adherencia registrada"),
    onError: (e) => toast.error(e.message),
  });
  const measurementsQ = trpc.clientPortal.getMeasurements.useQuery({ clientId: session.clientId, accessCode: session.accessCode });
  const photosQ = trpc.clientPortal.getPhotos.useQuery({ clientId: session.clientId, accessCode: session.accessCode });
  const addMetricMut = trpc.clientPortal.addMeasurement.useMutation({
    onSuccess: () => { toast.success("Métricas registradas"); measurementsQ.refetch(); setShowAddMetric(false); setMetricForm({ date: new Date().toISOString().split("T")[0], weight: "", waist: "", hips: "", chest: "", arms: "" }); },
    onError: (e) => toast.error(e.message),
  });
  const uploadPhotoMut = trpc.clientPortal.uploadPhoto.useMutation({
    onSuccess: () => { toast.success("Foto subida"); photosQ.refetch(); setShowAddPhoto(false); setPhotoForm({ photoType: "front", date: new Date().toISOString().split("T")[0], notes: "", file: null }); },
    onError: (e) => toast.error(e.message),
  });

  const measurements = measurementsQ.data || [];
  const photos = photosQ.data || [];
  const weightVals = measurements.filter((m: any) => m.weight).map((m: any) => m.weight / 1000);
  const waistVals = measurements.filter((m: any) => m.waist).map((m: any) => m.waist / 10);
  const hipsVals = measurements.filter((m: any) => m.hips).map((m: any) => m.hips / 10);
  const chestVals = measurements.filter((m: any) => m.chest).map((m: any) => m.chest / 10);
  const armsVals = measurements.filter((m: any) => m.arms).map((m: any) => m.arms / 10);
  const photoTypeLabels: Record<string, string> = { front: "Frente", side: "Perfil", back: "Espalda", other: "Otra" };

  const renderMiniChart = (values: number[], label: string, unit: string, color: string) => {
    if (values.length < 2) return null;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    return (
      <div className="bg-card rounded-xl border border-border/50 p-3">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[12px] font-medium text-muted-foreground">{label}</span>
          <span className="text-[14px] font-semibold">{values[values.length - 1]}{unit}</span>
        </div>
        <div className="flex items-end gap-[2px] h-10">
          {values.slice(-12).map((v, i) => (
            <div key={i} className="flex-1 rounded-t" style={{ height: `${Math.max(10, ((v - min) / range) * 100)}%`, backgroundColor: color, opacity: i === values.slice(-12).length - 1 ? 1 : 0.5 }} />
          ))}
        </div>
      </div>
    );
  };

  const statusOptions = [
    { value: 1, label: "Cumplida", icon: CheckCircle2, color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
    { value: 0, label: "No cumplida", icon: XCircle, color: "text-red-400 bg-red-500/10 border-red-500/20" },
  ];

  return (
    <div className="space-y-4">
      {/* Section selector */}
      <div className="flex gap-2">
        <button onClick={() => setSection("adherence")} className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-medium transition-colors ${section === "adherence" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
          <Calendar className="h-3.5 w-3.5" />Adherencia
        </button>
        <button onClick={() => setSection("metrics")} className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-medium transition-colors ${section === "metrics" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
          <TrendingUp className="h-3.5 w-3.5" />Métricas
        </button>
        <button onClick={() => setSection("photos")} className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-medium transition-colors ${section === "photos" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
          <Camera className="h-3.5 w-3.5" />Fotos
        </button>
      </div>

      {section === "adherence" && (
        <div className="bg-card rounded-2xl border border-border/50 p-5">
          <h3 className="text-[15px] font-semibold mb-1">REGISTRO DE HOY</h3>
          <p className="text-[12px] text-muted-foreground mb-4">{new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}</p>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {statusOptions.map((opt) => (
              <button key={opt.value} onClick={() => setTodayStatus(String(opt.value))}
                className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${todayStatus === String(opt.value) ? opt.color + " border-2" : "border-border/50 text-muted-foreground hover:bg-accent/50"}`}>
                <opt.icon className="h-4 w-4" /><span className="text-[13px] font-medium">{opt.label}</span>
              </button>
            ))}
          </div>
          <Textarea placeholder="Notas opcionales..." value={notes} onChange={(e) => setNotes(e.target.value)} className="rounded-xl text-[13px] mb-3" rows={2} />
          <Button onClick={() => { if (!todayStatus || !dietId) return; adherenceMut.mutate({ clientId: session.clientId, accessCode: session.accessCode, dietId, date: today, mealNumber: 0, completed: Number(todayStatus), notes: notes || undefined }); }} disabled={!todayStatus || !dietId || adherenceMut.isPending} className="w-full rounded-xl">
            {adherenceMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Registrar
          </Button>
        </div>
      )}

      {section === "metrics" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-[15px] font-semibold">MI PROGRESO</h3>
            <Button size="sm" onClick={() => setShowAddMetric(true)} className="gap-1.5 rounded-xl h-8 text-[12px]"><Plus className="h-3.5 w-3.5" />Registrar</Button>
          </div>
          {measurements.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {renderMiniChart(weightVals, "Peso", "kg", "#6BCB77")}
              {renderMiniChart(waistVals, "Cintura", "cm", "#4D96FF")}
              {renderMiniChart(hipsVals, "Cadera", "cm", "#FF6B6B")}
              {renderMiniChart(chestVals, "Pecho", "cm", "#FFD93D")}
              {renderMiniChart(armsVals, "Brazos", "cm", "#C084FC")}
            </div>
          ) : (
            <div className="text-center py-12"><TrendingUp className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" /><p className="text-[15px] font-medium">Sin registros aún</p><p className="text-[13px] text-muted-foreground mt-1">Registra tus medidas para ver tu evolución</p></div>
          )}
          {measurements.length > 0 && (
            <div className="bg-card rounded-2xl border border-border/50 p-4 space-y-3">
              <h4 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider">Historial</h4>
              <div className="space-y-2">
                {measurements.slice(0, 10).map((m: any) => (
                  <div key={m.id} className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/30">
                    <span className="text-[12px] text-muted-foreground">{new Date(m.date).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}</span>
                    <div className="flex gap-3 text-[12px]">
                      {m.weight && <span className="font-medium">{(m.weight / 1000).toFixed(1)}kg</span>}
                      {m.waist && <span>{(m.waist / 10).toFixed(1)}cm cin</span>}
                      {m.hips && <span>{(m.hips / 10).toFixed(1)}cm cad</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {section === "photos" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-[15px] font-semibold">FOTOS DE SEGUIMIENTO</h3>
            <Button size="sm" onClick={() => setShowAddPhoto(true)} className="gap-1.5 rounded-xl h-8 text-[12px]"><Camera className="h-3.5 w-3.5" />Subir foto</Button>
          </div>
          {photos.length > 0 ? (
            <div className="space-y-4">
              {Object.entries(photos.reduce((acc: Record<string, any[]>, p: any) => { const d = new Date(p.date).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" }); if (!acc[d]) acc[d] = []; acc[d].push(p); return acc; }, {})).map(([date, datePhotos]) => (
                <div key={date}>
                  <p className="text-[12px] font-medium text-muted-foreground mb-2">{date}</p>
                  <div className="grid grid-cols-3 gap-2">
                    {(datePhotos as any[]).map((p: any) => (
                      <div key={p.id} className="relative aspect-[3/4] rounded-xl overflow-hidden border border-border/50">
                        <img src={p.photoUrl} alt={photoTypeLabels[p.photoType] || p.photoType} className="w-full h-full object-cover" />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                          <span className="text-[10px] text-white font-medium">{photoTypeLabels[p.photoType] || p.photoType}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12"><ImageIcon className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" /><p className="text-[15px] font-medium">Sin fotos aún</p><p className="text-[13px] text-muted-foreground mt-1">Sube fotos de seguimiento para ver tu transformación</p></div>
          )}
        </div>
      )}

      {/* Add Metric Dialog */}
      <Dialog open={showAddMetric} onOpenChange={setShowAddMetric}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader><DialogTitle className="text-[17px]">Registrar Métricas</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label className="text-[13px]">Fecha</Label><Input type="date" value={metricForm.date} onChange={(e) => setMetricForm(f => ({ ...f, date: e.target.value }))} className="rounded-xl" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-[13px]">Peso (kg)</Label><Input type="number" step="0.1" value={metricForm.weight} onChange={(e) => setMetricForm(f => ({ ...f, weight: e.target.value }))} placeholder="75.5" className="rounded-xl" /></div>
              <div className="space-y-1.5"><Label className="text-[13px]">Cintura (cm)</Label><Input type="number" step="0.1" value={metricForm.waist} onChange={(e) => setMetricForm(f => ({ ...f, waist: e.target.value }))} placeholder="80" className="rounded-xl" /></div>
              <div className="space-y-1.5"><Label className="text-[13px]">Cadera (cm)</Label><Input type="number" step="0.1" value={metricForm.hips} onChange={(e) => setMetricForm(f => ({ ...f, hips: e.target.value }))} placeholder="95" className="rounded-xl" /></div>
              <div className="space-y-1.5"><Label className="text-[13px]">Pecho (cm)</Label><Input type="number" step="0.1" value={metricForm.chest} onChange={(e) => setMetricForm(f => ({ ...f, chest: e.target.value }))} placeholder="100" className="rounded-xl" /></div>
              <div className="space-y-1.5"><Label className="text-[13px]">Brazos (cm)</Label><Input type="number" step="0.1" value={metricForm.arms} onChange={(e) => setMetricForm(f => ({ ...f, arms: e.target.value }))} placeholder="35" className="rounded-xl" /></div>
            </div>
            <Button onClick={() => { addMetricMut.mutate({ clientId: session.clientId, accessCode: session.accessCode, date: metricForm.date, weight: metricForm.weight ? Math.round(parseFloat(metricForm.weight) * 1000) : undefined, waist: metricForm.waist ? Math.round(parseFloat(metricForm.waist) * 10) : undefined, hips: metricForm.hips ? Math.round(parseFloat(metricForm.hips) * 10) : undefined, chest: metricForm.chest ? Math.round(parseFloat(metricForm.chest) * 10) : undefined, arms: metricForm.arms ? Math.round(parseFloat(metricForm.arms) * 10) : undefined }); }} disabled={addMetricMut.isPending} className="w-full rounded-xl h-11">
              {addMetricMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Guardar Métricas
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Photo Dialog */}
      <Dialog open={showAddPhoto} onOpenChange={setShowAddPhoto}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader><DialogTitle className="text-[17px]">Subir Foto de Seguimiento</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-[13px]">Tipo de foto</Label>
              <Select value={photoForm.photoType} onValueChange={(v) => setPhotoForm(f => ({ ...f, photoType: v }))}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="front">Frente</SelectItem>
                  <SelectItem value="side">Perfil</SelectItem>
                  <SelectItem value="back">Espalda</SelectItem>
                  <SelectItem value="other">Otra</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label className="text-[13px]">Fecha</Label><Input type="date" value={photoForm.date} onChange={(e) => setPhotoForm(f => ({ ...f, date: e.target.value }))} className="rounded-xl" /></div>
            <div className="space-y-1.5">
              <Label className="text-[13px]">Foto</Label>
              <Input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0] || null; if (file && file.size > 5 * 1024 * 1024) { toast.error("Máximo 5MB"); return; } setPhotoForm(f => ({ ...f, file })); }} className="rounded-xl" />
            </div>
            <div className="space-y-1.5"><Label className="text-[13px]">Notas (opcional)</Label><Input value={photoForm.notes} onChange={(e) => setPhotoForm(f => ({ ...f, notes: e.target.value }))} placeholder="Ej: Semana 4" className="rounded-xl" /></div>
            <Button onClick={async () => { if (!photoForm.file) { toast.error("Selecciona una foto"); return; } const reader = new FileReader(); reader.onload = () => { const base64 = (reader.result as string).split(",")[1]; uploadPhotoMut.mutate({ clientId: session.clientId, accessCode: session.accessCode, photoBase64: base64, photoType: photoForm.photoType as any, date: photoForm.date, notes: photoForm.notes || undefined }); }; reader.readAsDataURL(photoForm.file); }} disabled={!photoForm.file || uploadPhotoMut.isPending} className="w-full rounded-xl h-11">
              {uploadPhotoMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Subir Foto
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Wellness Tab (Hydration + Sleep + Wellness) ──
function WellnessTab({ session }: { session: { clientId: number; name: string; accessCode: string } }) {
  const [section, setSection] = useState<"hydration" | "sleep" | "wellness">("hydration");
  const today = useMemo(() => new Date().toISOString().split("T")[0], []);
  const [glasses, setGlasses] = useState(0);
  const [goalGlasses] = useState(8);
  const [sleepForm, setSleepForm] = useState({ hours: "", quality: "3", notes: "" });
  const [wellnessForm, setWellnessForm] = useState({ energy: "3", mood: "3", digestion: "3", bloating: "3", notes: "" });

  const hydrationQ = trpc.clientPortal.getHydration.useQuery({ clientId: session.clientId, accessCode: session.accessCode });
  const sleepQ = trpc.clientPortal.getSleep.useQuery({ clientId: session.clientId, accessCode: session.accessCode });
  const wellnessQ = trpc.clientPortal.getWellness.useQuery({ clientId: session.clientId, accessCode: session.accessCode });

  const logHydrationMut = trpc.clientPortal.logHydration.useMutation({
    onSuccess: () => { toast.success("Hidratación registrada"); hydrationQ.refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const logSleepMut = trpc.clientPortal.logSleep.useMutation({
    onSuccess: () => { toast.success("Sueño registrado"); sleepQ.refetch(); setSleepForm({ hours: "", quality: "3", notes: "" }); },
    onError: (e) => toast.error(e.message),
  });
  const logWellnessMut = trpc.clientPortal.logWellness.useMutation({
    onSuccess: () => { toast.success("Bienestar registrado"); wellnessQ.refetch(); setWellnessForm({ energy: "3", mood: "3", digestion: "3", bloating: "3", notes: "" }); },
    onError: (e) => toast.error(e.message),
  });

  const hydrationLogs = hydrationQ.data || [];
  const sleepLogs = sleepQ.data || [];
  const wellnessLogs = wellnessQ.data || [];

  // Check if today already logged
  const todayHydration = hydrationLogs.find((h: any) => h.date === today);
  useEffect(() => { if (todayHydration) setGlasses((todayHydration as any).glasses); }, [todayHydration]);

  const qualityLabels = ["", "Muy mal", "Mal", "Normal", "Bien", "Muy bien"];
  const emojiScale = ["", "😫", "😕", "😐", "🙂", "😊"];

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button onClick={() => setSection("hydration")} className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-medium transition-colors ${section === "hydration" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
          <Droplets className="h-3.5 w-3.5" />Hidratación
        </button>
        <button onClick={() => setSection("sleep")} className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-medium transition-colors ${section === "sleep" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
          <Moon className="h-3.5 w-3.5" />Sueño
        </button>
        <button onClick={() => setSection("wellness")} className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-medium transition-colors ${section === "wellness" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
          <Heart className="h-3.5 w-3.5" />Bienestar
        </button>
      </div>

      {section === "hydration" && (
        <div className="space-y-4">
          <div className="bg-card rounded-2xl border border-border/50 p-5 text-center">
            <Droplets className="h-8 w-8 text-blue-400 mx-auto mb-2" />
            <h3 className="text-[17px] font-semibold mb-1">HIDRATACIÓN HOY</h3>
            <p className="text-[12px] text-muted-foreground mb-4">{new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}</p>

            {/* Glass counter */}
            <div className="flex items-center justify-center gap-4 mb-4">
              <Button variant="outline" size="icon" className="h-10 w-10 rounded-full" onClick={() => setGlasses(Math.max(0, glasses - 1))} disabled={glasses <= 0}>
                <span className="text-lg">-</span>
              </Button>
              <div className="text-center">
                <span className="text-[32px] font-bold text-blue-400">{glasses}</span>
                <span className="text-[14px] text-muted-foreground">/{goalGlasses}</span>
                <p className="text-[11px] text-muted-foreground">vasos (250ml)</p>
              </div>
              <Button variant="outline" size="icon" className="h-10 w-10 rounded-full" onClick={() => setGlasses(glasses + 1)}>
                <span className="text-lg">+</span>
              </Button>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-secondary rounded-full h-3 mb-4">
              <div className="bg-blue-400 h-3 rounded-full transition-all" style={{ width: `${Math.min(100, (glasses / goalGlasses) * 100)}%` }} />
            </div>
            <p className="text-[12px] text-muted-foreground mb-4">{glasses >= goalGlasses ? "Meta alcanzada" : `Faltan ${goalGlasses - glasses} vasos`}</p>

            <Button onClick={() => logHydrationMut.mutate({ clientId: session.clientId, accessCode: session.accessCode, date: today, glasses, goalGlasses })} disabled={logHydrationMut.isPending} className="w-full rounded-xl">
              {logHydrationMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Guardar
            </Button>
          </div>

          {/* History */}
          {hydrationLogs.length > 0 && (
            <div className="bg-card rounded-2xl border border-border/50 p-4">
              <h4 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Últimos 7 días</h4>
              <div className="flex items-end gap-2 h-20">
                {hydrationLogs.slice(0, 7).reverse().map((h: any, i: number) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] font-medium">{h.glasses}</span>
                    <div className="w-full bg-secondary rounded-t" style={{ height: `${Math.max(8, (h.glasses / (h.goalGlasses || 8)) * 100)}%`, backgroundColor: h.glasses >= (h.goalGlasses || 8) ? "#6BCB77" : "#4D96FF" }} />
                    <span className="text-[9px] text-muted-foreground">{new Date(h.date).toLocaleDateString("es-ES", { weekday: "short" }).slice(0, 2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {section === "sleep" && (
        <div className="space-y-4">
          <div className="bg-card rounded-2xl border border-border/50 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Moon className="h-5 w-5 text-indigo-400" />
              <h3 className="text-[17px] font-semibold">REGISTRO DE SUEÑO</h3>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[13px]">Horas dormidas</Label>
                <Input type="number" step="0.5" min="0" max="24" value={sleepForm.hours} onChange={(e) => setSleepForm(f => ({ ...f, hours: e.target.value }))} placeholder="7.5" className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[13px]">Calidad del sueño</Label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((q) => (
                    <button key={q} onClick={() => setSleepForm(f => ({ ...f, quality: String(q) }))}
                      className={`flex-1 py-2 rounded-xl text-center transition-all ${Number(sleepForm.quality) === q ? "bg-indigo-500 text-white" : "bg-secondary text-muted-foreground hover:bg-accent"}`}>
                      <div className="text-lg">{emojiScale[q]}</div>
                      <div className="text-[10px]">{qualityLabels[q]}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[13px]">Notas (opcional)</Label>
                <Input value={sleepForm.notes} onChange={(e) => setSleepForm(f => ({ ...f, notes: e.target.value }))} placeholder="Ej: Me desperté 2 veces" className="rounded-xl" />
              </div>
              <Button onClick={() => { if (!sleepForm.hours) { toast.error("Indica las horas"); return; } logSleepMut.mutate({ clientId: session.clientId, accessCode: session.accessCode, date: today, hoursSlept: Math.round(parseFloat(sleepForm.hours) * 60), quality: Number(sleepForm.quality), notes: sleepForm.notes || undefined }); }} disabled={logSleepMut.isPending} className="w-full rounded-xl">
                {logSleepMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Registrar Sueño
              </Button>
            </div>
          </div>

          {/* Sleep history */}
          {sleepLogs.length > 0 && (
            <div className="bg-card rounded-2xl border border-border/50 p-4">
              <h4 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Historial</h4>
              <div className="space-y-2">
                {sleepLogs.slice(0, 7).map((s: any) => (
                  <div key={s.id} className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/30">
                    <span className="text-[12px] text-muted-foreground">{new Date(s.date).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}</span>
                    <div className="flex items-center gap-3 text-[12px]">
                      <span className="font-medium">{(s.hoursSlept / 60).toFixed(1)}h</span>
                      <span>{emojiScale[s.quality] || ""}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {section === "wellness" && (
        <div className="space-y-4">
          <div className="bg-card rounded-2xl border border-border/50 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Heart className="h-5 w-5 text-rose-400" />
              <h3 className="text-[17px] font-semibold">CHECK-IN DE BIENESTAR</h3>
            </div>
            <p className="text-[12px] text-muted-foreground mb-4">Valora del 1 al 5 cómo te sientes hoy</p>

            {[
              { key: "energy", label: "Energía", icon: "⚡" },
              { key: "mood", label: "Estado de ánimo", icon: "😊" },
              { key: "digestion", label: "Digestión", icon: "🫃" },
              { key: "bloating", label: "Hinchazón", icon: "🎈" },
            ].map(({ key, label, icon }) => (
              <div key={key} className="mb-4">
                <Label className="text-[13px] flex items-center gap-1.5 mb-2"><span>{icon}</span>{label}</Label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((v) => (
                    <button key={v} onClick={() => setWellnessForm(f => ({ ...f, [key]: String(v) }))}
                      className={`flex-1 py-2 rounded-xl text-[13px] font-medium transition-all ${Number((wellnessForm as any)[key]) === v ? "bg-rose-500 text-white" : "bg-secondary text-muted-foreground hover:bg-accent"}`}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <div className="space-y-1.5 mb-4">
              <Label className="text-[13px]">Notas (opcional)</Label>
              <Input value={wellnessForm.notes} onChange={(e) => setWellnessForm(f => ({ ...f, notes: e.target.value }))} placeholder="Ej: Dolor de cabeza por la tarde" className="rounded-xl" />
            </div>

            <Button onClick={() => { logWellnessMut.mutate({ clientId: session.clientId, accessCode: session.accessCode, date: today, energy: Number(wellnessForm.energy), mood: Number(wellnessForm.mood), digestion: Number(wellnessForm.digestion), bloating: Number(wellnessForm.bloating), notes: wellnessForm.notes || undefined }); }} disabled={logWellnessMut.isPending} className="w-full rounded-xl">
              {logWellnessMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Registrar Bienestar
            </Button>
          </div>

          {/* Wellness history */}
          {wellnessLogs.length > 0 && (
            <div className="bg-card rounded-2xl border border-border/50 p-4">
              <h4 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Historial</h4>
              <div className="space-y-2">
                {wellnessLogs.slice(0, 7).map((w: any) => (
                  <div key={w.id} className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/30">
                    <span className="text-[12px] text-muted-foreground">{new Date(w.date).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}</span>
                    <div className="flex gap-2 text-[11px]">
                      <span>⚡{w.energy}</span><span>😊{w.mood}</span><span>🫃{w.digestion}</span><span>🎈{w.bloating}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Fasting Timer */}
      <FastingTimer />
    </div>
  );
}

// ── Fasting Timer Component ──
function FastingTimer() {
  const [protocol, setProtocol] = useState("16/8");
  const protocols: Record<string, { fast: number; eat: number }> = {
    "16/8": { fast: 16, eat: 8 },
    "18/6": { fast: 18, eat: 6 },
    "20/4": { fast: 20, eat: 4 },
  };
  const [startTime, setStartTime] = useState<number | null>(() => {
    try {
      const saved = localStorage.getItem("fastingStart");
      return saved ? parseInt(saved) : null;
    } catch { return null; }
  });
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const startFast = () => {
    const t = Date.now();
    setStartTime(t);
    localStorage.setItem("fastingStart", String(t));
    localStorage.setItem("fastingProtocol", protocol);
    toast.success(`Ayuno ${protocol} iniciado`);
  };

  const stopFast = () => {
    setStartTime(null);
    localStorage.removeItem("fastingStart");
    localStorage.removeItem("fastingProtocol");
  };

  // Restore protocol from storage
  useEffect(() => {
    const saved = localStorage.getItem("fastingProtocol");
    if (saved && protocols[saved]) setProtocol(saved);
  }, []);

  const p = protocols[protocol];
  const fastMs = p.fast * 60 * 60 * 1000;
  const elapsed = startTime ? now - startTime : 0;
  const progress = startTime ? Math.min(elapsed / fastMs, 1) : 0;
  const remaining = startTime ? Math.max(fastMs - elapsed, 0) : fastMs;
  const isComplete = progress >= 1;

  const formatTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const circumference = 2 * Math.PI * 54;
  const dashOffset = circumference * (1 - progress);

  return (
    <div className="bg-card rounded-2xl border border-border/50 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Clock className="h-4.5 w-4.5 text-primary" />
        <h3 className="text-[15px] font-semibold uppercase tracking-wider">Ayuno Intermitente</h3>
      </div>

      {/* Protocol selector */}
      {!startTime && (
        <div className="flex gap-2">
          {Object.keys(protocols).map((p) => (
            <button key={p} onClick={() => setProtocol(p)} className={`flex-1 py-2 rounded-xl text-[13px] font-medium transition-all ${protocol === p ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>{p}</button>
          ))}
        </div>
      )}

      {/* Timer circle */}
      <div className="flex flex-col items-center py-4">
        <div className="relative w-[140px] h-[140px]">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" strokeWidth="6" className="text-secondary" />
            <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" strokeWidth="6" strokeDasharray={circumference} strokeDashoffset={dashOffset} strokeLinecap="round" className={isComplete ? "text-emerald-500" : "text-primary"} style={{ transition: "stroke-dashoffset 1s linear" }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[22px] font-bold tabular-nums">{startTime ? formatTime(remaining) : formatTime(fastMs)}</span>
            <span className="text-[11px] text-muted-foreground">{startTime ? (isComplete ? "Completado" : "Restante") : "Duraci\u00f3n"}</span>
          </div>
        </div>

        {startTime && (
          <div className="flex gap-6 mt-3 text-[12px] text-muted-foreground">
            <div className="text-center">
              <p className="font-medium text-foreground">{new Date(startTime).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}</p>
              <p>Inicio</p>
            </div>
            <div className="text-center">
              <p className="font-medium text-foreground">{new Date(startTime + fastMs).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}</p>
              <p>Fin ayuno</p>
            </div>
            <div className="text-center">
              <p className="font-medium text-foreground">{Math.round(progress * 100)}%</p>
              <p>Progreso</p>
            </div>
          </div>
        )}
      </div>

      {/* Start/Stop button */}
      {!startTime ? (
        <Button onClick={startFast} className="w-full rounded-xl h-11 gap-2">
          <Clock className="h-4 w-4" />Iniciar Ayuno {protocol}
        </Button>
      ) : isComplete ? (
        <Button onClick={stopFast} variant="outline" className="w-full rounded-xl h-11 gap-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50">
          <CheckCircle2 className="h-4 w-4" />Ayuno Completado — Finalizar
        </Button>
      ) : (
        <Button onClick={stopFast} variant="outline" className="w-full rounded-xl h-11 gap-2 text-destructive hover:bg-destructive/5">
          <XCircle className="h-4 w-4" />Cancelar Ayuno
        </Button>
      )}

      {/* Info */}
      <div className="bg-secondary/50 rounded-xl p-3">
        <p className="text-[12px] text-muted-foreground">
          <strong>Protocolo {protocol}:</strong> {p.fast}h de ayuno + {p.eat}h ventana de alimentaci\u00f3n. 
          {protocol === "16/8" && " Ideal para principiantes. Ej: comer de 12:00 a 20:00."}
          {protocol === "18/6" && " Intermedio. Ej: comer de 13:00 a 19:00."}
          {protocol === "20/4" && " Avanzado (Warrior Diet). Ej: comer de 16:00 a 20:00."}
        </p>
      </div>
    </div>
  );
}

// ── Shopping Tab (Interactive Shopping List) ──
function ShoppingTab({ session, archetype }: { session: { clientId: number; name: string; accessCode: string }; archetype?: ArchetypeId }) {
  const shoppingQ = trpc.clientPortal.getShoppingList.useQuery({ clientId: session.clientId, accessCode: session.accessCode });
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const toggleItem = (text: string) => {
    setChecked(prev => {
      const next = new Set(prev);
      if (next.has(text)) next.delete(text); else next.add(text);
      return next;
    });
  };

  if (shoppingQ.isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  const sections = shoppingQ.data?.sections || [];

  if (sections.length === 0) return (
    <div className="text-center py-16">
      <ShoppingCart className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
      <p className="text-[15px] font-medium">Sin lista de la compra</p>
      <p className="text-[13px] text-muted-foreground mt-1">Necesitas una dieta asignada para generar la lista</p>
    </div>
  );

  const totalItems = sections.reduce((acc: number, s: any) => acc + s.items.length, 0);
  const checkedCount = checked.size;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-[15px] font-semibold">LISTA DE LA COMPRA</h3>
        <span className="text-[12px] text-muted-foreground">{checkedCount}/{totalItems} completados</span>
      </div>

      {/* Progress */}
      <div className="w-full bg-secondary rounded-full h-2">
        <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${totalItems > 0 ? (checkedCount / totalItems) * 100 : 0}%` }} />
      </div>

      {sections.map((section: any) => (
        <div key={section.name} className="bg-card rounded-2xl border border-border/50 overflow-hidden">
          <div className="px-4 py-2.5 bg-secondary/30 border-b border-border/30">
            <h4 className="text-[13px] font-semibold uppercase tracking-wider">{section.name}</h4>
          </div>
          <div className="divide-y divide-border/30">
            {section.items.map((item: any, i: number) => (
              <button key={i} onClick={() => toggleItem(item.text)} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-accent/30 transition-colors">
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${checked.has(item.text) ? "bg-primary border-primary" : "border-border"}`}>
                  {checked.has(item.text) && <CheckCircle2 className="h-3.5 w-3.5 text-primary-foreground" />}
                </div>
                <span className={`text-[13px] flex-1 ${checked.has(item.text) ? "line-through text-muted-foreground" : ""}`}>{item.text}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Weekend Tab ─── */
function WeekendTab({ session }: { session: { clientId: number; name: string; accessCode: string } }) {
  const now = new Date();
  const weekendDate = now.toISOString().split("T")[0];
  const feedbackQ = trpc.clientPortal.getWeekendFeedbackHistory.useQuery({ clientId: session.clientId, accessCode: session.accessCode });
  const mealsQ = trpc.clientPortal.getWeekendMeals.useQuery({ clientId: session.clientId, accessCode: session.accessCode });
  const addFeedbackMut = trpc.clientPortal.getWeekendFeedback.useMutation({ onSuccess: () => { toast.success("Feedback guardado"); feedbackQ.refetch(); } });
  const addMealMut = trpc.clientPortal.addWeekendMeal.useMutation({ onSuccess: () => { toast.success("Comida registrada"); mealsQ.refetch(); setMealForm({ description: "", mealType: "almuerzo", photo: "" }); } });

  const [showMeal, setShowMeal] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({ date: new Date().toISOString().split("T")[0], notes: "" });
  const [mealForm, setMealForm] = useState({ description: "", mealType: "almuerzo", photo: "" });

  const isWeekend = [0, 6].includes(new Date().getDay());

  return (
    <div className="space-y-4">
      {/* Weekend header */}
      <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-2xl border border-amber-500/20 p-5">
        <div className="flex items-center gap-3 mb-2">
          <Calendar className="h-5 w-5 text-amber-500" />
          <h2 className="text-[17px] font-bold uppercase tracking-wider">FIN DE SEMANA</h2>
        </div>
        <p className="text-[13px] text-muted-foreground">
          {isWeekend
            ? "Es fin de semana. Registra tus comidas y cómo te has sentido para que tu entrenador pueda ajustar tu plan."
            : "Aquí puedes revisar tus registros de fin de semana y prepararte para el próximo."}
        </p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => setShowMeal(true)} className="bg-card rounded-2xl border border-border/50 p-4 text-left hover:bg-accent/30 transition-colors">
          <Utensils className="h-5 w-5 text-primary mb-2" />
          <p className="text-[13px] font-semibold">Registrar Comida</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Anota lo que has comido</p>
        </button>
        <button onClick={() => {
          const el = document.getElementById('ai-feedback-section');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
          else toast.info("Registra comidas primero para obtener tu valoración IA");
        }} className="bg-card rounded-2xl border border-border/50 p-4 text-left hover:bg-accent/30 transition-colors">
          <Award className="h-5 w-5 text-amber-500 mb-2" />
          <p className="text-[13px] font-semibold">Valoración IA</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Análisis y ajustes</p>
        </button>
      </div>

      {/* Recent weekend meals */}
      <div className="bg-card rounded-2xl border border-border/50 p-5 space-y-3">
        <h3 className="text-[15px] font-semibold">Comidas de Fin de Semana</h3>
        {(mealsQ.data || []).length === 0 ? (
          <p className="text-[13px] text-muted-foreground text-center py-6">Sin comidas registradas aún. Pulsa "Registrar Comida" para empezar.</p>
        ) : (
          <div className="space-y-2">
            {(mealsQ.data || []).slice(0, 20).map((meal: any) => (
              <div key={meal.id} className="flex items-start gap-3 p-3 rounded-xl bg-secondary/30">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                  <Utensils className="h-4 w-4 text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-medium capitalize">{meal.mealType}</span>
                    <span className="text-[10px] text-muted-foreground">{new Date(meal.date).toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" })}</span>
                  </div>
                  <p className="text-[13px] mt-0.5">{meal.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Feedback button */}
      {(mealsQ.data || []).length > 0 && (
        <div id="ai-feedback-section" className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl border border-primary/20 p-5">
          <div className="flex items-center gap-3 mb-2">
            <Award className="h-5 w-5 text-primary" />
            <h3 className="text-[15px] font-semibold">Obtener Valoración IA</h3>
          </div>
          <p className="text-[13px] text-muted-foreground mb-3">Basada en tus comidas registradas, la IA analizará tu fin de semana y te dará recomendaciones personalizadas para los próximos días.</p>
          <div className="space-y-2 mb-3">
            <Label className="text-[13px]">Notas sobre tu fin de semana (opcional)</Label>
            <Textarea value={feedbackForm.notes} onChange={(e) => setFeedbackForm(f => ({ ...f, notes: e.target.value }))} placeholder="¿Cómo te has sentido? ¿Alguna comida fuera de lo habitual? ¿Evento social?" rows={2} className="rounded-xl text-[13px]" />
          </div>
          <Button onClick={() => {
            addFeedbackMut.mutate({ clientId: session.clientId, accessCode: session.accessCode, weekendDate: feedbackForm.date, clientNotes: feedbackForm.notes || undefined });
          }} disabled={addFeedbackMut.isPending} className="w-full rounded-xl h-11">
            {addFeedbackMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {addFeedbackMut.isPending ? "Analizando tu fin de semana..." : "Obtener Valoración y Ajustes"}
          </Button>
        </div>
      )}

      {/* Weekend feedback history with AI analysis */}
      <div className="bg-card rounded-2xl border border-border/50 p-5 space-y-3">
        <h3 className="text-[15px] font-semibold">Valoraciones y Ajustes</h3>
        {(feedbackQ.data || []).length === 0 ? (
          <p className="text-[13px] text-muted-foreground text-center py-6">Sin valoraciones aún. Registra tus comidas y solicita una valoración IA.</p>
        ) : (
          <div className="space-y-4">
            {(feedbackQ.data || []).slice(0, 10).map((fb: any) => (
              <div key={fb.id} className="rounded-xl border border-border/50 overflow-hidden">
                <div className="flex items-center justify-between p-3 bg-secondary/30">
                  <p className="text-[12px] text-muted-foreground">{new Date(fb.date).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}</p>
                  {fb.score != null && (
                    <span className={`text-[13px] font-bold px-2.5 py-0.5 rounded-lg ${fb.score >= 7 ? 'bg-green-500/10 text-green-600' : fb.score >= 4 ? 'bg-amber-500/10 text-amber-600' : 'bg-red-500/10 text-red-500'}`}>
                      {fb.score}/10
                    </span>
                  )}
                </div>
                {fb.feedback && (
                  <div className="p-3 text-[13px] leading-relaxed whitespace-pre-wrap">{fb.feedback}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Meal Dialog */}
      <Dialog open={showMeal} onOpenChange={setShowMeal}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Registrar Comida de Fin de Semana</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-[13px]">Tipo de comida</Label>
              <Select value={mealForm.mealType} onValueChange={(v) => setMealForm(f => ({ ...f, mealType: v }))}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="desayuno">Desayuno</SelectItem>
                  <SelectItem value="almuerzo">Almuerzo</SelectItem>
                  <SelectItem value="cena">Cena</SelectItem>
                  <SelectItem value="snack">Snack</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px]">¿Qué has comido?</Label>
              <Textarea value={mealForm.description} onChange={(e) => setMealForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe lo que has comido..." rows={3} className="rounded-xl" />
            </div>
            <Button onClick={() => {
              if (!mealForm.description.trim()) { toast.error("Describe lo que has comido"); return; }
              addMealMut.mutate({ clientId: session.clientId, accessCode: session.accessCode, date: new Date().toISOString().split("T")[0], mealType: mealForm.mealType, description: mealForm.description });
            }} disabled={addMealMut.isPending} className="w-full rounded-xl h-11">
              {addMealMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Guardar Comida
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Old feedback dialog removed - now inline AI feedback */}
    </div>
  );
}

// ── Assistant Tab (AI Chat) ──
function AssistantTab({ session, archetype, accentColor }: { session: { clientId: number; name: string; accessCode: string }; archetype?: ArchetypeId; accentColor: string }) {
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string; timestamp: number }>>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const archetypeData = archetype ? ARCHETYPES.find(a => a.id === archetype) : null;

  // Load chat history
  const historyQ = trpc.clientPortal.aiChatHistory.useQuery(
    { clientId: session.clientId, accessCode: session.accessCode },
    { refetchOnWindowFocus: false }
  );

  useEffect(() => {
    if (historyQ.data && historyQ.data.length > 0) {
      const latest = historyQ.data[0];
      if (latest?.messages) {
        setMessages(latest.messages as any[]);
      }
    }
  }, [historyQ.data]);

  const chatMut = trpc.clientPortal.aiChat.useMutation({
    onSuccess: (data) => {
      setMessages(prev => [...prev, { role: "assistant", content: data.reply, timestamp: Date.now() }]);
    },
    onError: (e) => toast.error(e.message),
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, chatMut.isPending]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || chatMut.isPending) return;
    setMessages(prev => [...prev, { role: "user", content: trimmed, timestamp: Date.now() }]);
    setInput("");
    chatMut.mutate({ clientId: session.clientId, accessCode: session.accessCode, message: trimmed });
    inputRef.current?.focus();
  };

  const suggestedPrompts = [
    "\u00bfQu\u00e9 puedo comer como snack saludable?",
    "\u00bfC\u00f3mo puedo mejorar mi adherencia?",
    "Tengo hambre entre comidas, \u00bfqu\u00e9 hago?",
    "\u00bfPuedo sustituir alg\u00fan alimento de mi dieta?",
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-card text-card-foreground rounded-2xl shadow-sm p-4 flex items-center gap-3" style={{ borderLeft: `3px solid ${accentColor}` }}>
        {archetypeData ? (
          <img src={archetypeData.image} alt={archetypeData.name} className="h-12 w-12 object-contain" />
        ) : (
          <Bot className="h-8 w-8 text-primary" />
        )}
        <div>
          <h3 className="font-semibold text-[15px]">Asistente NutriFlow</h3>
          <p className="text-[12px] text-muted-foreground">Tu asistente nutricional 24/7. Pregunta lo que necesites sobre tu dieta.</p>
        </div>
      </div>

      {/* Chat area */}
      <div className="bg-card text-card-foreground rounded-2xl shadow-sm overflow-hidden" style={{ height: "calc(100vh - 340px)", minHeight: "400px" }}>
        <div ref={scrollRef} className="h-full overflow-y-auto p-4 space-y-3" style={{ paddingBottom: "80px" }}>
          {messages.length === 0 && !historyQ.isLoading && (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              {archetypeData && (
                <img src={archetypeData.image} alt={archetypeData.name} className="h-20 w-20 object-contain opacity-60" />
              )}
              <p className="text-muted-foreground text-sm">\u00a1Hola {session.name}! Soy tu asistente. Preg\u00fantame lo que necesites.</p>
              <div className="flex flex-wrap justify-center gap-2">
                {suggestedPrompts.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => { setInput(prompt); }}
                    className="text-[12px] px-3 py-1.5 rounded-full border border-border/50 text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && archetypeData && (
                <img src={archetypeData.image} alt="" className="h-7 w-7 object-contain mt-1 flex-shrink-0" />
              )}
              <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                msg.role === "user"
                  ? "text-white"
                  : "bg-muted/50 text-card-foreground"
              }`} style={msg.role === "user" ? { backgroundColor: accentColor } : undefined}>
                {msg.content.split("\n").map((line, j) => (
                  <p key={j} className={j > 0 ? "mt-1.5" : ""}>{line}</p>
                ))}
              </div>
              {msg.role === "user" && (
                <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center mt-1 flex-shrink-0">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}

          {chatMut.isPending && (
            <div className="flex gap-2 items-start">
              {archetypeData && <img src={archetypeData.image} alt="" className="h-7 w-7 object-contain mt-1" />}
              <div className="bg-muted/50 rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: accentColor, animationDelay: "0ms" }} />
                  <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: accentColor, animationDelay: "150ms" }} />
                  <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: accentColor, animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-border/30 bg-card" style={{ position: "sticky" }}>
          <div className="flex gap-2 items-end">
            <Textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Escribe tu pregunta..."
              className="flex-1 min-h-[40px] max-h-[100px] resize-none text-[13px] rounded-xl"
              rows={1}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || chatMut.isPending}
              size="icon"
              className="h-10 w-10 rounded-xl flex-shrink-0"
              style={{ backgroundColor: accentColor }}
            >
              {chatMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Activity Tab (Wearables / Manual) ──
function ActivityTab({ session, accentColor }: { session: { clientId: number; name: string; accessCode: string }; accentColor: string }) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [steps, setSteps] = useState("");
  const [activeMinutes, setActiveMinutes] = useState("");
  const [caloriesBurned, setCaloriesBurned] = useState("");

  const activityQ = trpc.clientPortal.getActivityLogs.useQuery(
    { clientId: session.clientId, accessCode: session.accessCode },
    { refetchOnWindowFocus: false }
  );

  const logMut = trpc.clientPortal.logActivity.useMutation({
    onSuccess: () => {
      toast.success("Actividad registrada");
      activityQ.refetch();
      setSteps(""); setActiveMinutes(""); setCaloriesBurned("");
    },
    onError: (e) => toast.error(e.message),
  });

  const handleLog = () => {
    if (!steps && !activeMinutes && !caloriesBurned) {
      toast.error("Introduce al menos un dato");
      return;
    }
    logMut.mutate({
      clientId: session.clientId,
      accessCode: session.accessCode,
      date,
      steps: steps ? parseInt(steps) : undefined,
      activeMinutes: activeMinutes ? parseInt(activeMinutes) : undefined,
      caloriesBurned: caloriesBurned ? parseInt(caloriesBurned) : undefined,
      source: "manual",
    });
  };

  const weekData = (activityQ.data || []).slice(0, 7).reverse();
  const maxSteps = Math.max(...weekData.map(d => d.steps || 0), 1);

  return (
    <div className="space-y-4">
      {/* Quick log */}
      <div className="bg-card text-card-foreground rounded-2xl shadow-sm p-4 space-y-3">
        <h3 className="font-semibold text-[15px] flex items-center gap-2">
          <Activity className="h-4 w-4" style={{ color: accentColor }} />
          Registrar Actividad
        </h3>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-xl" />
        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label className="text-[11px] text-muted-foreground">Pasos</Label>
            <Input type="number" placeholder="0" value={steps} onChange={(e) => setSteps(e.target.value)} className="rounded-xl" />
          </div>
          <div>
            <Label className="text-[11px] text-muted-foreground">Min. activos</Label>
            <Input type="number" placeholder="0" value={activeMinutes} onChange={(e) => setActiveMinutes(e.target.value)} className="rounded-xl" />
          </div>
          <div>
            <Label className="text-[11px] text-muted-foreground">Cal. quemadas</Label>
            <Input type="number" placeholder="0" value={caloriesBurned} onChange={(e) => setCaloriesBurned(e.target.value)} className="rounded-xl" />
          </div>
        </div>
        <Button onClick={handleLog} disabled={logMut.isPending} className="w-full rounded-xl" style={{ backgroundColor: accentColor }}>
          {logMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
          Registrar
        </Button>
      </div>

      {/* Weekly chart */}
      <div className="bg-card text-card-foreground rounded-2xl shadow-sm p-4">
        <h3 className="font-semibold text-[15px] mb-3">Pasos \u00faltimos 7 d\u00edas</h3>
        {weekData.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-6">Sin datos de actividad a\u00fan</p>
        ) : (
          <div className="flex items-end gap-1 h-32">
            {weekData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] text-muted-foreground">{(d.steps || 0).toLocaleString()}</span>
                <div
                  className="w-full rounded-t-md transition-all"
                  style={{
                    height: `${Math.max(4, ((d.steps || 0) / maxSteps) * 100)}%`,
                    backgroundColor: accentColor,
                    opacity: 0.7 + ((d.steps || 0) / maxSteps) * 0.3,
                  }}
                />
                <span className="text-[9px] text-muted-foreground">{d.date.slice(5)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* History */}
      <div className="bg-card text-card-foreground rounded-2xl shadow-sm p-4">
        <h3 className="font-semibold text-[15px] mb-3">Historial</h3>
        {activityQ.isLoading ? (
          <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : (activityQ.data || []).length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-4">No hay registros de actividad</p>
        ) : (
          <div className="space-y-2">
            {(activityQ.data || []).slice(0, 14).map((log) => (
              <div key={log.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                <div>
                  <p className="text-[13px] font-medium">{log.date}</p>
                  <p className="text-[11px] text-muted-foreground">{log.source}</p>
                </div>
                <div className="flex gap-4 text-right">
                  {log.steps != null && <div><p className="text-[13px] font-semibold" style={{ color: accentColor }}>{log.steps.toLocaleString()}</p><p className="text-[9px] text-muted-foreground">pasos</p></div>}
                  {log.activeMinutes != null && <div><p className="text-[13px] font-semibold">{log.activeMinutes}</p><p className="text-[9px] text-muted-foreground">min</p></div>}
                  {log.caloriesBurned != null && <div><p className="text-[13px] font-semibold">{log.caloriesBurned}</p><p className="text-[9px] text-muted-foreground">kcal</p></div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Wearable connections placeholder */}
      <div className="bg-card text-card-foreground rounded-2xl shadow-sm p-4">
        <h3 className="font-semibold text-[15px] mb-2">Dispositivos</h3>
        <p className="text-[12px] text-muted-foreground mb-3">Conecta tu wearable para sincronizar datos autom\u00e1ticamente.</p>
        <div className="grid grid-cols-2 gap-2">
          {["Fitbit", "Garmin", "Apple Health", "Google Fit"].map((provider) => (
            <button
              key={provider}
              onClick={() => toast.info("Integraci\u00f3n con " + provider + " pr\u00f3ximamente")}
              className="flex items-center gap-2 p-3 rounded-xl border border-border/50 text-[12px] text-muted-foreground hover:border-foreground/30 transition-colors"
            >
              <Activity className="h-4 w-4" />
              {provider}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
