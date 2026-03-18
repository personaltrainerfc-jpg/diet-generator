import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Flame, Beef, Wheat, Droplets, UtensilsCrossed, ChefHat,
  Loader2, X, Plus, Sparkles, AlertCircle, Salad, CookingPot, MessageSquare
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { DIET_TYPES, COOKING_LEVELS, QUICK_TEMPLATES } from "@shared/constants";
import type { DietType, CookingLevel } from "@shared/constants";

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

  const macroSum = proteinPercent + carbsPercent + fatsPercent;
  const proteinGrams = Math.round((totalCalories * proteinPercent / 100) / 4);
  const carbsGrams = Math.round((totalCalories * carbsPercent / 100) / 4);
  const fatsGrams = Math.round((totalCalories * fatsPercent / 100) / 9);

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

  const handleRemoveAvoidFood = (food: string) => {
    setAvoidFoods(avoidFoods.filter(f => f !== food));
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
      ...(preferences.trim() ? { preferences: preferences.trim() } : {}),
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
          Crear Nueva Dieta
        </h1>
        <p className="text-muted-foreground mt-1">
          Configura los parámetros y genera menús personalizados con IA.
        </p>
      </div>

      {/* Plantillas rápidas */}
      <Card className="shadow-sm border-dashed">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            Plantillas Rápidas
          </CardTitle>
          <CardDescription>
            Selecciona una plantilla para rellenar automáticamente los parámetros.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {QUICK_TEMPLATES.map(template => (
              <button
                key={template.name}
                type="button"
                onClick={() => applyTemplate(template)}
                className="flex flex-col items-center gap-1.5 p-3 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all cursor-pointer text-center group"
              >
                <span className="text-2xl">{template.icon}</span>
                <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{template.name}</span>
                <span className="text-xs text-muted-foreground">{template.totalCalories} kcal</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Nombre de la dieta */}
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ChefHat className="h-5 w-5 text-primary" />
              Nombre de la Dieta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej: Dieta de definición"
              className="text-base"
              required
            />
          </CardContent>
        </Card>

        {/* Tipo de dieta */}
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Salad className="h-5 w-5 text-green-600" />
              Tipo de Dieta
            </CardTitle>
            <CardDescription>
              Selecciona el estilo de alimentación que deseas seguir.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {DIET_TYPES.map(dt => (
                <button
                  key={dt.value}
                  type="button"
                  onClick={() => setDietType(dt.value)}
                  className={`flex flex-col items-start gap-1 p-3 rounded-lg border text-left transition-all cursor-pointer ${
                    dietType === dt.value
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                  }`}
                >
                  <span className={`text-sm font-semibold ${dietType === dt.value ? "text-primary" : "text-foreground"}`}>
                    {dt.label}
                  </span>
                  <span className="text-xs text-muted-foreground leading-relaxed">
                    {dt.description}
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Nivel de cocina */}
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CookingPot className="h-5 w-5 text-orange-600" />
              Nivel de Cocina
            </CardTitle>
            <CardDescription>
              Indica cuánto tiempo y esfuerzo quieres dedicar a cocinar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {COOKING_LEVELS.map(cl => (
                <button
                  key={cl.value}
                  type="button"
                  onClick={() => setCookingLevel(cl.value)}
                  className={`flex flex-col items-start gap-1 p-3 rounded-lg border text-left transition-all cursor-pointer ${
                    cookingLevel === cl.value
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                  }`}
                >
                  <span className={`text-sm font-semibold ${cookingLevel === cl.value ? "text-primary" : "text-foreground"}`}>
                    {cl.label}
                  </span>
                  <span className="text-xs text-muted-foreground leading-relaxed">
                    {cl.description}
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Calorías */}
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Flame className="h-5 w-5 text-orange-500" />
              Calorías Totales Diarias
            </CardTitle>
            <CardDescription>
              Define el objetivo calórico total para cada día.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Input
                type="number"
                value={totalCalories}
                onChange={e => setTotalCalories(Number(e.target.value))}
                min={800}
                max={10000}
                step={50}
                className="w-32 text-center text-lg font-semibold"
              />
              <span className="text-muted-foreground font-medium">kcal</span>
            </div>
            <Slider
              value={[totalCalories]}
              onValueChange={v => setTotalCalories(v[0])}
              min={800}
              max={6000}
              step={50}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>800 kcal</span>
              <span>6000 kcal</span>
            </div>
          </CardContent>
        </Card>

        {/* Macronutrientes */}
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Distribución de Macronutrientes</CardTitle>
            <CardDescription>
              Ajusta los porcentajes. La suma debe ser aproximadamente 100%.
            </CardDescription>
            {(macroSum < 95 || macroSum > 105) && (
              <div className="flex items-center gap-2 text-destructive text-sm mt-2">
                <AlertCircle className="h-4 w-4" />
                <span>Suma actual: {macroSum}% (debe ser ~100%)</span>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Proteínas */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 font-medium">
                  <Beef className="h-4 w-4 text-red-500" />
                  Proteínas
                </Label>
                <div className="text-right">
                  <span className="text-lg font-bold text-foreground">{proteinPercent}%</span>
                  <span className="text-sm text-muted-foreground ml-2">({proteinGrams}g)</span>
                </div>
              </div>
              <Slider
                value={[proteinPercent]}
                onValueChange={v => setProteinPercent(v[0])}
                min={5}
                max={60}
                step={1}
              />
            </div>

            <Separator />

            {/* Carbohidratos */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 font-medium">
                  <Wheat className="h-4 w-4 text-amber-500" />
                  Carbohidratos
                </Label>
                <div className="text-right">
                  <span className="text-lg font-bold text-foreground">{carbsPercent}%</span>
                  <span className="text-sm text-muted-foreground ml-2">({carbsGrams}g)</span>
                </div>
              </div>
              <Slider
                value={[carbsPercent]}
                onValueChange={v => setCarbsPercent(v[0])}
                min={5}
                max={70}
                step={1}
              />
            </div>

            <Separator />

            {/* Grasas */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 font-medium">
                  <Droplets className="h-4 w-4 text-blue-500" />
                  Grasas
                </Label>
                <div className="text-right">
                  <span className="text-lg font-bold text-foreground">{fatsPercent}%</span>
                  <span className="text-sm text-muted-foreground ml-2">({fatsGrams}g)</span>
                </div>
              </div>
              <Slider
                value={[fatsPercent]}
                onValueChange={v => setFatsPercent(v[0])}
                min={5}
                max={60}
                step={1}
              />
            </div>

            {/* Resumen visual */}
            <div className="flex h-3 rounded-full overflow-hidden bg-muted">
              <div className="bg-red-400 transition-all" style={{ width: `${proteinPercent}%` }} />
              <div className="bg-amber-400 transition-all" style={{ width: `${carbsPercent}%` }} />
              <div className="bg-blue-400 transition-all" style={{ width: `${fatsPercent}%` }} />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-red-400" /> Proteínas {proteinPercent}%
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-amber-400" /> Carbos {carbsPercent}%
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-blue-400" /> Grasas {fatsPercent}%
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Estructura */}
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <UtensilsCrossed className="h-5 w-5 text-primary" />
              Estructura del Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="font-medium">Comidas por día</Label>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    value={mealsPerDay}
                    onChange={e => setMealsPerDay(Number(e.target.value))}
                    min={1}
                    max={10}
                    className="w-20 text-center font-semibold"
                  />
                  <span className="text-sm text-muted-foreground">comidas</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-medium">Menús totales a generar</Label>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    value={totalMenus}
                    onChange={e => setTotalMenus(Number(e.target.value))}
                    min={1}
                    max={7}
                    className="w-20 text-center font-semibold"
                  />
                  <span className="text-sm text-muted-foreground">menús</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alimentos a evitar */}
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Alimentos a Evitar</CardTitle>
            <CardDescription>
              Añade alimentos o ingredientes que no quieras incluir en la dieta.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newAvoidFood}
                onChange={e => setNewAvoidFood(e.target.value)}
                placeholder="Ej: Gluten, Lactosa, Frutos secos..."
                onKeyDown={e => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddAvoidFood();
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleAddAvoidFood}
                className="shrink-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {avoidFoods.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {avoidFoods.map(food => (
                  <Badge
                    key={food}
                    variant="secondary"
                    className="pl-3 pr-1 py-1.5 text-sm gap-1"
                  >
                    {food}
                    <button
                      type="button"
                      onClick={() => handleRemoveAvoidFood(food)}
                      className="ml-1 h-4 w-4 rounded-full hover:bg-destructive/20 flex items-center justify-center"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preferencias opcionales */}
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageSquare className="h-5 w-5 text-purple-500" />
              Preferencias para las Comidas
              <Badge variant="outline" className="text-xs font-normal">Opcional</Badge>
            </CardTitle>
            <CardDescription>
              Escribe ideas o preferencias para personalizar los menús. Si lo dejas vacío, la dieta se genera automáticamente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={preferences}
              onChange={e => setPreferences(e.target.value)}
              placeholder="Ej: Para comer me gustaría arroz con pollo. Prefiero que las cenas sean ligeras con ensalada. Me gusta desayunar tostadas con aguacate..."
              rows={3}
              className="resize-none"
              maxLength={2000}
            />
            {preferences.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1 text-right">{preferences.length}/2000</p>
            )}
          </CardContent>
        </Card>

        {/* Botón de generar */}
        <Button
          type="submit"
          size="lg"
          className="w-full text-base font-semibold h-12 shadow-lg hover:shadow-xl transition-all"
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
