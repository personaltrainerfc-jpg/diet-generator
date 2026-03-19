import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  Sparkles, Brain, Zap, CheckCircle2, XCircle, ChevronDown, Edit2,
  Save, X
} from "lucide-react";

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const clientId = parseInt(id || "0");
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<any>(null);

  // Queries
  const clientQ = trpc.clientMgmt.getById.useQuery({ id: clientId }, { enabled: clientId > 0 });
  const assessmentQ = trpc.clientMgmt.getAssessment.useQuery({ clientId }, { enabled: clientId > 0 });
  const checkInsQ = trpc.clientMgmt.getCheckIns.useQuery({ clientId }, { enabled: clientId > 0 });
  const photosQ = trpc.clientMgmt.getPhotos.useQuery({ clientId }, { enabled: clientId > 0 });
  const measurementsQ = trpc.clientMgmt.getMeasurements.useQuery({ clientId }, { enabled: clientId > 0 });
  const achievementsQ = trpc.clientMgmt.getClientAchievements.useQuery({ clientId }, { enabled: clientId > 0 });
  const messagesQ = trpc.clientMgmt.getMessages.useQuery({ clientId, limit: 50 }, { enabled: clientId > 0 });

  // Mutations
  const updateMut = trpc.clientMgmt.update.useMutation({
    onSuccess: () => { toast.success("Cliente actualizado"); clientQ.refetch(); setEditMode(false); },
  });
  const sendMsgMut = trpc.clientMgmt.sendMessage.useMutation({
    onSuccess: () => { messagesQ.refetch(); setNewMsg(""); },
  });
  const motivationMut = trpc.clientMgmt.sendMotivation.useMutation({
    onSuccess: (data) => { toast.success("Mensaje enviado"); messagesQ.refetch(); },
  });
  const recommendMut = trpc.clientMgmt.getRecommendations.useMutation();
  const quickConsultMut = trpc.clientMgmt.quickConsult.useMutation();
  const createCheckInMut = trpc.clientMgmt.createCheckIn.useMutation({
    onSuccess: () => { toast.success("Check-in registrado"); checkInsQ.refetch(); setShowCheckIn(false); },
  });
  const addMeasureMut = trpc.clientMgmt.addMeasurement.useMutation({
    onSuccess: () => { toast.success("Medida registrada"); measurementsQ.refetch(); setShowMeasure(false); },
  });
  const feedbackMut = trpc.clientMgmt.addCheckInFeedback.useMutation({
    onSuccess: () => { toast.success("Feedback enviado"); checkInsQ.refetch(); },
  });
  const createAssessMut = trpc.clientMgmt.createAssessment.useMutation({
    onSuccess: () => { toast.success("Valoración guardada"); assessmentQ.refetch(); setShowAssessment(false); },
  });

  // Local state
  const [newMsg, setNewMsg] = useState("");
  const [consultQ, setConsultQ] = useState("");
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [showMeasure, setShowMeasure] = useState(false);
  const [showAssessment, setShowAssessment] = useState(false);
  const [checkInForm, setCheckInForm] = useState({
    weekStart: new Date().toISOString().split("T")[0],
    currentWeight: "", energyLevel: "3", hungerLevel: "3", sleepQuality: "3", adherenceRating: "3", notes: "",
  });
  const [measureForm, setMeasureForm] = useState({
    date: new Date().toISOString().split("T")[0],
    weight: "", bodyFat: "", chest: "", waist: "", hips: "", arms: "", thighs: "", notes: "",
  });
  const [assessForm, setAssessForm] = useState({
    currentDiet: "", exerciseFrequency: "", exerciseType: "", medicalConditions: "",
    medications: "", allergiesIntolerances: "", sleepHours: "", stressLevel: "3",
    waterIntake: "", alcoholFrequency: "", smokingStatus: "", goals: "", trainerNotes: "",
  });

  const client = clientQ.data;
  if (!client) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    inactive: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    paused: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  };

  const messages = (messagesQ.data || []).slice().reverse();

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/clients")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-foreground">{client.name}</h1>
            <Badge className={statusColors[client.status] || ""}>
              {client.status === "active" ? "Activo" : client.status === "paused" ? "Pausado" : "Inactivo"}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {client.email && <span>{client.email}</span>}
            {client.phone && <span>{client.phone}</span>}
            {client.goal && <span className="text-primary font-medium">{client.goal}</span>}
          </div>
        </div>
        <div className="flex gap-2">
          <Select
            value={client.status}
            onValueChange={(v) => updateMut.mutate({ id: clientId, status: v as any })}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
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
        <Card>
          <CardContent className="py-3 text-center">
            <p className="text-xs text-muted-foreground">Peso</p>
            <p className="text-lg font-bold text-foreground">
              {client.weight ? `${(client.weight / 1000).toFixed(1)} kg` : "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 text-center">
            <p className="text-xs text-muted-foreground">Altura</p>
            <p className="text-lg font-bold text-foreground">
              {client.height ? `${client.height} cm` : "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 text-center">
            <p className="text-xs text-muted-foreground">Edad</p>
            <p className="text-lg font-bold text-foreground">
              {client.age ? `${client.age} años` : "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 text-center">
            <p className="text-xs text-muted-foreground">Check-ins</p>
            <p className="text-lg font-bold text-foreground">
              {checkInsQ.data?.length || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="overview" className="gap-1.5"><User className="h-3.5 w-3.5" />General</TabsTrigger>
          <TabsTrigger value="chat" className="gap-1.5"><MessageCircle className="h-3.5 w-3.5" />Chat</TabsTrigger>
          <TabsTrigger value="checkins" className="gap-1.5"><ClipboardCheck className="h-3.5 w-3.5" />Check-ins</TabsTrigger>
          <TabsTrigger value="measurements" className="gap-1.5"><Ruler className="h-3.5 w-3.5" />Medidas</TabsTrigger>
          <TabsTrigger value="photos" className="gap-1.5"><Camera className="h-3.5 w-3.5" />Fotos</TabsTrigger>
          <TabsTrigger value="achievements" className="gap-1.5"><Trophy className="h-3.5 w-3.5" />Logros</TabsTrigger>
          <TabsTrigger value="assessment" className="gap-1.5"><FileText className="h-3.5 w-3.5" />Valoración</TabsTrigger>
          <TabsTrigger value="ai" className="gap-1.5"><Brain className="h-3.5 w-3.5" />IA</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Información del Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Nombre:</span> <span className="font-medium">{client.name}</span></div>
                <div><span className="text-muted-foreground">Email:</span> <span className="font-medium">{client.email || "—"}</span></div>
                <div><span className="text-muted-foreground">Teléfono:</span> <span className="font-medium">{client.phone || "—"}</span></div>
                <div><span className="text-muted-foreground">Objetivo:</span> <span className="font-medium">{client.goal || "—"}</span></div>
              </div>
              {client.notes && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Notas:</span>
                  <p className="mt-1 text-foreground">{client.notes}</p>
                </div>
              )}
              <div className="pt-2">
                <span className="text-xs text-muted-foreground">Código de acceso: </span>
                <code className="text-xs bg-muted px-2 py-1 rounded font-mono">{client.accessCode}</code>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Chat Tab */}
        <TabsContent value="chat" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Chat con {client.name}</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => motivationMut.mutate({ clientId })}
                disabled={motivationMut.isPending}
                className="gap-1.5"
              >
                {motivationMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                Motivar
              </Button>
            </CardHeader>
            <CardContent>
              <div className="h-80 overflow-y-auto border rounded-lg p-3 mb-3 space-y-2 bg-muted/30">
                {messages.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-8">No hay mensajes aún</p>
                ) : (
                  messages.map((msg: any) => (
                    <div key={msg.id} className={`flex ${msg.senderType === "trainer" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                        msg.senderType === "trainer"
                          ? "bg-primary text-primary-foreground"
                          : "bg-card text-card-foreground border"
                      }`}>
                        <p>{msg.message}</p>
                        <p className={`text-[10px] mt-1 ${msg.senderType === "trainer" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                          {new Date(msg.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newMsg}
                  onChange={(e) => setNewMsg(e.target.value)}
                  placeholder="Escribe un mensaje..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newMsg.trim()) {
                      sendMsgMut.mutate({ clientId, message: newMsg.trim() });
                    }
                  }}
                />
                <Button
                  onClick={() => { if (newMsg.trim()) sendMsgMut.mutate({ clientId, message: newMsg.trim() }); }}
                  disabled={sendMsgMut.isPending || !newMsg.trim()}
                  size="icon"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Check-ins Tab */}
        <TabsContent value="checkins" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-foreground">Check-ins Semanales</h3>
            <Button onClick={() => setShowCheckIn(true)} size="sm" className="gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Nuevo Check-in
            </Button>
          </div>
          {(checkInsQ.data || []).length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center text-muted-foreground">
                No hay check-ins registrados
              </CardContent>
            </Card>
          ) : (
            (checkInsQ.data || []).map((ci: any) => (
              <Card key={ci.id}>
                <CardContent className="py-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-foreground">Semana del {ci.weekStart}</span>
                    {ci.currentWeight && <Badge variant="outline">{(ci.currentWeight / 1000).toFixed(1)} kg</Badge>}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    {ci.energyLevel && <div>Energía: <span className="font-medium">{"⭐".repeat(ci.energyLevel)}</span></div>}
                    {ci.hungerLevel && <div>Hambre: <span className="font-medium">{"⭐".repeat(ci.hungerLevel)}</span></div>}
                    {ci.sleepQuality && <div>Sueño: <span className="font-medium">{"⭐".repeat(ci.sleepQuality)}</span></div>}
                    {ci.adherenceRating && <div>Adherencia: <span className="font-medium">{"⭐".repeat(ci.adherenceRating)}</span></div>}
                  </div>
                  {ci.notes && <p className="text-sm text-muted-foreground">{ci.notes}</p>}
                  {ci.trainerFeedback ? (
                    <div className="bg-primary/5 rounded p-2 text-sm">
                      <span className="font-medium text-primary">Tu feedback:</span> {ci.trainerFeedback}
                    </div>
                  ) : (
                    <FeedbackInput checkInId={ci.id} clientId={clientId} onSubmit={(fb) => feedbackMut.mutate({ id: ci.id, clientId, feedback: fb })} />
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Measurements Tab */}
        <TabsContent value="measurements" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-foreground">Medidas Corporales</h3>
            <Button onClick={() => setShowMeasure(true)} size="sm" className="gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Nueva Medida
            </Button>
          </div>
          {(measurementsQ.data || []).length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center text-muted-foreground">
                No hay medidas registradas
              </CardContent>
            </Card>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-2 px-2">Fecha</th>
                    <th className="text-right py-2 px-2">Peso</th>
                    <th className="text-right py-2 px-2">Grasa</th>
                    <th className="text-right py-2 px-2">Pecho</th>
                    <th className="text-right py-2 px-2">Cintura</th>
                    <th className="text-right py-2 px-2">Cadera</th>
                    <th className="text-right py-2 px-2">Brazos</th>
                    <th className="text-right py-2 px-2">Muslos</th>
                  </tr>
                </thead>
                <tbody>
                  {(measurementsQ.data || []).map((m: any) => (
                    <tr key={m.id} className="border-b">
                      <td className="py-2 px-2 font-medium">{m.date}</td>
                      <td className="text-right py-2 px-2">{m.weight ? `${(m.weight / 1000).toFixed(1)}` : "—"}</td>
                      <td className="text-right py-2 px-2">{m.bodyFat ? `${(m.bodyFat / 10).toFixed(1)}%` : "—"}</td>
                      <td className="text-right py-2 px-2">{m.chest ? `${(m.chest / 10).toFixed(1)}` : "—"}</td>
                      <td className="text-right py-2 px-2">{m.waist ? `${(m.waist / 10).toFixed(1)}` : "—"}</td>
                      <td className="text-right py-2 px-2">{m.hips ? `${(m.hips / 10).toFixed(1)}` : "—"}</td>
                      <td className="text-right py-2 px-2">{m.arms ? `${(m.arms / 10).toFixed(1)}` : "—"}</td>
                      <td className="text-right py-2 px-2">{m.thighs ? `${(m.thighs / 10).toFixed(1)}` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* Photos Tab */}
        <TabsContent value="photos" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-foreground">Fotos de Progreso</h3>
          </div>
          {(photosQ.data || []).length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center text-muted-foreground">
                No hay fotos de progreso
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {(photosQ.data || []).map((p: any) => (
                <Card key={p.id} className="overflow-hidden">
                  <img src={p.photoUrl} alt={p.photoType} className="w-full h-48 object-cover" />
                  <CardContent className="py-2 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>{p.date}</span>
                      <Badge variant="outline" className="text-[10px]">{p.photoType}</Badge>
                    </div>
                    {p.notes && <p className="mt-1">{p.notes}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Logros Desbloqueados</h3>
          {(achievementsQ.data || []).length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center text-muted-foreground">
                No hay logros desbloqueados aún
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {(achievementsQ.data || []).map((a: any) => (
                <Card key={a.id}>
                  <CardContent className="py-4 text-center">
                    <div className="text-3xl mb-2">{a.icon || "🏆"}</div>
                    <p className="font-medium text-foreground">{a.name}</p>
                    {a.description && <p className="text-xs text-muted-foreground mt-1">{a.description}</p>}
                    <p className="text-[10px] text-muted-foreground mt-2">
                      {new Date(a.unlockedAt).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Assessment Tab */}
        <TabsContent value="assessment" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-foreground">Valoración Inicial</h3>
            <Button onClick={() => setShowAssessment(true)} size="sm" className="gap-1.5">
              <Plus className="h-3.5 w-3.5" /> {assessmentQ.data ? "Actualizar" : "Crear"}
            </Button>
          </div>
          {assessmentQ.data ? (
            <Card>
              <CardContent className="py-4 space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  {assessmentQ.data.currentDiet && <div><span className="text-muted-foreground">Dieta actual:</span> <span className="font-medium">{assessmentQ.data.currentDiet}</span></div>}
                  {assessmentQ.data.exerciseFrequency && <div><span className="text-muted-foreground">Frecuencia ejercicio:</span> <span className="font-medium">{assessmentQ.data.exerciseFrequency}</span></div>}
                  {assessmentQ.data.exerciseType && <div><span className="text-muted-foreground">Tipo ejercicio:</span> <span className="font-medium">{assessmentQ.data.exerciseType}</span></div>}
                  {assessmentQ.data.medicalConditions && <div><span className="text-muted-foreground">Condiciones médicas:</span> <span className="font-medium">{assessmentQ.data.medicalConditions}</span></div>}
                  {assessmentQ.data.medications && <div><span className="text-muted-foreground">Medicamentos:</span> <span className="font-medium">{assessmentQ.data.medications}</span></div>}
                  {assessmentQ.data.allergiesIntolerances && <div><span className="text-muted-foreground">Alergias:</span> <span className="font-medium">{assessmentQ.data.allergiesIntolerances}</span></div>}
                  {assessmentQ.data.sleepHours != null && <div><span className="text-muted-foreground">Horas sueño:</span> <span className="font-medium">{assessmentQ.data.sleepHours}h</span></div>}
                  {assessmentQ.data.stressLevel != null && <div><span className="text-muted-foreground">Estrés:</span> <span className="font-medium">{assessmentQ.data.stressLevel}/5</span></div>}
                  {assessmentQ.data.waterIntake != null && <div><span className="text-muted-foreground">Agua diaria:</span> <span className="font-medium">{assessmentQ.data.waterIntake}ml</span></div>}
                  {assessmentQ.data.goals && <div className="col-span-2"><span className="text-muted-foreground">Objetivos:</span> <span className="font-medium">{assessmentQ.data.goals}</span></div>}
                  {assessmentQ.data.trainerNotes && <div className="col-span-2"><span className="text-muted-foreground">Notas del entrenador:</span> <span className="font-medium">{assessmentQ.data.trainerNotes}</span></div>}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center text-muted-foreground">
                No hay valoración inicial registrada
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* AI Tab */}
        <TabsContent value="ai" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" /> Recomendaciones IA
                </CardTitle>
                <CardDescription>Análisis basado en los datos del cliente</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => recommendMut.mutate({ clientId })}
                  disabled={recommendMut.isPending}
                  className="w-full mb-3 gap-2"
                >
                  {recommendMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Generar Recomendaciones
                </Button>
                {recommendMut.data && (
                  <div className="text-sm whitespace-pre-wrap bg-muted/50 rounded-lg p-3">
                    {String(recommendMut.data)}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Consult */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" /> Consulta Express
                </CardTitle>
                <CardDescription>Pregunta rápida sobre este cliente</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={consultQ}
                  onChange={(e) => setConsultQ(e.target.value)}
                  placeholder="Ej: ¿Debería reducir carbohidratos si no pierde peso?"
                  rows={3}
                  className="mb-3"
                />
                <Button
                  onClick={() => { if (consultQ.trim()) quickConsultMut.mutate({ clientId, question: consultQ.trim() }); }}
                  disabled={quickConsultMut.isPending || !consultQ.trim()}
                  className="w-full gap-2"
                >
                  {quickConsultMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Consultar
                </Button>
                {quickConsultMut.data && (
                  <div className="text-sm whitespace-pre-wrap bg-muted/50 rounded-lg p-3 mt-3">
                    {String(quickConsultMut.data)}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Check-in Dialog */}
      <Dialog open={showCheckIn} onOpenChange={setShowCheckIn}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nuevo Check-in Semanal</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Semana del</Label>
              <Input type="date" value={checkInForm.weekStart} onChange={(e) => setCheckInForm(f => ({ ...f, weekStart: e.target.value }))} />
            </div>
            <div>
              <Label>Peso actual (kg)</Label>
              <Input type="number" value={checkInForm.currentWeight} onChange={(e) => setCheckInForm(f => ({ ...f, currentWeight: e.target.value }))} placeholder="75.5" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {(["energyLevel", "hungerLevel", "sleepQuality", "adherenceRating"] as const).map((field) => (
                <div key={field}>
                  <Label>{field === "energyLevel" ? "Energía" : field === "hungerLevel" ? "Hambre" : field === "sleepQuality" ? "Sueño" : "Adherencia"} (1-5)</Label>
                  <Select value={checkInForm[field]} onValueChange={(v) => setCheckInForm(f => ({ ...f, [field]: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[1,2,3,4,5].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
            <div>
              <Label>Notas</Label>
              <Textarea value={checkInForm.notes} onChange={(e) => setCheckInForm(f => ({ ...f, notes: e.target.value }))} rows={3} />
            </div>
            <Button onClick={() => {
              createCheckInMut.mutate({
                clientId,
                weekStart: checkInForm.weekStart,
                currentWeight: checkInForm.currentWeight ? Math.round(parseFloat(checkInForm.currentWeight) * 1000) : undefined,
                energyLevel: parseInt(checkInForm.energyLevel),
                hungerLevel: parseInt(checkInForm.hungerLevel),
                sleepQuality: parseInt(checkInForm.sleepQuality),
                adherenceRating: parseInt(checkInForm.adherenceRating),
                notes: checkInForm.notes || undefined,
              });
            }} disabled={createCheckInMut.isPending} className="w-full">
              {createCheckInMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Guardar Check-in
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Measurement Dialog */}
      <Dialog open={showMeasure} onOpenChange={setShowMeasure}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nueva Medida Corporal</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Fecha</Label>
              <Input type="date" value={measureForm.date} onChange={(e) => setMeasureForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Peso (kg)</Label><Input type="number" step="0.1" value={measureForm.weight} onChange={(e) => setMeasureForm(f => ({ ...f, weight: e.target.value }))} /></div>
              <div><Label>Grasa (%)</Label><Input type="number" step="0.1" value={measureForm.bodyFat} onChange={(e) => setMeasureForm(f => ({ ...f, bodyFat: e.target.value }))} /></div>
              <div><Label>Pecho (cm)</Label><Input type="number" step="0.1" value={measureForm.chest} onChange={(e) => setMeasureForm(f => ({ ...f, chest: e.target.value }))} /></div>
              <div><Label>Cintura (cm)</Label><Input type="number" step="0.1" value={measureForm.waist} onChange={(e) => setMeasureForm(f => ({ ...f, waist: e.target.value }))} /></div>
              <div><Label>Cadera (cm)</Label><Input type="number" step="0.1" value={measureForm.hips} onChange={(e) => setMeasureForm(f => ({ ...f, hips: e.target.value }))} /></div>
              <div><Label>Brazos (cm)</Label><Input type="number" step="0.1" value={measureForm.arms} onChange={(e) => setMeasureForm(f => ({ ...f, arms: e.target.value }))} /></div>
              <div><Label>Muslos (cm)</Label><Input type="number" step="0.1" value={measureForm.thighs} onChange={(e) => setMeasureForm(f => ({ ...f, thighs: e.target.value }))} /></div>
            </div>
            <div><Label>Notas</Label><Textarea value={measureForm.notes} onChange={(e) => setMeasureForm(f => ({ ...f, notes: e.target.value }))} rows={2} /></div>
            <Button onClick={() => {
              addMeasureMut.mutate({
                clientId,
                date: measureForm.date,
                weight: measureForm.weight ? Math.round(parseFloat(measureForm.weight) * 1000) : undefined,
                bodyFat: measureForm.bodyFat ? Math.round(parseFloat(measureForm.bodyFat) * 10) : undefined,
                chest: measureForm.chest ? Math.round(parseFloat(measureForm.chest) * 10) : undefined,
                waist: measureForm.waist ? Math.round(parseFloat(measureForm.waist) * 10) : undefined,
                hips: measureForm.hips ? Math.round(parseFloat(measureForm.hips) * 10) : undefined,
                arms: measureForm.arms ? Math.round(parseFloat(measureForm.arms) * 10) : undefined,
                thighs: measureForm.thighs ? Math.round(parseFloat(measureForm.thighs) * 10) : undefined,
                notes: measureForm.notes || undefined,
              });
            }} disabled={addMeasureMut.isPending} className="w-full">
              {addMeasureMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Guardar Medida
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assessment Dialog */}
      <Dialog open={showAssessment} onOpenChange={setShowAssessment}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Valoración Inicial</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Dieta actual</Label><Textarea value={assessForm.currentDiet} onChange={(e) => setAssessForm(f => ({ ...f, currentDiet: e.target.value }))} rows={2} placeholder="Describe su alimentación habitual..." /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Frecuencia ejercicio</Label><Input value={assessForm.exerciseFrequency} onChange={(e) => setAssessForm(f => ({ ...f, exerciseFrequency: e.target.value }))} placeholder="3-4 días/semana" /></div>
              <div><Label>Tipo ejercicio</Label><Input value={assessForm.exerciseType} onChange={(e) => setAssessForm(f => ({ ...f, exerciseType: e.target.value }))} placeholder="Pesas, cardio..." /></div>
            </div>
            <div><Label>Condiciones médicas</Label><Input value={assessForm.medicalConditions} onChange={(e) => setAssessForm(f => ({ ...f, medicalConditions: e.target.value }))} placeholder="Ninguna, diabetes..." /></div>
            <div><Label>Medicamentos</Label><Input value={assessForm.medications} onChange={(e) => setAssessForm(f => ({ ...f, medications: e.target.value }))} placeholder="Ninguno..." /></div>
            <div><Label>Alergias/Intolerancias</Label><Input value={assessForm.allergiesIntolerances} onChange={(e) => setAssessForm(f => ({ ...f, allergiesIntolerances: e.target.value }))} placeholder="Lactosa, gluten..." /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Horas sueño</Label><Input type="number" value={assessForm.sleepHours} onChange={(e) => setAssessForm(f => ({ ...f, sleepHours: e.target.value }))} placeholder="7" /></div>
              <div>
                <Label>Estrés (1-5)</Label>
                <Select value={assessForm.stressLevel} onValueChange={(v) => setAssessForm(f => ({ ...f, stressLevel: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{[1,2,3,4,5].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Agua (ml/día)</Label><Input type="number" value={assessForm.waterIntake} onChange={(e) => setAssessForm(f => ({ ...f, waterIntake: e.target.value }))} placeholder="2000" /></div>
            </div>
            <div><Label>Objetivos</Label><Textarea value={assessForm.goals} onChange={(e) => setAssessForm(f => ({ ...f, goals: e.target.value }))} rows={2} placeholder="Objetivos del cliente..." /></div>
            <div><Label>Notas del entrenador</Label><Textarea value={assessForm.trainerNotes} onChange={(e) => setAssessForm(f => ({ ...f, trainerNotes: e.target.value }))} rows={2} placeholder="Tus observaciones..." /></div>
            <Button onClick={() => {
              createAssessMut.mutate({
                clientId,
                currentDiet: assessForm.currentDiet || undefined,
                exerciseFrequency: assessForm.exerciseFrequency || undefined,
                exerciseType: assessForm.exerciseType || undefined,
                medicalConditions: assessForm.medicalConditions || undefined,
                medications: assessForm.medications || undefined,
                allergiesIntolerances: assessForm.allergiesIntolerances || undefined,
                sleepHours: assessForm.sleepHours ? parseInt(assessForm.sleepHours) : undefined,
                stressLevel: parseInt(assessForm.stressLevel),
                waterIntake: assessForm.waterIntake ? parseInt(assessForm.waterIntake) : undefined,
                alcoholFrequency: assessForm.alcoholFrequency || undefined,
                smokingStatus: assessForm.smokingStatus || undefined,
                goals: assessForm.goals || undefined,
                trainerNotes: assessForm.trainerNotes || undefined,
              });
            }} disabled={createAssessMut.isPending} className="w-full">
              {createAssessMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Guardar Valoración
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Small helper component for inline feedback
function FeedbackInput({ checkInId, clientId, onSubmit }: { checkInId: number; clientId: number; onSubmit: (fb: string) => void }) {
  const [show, setShow] = useState(false);
  const [text, setText] = useState("");
  if (!show) return (
    <Button variant="ghost" size="sm" onClick={() => setShow(true)} className="text-xs gap-1">
      <Edit2 className="h-3 w-3" /> Añadir feedback
    </Button>
  );
  return (
    <div className="flex gap-2">
      <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Tu feedback..." className="text-sm" />
      <Button size="sm" onClick={() => { if (text.trim()) onSubmit(text.trim()); }} disabled={!text.trim()}>
        <Send className="h-3.5 w-3.5" />
      </Button>
      <Button size="sm" variant="ghost" onClick={() => setShow(false)}>
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
