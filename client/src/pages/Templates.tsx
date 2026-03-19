import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, FileStack, Plus, Search, Tag, Trash2, Copy, Users } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation } from "wouter";

export default function Templates() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [filterTag, setFilterTag] = useState("all");
  const [showSave, setShowSave] = useState(false);
  const [saveForm, setSaveForm] = useState({ dietId: "", name: "", tags: "" });

  const templatesQ = trpc.clientMgmt.getTemplates.useQuery();
  const dietsQ = trpc.diet.list.useQuery();
  const deleteMut = trpc.clientMgmt.deleteTemplate.useMutation({
    onSuccess: () => { toast.success("Plantilla eliminada"); templatesQ.refetch(); },
    onError: (e: any) => toast.error(e.message),
  });
  const saveMut = trpc.clientMgmt.createTemplate.useMutation({
    onSuccess: () => { toast.success("Plantilla guardada"); templatesQ.refetch(); setShowSave(false); setSaveForm({ dietId: "", name: "", tags: "" }); },
    onError: (e: any) => toast.error(e.message),
  });

  const templates = templatesQ.data || [];
  const diets = dietsQ.data || [];

  // Collect all unique tags
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    templates.forEach((t: any) => {
      const tags = typeof t.tags === "string" ? JSON.parse(t.tags || "[]") : (t.tags || []);
      tags.forEach((tag: string) => tagSet.add(tag));
    });
    return Array.from(tagSet);
  }, [templates]);

  const filtered = useMemo(() => {
    return templates.filter((t: any) => {
      const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase());
      if (filterTag === "all") return matchSearch;
      const tags = typeof t.tags === "string" ? JSON.parse(t.tags || "[]") : (t.tags || []);
      return matchSearch && tags.includes(filterTag);
    });
  }, [templates, search, filterTag]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight uppercase">PLANTILLAS</h1>
          <p className="text-[14px] text-muted-foreground mt-1">Dietas reutilizables para asignar rápidamente a tus clientes</p>
        </div>
        <Button onClick={() => setShowSave(true)} className="gap-2 rounded-xl">
          <Plus className="h-4 w-4" />Guardar plantilla
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar plantillas..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 rounded-xl" />
        </div>
        {allTags.length > 0 && (
          <Select value={filterTag} onValueChange={setFilterTag}>
            <SelectTrigger className="w-[180px] rounded-xl"><SelectValue placeholder="Filtrar por etiqueta" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {allTags.map((tag) => (
                <SelectItem key={tag} value={tag}>{tag}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Templates grid */}
      {templatesQ.isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <FileStack className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-[17px] font-semibold">Sin plantillas</p>
          <p className="text-[14px] text-muted-foreground mt-1">Guarda una dieta como plantilla para reutilizarla</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((t: any) => {
            const tags = typeof t.tags === "string" ? JSON.parse(t.tags || "[]") : (t.tags || []);
            return (
              <div key={t.id} className="bg-card rounded-2xl border border-border/50 p-5 hover:border-primary/30 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-[15px] font-semibold">{t.name}</h3>
                    <p className="text-[12px] text-muted-foreground mt-0.5">{t.totalCalories} kcal · {t.mealsPerDay} comidas · {t.totalMenus} menús</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => { if (confirm("¿Eliminar esta plantilla?")) deleteMut.mutate({ id: t.id }); }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {tags.map((tag: string) => (
                      <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[11px] font-medium">
                        <Tag className="h-2.5 w-2.5" />{tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 mt-3 pt-3 border-t border-border/30">
                  <Button variant="outline" size="sm" className="flex-1 gap-1.5 rounded-xl text-[12px]" onClick={() => navigate(`/diet/${t.dietId}`)}>
                    <Copy className="h-3 w-3" />Ver dieta
                  </Button>
                  <Button variant="default" size="sm" className="flex-1 gap-1.5 rounded-xl text-[12px]" onClick={() => { navigate("/clients"); toast.info("Selecciona un cliente para asignar esta plantilla"); }}>
                    <Users className="h-3 w-3" />Asignar
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Save as template dialog */}
      <Dialog open={showSave} onOpenChange={setShowSave}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader><DialogTitle className="text-[17px]">Guardar como Plantilla</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[13px]">Dieta base</Label>
              <Select value={saveForm.dietId} onValueChange={(v) => setSaveForm(f => ({ ...f, dietId: v }))}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecciona una dieta" /></SelectTrigger>
                <SelectContent>
                  {diets.map((d: any) => (
                    <SelectItem key={d.id} value={String(d.id)}>{d.name} ({d.totalCalories} kcal)</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px]">Nombre de la plantilla</Label>
              <Input value={saveForm.name} onChange={(e) => setSaveForm(f => ({ ...f, name: e.target.value }))} placeholder="Ej: Definición mujer 60kg" className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px]">Etiquetas (separadas por coma)</Label>
              <Input value={saveForm.tags} onChange={(e) => setSaveForm(f => ({ ...f, tags: e.target.value }))} placeholder="Ej: definición, mujer, 60kg" className="rounded-xl" />
            </div>
            <Button onClick={() => {
              if (!saveForm.dietId || !saveForm.name.trim()) { toast.error("Completa los campos"); return; }
              const tags = saveForm.tags.split(",").map(t => t.trim()).filter(Boolean);
              saveMut.mutate({ dietId: Number(saveForm.dietId), name: saveForm.name.trim(), tags });
            }} disabled={saveMut.isPending} className="w-full rounded-xl h-11">
              {saveMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Guardar Plantilla
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
