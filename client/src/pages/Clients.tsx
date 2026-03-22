import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useLocation } from "wouter";
import { Plus, Users, Search, Phone, Mail, Target, Trash2, Loader2, UserCircle } from "lucide-react";
import { toast } from "sonner";
import { ARCHETYPES } from "@shared/constants";

export default function Clients() {
  const [, setLocation] = useLocation();
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ name: "", email: "", phone: "", age: "", weight: "", height: "", goal: "", notes: "" });

  const clientsQuery = trpc.clientMgmt.list.useQuery();
  const createMut = trpc.clientMgmt.create.useMutation({
    onSuccess: (data) => { toast.success(`Cliente creado. Código: ${data.accessCode}`); clientsQuery.refetch(); setShowCreate(false); setForm({ name: "", email: "", phone: "", age: "", weight: "", height: "", goal: "", notes: "" }); },
  });
  const deleteMut = trpc.clientMgmt.delete.useMutation({
    onSuccess: () => { toast.success("Cliente eliminado"); clientsQuery.refetch(); },
  });

  const clients = clientsQuery.data || [];
  const filtered = clients.filter((c: any) => c.name.toLowerCase().includes(search.toLowerCase()) || (c.email && c.email.toLowerCase().includes(search.toLowerCase())));

  const handleCreate = () => {
    if (!form.name.trim()) return;
    createMut.mutate({ name: form.name.trim(), email: form.email.trim() || undefined, phone: form.phone.trim() || undefined, age: form.age ? parseInt(form.age) : undefined, weight: form.weight ? parseInt(form.weight) * 1000 : undefined, height: form.height ? parseInt(form.height) : undefined, goal: form.goal.trim() || undefined, notes: form.notes.trim() || undefined });
  };

  const statusColors: Record<string, string> = {
    active: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    inactive: "bg-secondary text-muted-foreground border-border/50",
    paused: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  };
  const statusLabels: Record<string, string> = { active: "Activo", inactive: "Inactivo", paused: "Pausado" };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight uppercase">Mis Clientes</h1>
          <p className="text-[14px] text-muted-foreground mt-1">Gestiona tus clientes y sus planes nutricionales.</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2 rounded-xl h-10"><Plus className="h-4 w-4" />Nuevo Cliente</Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar por nombre o email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 rounded-xl h-11 bg-secondary/50 border-border/50" />
      </div>

      {clientsQuery.isLoading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-card text-card-foreground rounded-2xl border border-dashed border-border/50 flex flex-col items-center justify-center py-16 text-center shadow-sm">
          <div className="h-16 w-16 rounded-2xl bg-secondary flex items-center justify-center mb-4"><Users className="h-8 w-8 text-muted-foreground/40" /></div>
          <h3 className="text-[17px] font-semibold mb-1">{search ? "Sin resultados" : "No tienes clientes aún"}</h3>
          <p className="text-[13px] text-muted-foreground mb-5 max-w-xs">{search ? "Prueba con otro término" : "Crea tu primer cliente para empezar"}</p>
          {!search && <Button onClick={() => setShowCreate(true)} variant="outline" className="gap-2 rounded-xl"><Plus className="h-4 w-4" />Crear cliente</Button>}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((client: any) => (
            <div key={client.id} className="bg-card text-card-foreground rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-all cursor-pointer group" onClick={() => setLocation(`/clients/${client.id}`)}>
              <div className="flex items-center gap-4 p-4">
                {(() => {
                  const arch = client.archetype ? ARCHETYPES.find((a: any) => a.id === client.archetype) : null;
                  return arch ? (
                    <div className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0 overflow-hidden" style={{ backgroundColor: `${arch.accentColor}15`, border: `1px solid ${arch.accentColor}30` }}>
                      <img src={arch.image} alt={arch.name} className="h-9 w-9 object-contain" />
                    </div>
                  ) : (
                    <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <UserCircle className="h-5.5 w-5.5 text-primary" />
                    </div>
                  );
                })()}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-[15px] truncate">{client.name}</span>
                    <Badge variant="outline" className={`text-[11px] rounded-full px-2 py-0 ${statusColors[client.status] || ""}`}>
                      {statusLabels[client.status] || client.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-[12px] text-muted-foreground">
                    {client.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{client.email}</span>}
                    {client.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{client.phone}</span>}
                    {client.goal && <span className="flex items-center gap-1 hidden sm:flex"><Target className="h-3 w-3" />{client.goal}</span>}
                  </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); if (confirm(`¿Eliminar a ${client.name}?`)) deleteMut.mutate({ id: client.id }); }}
                  className="h-9 w-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100 shrink-0">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto rounded-2xl">
          <DialogHeader><DialogTitle className="text-[17px]">Nuevo Cliente</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="font-medium text-[13px]">Nombre *</Label>
              <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nombre completo" className="rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-[13px]">Email</Label><Input type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@ejemplo.com" className="rounded-xl" /></div>
              <div className="space-y-1.5"><Label className="text-[13px]">Teléfono</Label><Input value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+34 600..." className="rounded-xl" /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5"><Label className="text-[13px]">Edad</Label><Input type="number" value={form.age} onChange={(e) => setForm(f => ({ ...f, age: e.target.value }))} placeholder="25" className="rounded-xl" /></div>
              <div className="space-y-1.5"><Label className="text-[13px]">Peso (kg)</Label><Input type="number" value={form.weight} onChange={(e) => setForm(f => ({ ...f, weight: e.target.value }))} placeholder="75" className="rounded-xl" /></div>
              <div className="space-y-1.5"><Label className="text-[13px]">Altura (cm)</Label><Input type="number" value={form.height} onChange={(e) => setForm(f => ({ ...f, height: e.target.value }))} placeholder="175" className="rounded-xl" /></div>
            </div>
            <div className="space-y-1.5"><Label className="text-[13px]">Objetivo</Label><Input value={form.goal} onChange={(e) => setForm(f => ({ ...f, goal: e.target.value }))} placeholder="Pérdida de peso, ganancia muscular..." className="rounded-xl" /></div>
            <div className="space-y-1.5"><Label className="text-[13px]">Notas</Label><Textarea value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Observaciones adicionales..." rows={3} className="rounded-xl" /></div>
            <Button onClick={handleCreate} disabled={createMut.isPending || !form.name.trim()} className="w-full rounded-xl h-11">
              {createMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}Crear Cliente
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
