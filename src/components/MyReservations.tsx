import React, { useState } from "react";
import { Appointment, Doctor } from "../types";
import { TREATMENTS } from "../data";
import { formatRut, normalizeRut, validateRut } from "../utils/rut";
import {
  Calendar, Clock, QrCode, Trash2, ShieldCheck,
  PhoneCall, CheckCircle2, XCircle, ArrowRight,
  Search, AlertCircle, CreditCard, RefreshCw
} from "lucide-react";

interface MyReservationsProps {
  appointments: Appointment[];
  doctors: Doctor[];
  activeQueriedRut: string;
  onSetQueriedRut: (rut: string) => void;
  onCancelAppointment: (id: string) => void;
  onNavigateToBooking: () => void;
}

export default function MyReservations({
  appointments,
  doctors,
  activeQueriedRut,
  onSetQueriedRut,
  onCancelAppointment,
  onNavigateToBooking
}: MyReservationsProps) {
  const [rutInput, setRutInput] = useState<string>(
    activeQueriedRut ? formatRut(activeQueriedRut) : ""
  );
  const [rutError, setRutError] = useState<string>("");

  const formatFriendlyDate = (dateString: string) => {
    try {
      const options: Intl.DateTimeFormatOptions = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
      };
      return new Date(dateString + "T00:00:00").toLocaleDateString("es-ES", options);
    } catch {
      return dateString;
    }
  };

  const handleSearchRut = (e: React.FormEvent) => {
    e.preventDefault();
    setRutError("");

    if (!rutInput.trim() || !validateRut(rutInput)) {
      setRutError("Ingresa un RUT chileno válido con dígito verificador (ej. 12.345.678-5).");
      return;
    }

    onSetQueriedRut(normalizeRut(rutInput));
  };

  const handleChangeRut = () => {
    setRutError("");
    setRutInput("");
    onSetQueriedRut("");
  };

  const matchingAppointments = activeQueriedRut
    ? appointments.filter(
        (apt) => apt.patientRut && normalizeRut(apt.patientRut) === normalizeRut(activeQueriedRut)
      )
    : [];

  return (
    <section className="py-12 lg:py-16 bg-[#F8FAFC] min-h-[75vh]" id="my-reservations-section">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="max-w-2xl space-y-2 mb-10">
          <p className="text-sm font-medium text-[#0086C0]">
            Portal del Paciente
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[#0D1B38] tracking-tight">
            Mis Citas Programadas
          </h2>
          <p className="text-sm text-slate-600">
            Consulta tus reservas vigentes ingresando tu RUT chileno para proteger tu privacidad clínica.
          </p>
        </div>

        {/* RUT Lookup Form when no active RUT is queried */}
        {!activeQueriedRut ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 max-w-xl mx-auto space-y-6">
            <div className="space-y-1.5">
              <h3 className="font-display text-lg font-bold text-[#0D1B38]">
                Consultar citas por RUT
              </h3>
              <p className="text-sm text-slate-600">
                Ingresa el RUT del paciente utilizado al momento de agendar tu hora médica.
              </p>
            </div>

            {rutError && (
              <div
                role="alert"
                className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs sm:text-sm text-red-800 font-medium flex items-center gap-2"
              >
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                <span>{rutError}</span>
              </div>
            )}

            <form onSubmit={handleSearchRut} id="rut-lookup-form" className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="lookup-rut-input" className="block text-xs font-semibold text-[#0D1B38]">
                  RUT chileno del paciente
                </label>
                <div className="relative">
                  <CreditCard className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    id="lookup-rut-input"
                    type="text"
                    required
                    placeholder="12.345.678-5"
                    value={rutInput}
                    onChange={(e) => {
                      setRutError("");
                      setRutInput(formatRut(e.target.value));
                    }}
                    className="w-full bg-white border border-slate-300 rounded-lg pl-10 pr-4 py-2.5 text-sm text-[#0D1B38] tabular-nums focus:outline-none focus:border-[#0086C0] focus:ring-1 focus:ring-[#0086C0]"
                  />
                </div>
              </div>

              <button
                type="submit"
                id="lookup-rut-submit"
                className="w-full py-3 bg-[#0D1B38] hover:bg-[#0086C0] text-white text-sm font-semibold rounded-lg inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Search className="h-4 w-4" />
                <span>Consultar Mis Citas</span>
              </button>
            </form>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4 text-xs text-slate-500">
              <span>¿Aún no tienes una hora agendada?</span>
              <button
                type="button"
                onClick={onNavigateToBooking}
                className="font-semibold text-[#0086C0] hover:underline cursor-pointer"
              >
                Reservar Cita &rarr;
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Active RUT Bar */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-sm">
                <CreditCard className="h-4 w-4 text-[#0086C0] shrink-0" />
                <div>
                  <span className="text-slate-500 mr-2">Mostrando reservas para RUT:</span>
                  <strong className="text-[#0D1B38] tabular-nums">
                    {formatRut(activeQueriedRut)}
                  </strong>
                </div>
              </div>

              <button
                type="button"
                onClick={handleChangeRut}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-300 hover:border-[#0086C0] text-[#0D1B38] rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer self-start sm:self-auto"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Consultar otro RUT</span>
              </button>
            </div>

            {/* Matching Appointments or Empty State */}
            {matchingAppointments.length === 0 ? (
              <div
                className="bg-white border border-slate-200 rounded-2xl p-10 sm:p-14 text-center space-y-5 max-w-xl mx-auto"
                id="citas-empty-view"
              >
                <div className="mx-auto w-14 h-14 bg-[#EBF6FB] flex items-center justify-center rounded-xl text-[#0086C0]">
                  <Calendar className="h-7 w-7" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-display text-lg font-bold text-[#0D1B38]">
                    Sin citas registradas para este RUT
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
                    No encontramos reservas asociadas al RUT{" "}
                    <strong className="tabular-nums">{formatRut(activeQueriedRut)}</strong>.
                    Puedes programar una nueva hora en pocos pasos.
                  </p>
                </div>
                <div>
                  <button
                    type="button"
                    id="empty-state-book-btn"
                    onClick={onNavigateToBooking}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#0086C0] hover:bg-[#006C9C] text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    <span>Agendar Cita</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6" id="active-citas-list">
                {matchingAppointments.map((apt) => {
                  const treatment = TREATMENTS.find((t) => t.id === apt.treatmentId);
                  const doctor = doctors.find((d) => d.id === apt.doctorId);
                  const isCancelled = apt.status === "cancelada";
                  const isAttended = apt.status === "atendida";

                  return (
                    <article
                      key={apt.id}
                      id={`appointment-card-${apt.id}`}
                      className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span className="font-mono font-semibold text-[#0D1B38] tabular-nums">
                            {apt.id}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="font-medium text-[#0086C0]">
                            {treatment?.specialty || doctor?.specialty || "Odontología Clínica"}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          {isCancelled ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700">
                              <XCircle className="h-4 w-4" />
                              Cancelada
                            </span>
                          ) : isAttended ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0086C0]">
                              <CheckCircle2 className="h-4 w-4" />
                              Atendida
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700">
                              <CheckCircle2 className="h-4 w-4" />
                              Confirmada
                            </span>
                          )}

                          {!isCancelled && !isAttended && (
                            <button
                              type="button"
                              id={`cancel-btn-${apt.id}`}
                              onClick={() => onCancelAppointment(apt.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-slate-200 hover:border-red-200 hover:bg-red-50 text-slate-600 hover:text-red-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Cancelar</span>
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                        <div className="md:col-span-3 flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
                          <QrCode className="h-16 w-16 text-[#0D1B38] stroke-[1.4]" />
                          <span className="text-xs font-mono font-semibold text-slate-600 mt-2 tabular-nums">
                            {apt.id}
                          </span>
                        </div>

                        <div className="md:col-span-5 space-y-3">
                          <h3 className="font-display text-lg font-bold text-[#0D1B38]">
                            {apt.treatmentName || treatment?.name || "Evaluación Clínica"}
                          </h3>

                          <div className="flex items-center gap-3">
                            {doctor && (
                              <img
                                src={doctor.image}
                                alt={doctor.name}
                                className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                                referrerPolicy="no-referrer"
                              />
                            )}
                            <div>
                              <p className="text-xs text-slate-500">Especialista</p>
                              <p className="text-sm font-semibold text-[#0D1B38]">
                                {apt.doctorName || doctor?.name || "Por confirmar"}
                              </p>
                            </div>
                          </div>

                          <div className="text-xs text-slate-600 space-y-1 pt-1">
                            <p>
                              Paciente: <strong className="text-[#0D1B38]">{apt.patientName}</strong>
                              {" · "}
                              <span className="tabular-nums">RUT {formatRut(apt.patientRut)}</span>
                            </p>
                            <p className="tabular-nums">
                              {apt.patientEmail} · {apt.patientPhone}
                            </p>
                          </div>
                        </div>

                        <div className="md:col-span-4 bg-[#F8FAFC] border border-slate-200/80 p-4 rounded-xl space-y-3">
                          <div>
                            <div className="flex items-center gap-1.5 text-xs font-medium text-[#0086C0]">
                              <Calendar className="h-3.5 w-3.5" />
                              <span>Fecha</span>
                            </div>
                            <p className="text-xs sm:text-sm font-semibold text-[#0D1B38] mt-1 capitalize">
                              {formatFriendlyDate(apt.date)}
                            </p>
                          </div>

                          <div className="pt-2.5 border-t border-slate-200/70">
                            <div className="flex items-center gap-1.5 text-xs font-medium text-[#0086C0]">
                              <Clock className="h-3.5 w-3.5" />
                              <span>Horario</span>
                            </div>
                            <p className="text-sm font-bold text-[#0D1B38] tabular-nums mt-0.5">
                              {apt.timeSlot}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1.5">
                          <ShieldCheck className="h-4 w-4 text-[#0086C0] shrink-0" />
                          Preséntate 10 minutos antes en recepción con este pase digital.
                        </span>
                        <a
                          href="tel:+56224508900"
                          className="inline-flex items-center gap-1.5 font-semibold text-[#0D1B38] hover:text-[#0086C0] transition-colors"
                        >
                          <PhoneCall className="h-3.5 w-3.5" />
                          <span>Atención Telefónica</span>
                        </a>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
