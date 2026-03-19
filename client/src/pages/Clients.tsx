import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useLocation } from "wouter";
import {
  Plus, Users, Search, Phone, Mail, Target, MoreVertical,
  Trash2, Loader2, UserCircle, Activity
} from "lucide-react";
import { toast } from "sonner";

export default function Clients() {

  const [, setLocation] = useLocation();
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    name: "", email: "", phone: "", age: "", weight: "", height: "", goal: "", notes: "",
  });

  const clientsQuery = trpc.clientMgmt.list.useQuery();
  const createMut = trpc.clientMgmt.create.useMutation({
    onSuccess: (data) => {
      toast.success(`Cliente creado. Código de acceso: ${data.accessCode}`);
      clientsQuery.refetch();
      setShowCreate(false);
      setForm({ name: "", email: "", phone: "", age: "", weight: "", height: "", goal: "", notes: "" });
    },
  });
  const deleteMut = trpc.clientMgmt.delete.useMutation({
    onSuccess: () => {
      toast.success("Cliente eliminado");
      clientsQuery.refetch();
    },
  });

  const clients = clientsQuery.data || [];
  const filtered = clients.filter((c: any) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
  );

  const handleCreate = () => {
    if (!form.name.trim()) return;
    createMut.mutate({
      name: form.name.trim(),
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      age: form.age ? parseInt(form.age) : undefined,
      weight: form.weight ? parseInt(form.weight) * 1000 : undefined,
      height: form.height ? parseInt(form.height) : undefined,
      goal: form.goal.trim() || undefined,
      notes: form.notes.trim() || undefined,
    });
  };

  const statusColors: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    inactive: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    paused: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  };
  const statusLabels: Record<string, string> = { active: "Activo", inactive: "Inactivo", paused: "Pausado" };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Mis Clientes</h1>
          <p className="text-sm text-muted-foreground mt-1">Gestiona tus clientes y sus planes nutricionales</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Nuevo Cliente
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre o email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Client List */}
      {clientsQuery.isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-1">
              {search ? "Sin resultados" : "No tienes clientes aún"}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {search ? "Prueba con otro término de búsqueda" : "Crea tu primer cliente para empezar"}
            </p>
            {!search && (
              <Button onClick={() => setShowCreate(true)} variant="outline" className="gap-2">
                <Plus className="h-4 w-4" /> Crear cliente
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((client: any) => (
            <Card
              key={client.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setLocation(`/clients/${client.id}`)}
            >
              <CardContent className="flex items-center gap-4 py-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <UserCircle className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-foreground truncate">{client.name}</span>
                    <Badge className={`text-xs ${statusColors[client.status] || ""}`}>
                      {statusLabels[client.status] || client.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {client.email && (
                      <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{client.email}</span>
                    )}
                    {client.phone && (
                      <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{client.phone}</span>
                    )}
                    {client.goal && (
                      <span className="flex items-center gap-1"><Target className="h-3 w-3" />{client.goal}</span>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`¿Eliminar a ${client.name}?`)) {
                      deleteMut.mutate({ id: client.id });
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo Cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nombre *</Label>
              <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nombre completo" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@ejemplo.com" />
              </div>
              <div>
                <Label>Teléfono</Label>
                <Input value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+34 600..." />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Edad</Label>
                <Input type="number" value={form.age} onChange={(e) => setForm(f => ({ ...f, age: e.target.value }))} placeholder="25" />
              </div>
              <div>
                <Label>Peso (kg)</Label>
                <Input type="number" value={form.weight} onChange={(e) => setForm(f => ({ ...f, weight: e.target.value }))} placeholder="75" />
              </div>
              <div>
                <Label>Altura (cm)</Label>
                <Input type="number" value={form.height} onChange={(e) => setForm(f => ({ ...f, height: e.target.value }))} placeholder="175" />
              </div>
            </div>
            <div>
              <Label>Objetivo</Label>
              <Input value={form.goal} onChange={(e) => setForm(f => ({ ...f, goal: e.target.value }))} placeholder="Pérdida de peso, ganancia muscular..." />
            </div>
            <div>
              <Label>Notas</Label>
              <Textarea value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Observaciones adicionales..." rows={3} />
            </div>
            <Button onClick={handleCreate} disabled={createMut.isPending || !form.name.trim()} className="w-full">
              {createMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Crear Cliente
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
