import React, { useState } from "react";
import { SpecialtyItem } from "../types";
import { TREATMENTS, slugifyId } from "../data";
import { ArrowRight, Scan } from "lucide-react";

interface SpecialtiesProps {
  specialties: SpecialtyItem[];
  onSelectTreatment: (treatmentId: string, specialtyName?: string) => void;
}

export default function Specialties({
  specialties,
  onSelectTreatment
}: SpecialtiesProps) {
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("ALL");

  const specialtiesList = [
    { id: "ALL", name: "Todas", description: "" },
    ...specialties.map((s) => ({
      id: s.name,
      name: s.name,
      description: s.description
    }))
  ];

  const filteredTreatments =
    selectedSpecialty === "ALL"
      ? TREATMENTS
      : TREATMENTS.filter((t) => t.specialty === selectedSpecialty);

  // Include custom specialties that don't yet have predefined treatments in TREATMENTS
  const customSpecialtiesToShow = specialties.filter((spec) => {
    const hasPredefined = TREATMENTS.some((t) => t.specialty === spec.name);
    if (hasPredefined) return false;
    return selectedSpecialty === "ALL" || selectedSpecialty === spec.name;
  });

  return (
    <section className="py-12 lg:py-16 bg-[#F8FAFC] min-h-[70vh]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl space-y-3 mb-10">
          <p className="text-sm font-medium text-[#0086C0]">
            Tratamientos Predictivos y Personalizados
          </p>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[#0D1B38] tracking-tight text-balance">
            Especialidades Odontológicas Clínicas
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Protocolos clínicos de alta precisión que combinan experiencia médica especializada y tecnología digital para resultados estéticos y funcionales predecibles.
          </p>
        </div>

        {/* Interactive Segmented Filter Bar */}
        <div className="mb-10 overflow-x-auto pb-2">
          <div
            className="inline-flex items-center gap-1 p-1 bg-slate-200/70 rounded-xl"
            role="tablist"
            aria-label="Filtrar especialidades"
          >
            {specialtiesList.map((spec) => {
              const isActive = selectedSpecialty === spec.id;
              return (
                <button
                  key={spec.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setSelectedSpecialty(spec.id)}
                  className={`px-4 py-2 text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap shrink-0 transition-colors duration-150 cursor-pointer ${
                    isActive
                      ? "bg-white text-[#0D1B38] shadow-xs font-semibold"
                      : "text-slate-600 hover:text-[#0D1B38]"
                  }`}
                >
                  {spec.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Treatments & Custom Specialties Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTreatments.map((treatment) => (
            <article
              key={treatment.id}
              className="bg-white border border-slate-200 rounded-xl hover:border-[#0086C0]/50 transition-colors duration-150 flex flex-col justify-between p-6"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="font-medium text-[#0086C0]">{treatment.specialty}</span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">{treatment.duration}</span>
                </div>

                <h3 className="font-display text-lg font-bold text-[#0D1B38] leading-snug">
                  {treatment.name}
                </h3>

                <p className="text-sm text-slate-600 leading-relaxed">
                  {treatment.description}
                </p>

                <div className="pt-3 border-t border-slate-100 space-y-1">
                  <p className="text-xs font-medium text-slate-500">Tecnología aplicada</p>
                  <p className="text-xs font-semibold text-[#0D1B38]">{treatment.techUsed}</p>
                </div>
              </div>

              <div className="pt-5 mt-6 border-t border-slate-100 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-slate-500">Inversión estimada</p>
                  <p className="text-sm font-bold text-[#0D1B38] tabular-nums">
                    {treatment.estimatedCost}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectTreatment(treatment.id, treatment.specialty)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-[#0D1B38] hover:bg-[#0086C0] transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>Reservar</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </article>
          ))}

          {customSpecialtiesToShow.map((spec) => {
            const evalId = `eval-${slugifyId(spec.name) || spec.id}`;
            return (
              <article
                key={spec.id}
                className="bg-white border border-slate-200 rounded-xl hover:border-[#0086C0]/50 transition-colors duration-150 flex flex-col justify-between p-6"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-medium text-[#0086C0]">{spec.name}</span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">30 minutos</span>
                  </div>

                  <h3 className="font-display text-lg font-bold text-[#0D1B38] leading-snug">
                    Consulta de {spec.name}
                  </h3>

                  <p className="text-sm text-slate-600 leading-relaxed">
                    {spec.description ||
                      `Evaluación clínica y plan de tratamiento personalizado en ${spec.name}.`}
                  </p>

                  <div className="pt-3 border-t border-slate-100 space-y-1">
                    <p className="text-xs font-medium text-slate-500">Protocolo clínico</p>
                    <p className="text-xs font-semibold text-[#0D1B38]">
                      Diagnóstico Digital & Atención Especializada
                    </p>
                  </div>
                </div>

                <div className="pt-5 mt-6 border-t border-slate-100 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs text-slate-500">Modalidad</p>
                    <p className="text-sm font-bold text-[#0D1B38]">
                      Evaluación Clínica
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectTreatment(evalId, spec.name)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-[#0D1B38] hover:bg-[#0086C0] transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <span>Reservar</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        {/* First Visit Evaluation Callout */}
        <div className="mt-12 bg-[#EBF6FB] border border-[#0086C0]/25 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="bg-[#0086C0] text-white p-3 rounded-xl shrink-0">
              <Scan className="h-6 w-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-display text-base sm:text-lg font-bold text-[#0D1B38]">
                ¿Primera visita? Evaluación Clínica Integral 3D
              </h3>
              <p className="text-sm text-slate-700 leading-relaxed max-w-2xl">
                Tu primera consulta incluye escaneo intraoral 3D completo y valoración radiográfica panorámica para definir un plan de tratamiento claro, transparente y sin sorpresas.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onSelectTreatment("eval-3d")}
            className="inline-flex items-center gap-2 px-5 py-3 bg-[#0D1B38] hover:bg-[#162B54] text-white rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer"
          >
            <span>Agendar Evaluación 3D</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

      </div>
    </section>
  );
}
