import { useState, useMemo, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from "chart.js";
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  ArrowLeft, User, Activity, Camera, ClipboardCheck, MessageCircle,
  Ruler, Trophy, FileText, Send, Loader2, Plus, Trash2, Star,
  Sparkles, Brain, Zap, CheckCircle2, XCircle, Edit2, Save, X,
  TrendingDown, TrendingUp, Minus, BarChart3, Download, UtensilsCrossed, Link2, ExternalLink,
  Tag, Heart, Copy, Search
} from "lucide-react";
import { ARCHETYPES } from "@shared/constants";

/* ─── Chart.js Evolution Chart ─── */
function EvolutionChart({ data, labels, color = "#007AFF", unit = "", height = 160 }: { data: number[]; labels: string[]; color?: string; unit?: string; height?: number }) {
  if (data.length === 0) return <p className="text-[13px] text-muted-foreground text-center py-6">Sin registros aún</p>;
  if (data.length === 1) return (
    <div className="flex flex-col items-center justify-center py-6">
      <div className="text-3xl font-bold" style={{ color }}>{data[0]}{unit}</div>
      <p className="text-[12px] text-muted-foreground mt-1">{labels[0]}</p>
    </div>
  );
  const chartData = {
    labels,
    datasets: [{
      data,
      borderColor: color,
      backgroundColor: color + "18",
      fill: true,
      tension: 0.35,
      pointRadius: 4,
      pointHoverRadius: 6,
      pointBackgroundColor: color,
      pointBorderColor: "#fff",
      pointBorderWidth: 2,
      borderWidth: 2.5,
    }],
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(0,0,0,0.8)",
        titleFont: { size: 12, family: "Inter" },
        bodyFont: { size: 13, family: "Inter", weight: "bold" as const },
        padding: 10,
        cornerRadius: 10,
        callbacks: { label: (ctx: any) => `${ctx.parsed.y.toFixed(1)} ${unit}` },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 10, family: "Inter" }, color: "#999", maxTicksLimit: 8 }, border: { display: false } },
      y: { grid: { color: "rgba(0,0,0,0.04)" }, ticks: { font: { size: 10, family: "Inter" }, color: "#999", callback: (v: any) => `${v}${unit ? " " + unit : ""}` }, border: { display: false } },
    },
    interaction: { intersect: false, mode: "index" as const },
  };
  return <div style={{ height }}><Line data={chartData} options={options} /></div>;
}

/* ─── Stat Card ─── */
function StatCard({ label, value, trend, icon: Icon }: { label: string; value: string; trend?: "up" | "down" | "neutral"; icon?: any }) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor = trend === "down" ? "text-emerald-500" : trend === "up" ? "text-red-400" : "text-muted-foreground";
  return (
    <div className="bg-card rounded-2xl border border-border/50 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
        {trend && <TrendIcon className={`h-3.5 w-3.5 ${trendColor}`} />}
      </div>
      <p className="text-[22px] font-bold tracking-tight">{value}</p>
    </div>
  );
}

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const clientId = parseInt(id || "0");
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");

  // Queries
  const clientQ = trpc.clientMgmt.getById.useQuery({ id: clientId }, { enabled: clientId > 0 });
  const assessmentQ = trpc.clientMgmt.getAssessment.useQuery({ clientId }, { enabled: clientId > 0 });
  const checkInsQ = trpc.clientMgmt.getCheckIns.useQuery({ clientId }, { enabled: clientId > 0 });
  const photosQ = trpc.clientMgmt.getPhotos.useQuery({ clientId }, { enabled: clientId > 0 });
  const measurementsQ = trpc.clientMgmt.getMeasurements.useQuery({ clientId }, { enabled: clientId > 0 });
  const achievementsQ = trpc.clientMgmt.getClientAchievements.useQuery({ clientId }, { enabled: clientId > 0 });
  const messagesQ = trpc.clientMgmt.getMessages.useQuery({ clientId, limit: 50 }, { enabled: clientId > 0 });
  const activeDietQ = trpc.clientMgmt.getActiveDiet.useQuery({ clientId }, { enabled: clientId > 0 });
  const dietHistoryQ = trpc.clientMgmt.getDietHistory.useQuery({ clientId }, { enabled: clientId > 0 });
  const trainerDietsQ = trpc.diet.list.useQuery(undefined, { enabled: clientId > 0 });

  // Mutations
  const updateMut = trpc.clientMgmt.update.useMutation({ onSuccess: () => { toast.success("Cliente actualizado"); clientQ.refetch(); } });
  const sendMsgMut = trpc.clientMgmt.sendMessage.useMutation({ onSuccess: () => { messagesQ.refetch(); setNewMsg(""); } });
  const generateMotivationMut = trpc.clientMgmt.generateMotivation.useMutation();
  const sendMotivationMut = trpc.clientMgmt.sendMotivation.useMutation({ onSuccess: () => { toast.success("Mensaje motivacional enviado"); messagesQ.refetch(); setMotivationDraft(null); setMotivationLogId(null); } });
  const [motivationDraft, setMotivationDraft] = useState<string | null>(null);
  const [motivationLogId, setMotivationLogId] = useState<number | null>(null);
  const recommendMut = trpc.clientMgmt.getRecommendations.useMutation();
  const quickConsultMut = trpc.clientMgmt.quickConsult.useMutation();
  const createCheckInMut = trpc.clientMgmt.createCheckIn.useMutation({ onSuccess: () => { toast.success("Check-in registrado"); checkInsQ.refetch(); setShowCheckIn(false); } });
  const addMeasureMut = trpc.clientMgmt.addMeasurement.useMutation({ onSuccess: () => { toast.success("Medida registrada"); measurementsQ.refetch(); setShowMeasure(false); } });
  const feedbackMut = trpc.clientMgmt.addCheckInFeedback.useMutation({ onSuccess: () => { toast.success("Feedback enviado"); checkInsQ.refetch(); } });
  const createAssessMut = trpc.clientMgmt.createAssessment.useMutation({ onSuccess: () => { toast.success("Valoración guardada"); assessmentQ.refetch(); setShowAssessment(false); } });
  const assignDietMut = trpc.clientMgmt.assignDiet.useMutation({ onSuccess: () => { toast.success("Dieta asignada correctamente"); activeDietQ.refetch(); dietHistoryQ.refetch(); setShowAssignDiet(false); } });
  const favoritesQ = trpc.clientMgmt.getFavoriteFoods.useQuery({ clientId }, { enabled: clientId > 0 });
  const addFavMut = trpc.clientMgmt.addFavoriteFood.useMutation({ onSuccess: () => { toast.success("Alimento favorito añadido"); favoritesQ.refetch(); } });
  const removeFavMut = trpc.clientMgmt.deleteFavoriteFood.useMutation({ onSuccess: () => { toast.success("Favorito eliminado"); favoritesQ.refetch(); } });
  const allTagsQ = trpc.clientMgmt.getTags.useQuery();
  const clientTagsQ = trpc.clientMgmt.getClientTags.useQuery({ clientId }, { enabled: clientId > 0 });
  const assignTagMut = trpc.clientMgmt.assignTag.useMutation({ onSuccess: () => { toast.success("Etiqueta asignada"); clientTagsQ.refetch(); } });
  const removeTagMut = trpc.clientMgmt.removeTag.useMutation({ onSuccess: () => { toast.success("Etiqueta eliminada"); clientTagsQ.refetch(); } });
  const createTagMut = trpc.clientMgmt.createTag.useMutation({ onSuccess: () => { toast.success("Etiqueta creada"); allTagsQ.refetch(); } });
  const cloneDietMut = trpc.clientMgmt.cloneDietToClient.useMutation({ onSuccess: () => { toast.success("Dieta clonada y asignada"); activeDietQ.refetch(); dietHistoryQ.refetch(); } });
  const invitationsQ = trpc.clientMgmt.getInvitations.useQuery({ clientId }, { enabled: clientId > 0 });
  // Adherencia diaria del cliente (últimos 30 días)
  const [adherenceStartDate] = useState(() => { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().slice(0, 10); });
  const [adherenceEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const dailyAdherenceQ = trpc.clientMgmt.getAdherenceRange.useQuery({ clientId, startDate: adherenceStartDate, endDate: adherenceEndDate }, { enabled: clientId > 0 });
  const sendInviteMut = trpc.clientMgmt.sendInvitation.useMutation({ onSuccess: (data) => { toast.success(`Invitación enviada. Código: ${data.accessCode}`); invitationsQ.refetch(); setInviteEmail(""); } });
  const resendInviteMut = trpc.clientMgmt.resendInvitation.useMutation({ onSuccess: () => { toast.success("Invitación reenviada"); invitationsQ.refetch(); } });

  // Local state
  const [newMsg, setNewMsg] = useState("");
  const [consultQ_text, setConsultQ_text] = useState("");
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [showMeasure, setShowMeasure] = useState(false);
  const [showAssessment, setShowAssessment] = useState(false);
  const [showAssignDiet, setShowAssignDiet] = useState(false);
  const [selectedDietId, setSelectedDietId] = useState<string>("");
  const [checkInForm, setCheckInForm] = useState({ weekStart: new Date().toISOString().split("T")[0], currentWeight: "", energyLevel: "3", hungerLevel: "3", sleepQuality: "3", adherenceRating: "3", notes: "" });
  const [measureForm, setMeasureForm] = useState({ date: new Date().toISOString().split("T")[0], weight: "", bodyFat: "", chest: "", waist: "", hips: "", arms: "", thighs: "", notes: "" });
  const [assessForm, setAssessForm] = useState({ currentDiet: "", exerciseFrequency: "", exerciseType: "", medicalConditions: "", medications: "", allergiesIntolerances: "", sleepHours: "", stressLevel: "3", waterIntake: "", alcoholFrequency: "", smokingStatus: "", goals: "", trainerNotes: "" });
  const [showFavorites, setShowFavorites] = useState(false);
  const [showTags, setShowTags] = useState(false);
  const [showClone, setShowClone] = useState(false);
  const [favSearch, setFavSearch] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [cloneSourceId, setCloneSourceId] = useState<string>("");
  const [cloneCalories, setCloneCalories] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [showInvite, setShowInvite] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const client = clientQ.data;

  // Scroll chat to bottom
  const messages = useMemo(() => (messagesQ.data || []).slice().reverse(), [messagesQ.data]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // Weight evolution data
  const weightEntries = useMemo(() => {
    const measurements = measurementsQ.data || [];
    return measurements.filter((m: any) => m.weight).map((m: any) => ({ value: m.weight / 1000, date: new Date(m.date).toLocaleDateString("es-ES", { day: "2-digit", month: "short" }) })).reverse();
  }, [measurementsQ.data]);
  const weightData = useMemo(() => weightEntries.map(e => e.value), [weightEntries]);
  const weightLabels = useMemo(() => weightEntries.map(e => e.date), [weightEntries]);

  // Adherence data from check-ins (weekly)
  const adherenceEntries = useMemo(() => {
    const cis = checkInsQ.data || [];
    return cis.filter((c: any) => c.adherenceRating).map((c: any) => ({ value: c.adherenceRating, date: new Date(c.weekStart).toLocaleDateString("es-ES", { day: "2-digit", month: "short" }) })).reverse();
  }, [checkInsQ.data]);
  const adherenceData = useMemo(() => adherenceEntries.map(e => e.value), [adherenceEntries]);
  const adherenceLabels = useMemo(() => adherenceEntries.map(e => e.date), [adherenceEntries]);

  // Daily adherence data (from client portal)
  const dailyAdherenceEntries = useMemo(() => {
    const logs = dailyAdherenceQ.data || [];
    return logs.map((a: any) => ({
      value: a.completed ?? 0,
      date: new Date(a.date).toLocaleDateString("es-ES", { day: "2-digit", month: "short" }),
      rawDate: a.date,
      notes: a.notes,
    })).sort((x: any, y: any) => x.rawDate.localeCompare(y.rawDate));
  }, [dailyAdherenceQ.data]);
  const dailyAdherenceData = useMemo(() => dailyAdherenceEntries.map(e => e.value), [dailyAdherenceEntries]);
  const dailyAdherenceLabels = useMemo(() => dailyAdherenceEntries.map(e => e.date), [dailyAdherenceEntries]);

  if (!client) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  const statusColors: Record<string, string> = {
    active: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    inactive: "bg-secondary text-muted-foreground border-border/50",
    paused: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  };
  const statusLabels: Record<string, string> = { active: "Activo", inactive: "Inactivo", paused: "Pausado" };

  const lastWeight = weightData.length > 0 ? weightData[weightData.length - 1] : null;
  const weightTrend = weightData.length >= 2 ? (weightData[weightData.length - 1] < weightData[weightData.length - 2] ? "down" : weightData[weightData.length - 1] > weightData[weightData.length - 2] ? "up" : "neutral") : undefined;

  const handleExportClientPdf = () => {
    const assessment = assessmentQ.data;
    const measurements = measurementsQ.data || [];
    const checkIns = checkInsQ.data || [];
    const lastMeasure = measurements[0];

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Inter', sans-serif; color: #1d1d1f; padding: 40px; max-width: 800px; margin: 0 auto; }
      h1 { font-size: 28px; font-weight: 700; margin-bottom: 4px; }
      h2 { font-size: 18px; font-weight: 600; margin: 28px 0 12px; padding-bottom: 6px; border-bottom: 1px solid #e5e5e7; }
      h3 { font-size: 14px; font-weight: 600; margin: 16px 0 8px; }
      .subtitle { color: #86868b; font-size: 14px; margin-bottom: 24px; }
      .badge { display: inline-block; padding: 2px 10px; border-radius: 20px; font-size: 12px; font-weight: 500; }
      .badge-active { background: #e8f5e9; color: #2e7d32; }
      .badge-paused { background: #fff3e0; color: #e65100; }
      .badge-inactive { background: #f5f5f5; color: #757575; }
      .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 12px 0; }
      .stat { background: #f5f5f7; border-radius: 12px; padding: 14px; }
      .stat-label { font-size: 11px; color: #86868b; text-transform: uppercase; letter-spacing: 0.5px; }
      .stat-value { font-size: 20px; font-weight: 600; margin-top: 2px; }
      table { width: 100%; border-collapse: collapse; margin: 8px 0; }
      th, td { text-align: left; padding: 8px 12px; font-size: 13px; border-bottom: 1px solid #f0f0f0; }
      th { font-weight: 600; color: #86868b; font-size: 11px; text-transform: uppercase; }
      .section { margin-bottom: 20px; }
      .note { background: #f5f5f7; border-radius: 8px; padding: 12px; font-size: 13px; color: #424245; margin: 8px 0; }
      @media print { body { padding: 20px; } }
    </style></head><body>
      <h1>${client.name}</h1>
      <p class="subtitle">${client.email || ""} ${client.phone ? " · " + client.phone : ""} ${client.goal ? " · " + client.goal : ""}
        <span class="badge badge-${client.status}">${statusLabels[client.status]}</span>
      </p>

      <div class="grid">
        <div class="stat"><div class="stat-label">Peso</div><div class="stat-value">${lastWeight ? lastWeight.toFixed(1) + " kg" : client.weight ? (client.weight / 1000).toFixed(1) + " kg" : "—"}</div></div>
        <div class="stat"><div class="stat-label">Altura</div><div class="stat-value">${client.height ? client.height + " cm" : "—"}</div></div>
        <div class="stat"><div class="stat-label">Edad</div><div class="stat-value">${client.age ? client.age + " años" : "—"}</div></div>
        <div class="stat"><div class="stat-label">IMC</div><div class="stat-value">${lastWeight && client.height ? (lastWeight / ((client.height / 100) ** 2)).toFixed(1) : "—"}</div></div>
      </div>

      ${assessment ? `
      <h2>Valoración Inicial</h2>
      <div class="section">
        ${assessment.currentDiet ? `<h3>Dieta actual</h3><div class="note">${assessment.currentDiet}</div>` : ""}
        ${assessment.exerciseFrequency ? `<h3>Ejercicio</h3><div class="note">${assessment.exerciseFrequency} veces/semana${assessment.exerciseType ? " — " + assessment.exerciseType : ""}</div>` : ""}
        ${assessment.medicalConditions ? `<h3>Condiciones médicas</h3><div class="note">${assessment.medicalConditions}</div>` : ""}
        ${assessment.medications ? `<h3>Medicación</h3><div class="note">${assessment.medications}</div>` : ""}
        ${assessment.allergiesIntolerances ? `<h3>Alergias/Intolerancias</h3><div class="note">${assessment.allergiesIntolerances}</div>` : ""}
        ${assessment.goals ? `<h3>Objetivos</h3><div class="note">${assessment.goals}</div>` : ""}
        ${assessment.trainerNotes ? `<h3>Notas del entrenador</h3><div class="note">${assessment.trainerNotes}</div>` : ""}
      </div>` : ""}

      ${measurements.length > 0 ? `
      <h2>Medidas Corporales</h2>
      <table>
        <tr><th>Fecha</th><th>Peso</th><th>Grasa</th><th>Cintura</th><th>Pecho</th><th>Cadera</th></tr>
        ${measurements.slice(0, 10).map((m: any) => `<tr>
          <td>${new Date(m.date).toLocaleDateString("es-ES")}</td>
          <td>${m.weight ? (m.weight / 1000).toFixed(1) + " kg" : "—"}</td>
          <td>${m.bodyFat ? (m.bodyFat / 10).toFixed(1) + "%" : "—"}</td>
          <td>${m.waist ? (m.waist / 10).toFixed(1) + " cm" : "—"}</td>
          <td>${m.chest ? (m.chest / 10).toFixed(1) + " cm" : "—"}</td>
          <td>${m.hips ? (m.hips / 10).toFixed(1) + " cm" : "—"}</td>
        </tr>`).join("")}
      </table>` : ""}

      ${checkIns.length > 0 ? `
      <h2>Check-ins Semanales</h2>
      <table>
        <tr><th>Semana</th><th>Peso</th><th>Energía</th><th>Sueño</th><th>Adherencia</th></tr>
        ${checkIns.slice(0, 10).map((c: any) => `<tr>
          <td>${new Date(c.weekStart).toLocaleDateString("es-ES")}</td>
          <td>${c.currentWeight ? (c.currentWeight / 1000).toFixed(1) + " kg" : "—"}</td>
          <td>${c.energyLevel || "—"}/5</td>
          <td>${c.sleepQuality || "—"}/5</td>
          <td>${c.adherenceRating || "—"}/5</td>
        </tr>`).join("")}
      </table>` : ""}

      <p style="margin-top:40px;font-size:11px;color:#86868b;text-align:center;">Ficha generada el ${new Date().toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}</p>
    </body></html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const w = window.open(url, "_blank");
    if (w) { setTimeout(() => { w.print(); URL.revokeObjectURL(url); }, 500); }
    else { URL.revokeObjectURL(url); toast.error("No se pudo abrir la ventana de impresión"); }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <button onClick={() => setLocation("/clients")} className="h-10 w-10 rounded-xl bg-secondary/80 flex items-center justify-center hover:bg-secondary transition-colors mt-0.5 shrink-0">
          <ArrowLeft className="h-4.5 w-4.5" />
        </button>
        {(() => {
          const arch = client.archetype ? ARCHETYPES.find((a: any) => a.id === client.archetype) : null;
          return arch ? (
            <div className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: `${arch.accentColor}15`, border: `1px solid ${arch.accentColor}30` }}>
              <img src={arch.image} alt={arch.name} className="h-10 w-10 object-contain" />
            </div>
          ) : null;
        })()}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight truncate uppercase">{client.name}</h1>
            <Badge variant="outline" className={`text-[11px] rounded-full px-2.5 py-0.5 shrink-0 ${statusColors[client.status] || ""}`}>
              {statusLabels[client.status] || client.status}
            </Badge>
          </div>
          <div className="flex items-center gap-3 text-[13px] text-muted-foreground flex-wrap">
            {client.email && <span>{client.email}</span>}
            {client.phone && <span>{client.phone}</span>}
            {client.goal && <span className="text-primary font-medium">{client.goal}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={handleExportClientPdf} className="gap-1.5 rounded-xl h-9 text-[12px]">
            <Download className="h-3.5 w-3.5" />Ficha PDF
          </Button>
          <Select value={client.status} onValueChange={(v) => updateMut.mutate({ id: clientId, status: v as any })}>
            <SelectTrigger className="w-28 rounded-xl h-9 text-[13px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Activo</SelectItem>
              <SelectItem value="paused">Pausado</SelectItem>
              <SelectItem value="inactive">Inactivo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Peso" value={lastWeight ? `${lastWeight.toFixed(1)} kg` : client.weight ? `${(client.weight / 1000).toFixed(1)} kg` : "—"} trend={weightTrend as any} />
        <StatCard label="Altura" value={client.height ? `${client.height} cm` : "—"} />
        <StatCard label="Edad" value={client.age ? `${client.age} años` : "—"} />
        <StatCard label="Check-ins" value={String(checkInsQ.data?.length || 0)} />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto -mx-4 px-4 pb-1">
          <TabsList className="inline-flex h-10 gap-0.5 bg-secondary/60 rounded-xl p-1">
            <TabsTrigger value="overview" className="rounded-lg text-[13px] gap-1.5 px-3"><User className="h-3.5 w-3.5" />General</TabsTrigger>
            <TabsTrigger value="diet" className="rounded-lg text-[13px] gap-1.5 px-3"><UtensilsCrossed className="h-3.5 w-3.5" />Dieta</TabsTrigger>
            <TabsTrigger value="evolution" className="rounded-lg text-[13px] gap-1.5 px-3"><BarChart3 className="h-3.5 w-3.5" />Evolución</TabsTrigger>
            <TabsTrigger value="chat" className="rounded-lg text-[13px] gap-1.5 px-3"><MessageCircle className="h-3.5 w-3.5" />Chat</TabsTrigger>
            <TabsTrigger value="checkins" className="rounded-lg text-[13px] gap-1.5 px-3"><ClipboardCheck className="h-3.5 w-3.5" />Check-ins</TabsTrigger>
            <TabsTrigger value="measurements" className="rounded-lg text-[13px] gap-1.5 px-3"><Ruler className="h-3.5 w-3.5" />Medidas</TabsTrigger>
            <TabsTrigger value="photos" className="rounded-lg text-[13px] gap-1.5 px-3"><Camera className="h-3.5 w-3.5" />Fotos</TabsTrigger>
            <TabsTrigger value="achievements" className="rounded-lg text-[13px] gap-1.5 px-3"><Trophy className="h-3.5 w-3.5" />Logros</TabsTrigger>
            <TabsTrigger value="assessment" className="rounded-lg text-[13px] gap-1.5 px-3"><FileText className="h-3.5 w-3.5" />Valoración</TabsTrigger>
            <TabsTrigger value="ai" className="rounded-lg text-[13px] gap-1.5 px-3"><Brain className="h-3.5 w-3.5" />IA</TabsTrigger>
            <TabsTrigger value="personalization" className="rounded-lg text-[13px] gap-1.5 px-3"><Sparkles className="h-3.5 w-3.5" />Perfil</TabsTrigger>
            <TabsTrigger value="activity" className="rounded-lg text-[13px] gap-1.5 px-3"><Activity className="h-3.5 w-3.5" />Actividad</TabsTrigger>
          </TabsList>
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-5 space-y-4">
            <h3 className="text-[15px] font-semibold">Información del Cliente</h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-[14px]">
              <div><span className="text-muted-foreground">Nombre:</span> <span className="font-medium ml-1">{client.name}</span></div>
              <div><span className="text-muted-foreground">Email:</span> <span className="font-medium ml-1">{client.email || "—"}</span></div>
              <div><span className="text-muted-foreground">Teléfono:</span> <span className="font-medium ml-1">{client.phone || "—"}</span></div>
              <div><span className="text-muted-foreground">Objetivo:</span> <span className="font-medium ml-1">{client.goal || "—"}</span></div>
            </div>
            {client.notes && <p className="text-[13px] text-muted-foreground bg-secondary/50 rounded-xl p-3">{client.notes}</p>}
            <div className="pt-1 border-t border-border/30">
              <span className="text-[12px] text-muted-foreground">Código de acceso: </span>
              <code className="text-[12px] bg-secondary px-2 py-0.5 rounded-md font-mono">{client.accessCode}</code>
            </div>

            {/* Invitación por Email */}
            <div className="pt-3 border-t border-border/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">Invitación por Email</span>
                {(() => {
                  const invites = invitationsQ.data || [];
                  const latest = invites[0];
                  if (!latest) return <Badge variant="outline" className="text-[10px] h-5">Sin invitar</Badge>;
                  if (latest.status === 'accepted') return <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-[10px] h-5">Aceptada</Badge>;
                  if (latest.status === 'expired') return <Badge variant="destructive" className="text-[10px] h-5">Caducada</Badge>;
                  return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 text-[10px] h-5">Pendiente</Badge>;
                })()}
              </div>
              <div className="flex gap-2">
                <Input placeholder="email@ejemplo.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} className="h-8 text-[13px] rounded-lg flex-1" />
                <Button size="sm" className="h-8 text-[12px] rounded-lg gap-1" onClick={() => {
                  if (!inviteEmail) { toast.error("Introduce un email"); return; }
                  sendInviteMut.mutate({ clientId, email: inviteEmail });
                }} disabled={sendInviteMut.isPending || !inviteEmail}>
                  {sendInviteMut.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                  {(invitationsQ.data || []).length > 0 ? 'Reenviar' : 'Enviar'}
                </Button>
              </div>
              {(invitationsQ.data || []).length > 0 && (
                <div className="mt-2 space-y-1">
                  {(invitationsQ.data || []).slice(0, 3).map((inv: any) => (
                    <div key={inv.id} className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>{inv.email} — {new Date(inv.createdAt).toLocaleDateString('es-ES')}</span>
                      <span className={inv.status === 'accepted' ? 'text-green-500' : inv.status === 'expired' ? 'text-red-400' : 'text-yellow-500'}>{inv.status === 'accepted' ? 'Aceptada' : inv.status === 'expired' ? 'Caducada' : 'Pendiente (72h)'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Client Tags */}
            <div className="pt-3 border-t border-border/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">Etiquetas</span>
                <Button variant="ghost" size="sm" onClick={() => setShowTags(true)} className="h-6 text-[11px] gap-1 rounded-lg"><Tag className="h-3 w-3" />Gestionar</Button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(clientTagsQ.data || []).map((ct: any) => (
                  <span key={ct.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[11px] font-medium">
                    <Tag className="h-2.5 w-2.5" />{ct.tag?.name || ct.tagName || 'Tag'}
                    <button onClick={() => removeTagMut.mutate({ clientId, tagId: ct.tagId })} className="ml-0.5 hover:text-destructive"><X className="h-2.5 w-2.5" /></button>
                  </span>
                ))}
                {(clientTagsQ.data || []).length === 0 && <span className="text-[11px] text-muted-foreground">Sin etiquetas</span>}
              </div>
            </div>
          </div>

          {/* Favorite Foods */}
          <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[15px] font-semibold flex items-center gap-2"><Heart className="h-4 w-4 text-rose-400" />Alimentos Favoritos</h3>
              <Button variant="outline" size="sm" onClick={() => setShowFavorites(true)} className="gap-1.5 rounded-xl h-8 text-[12px]"><Plus className="h-3.5 w-3.5" />Añadir</Button>
            </div>
            {(favoritesQ.data || []).length === 0 ? (
              <p className="text-[13px] text-muted-foreground text-center py-4">Sin alimentos favoritos. Añade los que más le gusten al cliente para priorizarlos en la generación.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {(favoritesQ.data || []).map((f: any) => (
                  <span key={f.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[12px] font-medium">
                    <Heart className="h-3 w-3" />{f.foodName}
                    <button onClick={() => removeFavMut.mutate({ id: f.id })} className="ml-0.5 hover:text-destructive"><X className="h-3 w-3" /></button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Adherencia Diaria del Cliente */}
          <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[15px] font-semibold flex items-center gap-2"><BarChart3 className="h-4 w-4 text-emerald-500" />Adherencia Diaria</h3>
              <span className="text-[11px] text-muted-foreground">Últimos 30 días</span>
            </div>
            {dailyAdherenceQ.isLoading ? (
              <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : dailyAdherenceEntries.length === 0 ? (
              <div className="text-center py-6">
                <BarChart3 className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-[13px] text-muted-foreground">El cliente aún no ha registrado adherencia diaria</p>
                <p className="text-[11px] text-muted-foreground mt-1">Los registros aparecerán aquí cuando el cliente use su portal</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Visual calendar grid */}
                <div className="flex flex-wrap gap-1">
                  {dailyAdherenceEntries.map((entry: any, i: number) => (
                    <div key={i} title={`${entry.date}: ${entry.value}% ${entry.notes ? '- ' + entry.notes : ''}`} className={`w-7 h-7 rounded-md flex items-center justify-center text-[9px] font-bold cursor-default ${
                      entry.value >= 80 ? 'bg-emerald-500/20 text-emerald-600' :
                      entry.value >= 50 ? 'bg-yellow-500/20 text-yellow-600' :
                      'bg-red-500/20 text-red-500'
                    }`}>{entry.value}</div>
                  ))}
                </div>
                {/* Summary stats */}
                <div className="flex items-center gap-4 text-[12px] text-muted-foreground pt-2 border-t border-border/30">
                  <span>Registros: <strong className="text-foreground">{dailyAdherenceEntries.length}</strong></span>
                  <span>Media: <strong className={`${(dailyAdherenceData.reduce((a: number, b: number) => a + b, 0) / dailyAdherenceData.length) >= 70 ? 'text-emerald-500' : 'text-yellow-500'}`}>{(dailyAdherenceData.reduce((a: number, b: number) => a + b, 0) / dailyAdherenceData.length).toFixed(0)}%</strong></span>
                  <span>Último: <strong className="text-foreground">{dailyAdherenceData[dailyAdherenceData.length - 1]}%</strong></span>
                  <div className="flex items-center gap-1.5 ml-auto">
                    <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/20"></span><span>≥80%</span>
                    <span className="w-2.5 h-2.5 rounded-sm bg-yellow-500/20"></span><span>≥50%</span>
                    <span className="w-2.5 h-2.5 rounded-sm bg-red-500/20"></span><span>&lt;50%</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Plan Nutricional Activo */}
          <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[15px] font-semibold flex items-center gap-2"><UtensilsCrossed className="h-4 w-4 text-primary" />Plan Nutricional Activo</h3>
              <Button variant="outline" size="sm" onClick={() => setShowAssignDiet(true)} className="gap-1.5 rounded-xl h-8 text-[12px]">
                <Link2 className="h-3.5 w-3.5" />{activeDietQ.data ? "Cambiar" : "Asignar"}
              </Button>
            </div>
            {activeDietQ.isLoading ? (
              <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : activeDietQ.data ? (
              <div className="bg-primary/5 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[15px] font-semibold">{activeDietQ.data.name}</p>
                  <Button variant="ghost" size="sm" onClick={() => setLocation(`/diet/${activeDietQ.data!.id}`)} className="gap-1 rounded-lg h-7 text-[11px] text-primary">
                    <ExternalLink className="h-3 w-3" />Ver dieta
                  </Button>
                </div>
                <div className="flex gap-4 text-[13px] text-muted-foreground">
                  <span>{activeDietQ.data.totalCalories} kcal</span>
                  <span>{activeDietQ.data.mealsPerDay} comidas/d\u00eda</span>
                  <span className="capitalize">{activeDietQ.data.dietType}</span>
                </div>
                <p className="text-[11px] text-muted-foreground">Asignada el {new Date(activeDietQ.data.assignedAt).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}</p>
              </div>
            ) : (
              <div className="text-center py-6">
                <UtensilsCrossed className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-[13px] text-muted-foreground">No hay dieta asignada</p>
                <Button variant="outline" size="sm" onClick={() => setShowAssignDiet(true)} className="mt-3 gap-1.5 rounded-xl text-[12px]">
                  <Plus className="h-3.5 w-3.5" />Asignar dieta
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Diet Tab - Full diet assignment management */}
        <TabsContent value="diet" className="space-y-4 mt-4">
          {/* Active Diet */}
          <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[15px] font-semibold">Plan Nutricional Activo</h3>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowClone(true)} size="sm" className="gap-1.5 rounded-xl h-8 text-[12px]">
                  <Copy className="h-3.5 w-3.5" />Clonar plan
                </Button>
                <Button onClick={() => setShowAssignDiet(true)} size="sm" className="gap-1.5 rounded-xl h-8 text-[12px]">
                  <Plus className="h-3.5 w-3.5" />{activeDietQ.data ? "Cambiar dieta" : "Asignar dieta"}
                </Button>
              </div>
            </div>
            {activeDietQ.isLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : activeDietQ.data ? (
              <div className="bg-primary/5 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[16px] font-semibold">{activeDietQ.data.name}</p>
                    <div className="flex gap-4 mt-1 text-[13px] text-muted-foreground">
                      <span>{activeDietQ.data.totalCalories} kcal</span>
                      <span>{activeDietQ.data.mealsPerDay} comidas/d\u00eda</span>
                      <span className="capitalize">{activeDietQ.data.dietType}</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setLocation(`/diet/${activeDietQ.data!.id}`)} className="gap-1.5 rounded-xl h-8 text-[12px]">
                    <ExternalLink className="h-3.5 w-3.5" />Ver completa
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground">Asignada el {new Date(activeDietQ.data.assignedAt).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}</p>
                {/* Show menus summary */}
                {activeDietQ.data.menus && activeDietQ.data.menus.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-border/30">
                    <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">{activeDietQ.data.menus.length} men\u00fa{activeDietQ.data.menus.length > 1 ? "s" : ""}</p>
                    {activeDietQ.data.menus.slice(0, 3).map((menu: any, i: number) => (
                      <div key={i} className="bg-background/50 rounded-lg p-3">
                        <div className="flex justify-between text-[13px]">
                          <span className="font-medium">D\u00eda {menu.menuNumber}</span>
                          <span className="text-muted-foreground">{menu.totalCalories} kcal</span>
                        </div>
                        <div className="mt-1 space-y-0.5">
                          {menu.meals?.slice(0, 4).map((meal: any, mi: number) => (
                            <p key={mi} className="text-[12px] text-muted-foreground">{meal.mealName} \u2022 {meal.totalCalories} kcal</p>
                          ))}
                          {menu.meals && menu.meals.length > 4 && <p className="text-[11px] text-muted-foreground">+{menu.meals.length - 4} m\u00e1s...</p>}
                        </div>
                      </div>
                    ))}
                    {activeDietQ.data.menus.length > 3 && <p className="text-[11px] text-muted-foreground text-center">+{activeDietQ.data.menus.length - 3} men\u00fas m\u00e1s</p>}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-10">
                <UtensilsCrossed className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-[15px] font-medium">Sin dieta asignada</p>
                <p className="text-[13px] text-muted-foreground mt-1">Asigna una dieta de tu biblioteca para que el cliente la vea en su portal</p>
                <Button onClick={() => setShowAssignDiet(true)} className="mt-4 gap-1.5 rounded-xl">
                  <Plus className="h-4 w-4" />Asignar dieta
                </Button>
              </div>
            )}
          </div>

          {/* Diet History */}
          {(dietHistoryQ.data || []).length > 0 && (
            <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-5 space-y-3">
              <h3 className="text-[15px] font-semibold">Historial de Dietas</h3>
              <div className="space-y-2">
                {(dietHistoryQ.data || []).map((h: any) => (
                  <div key={h.id} className={`flex items-center justify-between p-3 rounded-xl border ${h.active ? "border-primary/30 bg-primary/5" : "border-border/50"}`}>
                    <div>
                      <p className="text-[14px] font-medium">{h.dietName}</p>
                      <div className="flex gap-3 text-[12px] text-muted-foreground mt-0.5">
                        <span>{h.totalCalories} kcal</span>
                        <span>{h.mealsPerDay} comidas</span>
                        <span className="capitalize">{h.dietType}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      {h.active ? (
                        <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">Activa</Badge>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">{new Date(h.assignedAt).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Evolution Tab - Charts */}
        <TabsContent value="evolution" className="space-y-4 mt-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-5">
              <h3 className="text-[15px] font-semibold mb-1">Evolución del Peso</h3>
              <p className="text-[12px] text-muted-foreground mb-3">{weightData.length} registros</p>
              <EvolutionChart data={weightData} labels={weightLabels} color="#007AFF" unit="kg" height={160} />
              {weightData.length >= 2 && (
                <div className="flex items-center justify-between mt-3 text-[12px] text-muted-foreground">
                  <span>Inicio: {weightData[0].toFixed(1)} kg</span>
                  <span className={`font-semibold ${weightData[weightData.length - 1] <= weightData[0] ? "text-emerald-500" : "text-red-400"}`}>
                    {(weightData[weightData.length - 1] - weightData[0] > 0 ? "+" : "")}{(weightData[weightData.length - 1] - weightData[0]).toFixed(1)} kg
                  </span>
                  <span>Actual: {weightData[weightData.length - 1].toFixed(1)} kg</span>
                </div>
              )}
            </div>
            <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-5">
              <h3 className="text-[15px] font-semibold mb-1">Adherencia Diaria</h3>
              <p className="text-[12px] text-muted-foreground mb-3">{dailyAdherenceData.length > 0 ? `${dailyAdherenceData.length} registros diarios` : `${adherenceData.length} check-ins semanales`}</p>
              {dailyAdherenceData.length > 0 ? (
                <>
                  <EvolutionChart data={dailyAdherenceData} labels={dailyAdherenceLabels} color="#34C759" unit="%" height={160} />
                  <div className="flex items-center justify-between mt-3 text-[12px] text-muted-foreground">
                    <span>Media: {(dailyAdherenceData.reduce((a: number, b: number) => a + b, 0) / dailyAdherenceData.length).toFixed(0)}%</span>
                    <span>Último: {dailyAdherenceData[dailyAdherenceData.length - 1]}%</span>
                  </div>
                </>
              ) : adherenceData.length > 0 ? (
                <>
                  <EvolutionChart data={adherenceData} labels={adherenceLabels} color="#34C759" unit="/5" height={160} />
                  <div className="flex items-center justify-between mt-3 text-[12px] text-muted-foreground">
                    <span>Media: {(adherenceData.reduce((a: number, b: number) => a + b, 0) / adherenceData.length).toFixed(1)}/5</span>
                    <span>Último: {adherenceData[adherenceData.length - 1]}/5</span>
                  </div>
                </>
              ) : (
                <p className="text-[13px] text-muted-foreground text-center py-6">Sin datos de adherencia aún</p>
              )}
            </div>
          </div>
          {/* Waist evolution if available */}
          {(() => {
            const waistEntries = (measurementsQ.data || []).filter((m: any) => m.waist).map((m: any) => ({ value: m.waist / 10, date: new Date(m.date).toLocaleDateString("es-ES", { day: "2-digit", month: "short" }) })).reverse();
            const waistData = waistEntries.map(e => e.value);
            const waistLabels = waistEntries.map(e => e.date);
            if (waistData.length < 2) return null;
            return (
              <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-5">
                <h3 className="text-[15px] font-semibold mb-1">Perímetro de Cintura</h3>
                <p className="text-[12px] text-muted-foreground mb-3">{waistData.length} registros</p>
                <EvolutionChart data={waistData} labels={waistLabels} color="#FF9500" unit="cm" height={140} />
                <div className="flex items-center justify-between mt-3 text-[12px] text-muted-foreground">
                  <span>Inicio: {waistData[0].toFixed(1)} cm</span>
                  <span className={`font-semibold ${waistData[waistData.length - 1] <= waistData[0] ? "text-emerald-500" : "text-red-400"}`}>
                    {(waistData[waistData.length - 1] - waistData[0] > 0 ? "+" : "")}{(waistData[waistData.length - 1] - waistData[0]).toFixed(1)} cm
                  </span>
                  <span>Actual: {waistData[waistData.length - 1].toFixed(1)} cm</span>
                </div>
              </div>
            );
          })()}
          {/* Body Fat evolution if available */}
          {(() => {
            const bfEntries = (measurementsQ.data || []).filter((m: any) => m.bodyFat).map((m: any) => ({ value: m.bodyFat / 10, date: new Date(m.date).toLocaleDateString("es-ES", { day: "2-digit", month: "short" }) })).reverse();
            const bfData = bfEntries.map(e => e.value);
            const bfLabels = bfEntries.map(e => e.date);
            if (bfData.length < 2) return null;
            return (
              <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-5">
                <h3 className="text-[15px] font-semibold mb-1">Grasa Corporal</h3>
                <p className="text-[12px] text-muted-foreground mb-3">{bfData.length} registros</p>
                <EvolutionChart data={bfData} labels={bfLabels} color="#AF52DE" unit="%" height={140} />
                <div className="flex items-center justify-between mt-3 text-[12px] text-muted-foreground">
                  <span>Inicio: {bfData[0].toFixed(1)}%</span>
                  <span className={`font-semibold ${bfData[bfData.length - 1] <= bfData[0] ? "text-emerald-500" : "text-red-400"}`}>
                    {(bfData[bfData.length - 1] - bfData[0] > 0 ? "+" : "")}{(bfData[bfData.length - 1] - bfData[0]).toFixed(1)}%
                  </span>
                  <span>Actual: {bfData[bfData.length - 1].toFixed(1)}%</span>
                </div>
              </div>
            );
          })()}
        </TabsContent>

        {/* Chat Tab */}
        <TabsContent value="chat" className="mt-4">
          <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-border/30">
              <h3 className="text-[15px] font-semibold">Chat con {client.name}</h3>
              <Button variant="outline" size="sm" onClick={() => generateMotivationMut.mutate({ clientId }, { onSuccess: (data) => { setMotivationDraft(data.message); setMotivationLogId(data.logId); } })} disabled={generateMotivationMut.isPending} className="gap-1.5 rounded-xl h-8 text-[12px]">
                {generateMotivationMut.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}Generar Mensaje
              </Button>
            </div>
            {motivationDraft && (
              <div className="px-4 py-3 bg-primary/5 border-b border-primary/20">
                <p className="text-[11px] font-medium text-primary mb-1.5 uppercase tracking-wide">Sugerencia de IA (edita antes de enviar)</p>
                <textarea className="w-full bg-card border border-border/50 rounded-xl px-3 py-2 text-[14px] resize-none" rows={2} value={motivationDraft} onChange={(e) => setMotivationDraft(e.target.value)} />
                <div className="flex gap-2 mt-2">
                  <Button size="sm" className="h-7 text-[12px] rounded-lg" onClick={() => sendMotivationMut.mutate({ clientId, logId: motivationLogId || undefined, message: motivationDraft })} disabled={sendMotivationMut.isPending}>
                    {sendMotivationMut.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}Enviar al cliente
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 text-[12px] rounded-lg" onClick={() => { setMotivationDraft(null); setMotivationLogId(null); }}>Descartar</Button>
                </div>
              </div>
            )}
            <div className="h-80 overflow-y-auto p-4 space-y-2.5 bg-secondary/20">
              {messages.length === 0 ? (
                <p className="text-center text-[13px] text-muted-foreground py-12">No hay mensajes aún</p>
              ) : messages.map((msg: any) => (
                <div key={msg.id} className={`flex ${msg.senderType === "trainer" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-[14px] ${msg.senderType === "trainer" ? "bg-primary text-primary-foreground rounded-br-md" : "bg-card text-card-foreground border border-border/50 rounded-bl-md"}`}>
                    <p>{msg.message}</p>
                    <p className={`text-[10px] mt-1 ${msg.senderType === "trainer" ? "text-primary-foreground/50" : "text-muted-foreground/60"}`}>
                      {new Date(msg.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div className="flex gap-2 p-3 border-t border-border/30">
              <Input value={newMsg} onChange={(e) => setNewMsg(e.target.value)} placeholder="Escribe un mensaje..." className="rounded-xl" onKeyDown={(e) => { if (e.key === "Enter" && newMsg.trim()) sendMsgMut.mutate({ clientId, message: newMsg.trim() }); }} />
              <Button onClick={() => { if (newMsg.trim()) sendMsgMut.mutate({ clientId, message: newMsg.trim() }); }} disabled={sendMsgMut.isPending || !newMsg.trim()} size="icon" className="rounded-xl shrink-0">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Check-ins Tab */}
        <TabsContent value="checkins" className="space-y-3 mt-4">
          <div className="flex justify-between items-center">
            <h3 className="text-[15px] font-semibold">Check-ins Semanales</h3>
            <Button onClick={() => setShowCheckIn(true)} size="sm" className="gap-1.5 rounded-xl h-8 text-[12px]"><Plus className="h-3.5 w-3.5" />Nuevo</Button>
          </div>
          {(checkInsQ.data || []).length === 0 ? (
            <div className="bg-card rounded-2xl border border-dashed border-border/50 flex flex-col items-center justify-center py-12 text-center">
              <ClipboardCheck className="h-8 w-8 text-muted-foreground/30 mb-3" />
              <p className="text-[13px] text-muted-foreground">No hay check-ins registrados</p>
            </div>
          ) : (checkInsQ.data || []).map((ci: any) => (
            <div key={ci.id} className="bg-card rounded-2xl border border-border/50 shadow-sm p-4 space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-[14px]">Semana del {ci.weekStart}</span>
                {ci.currentWeight && <Badge variant="outline" className="rounded-full text-[11px]">{(ci.currentWeight / 1000).toFixed(1)} kg</Badge>}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[{ k: "energyLevel", l: "Energía" }, { k: "hungerLevel", l: "Hambre" }, { k: "sleepQuality", l: "Sueño" }, { k: "adherenceRating", l: "Adherencia" }].map(({ k, l }) => ci[k] != null && (
                  <div key={k} className="bg-secondary/50 rounded-xl px-3 py-1.5 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{l}</p>
                    <p className="text-[14px] font-semibold">{ci[k]}/5</p>
                  </div>
                ))}
              </div>
              {ci.notes && <p className="text-[13px] text-muted-foreground">{ci.notes}</p>}
              {ci.trainerFeedback ? (
                <div className="bg-primary/5 rounded-xl p-3 text-[13px]"><span className="font-medium text-primary">Tu feedback:</span> {ci.trainerFeedback}</div>
              ) : (
                <FeedbackInput checkInId={ci.id} clientId={clientId} onSubmit={(fb) => feedbackMut.mutate({ id: ci.id, clientId, feedback: fb })} />
              )}
            </div>
          ))}
        </TabsContent>

        {/* Measurements Tab */}
        <TabsContent value="measurements" className="space-y-3 mt-4">
          <div className="flex justify-between items-center">
            <h3 className="text-[15px] font-semibold">Medidas Corporales</h3>
            <Button onClick={() => setShowMeasure(true)} size="sm" className="gap-1.5 rounded-xl h-8 text-[12px]"><Plus className="h-3.5 w-3.5" />Nueva</Button>
          </div>
          {(measurementsQ.data || []).length === 0 ? (
            <div className="bg-card rounded-2xl border border-dashed border-border/50 flex flex-col items-center justify-center py-12 text-center">
              <Ruler className="h-8 w-8 text-muted-foreground/30 mb-3" />
              <p className="text-[13px] text-muted-foreground">No hay medidas registradas</p>
            </div>
          ) : (
            <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead><tr className="border-b border-border/30 bg-secondary/30">
                    {["Fecha", "Peso", "Grasa", "Pecho", "Cintura", "Cadera", "Brazos", "Muslos"].map(h => (
                      <th key={h} className={`py-2.5 px-3 font-medium text-muted-foreground ${h === "Fecha" ? "text-left" : "text-right"}`}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {(measurementsQ.data || []).map((m: any) => (
                      <tr key={m.id} className="border-b border-border/20 last:border-0">
                        <td className="py-2.5 px-3 font-medium">{m.date}</td>
                        <td className="text-right py-2.5 px-3">{m.weight ? `${(m.weight / 1000).toFixed(1)}` : "—"}</td>
                        <td className="text-right py-2.5 px-3">{m.bodyFat ? `${(m.bodyFat / 10).toFixed(1)}%` : "—"}</td>
                        <td className="text-right py-2.5 px-3">{m.chest ? `${(m.chest / 10).toFixed(1)}` : "—"}</td>
                        <td className="text-right py-2.5 px-3">{m.waist ? `${(m.waist / 10).toFixed(1)}` : "—"}</td>
                        <td className="text-right py-2.5 px-3">{m.hips ? `${(m.hips / 10).toFixed(1)}` : "—"}</td>
                        <td className="text-right py-2.5 px-3">{m.arms ? `${(m.arms / 10).toFixed(1)}` : "—"}</td>
                        <td className="text-right py-2.5 px-3">{m.thighs ? `${(m.thighs / 10).toFixed(1)}` : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Photos Tab */}
        <TabsContent value="photos" className="space-y-4 mt-4">
          <h3 className="text-[15px] font-semibold uppercase">Fotos de Progreso</h3>
          {(photosQ.data || []).length === 0 ? (
            <div className="bg-card rounded-2xl border border-dashed border-border/50 flex flex-col items-center justify-center py-12 text-center">
              <Camera className="h-8 w-8 text-muted-foreground/30 mb-3" />
              <p className="text-[13px] text-muted-foreground">El cliente a\u00fan no ha subido fotos de progreso</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Group photos by date */}
              {Object.entries(
                (photosQ.data || []).reduce((acc: Record<string, any[]>, p: any) => {
                  const d = new Date(p.date).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
                  if (!acc[d]) acc[d] = [];
                  acc[d].push(p);
                  return acc;
                }, {})
              ).map(([date, datePhotos]) => (
                <div key={date} className="bg-card rounded-2xl border border-border/50 shadow-sm p-4 space-y-3">
                  <p className="text-[13px] font-semibold text-muted-foreground">{date}</p>
                  <div className="grid grid-cols-3 gap-3">
                    {(datePhotos as any[]).map((p: any) => (
                      <div key={p.id} className="relative aspect-[3/4] rounded-xl overflow-hidden border border-border/50 group">
                        <img src={p.photoUrl} alt={p.photoType} className="w-full h-full object-cover" />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                          <span className="text-[10px] text-white font-medium capitalize">{p.photoType === "front" ? "Frente" : p.photoType === "side" ? "Perfil" : p.photoType === "back" ? "Espalda" : p.photoType}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {(datePhotos as any[])[0]?.notes && <p className="text-[12px] text-muted-foreground italic">{(datePhotos as any[])[0].notes}</p>}
                </div>
              ))}

              {/* Enhanced Before/After Comparison */}
              {(photosQ.data || []).length >= 2 && (() => {
                const photos = photosQ.data as any[];
                const types = Array.from(new Set(photos.map((p: any) => p.photoType)));
                const typeLabels: Record<string, string> = { front: "Frente", side: "Perfil", back: "Espalda" };
                return (
                  <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-5 space-y-4">
                    <h4 className="text-[15px] font-semibold flex items-center gap-2"><Camera className="h-4 w-4 text-primary" />Comparativa Antes / Después</h4>
                    {types.map((type) => {
                      const typePhotos = photos.filter((p: any) => p.photoType === type).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
                      if (typePhotos.length < 2) return null;
                      const first = typePhotos[0];
                      const last = typePhotos[typePhotos.length - 1];
                      return (
                        <div key={type} className="space-y-2">
                          <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">{typeLabels[type] || type}</p>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <div className="aspect-[3/4] rounded-xl overflow-hidden border border-border/50">
                                <img src={first.photoUrl} alt="Antes" className="w-full h-full object-cover" />
                              </div>
                              <p className="text-[11px] text-muted-foreground text-center">{new Date(first.date).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}</p>
                            </div>
                            <div className="space-y-1">
                              <div className="aspect-[3/4] rounded-xl overflow-hidden border border-border/50">
                                <img src={last.photoUrl} alt="Después" className="w-full h-full object-cover" />
                              </div>
                              <p className="text-[11px] text-muted-foreground text-center">{new Date(last.date).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {/* Weight evolution overlay */}
                    {weightData.length >= 2 && (
                      <div className="pt-3 border-t border-border/30">
                        <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Evolución de peso</p>
                        <EvolutionChart data={weightData} labels={weightLabels} color="#6BCB77" unit="kg" height={120} />
                        <div className="flex justify-between mt-2 text-[12px]">
                          <span className="text-muted-foreground">Inicio: <strong>{weightData[0].toFixed(1)} kg</strong></span>
                          <span className="text-muted-foreground">Actual: <strong>{weightData[weightData.length - 1].toFixed(1)} kg</strong></span>
                          <span className={weightData[weightData.length - 1] < weightData[0] ? "text-emerald-500 font-semibold" : "text-amber-500 font-semibold"}>
                            {(weightData[weightData.length - 1] - weightData[0]) > 0 ? "+" : ""}{(weightData[weightData.length - 1] - weightData[0]).toFixed(1)} kg
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-3 mt-4">
          <h3 className="text-[15px] font-semibold">Logros Desbloqueados</h3>
          {(achievementsQ.data || []).length === 0 ? (
            <div className="bg-card rounded-2xl border border-dashed border-border/50 flex flex-col items-center justify-center py-12 text-center">
              <Trophy className="h-8 w-8 text-muted-foreground/30 mb-3" />
              <p className="text-[13px] text-muted-foreground">No hay logros desbloqueados aún</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {(achievementsQ.data || []).map((a: any) => (
                <div key={a.id} className="bg-card rounded-2xl border border-border/50 shadow-sm p-4 text-center">
                  <div className="text-3xl mb-2">{a.icon || "🏆"}</div>
                  <p className="font-semibold text-[14px]">{a.name}</p>
                  {a.description && <p className="text-[12px] text-muted-foreground mt-1">{a.description}</p>}
                  <p className="text-[10px] text-muted-foreground mt-2">{new Date(a.unlockedAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Assessment Tab */}
        <TabsContent value="assessment" className="space-y-3 mt-4">
          <div className="flex justify-between items-center">
            <h3 className="text-[15px] font-semibold">Valoración Inicial</h3>
            <Button onClick={() => setShowAssessment(true)} size="sm" className="gap-1.5 rounded-xl h-8 text-[12px]">
              <Plus className="h-3.5 w-3.5" />{assessmentQ.data ? "Actualizar" : "Crear"}
            </Button>
          </div>
          {assessmentQ.data ? (
            <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-5 space-y-3">
              <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-[14px]">
                {[
                  { k: "currentDiet", l: "Dieta actual" }, { k: "exerciseFrequency", l: "Frecuencia ejercicio" },
                  { k: "exerciseType", l: "Tipo ejercicio" }, { k: "medicalConditions", l: "Condiciones médicas" },
                  { k: "medications", l: "Medicamentos" }, { k: "allergiesIntolerances", l: "Alergias" },
                ].map(({ k, l }) => (assessmentQ.data as any)[k] && (
                  <div key={k}><span className="text-muted-foreground text-[13px]">{l}:</span> <span className="font-medium ml-1">{(assessmentQ.data as any)[k]}</span></div>
                ))}
                {assessmentQ.data.sleepHours != null && <div><span className="text-muted-foreground text-[13px]">Horas sueño:</span> <span className="font-medium ml-1">{assessmentQ.data.sleepHours}h</span></div>}
                {assessmentQ.data.stressLevel != null && <div><span className="text-muted-foreground text-[13px]">Estrés:</span> <span className="font-medium ml-1">{assessmentQ.data.stressLevel}/5</span></div>}
              </div>
              {assessmentQ.data.goals && <p className="text-[13px] bg-secondary/50 rounded-xl p-3"><span className="font-medium">Objetivos:</span> {assessmentQ.data.goals}</p>}
              {assessmentQ.data.trainerNotes && <p className="text-[13px] bg-primary/5 rounded-xl p-3"><span className="font-medium text-primary">Notas:</span> {assessmentQ.data.trainerNotes}</p>}
            </div>
          ) : (
            <div className="bg-card rounded-2xl border border-dashed border-border/50 flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-8 w-8 text-muted-foreground/30 mb-3" />
              <p className="text-[13px] text-muted-foreground">No hay valoración inicial</p>
            </div>
          )}
        </TabsContent>

        {/* AI Tab */}
        <TabsContent value="ai" className="space-y-4 mt-4">
          {/* Auto Report */}
          <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2"><FileText className="h-4.5 w-4.5 text-primary" /><h3 className="text-[15px] font-semibold">Informe Automático</h3></div>
              <Button variant="outline" size="sm" onClick={() => {
                const cis = checkInsQ.data || [];
                const ms = measurementsQ.data || [];
                const lastCi = cis[0];
                const lastM = ms[0];
                const avgAdherence = cis.length > 0 ? (cis.reduce((s: number, c: any) => s + (c.adherenceRating || 0), 0) / cis.length).toFixed(1) : '—';
                const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
                  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
                  * { margin: 0; padding: 0; box-sizing: border-box; }
                  body { font-family: 'Plus Jakarta Sans', sans-serif; color: #1d1d1f; padding: 40px; max-width: 800px; margin: 0 auto; }
                  h1 { font-size: 24px; font-weight: 700; margin-bottom: 4px; }
                  h2 { font-size: 16px; font-weight: 600; margin: 24px 0 10px; padding-bottom: 6px; border-bottom: 1px solid #e5e5e7; }
                  .subtitle { color: #86868b; font-size: 13px; margin-bottom: 20px; }
                  .grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin: 12px 0; }
                  .stat { background: #f5f5f7; border-radius: 12px; padding: 14px; }
                  .stat-label { font-size: 10px; color: #86868b; text-transform: uppercase; letter-spacing: 0.5px; }
                  .stat-value { font-size: 18px; font-weight: 600; margin-top: 2px; }
                  .note { background: #f5f5f7; border-radius: 8px; padding: 10px; font-size: 13px; color: #424245; margin: 8px 0; }
                  @media print { body { padding: 20px; } }
                </style></head><body>
                  <h1>Informe de Seguimiento — ${client.name}</h1>
                  <p class="subtitle">Generado el ${new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  <div class="grid">
                    <div class="stat"><div class="stat-label">Peso actual</div><div class="stat-value">${lastWeight ? lastWeight.toFixed(1) + ' kg' : '—'}</div></div>
                    <div class="stat"><div class="stat-label">Adherencia media</div><div class="stat-value">${avgAdherence}/5</div></div>
                    <div class="stat"><div class="stat-label">Check-ins</div><div class="stat-value">${cis.length}</div></div>
                  </div>
                  ${lastCi ? '<h2>\u00daltimo Check-in</h2><div class="note">Energ\u00eda: ' + (lastCi.energyLevel || '—') + '/5 · Sue\u00f1o: ' + (lastCi.sleepQuality || '—') + '/5 · Adherencia: ' + (lastCi.adherenceRating || '—') + '/5' + (lastCi.notes ? '<br/>' + lastCi.notes : '') + '</div>' : ''}
                  ${lastM ? '<h2>\u00daltimas Medidas</h2><div class="note">Peso: ' + (lastM.weight ? (lastM.weight/1000).toFixed(1) + ' kg' : '—') + ' · Cintura: ' + (lastM.waist ? (lastM.waist/10).toFixed(1) + ' cm' : '—') + ' · Pecho: ' + (lastM.chest ? (lastM.chest/10).toFixed(1) + ' cm' : '—') + '</div>' : ''}
                  ${activeDietQ.data ? '<h2>Plan Activo</h2><div class="note">' + activeDietQ.data.name + ' — ' + activeDietQ.data.totalCalories + ' kcal</div>' : ''}
                </body></html>`;
                const blob = new Blob([html], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                const w = window.open(url, '_blank');
                if (w) { setTimeout(() => { w.print(); URL.revokeObjectURL(url); }, 500); }
              }} className="gap-1.5 rounded-xl h-8 text-[12px]">
                <Download className="h-3.5 w-3.5" />Generar PDF
              </Button>
            </div>
            <p className="text-[13px] text-muted-foreground">Genera un informe resumen con peso, adherencia, medidas y plan activo del cliente. Ideal para revisiones periódicas.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-1"><Brain className="h-4.5 w-4.5 text-primary" /><h3 className="text-[15px] font-semibold">Recomendaciones IA</h3></div>
              <p className="text-[12px] text-muted-foreground mb-3">Análisis basado en los datos del cliente</p>
              <Button onClick={() => recommendMut.mutate({ clientId })} disabled={recommendMut.isPending} className="w-full gap-2 rounded-xl h-10 mb-3">
                {recommendMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}Generar Recomendaciones
              </Button>
              {recommendMut.data && <div className="text-[13px] whitespace-pre-wrap bg-secondary/50 rounded-xl p-3.5 leading-relaxed">{String(recommendMut.data)}</div>}
            </div>
            <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-1"><Zap className="h-4.5 w-4.5 text-primary" /><h3 className="text-[15px] font-semibold">Consulta Express</h3></div>
              <p className="text-[12px] text-muted-foreground mb-3">Pregunta rápida sobre este cliente</p>
              <Textarea value={consultQ_text} onChange={(e) => setConsultQ_text(e.target.value)} placeholder="Ej: ¿Debería reducir carbohidratos?" rows={3} className="rounded-xl mb-3 text-[14px]" />
              <Button onClick={() => { if (consultQ_text.trim()) quickConsultMut.mutate({ clientId, question: consultQ_text.trim() }); }} disabled={quickConsultMut.isPending || !consultQ_text.trim()} className="w-full gap-2 rounded-xl h-10">
                {quickConsultMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}Consultar
              </Button>
              {quickConsultMut.data && <div className="text-[13px] whitespace-pre-wrap bg-secondary/50 rounded-xl p-3.5 mt-3 leading-relaxed">{String(quickConsultMut.data)}</div>}
            </div>
          </div>
        </TabsContent>

        {/* Personalization Profile Tab */}
        <TabsContent value="personalization" className="space-y-4 mt-4">
          <PersonalizationPanel clientId={clientId} />
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-4 mt-4">
          <ActivityPanel clientId={clientId} />
        </TabsContent>
      </Tabs>

      {/* Check-in Dialog */}
      <Dialog open={showCheckIn} onOpenChange={setShowCheckIn}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto rounded-2xl">
          <DialogHeader><DialogTitle className="text-[17px]">Nuevo Check-in Semanal</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label className="text-[13px]">Semana del</Label><Input type="date" value={checkInForm.weekStart} onChange={(e) => setCheckInForm(f => ({ ...f, weekStart: e.target.value }))} className="rounded-xl" /></div>
            <div className="space-y-1.5"><Label className="text-[13px]">Peso actual (kg)</Label><Input type="number" value={checkInForm.currentWeight} onChange={(e) => setCheckInForm(f => ({ ...f, currentWeight: e.target.value }))} placeholder="75.5" className="rounded-xl" /></div>
            <div className="grid grid-cols-2 gap-3">
              {([["energyLevel", "Energía"], ["hungerLevel", "Hambre"], ["sleepQuality", "Sueño"], ["adherenceRating", "Adherencia"]] as const).map(([field, label]) => (
                <div key={field} className="space-y-1.5">
                  <Label className="text-[13px]">{label} (1-5)</Label>
                  <Select value={(checkInForm as any)[field]} onValueChange={(v) => setCheckInForm(f => ({ ...f, [field]: v }))}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>{[1,2,3,4,5].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              ))}
            </div>
            <div className="space-y-1.5"><Label className="text-[13px]">Notas</Label><Textarea value={checkInForm.notes} onChange={(e) => setCheckInForm(f => ({ ...f, notes: e.target.value }))} rows={3} className="rounded-xl" /></div>
            <Button onClick={() => createCheckInMut.mutate({ clientId, weekStart: checkInForm.weekStart, currentWeight: checkInForm.currentWeight ? Math.round(parseFloat(checkInForm.currentWeight) * 1000) : undefined, energyLevel: parseInt(checkInForm.energyLevel), hungerLevel: parseInt(checkInForm.hungerLevel), sleepQuality: parseInt(checkInForm.sleepQuality), adherenceRating: parseInt(checkInForm.adherenceRating), notes: checkInForm.notes || undefined })} disabled={createCheckInMut.isPending} className="w-full rounded-xl h-11">
              {createCheckInMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Guardar Check-in
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Measurement Dialog */}
      <Dialog open={showMeasure} onOpenChange={setShowMeasure}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto rounded-2xl">
          <DialogHeader><DialogTitle className="text-[17px]">Nueva Medida Corporal</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label className="text-[13px]">Fecha</Label><Input type="date" value={measureForm.date} onChange={(e) => setMeasureForm(f => ({ ...f, date: e.target.value }))} className="rounded-xl" /></div>
            <div className="grid grid-cols-2 gap-3">
              {([["weight", "Peso (kg)"], ["bodyFat", "Grasa (%)"], ["chest", "Pecho (cm)"], ["waist", "Cintura (cm)"], ["hips", "Cadera (cm)"], ["arms", "Brazos (cm)"], ["thighs", "Muslos (cm)"]] as const).map(([field, label]) => (
                <div key={field} className="space-y-1.5"><Label className="text-[13px]">{label}</Label><Input type="number" step="0.1" value={(measureForm as any)[field]} onChange={(e) => setMeasureForm(f => ({ ...f, [field]: e.target.value }))} className="rounded-xl" /></div>
              ))}
            </div>
            <div className="space-y-1.5"><Label className="text-[13px]">Notas</Label><Textarea value={measureForm.notes} onChange={(e) => setMeasureForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="rounded-xl" /></div>
            <Button onClick={() => addMeasureMut.mutate({ clientId, date: measureForm.date, weight: measureForm.weight ? Math.round(parseFloat(measureForm.weight) * 1000) : undefined, bodyFat: measureForm.bodyFat ? Math.round(parseFloat(measureForm.bodyFat) * 10) : undefined, chest: measureForm.chest ? Math.round(parseFloat(measureForm.chest) * 10) : undefined, waist: measureForm.waist ? Math.round(parseFloat(measureForm.waist) * 10) : undefined, hips: measureForm.hips ? Math.round(parseFloat(measureForm.hips) * 10) : undefined, arms: measureForm.arms ? Math.round(parseFloat(measureForm.arms) * 10) : undefined, thighs: measureForm.thighs ? Math.round(parseFloat(measureForm.thighs) * 10) : undefined, notes: measureForm.notes || undefined })} disabled={addMeasureMut.isPending} className="w-full rounded-xl h-11">
              {addMeasureMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Guardar Medida
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assessment Dialog */}
      <Dialog open={showAssessment} onOpenChange={setShowAssessment}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl">
          <DialogHeader><DialogTitle className="text-[17px]">Valoración Inicial</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label className="text-[13px]">Dieta actual</Label><Textarea value={assessForm.currentDiet} onChange={(e) => setAssessForm(f => ({ ...f, currentDiet: e.target.value }))} rows={2} placeholder="Describe su alimentación habitual..." className="rounded-xl" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-[13px]">Frecuencia ejercicio</Label><Input value={assessForm.exerciseFrequency} onChange={(e) => setAssessForm(f => ({ ...f, exerciseFrequency: e.target.value }))} placeholder="3-4 días/semana" className="rounded-xl" /></div>
              <div className="space-y-1.5"><Label className="text-[13px]">Tipo ejercicio</Label><Input value={assessForm.exerciseType} onChange={(e) => setAssessForm(f => ({ ...f, exerciseType: e.target.value }))} placeholder="Pesas, cardio..." className="rounded-xl" /></div>
            </div>
            <div className="space-y-1.5"><Label className="text-[13px]">Condiciones médicas</Label><Input value={assessForm.medicalConditions} onChange={(e) => setAssessForm(f => ({ ...f, medicalConditions: e.target.value }))} placeholder="Ninguna, diabetes..." className="rounded-xl" /></div>
            <div className="space-y-1.5"><Label className="text-[13px]">Medicamentos</Label><Input value={assessForm.medications} onChange={(e) => setAssessForm(f => ({ ...f, medications: e.target.value }))} placeholder="Ninguno..." className="rounded-xl" /></div>
            <div className="space-y-1.5"><Label className="text-[13px]">Alergias/Intolerancias</Label><Input value={assessForm.allergiesIntolerances} onChange={(e) => setAssessForm(f => ({ ...f, allergiesIntolerances: e.target.value }))} placeholder="Lactosa, gluten..." className="rounded-xl" /></div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5"><Label className="text-[13px]">Horas sueño</Label><Input type="number" value={assessForm.sleepHours} onChange={(e) => setAssessForm(f => ({ ...f, sleepHours: e.target.value }))} placeholder="7" className="rounded-xl" /></div>
              <div className="space-y-1.5"><Label className="text-[13px]">Estrés (1-5)</Label>
                <Select value={assessForm.stressLevel} onValueChange={(v) => setAssessForm(f => ({ ...f, stressLevel: v }))}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>{[1,2,3,4,5].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label className="text-[13px]">Agua (ml/día)</Label><Input type="number" value={assessForm.waterIntake} onChange={(e) => setAssessForm(f => ({ ...f, waterIntake: e.target.value }))} placeholder="2000" className="rounded-xl" /></div>
            </div>
            <div className="space-y-1.5"><Label className="text-[13px]">Objetivos</Label><Textarea value={assessForm.goals} onChange={(e) => setAssessForm(f => ({ ...f, goals: e.target.value }))} rows={2} placeholder="Objetivos del cliente..." className="rounded-xl" /></div>
            <div className="space-y-1.5"><Label className="text-[13px]">Notas del entrenador</Label><Textarea value={assessForm.trainerNotes} onChange={(e) => setAssessForm(f => ({ ...f, trainerNotes: e.target.value }))} rows={2} placeholder="Tus observaciones..." className="rounded-xl" /></div>
            <Button onClick={() => createAssessMut.mutate({ clientId, currentDiet: assessForm.currentDiet || undefined, exerciseFrequency: assessForm.exerciseFrequency || undefined, exerciseType: assessForm.exerciseType || undefined, medicalConditions: assessForm.medicalConditions || undefined, medications: assessForm.medications || undefined, allergiesIntolerances: assessForm.allergiesIntolerances || undefined, sleepHours: assessForm.sleepHours ? parseInt(assessForm.sleepHours) : undefined, stressLevel: parseInt(assessForm.stressLevel), waterIntake: assessForm.waterIntake ? parseInt(assessForm.waterIntake) : undefined, alcoholFrequency: assessForm.alcoholFrequency || undefined, smokingStatus: assessForm.smokingStatus || undefined, goals: assessForm.goals || undefined, trainerNotes: assessForm.trainerNotes || undefined })} disabled={createAssessMut.isPending} className="w-full rounded-xl h-11">
              {createAssessMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Guardar Valoración
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Favorite Food Dialog */}
      <Dialog open={showFavorites} onOpenChange={setShowFavorites}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader><DialogTitle className="text-[17px]">Añadir Alimento Favorito</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-[13px] text-muted-foreground">Añade alimentos que le gusten al cliente para priorizarlos en futuras dietas.</p>
            <div className="flex gap-2">
              <Input value={favSearch} onChange={(e) => setFavSearch(e.target.value)} placeholder="Ej: Pollo a la plancha, Arroz integral..." className="rounded-xl text-[14px]" onKeyDown={(e) => { if (e.key === 'Enter' && favSearch.trim()) { addFavMut.mutate({ clientId, foodName: favSearch.trim() }); setFavSearch(''); } }} />
              <Button onClick={() => { if (favSearch.trim()) { addFavMut.mutate({ clientId, foodName: favSearch.trim() }); setFavSearch(''); } }} disabled={!favSearch.trim() || addFavMut.isPending} className="rounded-xl shrink-0">
                {addFavMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-[200px] overflow-y-auto">
              {(favoritesQ.data || []).map((f: any) => (
                <span key={f.id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[12px] font-medium">
                  <Heart className="h-3 w-3" />{f.foodName}
                  <button onClick={() => removeFavMut.mutate({ id: f.id })} className="ml-0.5 hover:text-destructive"><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tags Dialog */}
      <Dialog open={showTags} onOpenChange={setShowTags}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader><DialogTitle className="text-[17px]">Gestionar Etiquetas</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="Nueva etiqueta..." className="rounded-xl text-[14px]" onKeyDown={(e) => { if (e.key === 'Enter' && tagInput.trim()) { createTagMut.mutate({ name: tagInput.trim(), color: '#6BCB77' }); setTagInput(''); } }} />
              <Button onClick={() => { if (tagInput.trim()) { createTagMut.mutate({ name: tagInput.trim(), color: '#6BCB77' }); setTagInput(''); } }} disabled={!tagInput.trim() || createTagMut.isPending} className="rounded-xl shrink-0">
                {createTagMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              </Button>
            </div>
            <div className="space-y-1.5">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Etiquetas disponibles</p>
              <div className="flex flex-wrap gap-1.5 max-h-[200px] overflow-y-auto">
                {(allTagsQ.data || []).map((tag: any) => {
                  const isAssigned = (clientTagsQ.data || []).some((ct: any) => ct.tagId === tag.id);
                  return (
                    <button key={tag.id} onClick={() => isAssigned ? removeTagMut.mutate({ clientId, tagId: tag.id }) : assignTagMut.mutate({ clientId, tagId: tag.id })} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[12px] font-medium transition-all ${isAssigned ? 'bg-primary/15 text-primary ring-1 ring-primary/30' : 'bg-secondary text-muted-foreground hover:bg-secondary/80'}`}>
                      <Tag className="h-3 w-3" />{tag.name}
                      {isAssigned && <CheckCircle2 className="h-3 w-3" />}
                    </button>
                  );
                })}
                {(allTagsQ.data || []).length === 0 && <p className="text-[12px] text-muted-foreground">Crea tu primera etiqueta arriba</p>}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Clone Diet Dialog */}
      <Dialog open={showClone} onOpenChange={setShowClone}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader><DialogTitle className="text-[17px]">Clonar y Adaptar Dieta</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-[13px] text-muted-foreground">Selecciona una dieta de tu biblioteca. Se creará una copia adaptada a las calorías que indiques y se asignará al cliente.</p>
            <div className="space-y-2 max-h-[250px] overflow-y-auto">
              {(trainerDietsQ.data || []).map((d: any) => (
                <button key={d.id} onClick={() => setCloneSourceId(String(d.id))} className={`w-full text-left p-3 rounded-xl border transition-all ${cloneSourceId === String(d.id) ? 'border-primary bg-primary/5 ring-1 ring-primary/30' : 'border-border/50 hover:bg-accent/50'}`}>
                  <p className="text-[14px] font-medium">{d.name}</p>
                  <div className="flex gap-3 mt-1 text-[12px] text-muted-foreground"><span>{d.totalCalories} kcal</span><span>{d.mealsPerDay} comidas</span></div>
                </button>
              ))}
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px]">Calorías objetivo (opcional)</Label>
              <Input type="number" value={cloneCalories} onChange={(e) => setCloneCalories(e.target.value)} placeholder="Dejar vacío para mantener las originales" className="rounded-xl" />
            </div>
            <Button onClick={() => { if (!cloneSourceId) { toast.error('Selecciona una dieta'); return; } cloneDietMut.mutate({ sourceDietId: parseInt(cloneSourceId), targetClientId: clientId }); setShowClone(false); }} disabled={!cloneSourceId || cloneDietMut.isPending} className="w-full rounded-xl h-11">
              {cloneDietMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Clonar y Asignar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Diet Dialog */}
      <Dialog open={showAssignDiet} onOpenChange={setShowAssignDiet}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto rounded-2xl">
          <DialogHeader><DialogTitle className="text-[17px]">Asignar Dieta al Cliente</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-[13px] text-muted-foreground">Selecciona una dieta de tu biblioteca para asignarla a {client.name}. La dieta activa anterior se desactivar\u00e1 autom\u00e1ticamente.</p>
            {trainerDietsQ.isLoading ? (
              <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : (trainerDietsQ.data || []).length === 0 ? (
              <div className="text-center py-6">
                <UtensilsCrossed className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-[13px] text-muted-foreground">No tienes dietas creadas</p>
                <Button variant="outline" size="sm" onClick={() => { setShowAssignDiet(false); setLocation("/"); }} className="mt-3 gap-1.5 rounded-xl text-[12px]">
                  <Plus className="h-3.5 w-3.5" />Crear nueva dieta
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {(trainerDietsQ.data || []).map((d: any) => (
                    <button
                      key={d.id}
                      onClick={() => setSelectedDietId(String(d.id))}
                      className={`w-full text-left p-3 rounded-xl border transition-all ${
                        selectedDietId === String(d.id)
                          ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                          : "border-border/50 hover:bg-accent/50"
                      }`}
                    >
                      <p className="text-[14px] font-medium">{d.name}</p>
                      <div className="flex gap-3 mt-1 text-[12px] text-muted-foreground">
                        <span>{d.totalCalories} kcal</span>
                        <span>{d.mealsPerDay} comidas</span>
                        <span className="capitalize">{d.dietType}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1">{new Date(d.createdAt).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}</p>
                    </button>
                  ))}
                </div>
                <Button
                  onClick={() => {
                    if (!selectedDietId) { toast.error("Selecciona una dieta"); return; }
                    assignDietMut.mutate({ clientId, dietId: parseInt(selectedDietId) });
                  }}
                  disabled={!selectedDietId || assignDietMut.isPending}
                  className="w-full rounded-xl h-11"
                >
                  {assignDietMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Asignar Dieta
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FeedbackInput({ checkInId, clientId, onSubmit }: { checkInId: number; clientId: number; onSubmit: (fb: string) => void }) {
  const [show, setShow] = useState(false);
  const [text, setText] = useState("");
  if (!show) return (
    <Button variant="ghost" size="sm" onClick={() => setShow(true)} className="text-[12px] gap-1 h-7 rounded-lg">
      <Edit2 className="h-3 w-3" /> Añadir feedback
    </Button>
  );
  return (
    <div className="flex gap-2">
      <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Tu feedback..." className="text-[13px] rounded-xl" />
      <Button size="sm" onClick={() => { if (text.trim()) onSubmit(text.trim()); }} disabled={!text.trim()} className="rounded-xl"><Send className="h-3.5 w-3.5" /></Button>
      <Button size="sm" variant="ghost" onClick={() => setShow(false)} className="rounded-xl"><X className="h-3.5 w-3.5" /></Button>
    </div>
  );
}

// ── Personalization Panel ──
function PersonalizationPanel({ clientId }: { clientId: number }) {
  const profileQ = trpc.clientMgmt.getClientPersonalization.useQuery({ clientId });
  const analyzeMut = trpc.clientMgmt.analyzeClientProfile.useMutation({
    onSuccess: () => { toast.success("Perfil analizado"); profileQ.refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const profile = profileQ.data?.profile as any;
  const preferences = profileQ.data?.preferences || [];

  const categoryLabels: Record<string, string> = {
    food_likes: "Le gusta",
    food_dislikes: "No le gusta",
    schedule: "Horarios",
    habits: "Hábitos",
  };

  const categoryColors: Record<string, string> = {
    food_likes: "#6BCB77",
    food_dislikes: "#FF6B6B",
    schedule: "#4ECDC4",
    habits: "#FFD93D",
  };

  return (
    <>
      {/* Analyze button */}
      <div className="bg-card text-card-foreground rounded-2xl border border-border/50 shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4.5 w-4.5 text-primary" />
            <h3 className="text-[15px] font-semibold">Motor de Personalización</h3>
          </div>
          <Button onClick={() => analyzeMut.mutate({ clientId })} disabled={analyzeMut.isPending} size="sm" className="rounded-xl gap-1.5">
            {analyzeMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Brain className="h-3.5 w-3.5" />}
            Analizar
          </Button>
        </div>
        <p className="text-[12px] text-muted-foreground">
          Analiza todos los datos del cliente (adherencia, bienestar, sueño, actividad, conversaciones IA) para construir un perfil de personalización completo.
        </p>
      </div>

      {/* Learned preferences */}
      {preferences.length > 0 && (
        <div className="bg-card text-card-foreground rounded-2xl border border-border/50 shadow-sm p-5">
          <h3 className="text-[15px] font-semibold mb-3 flex items-center gap-2">
            <Heart className="h-4 w-4 text-pink-500" />
            Preferencias Aprendidas
          </h3>
          <div className="space-y-2">
            {Object.entries(
              preferences.reduce((acc: Record<string, typeof preferences>, p) => {
                const cat = p.category;
                if (!acc[cat]) acc[cat] = [];
                acc[cat].push(p);
                return acc;
              }, {})
            ).map(([category, prefs]) => (
              <div key={category}>
                <p className="text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: categoryColors[category] || "#999" }}>
                  {categoryLabels[category] || category}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {prefs.map((p: any) => (
                    <span
                      key={p.id}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] border"
                      style={{
                        borderColor: (categoryColors[category] || "#999") + "40",
                        backgroundColor: (categoryColors[category] || "#999") + "10",
                        color: categoryColors[category] || "#999",
                      }}
                    >
                      {p.value}
                      {p.confidence && (
                        <span className="opacity-50 text-[9px]">{p.confidence}%</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Profile data */}
      {profile && (
        <div className="bg-card text-card-foreground rounded-2xl border border-border/50 shadow-sm p-5">
          <h3 className="text-[15px] font-semibold mb-3 flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            Perfil Aprendido
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { label: "Alimentos favoritos", data: profile.foodLikes, color: "#6BCB77" },
              { label: "Alimentos rechazados", data: profile.foodDislikes, color: "#FF6B6B" },
              { label: "Horarios preferidos", data: profile.preferredMealTimes, color: "#4ECDC4" },
              { label: "Preferencias de compra", data: profile.shoppingPreferences, color: "#FFD93D" },
              { label: "Factores de estrés", data: profile.stressFactors, color: "#FF8C42" },
              { label: "Motivaciones", data: profile.motivationTriggers, color: "#A78BFA" },
            ].map(({ label, data, color }) => (
              <div key={label}>
                <p className="text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color }}>{label}</p>
                {Array.isArray(data) && data.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {data.map((item: string, i: number) => (
                      <span key={i} className="text-[11px] px-2 py-0.5 rounded-full border" style={{ borderColor: color + "30", color }}>{item}</span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-muted-foreground">Sin datos</p>
                )}
              </div>
            ))}
            {profile.cookingSkill && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider mb-1 text-blue-400">Nivel de cocina</p>
                <p className="text-[13px]">{profile.cookingSkill}</p>
              </div>
            )}
            {profile.activityPattern && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider mb-1 text-green-400">Patrón de actividad</p>
                <p className="text-[13px]">{profile.activityPattern}</p>
              </div>
            )}
            {profile.sleepPattern && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider mb-1 text-indigo-400">Patrón de sueño</p>
                <p className="text-[13px]">{profile.sleepPattern}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {!profile && preferences.length === 0 && !profileQ.isLoading && (
        <div className="text-center py-8">
          <Brain className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Sin datos de personalización aún</p>
          <p className="text-muted-foreground text-[12px] mt-1">Pulsa "Analizar" para generar el perfil aprendido del cliente</p>
        </div>
      )}
    </>
  );
}

// ── Activity Panel (Trainer view) ──
function ActivityPanel({ clientId }: { clientId: number }) {
  const activityQ = trpc.clientMgmt.getClientActivity.useQuery({ clientId });
  const data = activityQ.data || [];
  const weekData = data.slice(0, 7).reverse();
  const maxSteps = Math.max(...weekData.map(d => d.steps || 0), 1);

  return (
    <>
      {/* Weekly chart */}
      <div className="bg-card text-card-foreground rounded-2xl border border-border/50 shadow-sm p-5">
        <h3 className="text-[15px] font-semibold mb-3 flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          Actividad Semanal
        </h3>
        {weekData.length === 0 ? (
          <div className="text-center py-6">
            <Activity className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">Sin datos de actividad</p>
          </div>
        ) : (
          <div className="flex items-end gap-1.5 h-36">
            {weekData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] text-muted-foreground">{(d.steps || 0).toLocaleString()}</span>
                <div
                  className="w-full rounded-t-lg transition-all"
                  style={{
                    height: `${Math.max(4, ((d.steps || 0) / maxSteps) * 100)}%`,
                    backgroundColor: "#6BCB77",
                    opacity: 0.6 + ((d.steps || 0) / maxSteps) * 0.4,
                  }}
                />
                <span className="text-[9px] text-muted-foreground">{d.date.slice(5)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary stats */}
      {data.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card text-card-foreground rounded-2xl border border-border/50 shadow-sm p-4 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Promedio pasos</p>
            <p className="text-xl font-bold text-primary mt-1">
              {Math.round(data.reduce((s, d) => s + (d.steps || 0), 0) / data.length).toLocaleString()}
            </p>
          </div>
          <div className="bg-card text-card-foreground rounded-2xl border border-border/50 shadow-sm p-4 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Min. activos/día</p>
            <p className="text-xl font-bold text-green-500 mt-1">
              {Math.round(data.reduce((s, d) => s + (d.activeMinutes || 0), 0) / data.length)}
            </p>
          </div>
          <div className="bg-card text-card-foreground rounded-2xl border border-border/50 shadow-sm p-4 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Cal. quemadas/día</p>
            <p className="text-xl font-bold text-orange-500 mt-1">
              {Math.round(data.reduce((s, d) => s + (d.caloriesBurned || 0), 0) / data.length)}
            </p>
          </div>
        </div>
      )}

      {/* History */}
      <div className="bg-card text-card-foreground rounded-2xl border border-border/50 shadow-sm p-5">
        <h3 className="text-[15px] font-semibold mb-3">Historial de Actividad</h3>
        {activityQ.isLoading ? (
          <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : data.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-4">Sin registros de actividad</p>
        ) : (
          <div className="space-y-2">
            {data.slice(0, 20).map((log) => (
              <div key={log.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                <div>
                  <p className="text-[13px] font-medium">{log.date}</p>
                  <p className="text-[11px] text-muted-foreground">{log.source || "manual"}</p>
                </div>
                <div className="flex gap-4 text-right">
                  {log.steps != null && <div><p className="text-[13px] font-semibold text-primary">{log.steps.toLocaleString()}</p><p className="text-[9px] text-muted-foreground">pasos</p></div>}
                  {log.activeMinutes != null && <div><p className="text-[13px] font-semibold">{log.activeMinutes}</p><p className="text-[9px] text-muted-foreground">min</p></div>}
                  {log.caloriesBurned != null && <div><p className="text-[13px] font-semibold">{log.caloriesBurned}</p><p className="text-[9px] text-muted-foreground">kcal</p></div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
