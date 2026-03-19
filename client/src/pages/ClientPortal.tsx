import { useState, useMemo, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, LogIn, Send, Trophy, CheckCircle2, XCircle, MinusCircle, ArrowLeft, MessageSquare, Calendar, Award, User, Utensils, TrendingUp, Camera, Plus, ImageIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// ── Client Portal: Login + Dashboard ──
export default function ClientPortal() {
  const [accessCode, setAccessCode] = useState("");
  const [session, setSession] = useState<{ clientId: number; name: string; accessCode: string } | null>(() => {
    try {
      const saved = localStorage.getItem("clientPortalSession");
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const loginMut = trpc.clientPortal.loginByCode.useMutation({
    onSuccess: (data) => {
      const s = { clientId: data.clientId, name: data.name, accessCode };
      setSession(s);
      localStorage.setItem("clientPortalSession", JSON.stringify(s));
      toast.success(`Bienvenido/a, ${data.name}`);
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
            <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663395627355/JuA5L95oAvQY6eqfSgbwUN/nutriflow_logo_43762e41.webp" alt="NutriFlow" className="h-14 object-contain mx-auto mb-4" />
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

  return <ClientDashboard session={session} onLogout={handleLogout} />;
}

// ── Client Dashboard (after login) ──
function ClientDashboard({ session, onLogout }: { session: { clientId: number; name: string; accessCode: string }; onLogout: () => void }) {
  const [tab, setTab] = useState<"diet" | "adherence" | "chat" | "achievements" | "progress">("diet");

  const profileQ = trpc.clientPortal.getProfile.useQuery({ clientId: session.clientId, accessCode: session.accessCode });
  const dietQ = trpc.clientPortal.getActiveDiet.useQuery({ clientId: session.clientId, accessCode: session.accessCode });

  const tabs = [
    { id: "diet" as const, label: "Mi Dieta", icon: Utensils },
    { id: "adherence" as const, label: "Adherencia", icon: Calendar },
    { id: "chat" as const, label: "Chat", icon: MessageSquare },
    { id: "progress" as const, label: "Progreso", icon: TrendingUp },
    { id: "achievements" as const, label: "Logros", icon: Award },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663395627355/JuA5L95oAvQY6eqfSgbwUN/nutriflow_logo_43762e41.webp" alt="NutriFlow" className="h-8 object-contain" />
            <div>
              <h1 className="text-[17px] font-semibold tracking-tight uppercase">{session.name}</h1>
              {profileQ.data?.goal && <p className="text-[12px] text-muted-foreground">{profileQ.data.goal}</p>}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onLogout} className="text-[13px] text-muted-foreground">
            Cerrar sesión
          </Button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="sticky top-[57px] z-30 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-2xl mx-auto px-4 flex gap-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-[13px] font-medium border-b-2 transition-colors ${
                tab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {tab === "diet" && <DietTab dietQ={dietQ} />}
        {tab === "adherence" && <AdherenceTab session={session} dietId={dietQ.data?.id} />}
        {tab === "chat" && <ChatTab session={session} />}
        {tab === "progress" && <ProgressTab session={session} />}
        {tab === "achievements" && <AchievementsTab session={session} />}
      </div>

      {/* Mobile bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-xl border-t border-border/50 md:hidden safe-area-bottom">
        <div className="flex justify-around py-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 ${
                tab === t.id ? "text-primary" : "text-muted-foreground"
              }`}
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
function DietTab({ dietQ }: { dietQ: any }) {
  if (dietQ.isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (!dietQ.data) return (
    <div className="text-center py-16">
      <Utensils className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
      <p className="text-[15px] font-medium">Sin dieta asignada</p>
      <p className="text-[13px] text-muted-foreground mt-1">Tu entrenador aún no te ha asignado un plan nutricional</p>
    </div>
  );

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

      {diet.menus?.map((menu: any, mi: number) => (
        <div key={mi} className="space-y-3">
          <h3 className="text-[15px] font-semibold text-muted-foreground">Día {mi + 1}</h3>
          {menu.meals?.map((meal: any, mealIdx: number) => {
            // Calculate real totals from foods
            const mealTotals = (meal.foods || []).reduce(
              (acc: any, f: any) => ({
                calories: acc.calories + (f.calories || 0),
                protein: acc.protein + (f.protein || 0),
                carbs: acc.carbs + (f.carbs || 0),
                fats: acc.fats + (f.fats || 0),
              }),
              { calories: 0, protein: 0, carbs: 0, fats: 0 }
            );
            return (
              <div key={mealIdx} className="bg-card rounded-xl border border-border/50 p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[14px] font-semibold">{meal.mealName}</h4>
                  <span className="text-[12px] text-muted-foreground">{mealTotals.calories} kcal</span>
                </div>
                {meal.description && (
                  <p className="text-[12px] text-primary/80 italic mb-2">{meal.description}</p>
                )}
                <div className="space-y-1.5">
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
              </div>
            );
          })}
        </div>
      ))}
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
