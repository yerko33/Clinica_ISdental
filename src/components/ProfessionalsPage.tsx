import React from "react";
import { Doctor } from "../types";
import { getDoctorActiveDays } from "../data";
import { Star, ArrowRight, Calendar } from "lucide-react";

interface ProfessionalsPageProps {
  doctors: Doctor[];
  onBookWithDoctor: (doctorId: string) => void;
}

export default function ProfessionalsPage({
  doctors,
  onBookWithDoctor
}: ProfessionalsPageProps) {
  return (
    <section className="py-12 lg:py-16 bg-[#F8FAFC] min-h-[75vh]" id="professionals-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Header */}
        <div className="max-w-3xl space-y-3 mb-12">
          <p className="text-sm font-medium text-[#0086C0]">
            Equipo Clínico Especializado
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-[#0D1B38] tracking-tight text-balance">
            Nuestros Profesionales
          </h1>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Conoce a los especialistas que lideran cada área odontológica en Clínica IS Dental. Consulta su formación, días de atención vigentes y agenda directamente con el profesional que necesitas.
          </p>
        </div>

        {/* Professionals Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8" id="doctors-list-grid">
          {doctors.map((doc) => {
            const activeDays = getDoctorActiveDays(doc.schedule);

            return (
              <article
                key={doc.id}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-[#0086C0]/45 transition-colors duration-150 flex flex-col sm:flex-row items-stretch"
              >
                <div className="sm:w-2/5 relative h-64 sm:h-auto bg-slate-200 shrink-0">
                  <img
                    src={doc.image}
                    alt={doc.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div className="sm:w-3/5 p-6 flex flex-col justify-between space-y-5">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                      <span className="font-medium text-[#0086C0]">
                        {doc.specialty} · <span className="tabular-nums">{doc.experienceYears} años exp.</span>
                      </span>
                      <span className="inline-flex items-center gap-1 font-semibold text-[#0D1B38] tabular-nums shrink-0">
                        <Star className="h-3.5 w-3.5 text-[#0086C0] fill-[#0086C0]" />
                        {doc.rating.toFixed(1)}
                      </span>
                    </div>

                    <h2 className="font-display text-xl font-bold text-[#0D1B38]">
                      {doc.name}
                    </h2>

                    <p className="text-sm text-slate-600 leading-relaxed">
                      {doc.bio}
                    </p>

                    <div className="pt-3 border-t border-slate-100 space-y-1">
                      <p className="text-xs font-medium text-slate-500">Formación Académica</p>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        {doc.education}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-100 gap-4">
                    <div className="space-y-0.5">
                      <p className="text-xs text-slate-500 inline-flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-[#0086C0]" />
                        <span>Días de atención</span>
                      </p>
                      <p className="text-xs font-semibold text-[#0D1B38]">
                        {activeDays.length > 0 ? activeDays.join(" · ") : "Sin días activos"}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => onBookWithDoctor(doc.id)}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold text-white bg-[#0D1B38] hover:bg-[#0086C0] transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <span>Agendar Cita</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
