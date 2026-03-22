import { useState } from "react";
import { ARCHETYPES, MASCOT_URLS, type ArchetypeId } from "@shared/constants";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface ArchetypeSelectorProps {
  onSelect: (archetype: ArchetypeId) => void;
  isPending?: boolean;
  clientName: string;
}

export default function ArchetypeSelector({ onSelect, isPending, clientName }: ArchetypeSelectorProps) {
  const [selected, setSelected] = useState<ArchetypeId | null>(null);

  return (
    <div className="min-h-screen bg-[#0B0D18] flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="text-center mb-8 max-w-md">
        <img
          src="https://d2xsxph8kpxj0f.cloudfront.net/310519663395627355/JuA5L95oAvQY6eqfSgbwUN/nutriflow_logo_43762e41.webp"
          alt="NutriFlow"
          className="h-16 object-contain mx-auto mb-6"
        />
        <h1 className="text-2xl font-bold text-white tracking-tight">
          ¡Hola, {clientName}!
        </h1>
        <p className="text-[15px] text-gray-400 mt-2 leading-relaxed">
          Elige tu personaje NutriFlow. Te acompañará en todo tu camino.
        </p>
      </div>

      {/* Group mascot image */}
      <div className="mb-8">
        <img
          src={MASCOT_URLS.grupo}
          alt="Mascotas NutriFlow"
          className="h-32 object-contain mx-auto drop-shadow-2xl"
        />
      </div>

      {/* Archetype cards */}
      <div className="grid grid-cols-2 gap-3 max-w-md w-full mb-8">
        {ARCHETYPES.map((arch) => {
          const isSelected = selected === arch.id;
          return (
            <button
              key={arch.id}
              onClick={() => setSelected(arch.id)}
              className="relative rounded-2xl border-2 p-4 transition-all duration-300 text-left overflow-hidden group"
              style={{
                borderColor: isSelected ? arch.accentColor : "rgba(255,255,255,0.08)",
                backgroundColor: isSelected ? `${arch.accentColor}15` : "rgba(255,255,255,0.03)",
                boxShadow: isSelected ? `0 0 30px ${arch.accentColor}20` : "none",
              }}
            >
              {/* Glow effect */}
              {isSelected && (
                <div
                  className="absolute inset-0 opacity-10"
                  style={{
                    background: `radial-gradient(circle at 50% 0%, ${arch.accentColor}, transparent 70%)`,
                  }}
                />
              )}

              <div className="relative z-10">
                <img
                  src={arch.image}
                  alt={arch.name}
                  className="h-20 w-20 object-contain mx-auto mb-3 drop-shadow-lg transition-transform duration-300 group-hover:scale-110"
                />
                <h3
                  className="text-[15px] font-bold text-center tracking-wider"
                  style={{ color: isSelected ? arch.accentColor : "#fff" }}
                >
                  {arch.name}
                </h3>
                <p className="text-[11px] text-center mt-1 leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
                  {arch.animal}
                </p>
                <p className="text-[11px] text-center mt-1.5 leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>
                  {arch.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Confirm button */}
      <Button
        onClick={() => selected && onSelect(selected)}
        disabled={!selected || isPending}
        className="w-full max-w-md h-14 rounded-2xl text-[16px] font-bold tracking-wide transition-all duration-300"
        style={{
          backgroundColor: selected
            ? ARCHETYPES.find((a) => a.id === selected)?.accentColor
            : undefined,
          color: "#fff",
          opacity: selected ? 1 : 0.5,
        }}
      >
        {isPending ? (
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
        ) : null}
        {selected ? `SOY ${ARCHETYPES.find((a) => a.id === selected)?.name}` : "ELIGE TU PERSONAJE"}
      </Button>

      <p className="text-[11px] text-gray-500 mt-4 text-center">
        Podrás cambiar tu personaje más adelante
      </p>
    </div>
  );
}
