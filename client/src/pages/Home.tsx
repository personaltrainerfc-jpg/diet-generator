import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Flame, Beef, Wheat, Droplets, UtensilsCrossed, ChefHat,
  Loader2, X, Plus, Sparkles, AlertCircle, Salad, CookingPot, MessageSquare,
  ShoppingCart, Ruler, CalendarDays, BookOpen, ChevronDown, ChevronUp
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { DIET_TYPES, COOKING_LEVELS, QUICK_TEMPLATES, DIET_TYPE_MACROS, NUTRIFLOW_LOGO } from "@shared/constants";
import type { DietType, CookingLevel } from "@shared/constants";

type DailyTarget = {
  day: number;
  calories: number;
  proteinPercent: number;
  carbsPercent: number;
  fatsPercent: number;
};

const SUPERMARKETS = [
  { value: "", label: "Sin preferencia" },
  { value: "Mercadona", label: "Mercadona" },
  { value: "Lidl", label: "Lidl" },
  { value: "Aldi", label: "Aldi" },
  { value: "Carrefour", label: "Carrefour" },
  { value: "Dia", label: "Dia" },
  { value: "Eroski", label: "Eroski" },
];

const DAY_NAMES = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"];

/* ─── Section wrapper ─── */
function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl bg-card text-card-foreground border border-border/50 p-5 md:p-6 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function SectionTitle({ icon: Icon, color, children }: { icon: any; color: string; children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-2.5 text-[15px] font-semibold text-card-foreground mb-1 uppercase tracking-wide">
      <Icon className={`h-[18px] w-[18px] ${color}`} strokeWidth={1.5} />
      {children}
    </h2>
  );
}

function SectionDesc({ children }: { children: React.ReactNode }) {
  return <p className="text-[13px] text-muted-foreground mb-5 leading-relaxed">{children}</p>;
}

export default function Home() {
  const [, setLocation] = useLocation();
  const [name, setName] = useState("Mi Dieta");
  const [totalCalories, setTotalCalories] = useState(2000);
  const [proteinPercent, setProteinPercent] = useState(30);
  const [carbsPercent, setCarbsPercent] = useState(45);
  const [fatsPercent, setFatsPercent] = useState(25);
  const [mealsPerDay, setMealsPerDay] = useState(4);
  const [totalMenus, setTotalMenus] = useState(1);
  const [avoidFoods, setAvoidFoods] = useState<string[]>([]);
  const [newAvoidFood, setNewAvoidFood] = useState("");
  const [dietType, setDietType] = useState<DietType>("equilibrada");
  const [cookingLevel, setCookingLevel] = useState<CookingLevel>("moderate");
  const [preferences, setPreferences] = useState("");
  const [useHomeMeasures, setUseHomeMeasures] = useState(false);
  const [supermarket, setSupermarket] = useState("");
  const [useDailyTargets, setUseDailyTargets] = useState(false);
  const [dailyTargets, setDailyTargets] = useState<DailyTarget[]>([]);
  const [selectedRecipeIds, setSelectedRecipeIds] = useState<number[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [preferredFoods, setPreferredFoods] = useState<string[]>([]);
  const [newPreferredFood, setNewPreferredFood] = useState("");
  const [allergies, setAllergies] = useState<string[]>([]);
  const [newAllergy, setNewAllergy] = useState("");
  const [fastingProtocol, setFastingProtocol] = useState("");

  const recipesQuery = trpc.recipe.list.useQuery();

  const macroSum = proteinPercent + carbsPercent + fatsPercent;
  const proteinGrams = Math.round((totalCalories * proteinPercent / 100) / 4);
  const carbsGrams = Math.round((totalCalories * carbsPercent / 100) / 4);
  const fatsGrams = Math.round((totalCalories * fatsPercent / 100) / 9);

  const handleToggleDailyTargets = (checked: boolean) => {
    setUseDailyTargets(checked);
    if (checked && dailyTargets.length === 0) {
      const targets: DailyTarget[] = [];
      for (let i = 1; i <= totalMenus; i++) {
        targets.push({ day: i, calories: totalCalories, proteinPercent, carbsPercent, fatsPercent });
      }
      setDailyTargets(targets);
    }
  };

  const updateDailyTarget = (index: number, field: keyof DailyTarget, value: number) => {
    setDailyTargets(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  useMemo(() => {
    if (useDailyTargets) {
      setDailyTargets(prev => {
        if (prev.length < totalMenus) {
          const newTargets = [...prev];
          for (let i = prev.length + 1; i <= totalMenus; i++) {
            newTargets.push({ day: i, calories: totalCalories, proteinPercent, carbsPercent, fatsPercent });
          }
          return newTargets;
        }
        return prev.slice(0, totalMenus);
      });
    }
  }, [totalMenus, useDailyTargets]);

  // Auto-adjust macros when diet type changes
  const handleDietTypeChange = (newType: DietType) => {
    setDietType(newType);
    const macros = DIET_TYPE_MACROS[newType];
    if (macros) {
      setProteinPercent(macros.proteinPercent);
      setCarbsPercent(macros.carbsPercent);
      setFatsPercent(macros.fatsPercent);
      toast.success(`Macros ajustados para dieta ${DIET_TYPES.find(d => d.value === newType)?.label || newType}`);
    }
  };

  const generateMutation = trpc.diet.generate.useMutation({
    onSuccess: (data) => {
      toast.success("Dieta generada correctamente");
      setLocation(`/diet/${data.dietId}`);
    },
    onError: (error) => {
      toast.error(error.message || "Error al generar la dieta");
    },
  });

  const handleAddAvoidFood = () => {
    const trimmed = newAvoidFood.trim();
    if (trimmed && !avoidFoods.includes(trimmed)) {
      setAvoidFoods([...avoidFoods, trimmed]);
      setNewAvoidFood("");
    }
  };

  const handleAddPreferredFood = () => {
    const trimmed = newPreferredFood.trim();
    if (trimmed && !preferredFoods.includes(trimmed)) {
      setPreferredFoods([...preferredFoods, trimmed]);
      setNewPreferredFood("");
    }
  };

  const handleAddAllergy = () => {
    const trimmed = newAllergy.trim();
    if (trimmed && !allergies.includes(trimmed)) {
      setAllergies([...allergies, trimmed]);
      setNewAllergy("");
    }
  };

  const applyTemplate = (template: typeof QUICK_TEMPLATES[number]) => {
    setTotalCalories(template.totalCalories);
    setProteinPercent(template.proteinPercent);
    setCarbsPercent(template.carbsPercent);
    setFatsPercent(template.fatsPercent);
    setMealsPerDay(template.mealsPerDay);
    setDietType(template.dietType);
    setCookingLevel(template.cookingLevel);
    setName(`Dieta ${template.name}`);
    toast.success(`Plantilla "${template.name}" aplicada`);
  };

  const toggleRecipe = (recipeId: number) => {
    setSelectedRecipeIds(prev =>
      prev.includes(recipeId) ? prev.filter(id => id !== recipeId) : [...prev, recipeId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (macroSum < 95 || macroSum > 105) {
      toast.error("La suma de macronutrientes debe ser aproximadamente 100%");
      return;
    }
    generateMutation.mutate({
      name,
      totalCalories,
      proteinPercent,
      carbsPercent,
      fatsPercent,
      mealsPerDay,
      totalMenus,
      avoidFoods,
      dietType,
      cookingLevel,
      useHomeMeasures,
      ...(supermarket ? { supermarket } : {}),
      ...(useDailyTargets && dailyTargets.length > 0 ? { dailyTargets } : {}),
      ...(selectedRecipeIds.length > 0 ? { selectedRecipeIds } : {}),
      ...(preferences.trim() ? { preferences: preferences.trim() } : {}),
      preferredFoods,
      allergies,
      ...(fastingProtocol ? { fastingProtocol } : {}),
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-8">
      {/* Header */}
      <div className="pt-2">
        <h1 className="text-[28px] font-bold tracking-tight text-foreground uppercase">NUEVA DIETA</h1>
        <p className="text-[13px] text-muted-foreground mt-1 uppercase tracking-wide">CONFIGURA LOS PARÁMETROS PARA CREAR EL PLAN NUTRICIONAL</p>
      </div>

      {/* Quick templates */}
      <Section>
        <SectionTitle icon={Sparkles} color="text-primary">Plantillas Rapidas</SectionTitle>
        <SectionDesc>Selecciona una plantilla para rellenar automaticamente.</SectionDesc>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {QUICK_TEMPLATES.map(template => (
            <button
              key={template.name}
              type="button"
              onClick={() => applyTemplate(template)}
              className="flex flex-col items-center gap-1 p-3 rounded-xl border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 cursor-pointer group"
            >
              <img src={template.iconImage} alt={template.name} className="h-8 w-8 object-contain" />
              <span className="text-[11px] font-medium text-card-foreground group-hover:text-primary transition-colors leading-tight text-center uppercase">{template.name}</span>
              <span className="text-[10px] text-muted-foreground">{template.totalCalories}</span>
            </button>
          ))}
        </div>
      </Section>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name */}
        <Section>
          <SectionTitle icon={ChefHat} color="text-primary">NOMBRE DEL PLAN</SectionTitle>
          <div className="mt-3">
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej: Dieta de definicion"
              className="rounded-xl h-11 text-[15px]"
              required
            />
          </div>
        </Section>

        {/* Diet type */}
        <Section>
          <SectionTitle icon={Salad} color="text-primary">Tipo de Dieta</SectionTitle>
          <SectionDesc>Selecciona el estilo de alimentacion. Los macros se ajustan automaticamente.</SectionDesc>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {DIET_TYPES.map(dt => (
              <button
                key={dt.value}
                type="button"
                onClick={() => handleDietTypeChange(dt.value)}
                className={`flex flex-col items-start gap-0.5 p-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                  dietType === dt.value
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border/50 hover:border-border hover:bg-accent/30"
                }`}
              >
                <span className={`text-[13px] font-semibold uppercase tracking-wide ${dietType === dt.value ? "text-primary" : "text-card-foreground"}`}>
                  {dt.label}
                </span>
                <span className="text-[12px] text-muted-foreground leading-relaxed">{dt.description}</span>
              </button>
            ))}
          </div>
        </Section>

        {/* Cooking level */}
        <Section>
          <SectionTitle icon={CookingPot} color="text-orange-500">Nivel de Cocina</SectionTitle>
          <SectionDesc>Indica cuanto tiempo y esfuerzo quieres dedicar a cocinar.</SectionDesc>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {COOKING_LEVELS.map(cl => (
              <button
                key={cl.value}
                type="button"
                onClick={() => setCookingLevel(cl.value)}
                className={`flex flex-col items-start gap-0.5 p-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                  cookingLevel === cl.value
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border/50 hover:border-border hover:bg-accent/30"
                }`}
              >
                <span className={`text-[13px] font-semibold uppercase tracking-wide ${cookingLevel === cl.value ? "text-primary" : "text-card-foreground"}`}>
                  {cl.label}
                </span>
                <span className="text-[12px] text-muted-foreground leading-relaxed">{cl.description}</span>
              </button>
            ))}
          </div>
        </Section>

        {/* Calories */}
        <Section>
          <SectionTitle icon={Flame} color="text-orange-500">Calorias Diarias</SectionTitle>
          <SectionDesc>Define el objetivo calorico total para cada dia.</SectionDesc>
          <div className="flex items-center gap-3 mb-4">
            <Input
              type="number"
              value={totalCalories}
              onChange={e => setTotalCalories(Number(e.target.value))}
              min={800}
              max={10000}
              step={50}
              className="w-28 text-center text-lg font-semibold rounded-xl h-11"
            />
            <span className="text-[13px] text-muted-foreground font-medium">kcal</span>
          </div>
          <Slider
            value={[totalCalories]}
            onValueChange={v => setTotalCalories(v[0])}
            min={800}
            max={6000}
            step={50}
            className="w-full"
          />
          <div className="flex justify-between text-[11px] text-muted-foreground mt-2">
            <span>800</span>
            <span>6000</span>
          </div>
        </Section>

        {/* Macros */}
        <Section>
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-[15px] font-semibold text-card-foreground uppercase tracking-wide">Macronutrientes</h2>
            {(macroSum < 95 || macroSum > 105) && (
              <span className="flex items-center gap-1 text-[12px] text-destructive font-medium">
                <AlertCircle className="h-3.5 w-3.5" />
                {macroSum}%
              </span>
            )}
          </div>
          <SectionDesc>Ajusta los porcentajes. La suma debe ser ~100%.</SectionDesc>

          <div className="space-y-5">
            {/* Protein */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 text-[13px] font-medium">
                  <Beef className="h-4 w-4 text-red-500" />Proteinas
                </Label>
                <div className="text-right">
                  <span className="text-[15px] font-bold">{proteinPercent}%</span>
                  <span className="text-[12px] text-muted-foreground ml-1.5">({proteinGrams}g)</span>
                </div>
              </div>
              <Slider value={[proteinPercent]} onValueChange={v => setProteinPercent(v[0])} min={5} max={60} step={1} />
            </div>

            {/* Carbs */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 text-[13px] font-medium">
                  <Wheat className="h-4 w-4 text-amber-500" />Carbohidratos
                </Label>
                <div className="text-right">
                  <span className="text-[15px] font-bold">{carbsPercent}%</span>
                  <span className="text-[12px] text-muted-foreground ml-1.5">({carbsGrams}g)</span>
                </div>
              </div>
              <Slider value={[carbsPercent]} onValueChange={v => setCarbsPercent(v[0])} min={5} max={70} step={1} />
            </div>

            {/* Fats */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 text-[13px] font-medium">
                  <Droplets className="h-4 w-4 text-blue-500" />Grasas
                </Label>
                <div className="text-right">
                  <span className="text-[15px] font-bold">{fatsPercent}%</span>
                  <span className="text-[12px] text-muted-foreground ml-1.5">({fatsGrams}g)</span>
                </div>
              </div>
              <Slider value={[fatsPercent]} onValueChange={v => setFatsPercent(v[0])} min={5} max={60} step={1} />
            </div>

            {/* Visual bar */}
            <div className="flex h-2 rounded-full overflow-hidden bg-muted">
              <div className="bg-red-400 transition-all duration-300" style={{ width: `${proteinPercent}%` }} />
              <div className="bg-amber-400 transition-all duration-300" style={{ width: `${carbsPercent}%` }} />
              <div className="bg-blue-400 transition-all duration-300" style={{ width: `${fatsPercent}%` }} />
            </div>
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-red-400" />Prot {proteinPercent}%</span>
              <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-amber-400" />Carbs {carbsPercent}%</span>
              <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-blue-400" />Grasas {fatsPercent}%</span>
            </div>
          </div>
        </Section>

        {/* Structure */}
        <Section>
          <SectionTitle icon={UtensilsCrossed} color="text-primary">Estructura del Plan</SectionTitle>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="space-y-2">
              <Label className="text-[13px] font-medium">Comidas por dia</Label>
              <Input
                type="number"
                value={mealsPerDay}
                onChange={e => setMealsPerDay(Number(e.target.value))}
                min={1}
                max={10}
                className="w-full text-center font-semibold rounded-xl h-11"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[13px] font-medium">Menus a generar</Label>
              <Input
                type="number"
                value={totalMenus}
                onChange={e => setTotalMenus(Number(e.target.value))}
                min={1}
                max={7}
                className="w-full text-center font-semibold rounded-xl h-11"
              />
            </div>
          </div>
        </Section>

        {/* Avoid foods */}
        <Section>
          <SectionTitle icon={X} color="text-muted-foreground">Alimentos a Evitar</SectionTitle>
          <SectionDesc>Anade alimentos o ingredientes que no quieras incluir.</SectionDesc>
          <div className="flex gap-2">
            <Input
              value={newAvoidFood}
              onChange={e => setNewAvoidFood(e.target.value)}
              placeholder="Ej: Gluten, Lactosa..."
              className="rounded-xl h-10"
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleAddAvoidFood(); } }}
            />
            <Button type="button" variant="outline" size="icon" onClick={handleAddAvoidFood} className="shrink-0 rounded-xl h-10 w-10">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {avoidFoods.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {avoidFoods.map(food => (
                <Badge key={food} variant="secondary" className="pl-2.5 pr-1 py-1 text-[12px] gap-1 rounded-lg">
                  {food}
                  <button type="button" onClick={() => setAvoidFoods(avoidFoods.filter(f => f !== food))} className="ml-0.5 h-4 w-4 rounded-full hover:bg-destructive/20 flex items-center justify-center">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </Section>

        {/* Preferred foods */}
        <Section>
          <SectionTitle icon={Sparkles} color="text-amber-500">Alimentos Preferidos</SectionTitle>
          <SectionDesc>Alimentos que quieres que aparezcan con mayor frecuencia.</SectionDesc>
          <div className="flex gap-2">
            <Input
              value={newPreferredFood}
              onChange={e => setNewPreferredFood(e.target.value)}
              placeholder="Ej: Pollo, Arroz, Aguacate..."
              className="rounded-xl h-10"
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleAddPreferredFood(); } }}
            />
            <Button type="button" variant="outline" size="icon" onClick={handleAddPreferredFood} className="shrink-0 rounded-xl h-10 w-10">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {preferredFoods.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {preferredFoods.map(food => (
                <Badge key={food} className="pl-2.5 pr-1 py-1 text-[12px] gap-1 rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                  {food}
                  <button type="button" onClick={() => setPreferredFoods(preferredFoods.filter(f => f !== food))} className="ml-0.5 h-4 w-4 rounded-full hover:bg-amber-300/50 flex items-center justify-center">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </Section>

        {/* Allergies */}
        <Section className="border-red-200/50 dark:border-red-900/30">
          <SectionTitle icon={AlertCircle} color="text-red-500">Alergias e Intolerancias</SectionTitle>
          <SectionDesc>Estos alimentos se excluiran completamente por motivos de salud.</SectionDesc>
          <div className="flex gap-2">
            <Input
              value={newAllergy}
              onChange={e => setNewAllergy(e.target.value)}
              placeholder="Ej: Gluten, Lactosa, Marisco..."
              className="rounded-xl h-10"
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleAddAllergy(); } }}
            />
            <Button type="button" variant="outline" size="icon" onClick={handleAddAllergy} className="shrink-0 rounded-xl h-10 w-10">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {allergies.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {allergies.map(allergy => (
                <Badge key={allergy} variant="destructive" className="pl-2.5 pr-1 py-1 text-[12px] gap-1 rounded-lg">
                  {allergy}
                  <button type="button" onClick={() => setAllergies(allergies.filter(a => a !== allergy))} className="ml-0.5 h-4 w-4 rounded-full hover:bg-red-300/50 flex items-center justify-center">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </Section>

        {/* Preferences */}
        <Section>
          <SectionTitle icon={MessageSquare} color="text-violet-500">Preferencias</SectionTitle>
          <SectionDesc>Escribe ideas o preferencias para personalizar los menus. Se respetaran de forma obligatoria.</SectionDesc>
          <Textarea
            value={preferences}
            onChange={e => setPreferences(e.target.value)}
            placeholder="Ej: Para comer me gustaria arroz con pollo. Prefiero cenas ligeras con ensalada..."
            rows={3}
            className="resize-none rounded-xl text-[14px]"
            maxLength={2000}
          />
          {preferences.length > 0 && (
            <p className="text-[11px] text-muted-foreground mt-1.5 text-right">{preferences.length}/2000</p>
          )}
        </Section>

        {/* Advanced toggle */}
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground hover:text-card-foreground transition-colors duration-200 w-full justify-center py-2 uppercase tracking-wide"
        >
          {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          {showAdvanced ? "Ocultar opciones avanzadas" : "Opciones avanzadas"}
        </button>

        {showAdvanced && (
          <div className="space-y-5">
            {/* Format options */}
            <Section>
              <SectionTitle icon={Ruler} color="text-teal-500">Formato</SectionTitle>
              <div className="space-y-5 mt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[13px] font-medium text-card-foreground">Medidas caseras</p>
                    <p className="text-[12px] text-muted-foreground">Punados, filetes, tazas en vez de gramos.</p>
                  </div>
                  <Switch checked={useHomeMeasures} onCheckedChange={setUseHomeMeasures} />
                </div>

                <div className="h-px bg-border/50" />

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <ShoppingCart className="h-4 w-4 text-blue-500" />
                    <p className="text-[13px] font-medium text-card-foreground">Supermercado</p>
                  </div>
                  <p className="text-[12px] text-muted-foreground mb-3">Adaptar alimentos a productos disponibles.</p>
                  <div className="flex flex-wrap gap-1.5">
                    {SUPERMARKETS.map(s => (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => setSupermarket(s.value)}
                        className={`px-3 py-1.5 rounded-lg text-[12px] transition-all duration-200 cursor-pointer ${
                          supermarket === s.value
                            ? "bg-primary text-primary-foreground font-medium shadow-sm"
                            : "bg-accent/50 text-card-foreground hover:bg-accent"
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Section>

            {/* Fasting */}
            <Section>
              <SectionTitle icon={UtensilsCrossed} color="text-orange-500">Ayuno Intermitente</SectionTitle>
              <SectionDesc>Las comidas se distribuiran dentro de la ventana de alimentacion.</SectionDesc>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { value: "", label: "Sin ayuno" },
                  { value: "16/8", label: "16/8" },
                  { value: "18/6", label: "18/6" },
                  { value: "20/4", label: "20/4" },
                  { value: "OMAD", label: "OMAD" },
                  { value: "5:2", label: "5:2" },
                ].map(f => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => setFastingProtocol(f.value)}
                    className={`px-3 py-1.5 rounded-lg text-[12px] transition-all duration-200 cursor-pointer ${
                      fastingProtocol === f.value
                        ? "bg-primary text-primary-foreground font-medium shadow-sm"
                        : "bg-accent/50 text-foreground hover:bg-accent"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </Section>

            {/* Daily targets */}
            <Section>
              <SectionTitle icon={CalendarDays} color="text-indigo-500">Calorias por Dia</SectionTitle>
              <SectionDesc>Define objetivos nutricionales distintos para cada dia (entreno vs descanso).</SectionDesc>
              <div className="flex items-center justify-between mb-4">
                <Label className="text-[13px] font-medium">Activar</Label>
                <Switch checked={useDailyTargets} onCheckedChange={handleToggleDailyTargets} />
              </div>
              {useDailyTargets && dailyTargets.length > 0 && (
                <div className="space-y-2">
                  {dailyTargets.map((dt, idx) => (
                    <div key={dt.day} className="p-3 rounded-xl bg-accent/30 space-y-2">
                      <p className="text-[13px] font-medium text-card-foreground">
                        {totalMenus <= 7 ? DAY_NAMES[idx] || `Dia ${dt.day}` : `Menu ${dt.day}`}
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[11px] text-muted-foreground">Calorias</Label>
                          <Input type="number" value={dt.calories} onChange={e => updateDailyTarget(idx, "calories", Number(e.target.value))} min={800} max={10000} step={50} className="h-8 text-[12px] text-center rounded-lg" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px] text-muted-foreground">Prot %</Label>
                          <Input type="number" value={dt.proteinPercent} onChange={e => updateDailyTarget(idx, "proteinPercent", Number(e.target.value))} min={0} max={100} className="h-8 text-[12px] text-center rounded-lg" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px] text-muted-foreground">Carbs %</Label>
                          <Input type="number" value={dt.carbsPercent} onChange={e => updateDailyTarget(idx, "carbsPercent", Number(e.target.value))} min={0} max={100} className="h-8 text-[12px] text-center rounded-lg" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px] text-muted-foreground">Grasas %</Label>
                          <Input type="number" value={dt.fatsPercent} onChange={e => updateDailyTarget(idx, "fatsPercent", Number(e.target.value))} min={0} max={100} className="h-8 text-[12px] text-center rounded-lg" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Section>

            {/* Recipes */}
            <Section>
              <SectionTitle icon={BookOpen} color="text-rose-500">Mis Recetas</SectionTitle>
              <SectionDesc>Selecciona recetas propias para incorporarlas en el menu.</SectionDesc>
              {recipesQuery.data && recipesQuery.data.length > 0 ? (
                <div className="space-y-1.5">
                  {recipesQuery.data.map(recipe => (
                    <button
                      key={recipe.id}
                      type="button"
                      onClick={() => toggleRecipe(recipe.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                        selectedRecipeIds.includes(recipe.id)
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border/50 hover:border-border hover:bg-accent/30"
                      }`}
                    >
                      <div>
                        <span className="text-[13px] font-medium text-card-foreground">{recipe.name}</span>
                        <span className="text-[11px] text-muted-foreground ml-2">
                          {recipe.totalCalories} kcal
                        </span>
                      </div>
                      {selectedRecipeIds.includes(recipe.id) && (
                        <Badge className="text-[10px] rounded-md">Seleccionada</Badge>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-[13px] text-muted-foreground">
                  No tienes recetas. Crealas desde "Mis Recetas" en el menu lateral.
                </p>
              )}
            </Section>
          </div>
        )}

        {/* Submit */}
        <Button
          type="submit"
          size="lg"
          className="w-full rounded-2xl h-12 text-[15px] font-semibold shadow-sm hover:shadow-md transition-all duration-200 uppercase tracking-wide"
          disabled={generateMutation.isPending || macroSum < 95 || macroSum > 105}
        >
          {generateMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Generando dieta con IA...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-5 w-5" />
              Generar Dieta
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
