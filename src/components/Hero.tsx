import React, { useState } from "react";
import { ArrowRight, Building2 } from "lucide-react";
import clinicHeroImg from "../assets/images/clinic_hero_1781296076431.jpg";

interface HeroProps {
  onBookNow: () => void;
  onViewSpecialties: () => void;
}

export default function Hero({ onBookNow, onViewSpecialties }: HeroProps) {
  const [imgError, setImgError] = useState(false);

  const metrics = [
    { value: "16+ años", label: "Trayectoria clínica especializada" },
    { value: "99.8%", label: "Satisfacción en auditoría de pacientes" },
    { value: "100% 3D", label: "Planificación digital sin moldes físicos" },
    { value: "Lun – Sáb", label: "Horario continuo 08:30 a 19:30 hrs" }
  ];

  return (
    <section className="relative bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-12 lg:pt-16 lg:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
          
          <div className="lg:col-span-7 flex flex-col justify-center space-y-6" id="hero-left-content">
            <p className="text-sm font-medium text-[#0086C0] tracking-tight">
              Clínica IS Dental · Odontología Digital y Rehabilitación Estética
            </p>

            <h1
              className="font-display font-extrabold text-[#0D1B38] tracking-tight leading-[1.12] text-balance"
              style={{ fontSize: "clamp(2.25rem, 4vw, 3.65rem)" }}
            >
              Odontología de precisión para una sonrisa natural y duradera
            </h1>

            <p className="text-slate-600 text-base sm:text-lg leading-relaxed max-w-xl">
              Integramos escaneo intraoral 3D, cirugía guiada por tomografía y protocolos láser mínimamente invasivos para ofrecer diagnósticos claros, tratamientos predecibles y confort clínico real.
            </p>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-2">
              <button
                type="button"
                id="hero-book-btn"
                onClick={onBookNow}
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-lg text-sm font-semibold text-white bg-[#0086C0] hover:bg-[#006C9C] transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0086C0]"
              >
                <span>Agendar Evaluación</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                type="button"
                id="hero-specialties-btn"
                onClick={onViewSpecialties}
                className="inline-flex items-center justify-center px-6 py-3.5 rounded-lg text-sm font-semibold text-[#0D1B38] bg-slate-100 hover:bg-slate-200/80 transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0D1B38]"
              >
                Explorar Especialidades
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 flex" id="hero-right-image">
            <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 min-h-[280px] sm:min-h-[340px] lg:min-h-[420px]">
              {!imgError ? (
                <img
                  src={clinicHeroImg}
                  alt="Instalaciones clínicas modernas de Clínica IS Dental"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#0D1B38] to-[#0086C0] text-white p-8 text-center">
                  <Building2 className="h-10 w-10 mb-3 text-sky-200" />
                  <p className="font-display font-bold text-lg">Clínica IS Dental</p>
                  <p className="text-xs text-sky-100 mt-1">Centro Odontológico Digital</p>
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-[#081226]/85 via-[#081226]/25 to-transparent pointer-events-none" />

              <div className="absolute inset-x-0 bottom-0 p-6 text-white space-y-1.5">
                <p className="text-xs font-medium text-sky-200">
                  Equipamiento CAD/CAM 3D · Bioseguridad Certificada
                </p>
                <p className="text-sm sm:text-base font-semibold text-white leading-snug">
                  Av. Apoquindo 4500, Piso 5 · Las Condes, Santiago
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>

      <div className="border-t border-slate-200 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
            {metrics.map((m, idx) => (
              <div key={idx} className="py-5 px-4 sm:px-6 first:pl-0 last:pr-0">
                <p className="font-display text-xl sm:text-2xl font-bold text-[#0D1B38] tabular-nums">
                  {m.value}
                </p>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                  {m.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
