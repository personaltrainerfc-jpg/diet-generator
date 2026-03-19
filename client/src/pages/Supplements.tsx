import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, Pill, Pencil, Loader2 } from "lucide-react";

interface SupplementsPanelProps {
  dietId: number;
}

export default function SupplementsPanel({ dietId }: SupplementsPanelProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [dose, setDose] = useState("");
  const [timing, setTiming] = useState("");
  const [notes, setNotes] = useState("");

  const utils = trpc.useUtils();
  const { data: supplements, isLoading } = trpc.supplement.list.useQuery({ dietId });

  const createMut = trpc.supplement.create.useMutation({
    onSuccess: () => {
      utils.supplement.list.invalidate({ dietId });
      toast.success("Suplemento añadido");
      resetForm();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMut = trpc.supplement.update.useMutation({
    onSuccess: () => {
      utils.supplement.list.invalidate({ dietId });
      toast.success("Suplemento actualizado");
      resetForm();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMut = trpc.supplement.delete.useMutation({
    onSuccess: () => {
      utils.supplement.list.invalidate({ dietId });
      toast.success("Suplemento eliminado");
    },
    onError: (err) => toast.error(err.message),
  });

  const resetForm = () => {
    setShowAdd(false);
    setEditId(null);
    setName("");
    setDose("");
    setTiming("");
    setNotes("");
  };

  const openEdit = (s: any) => {
    setEditId(s.id);
    setName(s.name);
    setDose(s.dose || "");
    setTiming(s.timing || "");
    setNotes(s.notes || "");
    setShowAdd(true);
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    if (editId) {
      updateMut.mutate({
        id: editId,
        name: name.trim(),
        dose: dose.trim() || null,
        timing: timing.trim() || null,
        notes: notes.trim() || null,
      });
    } else {
      createMut.mutate({
        dietId,
        name: name.trim(),
        dose: dose.trim() || undefined,
        timing: timing.trim() || undefined,
        notes: notes.trim() || undefined,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {supplements && supplements.length > 0
            ? `${supplements.length} suplemento(s) asignado(s)`
            : "Sin suplementos asignados"}
        </p>
        <Button size="sm" variant="outline" onClick={() => { resetForm(); setShowAdd(true); }} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Añadir
        </Button>
      </div>

      {supplements && supplements.length > 0 && (
        <div className="space-y-2">
          {supplements.map((s: any) => (
            <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Pill className="h-3.5 w-3.5 text-primary" />
                  <span className="font-medium text-sm">{s.name}</span>
                  {s.dose && <Badge variant="secondary" className="text-xs">{s.dose}</Badge>}
                </div>
                {s.timing && (
                  <p className="text-xs text-muted-foreground ml-5">{s.timing}</p>
                )}
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(s)}>
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => deleteMut.mutate({ id: s.id })}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showAdd} onOpenChange={(v) => { if (!v) resetForm(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5 text-primary" />
              {editId ? "Editar Suplemento" : "Nuevo Suplemento"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="font-medium">Nombre *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Creatina monohidrato"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              />
            </div>
            <div className="space-y-2">
              <Label className="font-medium">Dosis</Label>
              <Input
                value={dose}
                onChange={(e) => setDose(e.target.value)}
                placeholder="Ej: 5g al día"
              />
            </div>
            <div className="space-y-2">
              <Label className="font-medium">Momento de toma</Label>
              <Input
                value={timing}
                onChange={(e) => setTiming(e.target.value)}
                placeholder="Ej: Después de entrenar"
              />
            </div>
            <div className="space-y-2">
              <Label className="font-medium">Notas</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notas adicionales..."
                rows={2}
                className="resize-none"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={resetForm}>Cancelar</Button>
              <Button
                onClick={handleSubmit}
                disabled={!name.trim() || createMut.isPending || updateMut.isPending}
              >
                {(createMut.isPending || updateMut.isPending) && (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                )}
                {editId ? "Guardar" : "Añadir"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
