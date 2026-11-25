import React, { useState } from "react";
import {
  ShieldCheck, Scan, HeartHandshake, ArrowRight,
  Target, Compass, CheckCircle2, Building2
} from "lucide-react";

interface AboutUsProps {
  onBookNow: () => void;
  onViewSpecialties: () => void;
}

export default function AboutUs({ onBookNow, onViewSpecialties }: AboutUsProps) {
  const [techImgError, setTechImgError] = useState(false);

  const values = [
    {
      num: "01.",
      icon: Scan,
      title: "Precisión Diagnóstica 3D",
      description:
        "Planificamos cada tratamiento sobre modelos digitales exactos mediante escaneo intraoral y tomografía Cone Beam, evitando suposiciones."
    },
    {
      num: "02.",
      icon: ShieldCheck,
      title: "Bioseguridad y Rigor Clínico",
      description:
        "Nuestros pabellones y boxes cumplen estándares estrictos de esterilización trazable y protocolos quirúrgicos mínimamente invasivos."
    },
    {
      num: "03.",
      icon: HeartHandshake,
      title: "Trato Humano y Transparente",
      description:
        "Explicamos cada etapa, alternativa terapéutica y presupuesto con claridad antes de iniciar, priorizando siempre el bienestar del paciente."
    }
  ];

  const stats = [
    { value: "16+ años", label: "Experiencia clínica acumulada" },
    { value: "4,800+", label: "Tratamientos digitales realizados" },
    { value: "99.8%", label: "Satisfacción en control post-atención" },
    { value: "100%", label: "Protocolos libres de moldes físicos" }
  ];

  return (
    <div className="bg-white">
      {/* Intro Section */}
      <section className="py-12 lg:py-16 border-b border-slate-200 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            <div className="lg:col-span-7 space-y-5">
              <p className="text-sm font-medium text-[#0086C0]">
                Sobre Clínica IS Dental
              </p>
              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0D1B38] tracking-tight leading-tight text-balance">
                Excelencia odontológica respaldada por tecnología digital
              </h1>
              <p className="text-slate-600 text-base sm:text-lg leading-relaxed max-w-2xl">
                Clínica IS Dental nació en Santiago con el propósito de transformar la atención odontológica en una experiencia predecible, serena y transparente. Integramos equipamiento diagnóstico digital y protocolos clínicos conservadores en un ambiente pensado para el bienestar del paciente.
              </p>
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  type="button"
                  onClick={onBookNow}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#0086C0] hover:bg-[#006C9C] text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  <span>Agendar Evaluación</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={onViewSpecialties}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-slate-300 hover:border-[#0086C0] text-[#0D1B38] text-sm font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  <span>Ver Especialidades</span>
                </button>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 aspect-[4/3]">
                <img
                  src="/src/assets/images/clinic_hero_1781296076431.jpg"
                  alt="Recepción e instalaciones de Clínica IS Dental"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Strip */}
      <section className="border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
            {stats.map((s) => (
              <div key={s.label} className="py-6 px-4 sm:px-6 first:pl-0 last:pr-0">
                <p className="font-display text-2xl font-bold text-[#0D1B38] tabular-nums">
                  {s.value}
                </p>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl space-y-2 mb-10">
            <p className="text-sm font-medium text-[#0086C0]">Propósito Institucional</p>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[#0D1B38] tracking-tight">
              Misión y Visión
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-[#F8FAFC] border border-slate-200 rounded-2xl p-8 space-y-4">
              <div className="w-11 h-11 rounded-xl bg-[#EBF6FB] text-[#0086C0] flex items-center justify-center">
                <Target className="h-5 w-5" />
              </div>
              <h3 className="font-display text-xl font-bold text-[#0D1B38]">
                Nuestra Misión
              </h3>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                Brindar atención odontológica integral de alta precisión mediante tecnología digital 3D, procedimientos mínimamente invasivos y un trato cercano, garantizando diagnósticos transparentes y soluciones duraderas que mejoren la salud y confianza de cada paciente.
              </p>
            </div>

            <div className="bg-[#0D1B38] text-white border border-[#162B54] rounded-2xl p-8 space-y-4">
              <div className="w-11 h-11 rounded-xl bg-white/10 text-[#7DD3FC] flex items-center justify-center">
                <Compass className="h-5 w-5" />
              </div>
              <h3 className="font-display text-xl font-bold text-white">
                Nuestra Visión
              </h3>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed tracking-[0.01em]">
                Consolidarnos como el centro odontológico digital referente en Chile por nuestra excelencia clínica, innovación continua en rehabilitación y estética oral, y estándares de bioseguridad y confort que eliminen el temor a la consulta dental.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Clinical Values */}
      <section className="py-16 bg-[#F8FAFC] border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl space-y-2 mb-10">
            <p className="text-sm font-medium text-[#0086C0]">Nuestros Pilares</p>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[#0D1B38] tracking-tight">
              Cómo entendemos la odontología moderna
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {values.map((v) => {
              const Icon = v.icon;
              return (
                <div
                  key={v.num}
                  className="bg-white border border-slate-200 rounded-2xl p-7 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#0086C0]">{v.num}</span>
                    <Icon className="h-5 w-5 text-[#0D1B38]" />
                  </div>
                  <h3 className="font-display text-lg font-bold text-[#0D1B38]">
                    {v.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {v.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Installations & Equipment Showcase */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className="bg-[#0D1B38] text-white rounded-2xl border border-[#162B54] overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch"
            id="clinic-tech-card"
          >
            <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-center space-y-6">
              <p className="text-sm font-medium text-[#7DD3FC]">
                Nuestras Instalaciones
              </p>

              <h2 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight leading-tight text-balance">
                Boxes clínicos, quirófano 3D y sala de recuperación confortable
              </h2>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed tracking-[0.01em]">
                Ubicados en Av. Apoquindo 4500, Las Condes, nuestras dependencias cuentan con central de esterilización certificada, escáneres intraorales ópticos, radiología digital de baja dosis y salas insonorizadas diseñadas para brindar tranquilidad desde tu llegada.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-white/10">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-[#7DD3FC] shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-white">Quirófano Digital 3D</h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Equipado para implantología guiada y cirugía mínimamente invasiva.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-[#7DD3FC] shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-white">Confort y Accesibilidad</h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Estacionamiento subterráneo privado y recepción personalizada.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 relative min-h-[280px] lg:min-h-[400px] bg-[#081226]">
              {!techImgError ? (
                <img
                  src="/src/assets/images/high_tech_dental_1781296096733.jpg"
                  alt="Instalaciones y box clínico digital de Clínica IS Dental"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={() => setTechImgError(true)}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-8 text-slate-300">
                  <Building2 className="h-10 w-10 mb-2 text-[#7DD3FC]" />
                  <p className="text-sm font-semibold">Instalaciones Clínica IS Dental</p>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-[#0D1B38] via-[#0D1B38]/20 to-transparent pointer-events-none" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
