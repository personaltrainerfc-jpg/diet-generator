import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Bot, Shield, AlertTriangle, CheckCircle2, X, Plus, Save } from "lucide-react";

export default function AiConfig() {
  const configQ = trpc.clientMgmt.getAiConfig.useQuery();
  const alertsQ = trpc.clientMgmt.getEscalationAlerts.useQuery({ resolved: false });
  const resolvedAlertsQ = trpc.clientMgmt.getEscalationAlerts.useQuery({ resolved: true });

  const updateMut = trpc.clientMgmt.updateAiConfig.useMutation({
    onSuccess: () => { toast.success("Configuración guardada"); configQ.refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const resolveMut = trpc.clientMgmt.resolveAlert.useMutation({
    onSuccess: () => { alertsQ.refetch(); resolvedAlertsQ.refetch(); toast.success("Alerta resuelta"); },
    onError: (e) => toast.error(e.message),
  });

  const [name, setName] = useState("NutriBot");
  const [tone, setTone] = useState("amigable");
  const [rules, setRules] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState("");
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    if (configQ.data) {
      setName(configQ.data.assistantName || "NutriBot");
      setTone(configQ.data.tone || "amigable");
      setRules(configQ.data.customRules || "");
      setKeywords((configQ.data.escalationKeywords as string[]) || ["dolor", "mareo", "vomit", "desmay", "urgen", "médico", "hospital", "alergia"]);
      setEnabled(configQ.data.enabled === 1);
    }
  }, [configQ.data]);

  const handleSave = () => {
    updateMut.mutate({
      assistantName: name,
      tone,
      customRules: rules,
      escalationKeywords: keywords,
      enabled: enabled ? 1 : 0,
    });
  };

  const addKeyword = () => {
    const kw = newKeyword.trim().toLowerCase();
    if (kw && !keywords.includes(kw)) {
      setKeywords([...keywords, kw]);
      setNewKeyword("");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          Asistente IA
        </h2>
        <p className="text-muted-foreground text-sm mt-1">Configura el asistente inteligente que atiende a tus clientes 24/7</p>
      </div>

      {/* Config card */}
      <div className="bg-card text-card-foreground rounded-2xl shadow-sm p-5 space-y-4">
        <h3 className="font-semibold text-[15px] flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          Personalidad del Asistente
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nombre del asistente</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="NutriBot" className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>Tono de comunicación</Label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="amigable">Amigable y cercano</SelectItem>
                <SelectItem value="profesional">Profesional y directo</SelectItem>
                <SelectItem value="motivador">Motivador y energético</SelectItem>
                <SelectItem value="empático">Empático y comprensivo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Reglas personalizadas</Label>
          <Textarea
            value={rules}
            onChange={(e) => setRules(e.target.value)}
            placeholder="Ej: No recomendar suplementos. Siempre sugerir hidratación. Recordar que el cliente tiene intolerancia a la lactosa..."
            className="rounded-xl min-h-[100px]"
          />
          <p className="text-[11px] text-muted-foreground">Estas reglas se añaden al contexto del asistente para todas las conversaciones</p>
        </div>

        <div className="flex items-center gap-3">
          <Label>Estado:</Label>
          <Button
            variant={enabled ? "default" : "outline"}
            size="sm"
            onClick={() => setEnabled(!enabled)}
            className="rounded-xl"
          >
            {enabled ? "Activado" : "Desactivado"}
          </Button>
        </div>

        <Button onClick={handleSave} disabled={updateMut.isPending} className="rounded-xl">
          {updateMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Guardar Configuración
        </Button>
      </div>

      {/* Escalation keywords */}
      <div className="bg-card text-card-foreground rounded-2xl shadow-sm p-5 space-y-4">
        <h3 className="font-semibold text-[15px] flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          Palabras de Escalado
        </h3>
        <p className="text-[12px] text-muted-foreground">
          Cuando el cliente mencione alguna de estas palabras, recibirás una alerta inmediata.
        </p>

        <div className="flex flex-wrap gap-2">
          {keywords.map((kw, i) => (
            <span key={i} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 text-[12px] border border-amber-500/20">
              {kw}
              <button onClick={() => setKeywords(keywords.filter((_, j) => j !== i))} className="hover:text-amber-300">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>

        <div className="flex gap-2">
          <Input
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addKeyword()}
            placeholder="Nueva palabra clave..."
            className="rounded-xl flex-1"
          />
          <Button onClick={addKeyword} variant="outline" size="icon" className="rounded-xl">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Active alerts */}
      <div className="bg-card text-card-foreground rounded-2xl shadow-sm p-5 space-y-4">
        <h3 className="font-semibold text-[15px] flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          Alertas Pendientes
          {(alertsQ.data?.length || 0) > 0 && (
            <span className="ml-auto bg-red-500 text-white text-[11px] px-2 py-0.5 rounded-full">{alertsQ.data?.length}</span>
          )}
        </h3>

        {alertsQ.isLoading ? (
          <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : (alertsQ.data?.length || 0) === 0 ? (
          <div className="text-center py-6">
            <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">No hay alertas pendientes</p>
          </div>
        ) : (
          <div className="space-y-2">
            {alertsQ.data?.map((alert) => (
              <div key={alert.id} className="flex items-start justify-between p-3 rounded-xl bg-red-500/5 border border-red-500/20">
                <div className="flex-1">
                  <p className="text-[13px] font-medium text-red-400">{alert.reason}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {new Date(alert.createdAt).toLocaleString("es-ES")}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => resolveMut.mutate({ id: alert.id })}
                  disabled={resolveMut.isPending}
                  className="text-[12px] text-green-500 hover:text-green-400"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                  Resolver
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Resolved alerts */}
      {(resolvedAlertsQ.data?.length || 0) > 0 && (
        <div className="bg-card text-card-foreground rounded-2xl shadow-sm p-5 space-y-3">
          <h3 className="font-semibold text-[15px] text-muted-foreground">Alertas Resueltas</h3>
          <div className="space-y-2">
            {resolvedAlertsQ.data?.slice(0, 10).map((alert) => (
              <div key={alert.id} className="flex items-start p-3 rounded-xl bg-muted/30">
                <div className="flex-1">
                  <p className="text-[12px] text-muted-foreground">{alert.reason}</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1">
                    {new Date(alert.createdAt).toLocaleString("es-ES")}
                  </p>
                </div>
                <CheckCircle2 className="h-4 w-4 text-green-500/50 flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
