import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles } from "lucide-react";

const PROGRESS_MESSAGES = [
  "Analizando tu perfil nutricional...",
  "Calculando tus macros diarios...",
  "Eligiendo los mejores alimentos para ti...",
  "Construyendo tus menús semanales...",
  "Verificando coherencia nutricional...",
  "Comprobando variedad entre días...",
  "Revisando cantidades y porciones...",
  "Casi listo, últimos ajustes...",
];

const MEAL_NAMES_BY_COUNT: Record<number, string[]> = {
  3: ["Desayuno", "Comida", "Cena"],
  4: ["Desayuno", "Comida", "Merienda", "Cena"],
  5: ["Desayuno", "Media mañana", "Comida", "Merienda", "Cena"],
  6: ["Desayuno", "Media mañana", "Comida", "Merienda", "Cena", "Recena"],
};

interface DietGenerationSkeletonProps {
  totalMenus: number;
  mealsPerDay: number;
}

export default function DietGenerationSkeleton({ totalMenus, mealsPerDay }: DietGenerationSkeletonProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setMessageIndex((prev) => (prev + 1) % PROGRESS_MESSAGES.length);
        setIsVisible(true);
      }, 300);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const mealNames = MEAL_NAMES_BY_COUNT[mealsPerDay] ||
    Array.from({ length: mealsPerDay }, (_, i) => `Comida ${i + 1}`);

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-8">
      {/* Header skeleton */}
      <div className="pt-2">
        <h1 className="text-[28px] font-bold tracking-tight text-foreground uppercase">GENERANDO DIETA</h1>
        <p className="text-[13px] mt-1 uppercase tracking-wide text-muted-foreground">
          Tu plan nutricional personalizado está en camino
        </p>
      </div>

      {/* Progress indicator with rotating messages */}
      <div className="rounded-2xl bg-card text-card-foreground border border-primary/20 p-5 md:p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
          </div>
          <div>
            <p className="text-[15px] font-semibold text-card-foreground">Inteligencia artificial trabajando</p>
            <p
              className={`text-[13px] text-primary font-medium transition-opacity duration-300 ease-in-out ${
                isVisible ? "opacity-100" : "opacity-0"
              }`}
            >
              {PROGRESS_MESSAGES[messageIndex]}
            </p>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
          <div className="h-full rounded-full bg-primary/60 animate-progress-bar" />
        </div>
      </div>

      {/* Menu tabs skeleton (only if multiple menus) */}
      {totalMenus > 1 && (
        <div className="flex gap-1 p-1 rounded-2xl bg-secondary/50">
          {Array.from({ length: totalMenus }, (_, i) => (
            <div
              key={i}
              className={`px-4 py-2 rounded-xl text-[13px] font-medium ${
                i === 0 ? "bg-background shadow-sm text-card-foreground" : "text-muted-foreground"
              }`}
            >
              Menú {i + 1}
            </div>
          ))}
        </div>
      )}

      {/* Macro summary skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Calorías", color: "orange" },
          { label: "Proteínas", color: "red" },
          { label: "Carbohidratos", color: "amber" },
          { label: "Grasas", color: "blue" },
        ].map(({ label, color }) => (
          <div
            key={label}
            className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-${color}-500/8 border border-${color}-500/10`}
          >
            <Skeleton className="h-5 w-5 rounded-md" />
            <div className="flex-1">
              <p className="text-[11px] text-muted-foreground">{label}</p>
              <Skeleton className="h-5 w-16 mt-1 rounded-md" />
            </div>
          </div>
        ))}
      </div>

      {/* Meal cards skeleton */}
      <div className="space-y-4">
        {mealNames.map((mealName, i) => (
          <div
            key={i}
            className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden"
          >
            {/* Meal header */}
            <div className="px-5 pt-5 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[15px] font-semibold text-card-foreground/40">
                    {mealName}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[13px]">
                  <Skeleton className="h-4 w-14 rounded-md" />
                  <Skeleton className="h-4 w-8 rounded-md" />
                  <Skeleton className="h-4 w-8 rounded-md" />
                  <Skeleton className="h-4 w-8 rounded-md" />
                </div>
              </div>
              {/* Description skeleton */}
              <Skeleton className="h-3.5 w-48 mt-2 rounded-md" />
            </div>

            {/* Food rows skeleton */}
            <div className="px-3 pb-4 space-y-0.5">
              {Array.from({ length: Math.floor(Math.random() * 2) + 3 }, (_, j) => (
                <div
                  key={j}
                  className="flex items-center gap-3 py-2 px-3 rounded-xl"
                >
                  <div className="flex-1 min-w-0">
                    <Skeleton
                      className="h-4 rounded-md"
                      style={{ width: `${Math.floor(Math.random() * 40) + 30}%` }}
                    />
                    <Skeleton className="h-3 w-12 mt-1.5 rounded-md" />
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Skeleton className="h-3.5 w-12 rounded-md" />
                    <Skeleton className="h-3.5 w-6 rounded-md" />
                    <Skeleton className="h-3.5 w-6 rounded-md" />
                    <Skeleton className="h-3.5 w-6 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
