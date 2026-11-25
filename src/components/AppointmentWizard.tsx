import React, { useState, useEffect, useMemo } from "react";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { Appointment, Doctor, SpecialtyItem, Treatment } from "../types";
import {
  TREATMENTS,
  ALL_TIME_SLOTS,
  getDoctorActiveDays,
  getSpanishDayFromDate,
  slugifyId
} from "../data";
import { db, OperationType, handleFirestoreError } from "../firebase";
import { formatRut, normalizeRut, validateRut } from "../utils/rut";
import {
  User, Phone, Mail, ChevronRight, ChevronLeft,
  CheckCircle2, AlertCircle, ShieldCheck, QrCode, CreditCard, Calendar
} from "lucide-react";

interface AppointmentWizardProps {
  specialties: SpecialtyItem[];
  doctors: Doctor[];
  existingAppointments: Appointment[];
  prefilledTreatmentId?: string;
  prefilledSpecialtyName?: string;
  prefilledDoctorId?: string;
  onAppointmentCreated: (appointment: Appointment) => void;
  onNavigateToReservations: (rut: string) => void;
}

export default function AppointmentWizard({
  specialties,
  doctors,
  existingAppointments,
  prefilledTreatmentId,
  prefilledSpecialtyName,
  prefilledDoctorId,
  onAppointmentCreated,
  onNavigateToReservations
}: AppointmentWizardProps) {
  const [step, setStep] = useState<number>(0);

  const defaultSpecName = specialties[0]?.name || "Estética Dental";
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>(defaultSpecName);
  const [selectedTreatmentId, setSelectedTreatmentId] = useState<string>("");
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [patientName, setPatientName] = useState<string>("");
  const [patientRut, setPatientRut] = useState<string>("");
  const [patientEmail, setPatientEmail] = useState<string>("");
  const [patientPhone, setPatientPhone] = useState<string>("");
  const [patientNotes, setPatientNotes] = useState<string>("");

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [confirmedTicket, setConfirmedTicket] = useState<Appointment | null>(null);

  // Build combined treatment catalog including dynamic consultation items for newly created specialties
  const allTreatments: Treatment[] = useMemo(() => {
    const dynamicFallbacks: Treatment[] = specialties
      .filter((spec) => !TREATMENTS.some((t) => t.specialty === spec.name))
      .map((spec) => ({
        id: `eval-${slugifyId(spec.name) || spec.id}`,
        name: `Consulta de ${spec.name}`,
        specialty: spec.name,
        description:
          spec.description ||
          `Evaluación clínica y plan de tratamiento personalizado en ${spec.name}.`,
        duration: "30 minutos",
        highlight: "Evaluación especializada",
        techUsed: "Diagnóstico Digital 3D",
        estimatedCost: "Según evaluación"
      }));

    return [...TREATMENTS, ...dynamicFallbacks];
  }, [specialties]);

  const getMinDateString = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, "0");
    const dd = String(tomorrow.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const findNextAvailableDateForDoctor = (doctor: Doctor | undefined): string => {
    const cursor = new Date();
    cursor.setDate(cursor.getDate() + 1);
    if (!doctor) {
      if (cursor.getDay() === 0) cursor.setDate(cursor.getDate() + 1);
      return cursor.toISOString().split("T")[0];
    }

    for (let i = 0; i < 21; i++) {
      const yyyy = cursor.getFullYear();
      const mm = String(cursor.getMonth() + 1).padStart(2, "0");
      const dd = String(cursor.getDate()).padStart(2, "0");
      const dateStr = `${yyyy}-${mm}-${dd}`;
      const dayName = getSpanishDayFromDate(dateStr);
      if (dayName && dayName !== "Domingo") {
        const sched = doctor.schedule[dayName];
        if (sched?.enabled && sched.slots.length > 0) {
          return dateStr;
        }
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    return getMinDateString();
  };

  useEffect(() => {
    if (prefilledTreatmentId) {
      const parentTreatment = allTreatments.find((t) => t.id === prefilledTreatmentId);
      if (parentTreatment) {
        setSelectedSpecialty(parentTreatment.specialty);
        setSelectedTreatmentId(parentTreatment.id);
      } else if (prefilledSpecialtyName) {
        setSelectedSpecialty(prefilledSpecialtyName);
        const matching = allTreatments.filter((t) => t.specialty === prefilledSpecialtyName);
        if (matching.length > 0) {
          setSelectedTreatmentId(matching[0].id);
        }
      }
    } else if (prefilledSpecialtyName) {
      setSelectedSpecialty(prefilledSpecialtyName);
      const matching = allTreatments.filter((t) => t.specialty === prefilledSpecialtyName);
      if (matching.length > 0) {
        setSelectedTreatmentId(matching[0].id);
      }
    } else {
      const filtered = allTreatments.filter((t) => t.specialty === defaultSpecName);
      if (filtered.length > 0) {
        setSelectedSpecialty(defaultSpecName);
        setSelectedTreatmentId(filtered[0].id);
      }
    }

    if (prefilledDoctorId) {
      setSelectedDoctorId(prefilledDoctorId);
      const docItem = doctors.find((d) => d.id === prefilledDoctorId);
      setSelectedDate(findNextAvailableDateForDoctor(docItem));
    } else {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      if (tomorrow.getDay() === 0) tomorrow.setDate(tomorrow.getDate() + 1);
      const yyyy = tomorrow.getFullYear();
      const mm = String(tomorrow.getMonth() + 1).padStart(2, "0");
      const dd = String(tomorrow.getDate()).padStart(2, "0");
      setSelectedDate(`${yyyy}-${mm}-${dd}`);
    }
  }, [prefilledTreatmentId, prefilledSpecialtyName, prefilledDoctorId, doctors, allTreatments, defaultSpecName]);

  const handleSpecialtyChange = (specName: string) => {
    setSelectedSpecialty(specName);
    const matching = allTreatments.filter((t) => t.specialty === specName);
    setSelectedTreatmentId(matching.length > 0 ? matching[0].id : "");
  };

  const handleDoctorSelect = (doctorId: string) => {
    setSelectedDoctorId(doctorId);
    setSelectedTime("");
    setErrorMsg("");
    const docItem = doctors.find((d) => d.id === doctorId);
    if (docItem && selectedDate) {
      const dayName = getSpanishDayFromDate(selectedDate);
      const isValidCurrent =
        dayName &&
        dayName !== "Domingo" &&
        docItem.schedule[dayName]?.enabled &&
        docItem.schedule[dayName].slots.length > 0;
      if (!isValidCurrent) {
        setSelectedDate(findNextAvailableDateForDoctor(docItem));
      }
    }
  };

  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    setSelectedTime("");
    setErrorMsg("");
  };

  const getFilteredTreatments = () =>
    allTreatments.filter((t) => t.specialty === selectedSpecialty);

  const currentTreatment = allTreatments.find((t) => t.id === selectedTreatmentId);
  const currentDoctor = doctors.find((d) => d.id === selectedDoctorId);

  const selectedDayName = getSpanishDayFromDate(selectedDate);
  const doctorDaySchedule =
    currentDoctor && selectedDayName && selectedDayName !== "Domingo"
      ? currentDoctor.schedule[selectedDayName]
      : null;

  const isSlotBooked = (slot: string) => {
    if (!selectedDoctorId || !selectedDate) return false;
    return existingAppointments.some(
      (apt) =>
        apt.status === "confirmada" &&
        apt.doctorId === selectedDoctorId &&
        apt.date === selectedDate &&
        apt.timeSlot === slot
    );
  };

  const isSlotAvailableForDoctor = (slot: string) => {
    if (!doctorDaySchedule || !doctorDaySchedule.enabled) return false;
    if (!doctorDaySchedule.slots.includes(slot)) return false;
    if (isSlotBooked(slot)) return false;
    return true;
  };

  const activeDoctorDays = currentDoctor ? getDoctorActiveDays(currentDoctor.schedule) : [];

  const validateContactFields = () => {
    if (!patientName.trim() || patientName.trim().length < 2) {
      setErrorMsg("Por favor, ingresa tu nombre completo.");
      return false;
    }
    if (!patientRut.trim() || !validateRut(patientRut)) {
      setErrorMsg("Por favor, ingresa un RUT chileno válido (ej. 12.345.678-5).");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(patientEmail.trim())) {
      setErrorMsg("Por favor, ingresa un correo electrónico válido.");
      return false;
    }
    if (patientPhone.trim().replace(/\D/g, "").length < 7) {
      setErrorMsg("Por favor, ingresa un número de teléfono válido.");
      return false;
    }
    return true;
  };

  const nextStep = () => {
    setErrorMsg("");
    if (step === 0 && !selectedTreatmentId) {
      setErrorMsg("Por favor, selecciona un tratamiento para continuar.");
      return;
    }
    if (step === 1) {
      if (!selectedDoctorId) {
        setErrorMsg("Por favor, selecciona un especialista.");
        return;
      }
      const docItem = doctors.find((d) => d.id === selectedDoctorId);
      if (docItem && getDoctorActiveDays(docItem.schedule).length === 0) {
        setErrorMsg(
          `${docItem.name} no tiene horarios habilitados actualmente. Elige otro especialista disponible.`
        );
        return;
      }
    }
    if (step === 2) {
      if (!selectedDate) {
        setErrorMsg("Por favor, selecciona una fecha válida.");
        return;
      }
      if (selectedDayName === "Domingo") {
        setErrorMsg(
          "Los domingos la clínica permanece cerrada por sanitización. Selecciona una fecha de lunes a sábado."
        );
        return;
      }
      if (!doctorDaySchedule || !doctorDaySchedule.enabled || doctorDaySchedule.slots.length === 0) {
        setErrorMsg(
          `${currentDoctor?.name || "El profesional"} no atiende los días ${selectedDayName}. Días disponibles: ${
            activeDoctorDays.length > 0 ? activeDoctorDays.join(", ") : "Ninguno"
          }.`
        );
        return;
      }
      if (!selectedTime) {
        setErrorMsg("Por favor, selecciona un horario disponible.");
        return;
      }
      if (!isSlotAvailableForDoctor(selectedTime)) {
        setErrorMsg(
          "El horario seleccionado ya no está disponible para este profesional en la fecha indicada."
        );
        return;
      }
    }
    setStep(step + 1);
  };

  const prevStep = () => {
    setErrorMsg("");
    setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!validateContactFields()) return;

    if (!isSlotAvailableForDoctor(selectedTime)) {
      setErrorMsg(
        "El bloque horario seleccionado ya no está disponible para el profesional elegido. Regresa al paso anterior."
      );
      return;
    }

    const aptId = "ISD-" + Math.floor(100000 + Math.random() * 900000);
    const safeName = patientName.trim().slice(0, 120);
    const safeRut = normalizeRut(patientRut).slice(0, 15);
    const safeEmail = patientEmail.trim().slice(0, 254);
    const safePhone = patientPhone.trim().slice(0, 30);
    const safeTreatmentId = (selectedTreatmentId || "eval-3d").slice(0, 64);
    const safeTreatmentName = (currentTreatment?.name || "Evaluación Clínica").slice(0, 140);
    const safeDoctorId = selectedDoctorId.slice(0, 64);
    const safeDoctorName = (currentDoctor?.name || "Especialista").slice(0, 120);
    const safeNotes = patientNotes.trim().slice(0, 600);

    const newAppointment: Appointment = {
      id: aptId,
      patientName: safeName,
      patientRut: safeRut,
      patientEmail: safeEmail,
      patientPhone: safePhone,
      treatmentId: safeTreatmentId,
      treatmentName: safeTreatmentName,
      doctorId: safeDoctorId,
      doctorName: safeDoctorName,
      date: selectedDate,
      timeSlot: selectedTime,
      status: "confirmada",
      notes: safeNotes,
      createdAt: new Date().toISOString()
    };

    setSubmitting(true);
    try {
      await setDoc(doc(db, "appointments", aptId), {
        id: aptId,
        patientName: safeName,
        patientRut: safeRut,
        patientEmail: safeEmail,
        patientPhone: safePhone,
        treatmentId: safeTreatmentId,
        treatmentName: safeTreatmentName,
        doctorId: safeDoctorId,
        doctorName: safeDoctorName,
        date: selectedDate,
        timeSlot: selectedTime,
        status: "confirmada",
        notes: safeNotes,
        createdAt: serverTimestamp()
      });

      onAppointmentCreated(newAppointment);
      setConfirmedTicket(newAppointment);
      setStep(4);
    } catch (err) {
      setErrorMsg("No pudimos registrar la cita en el servidor. Inténtalo nuevamente.");
      handleFirestoreError(err, OperationType.CREATE, `appointments/${aptId}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setStep(0);
    setSelectedTreatmentId(allTreatments[0]?.id || "");
    setSelectedSpecialty(allTreatments[0]?.specialty || defaultSpecName);
    setSelectedDoctorId("");
    setSelectedTime("");
    setPatientName("");
    setPatientRut("");
    setPatientEmail("");
    setPatientPhone("");
    setPatientNotes("");
    setErrorMsg("");
    setConfirmedTicket(null);
  };

  const stepsMeta = [
    { label: "Tratamiento", num: 0 },
    { label: "Especialista", num: 1 },
    { label: "Fecha y Hora", num: 2 },
    { label: "Tus Datos", num: 3 }
  ];

  const rutIsValid = patientRut.trim().length > 0 && validateRut(patientRut);

  return (
    <section className="py-12 lg:py-16 bg-[#F8FAFC] min-h-[75vh]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {step < 4 && (
          <div className="max-w-2xl mb-8 space-y-2">
            <p className="text-sm font-medium text-[#0086C0]">
              Reserva Online en 4 Pasos
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[#0D1B38] tracking-tight">
              Agenda tu Cita en Clínica IS Dental
            </h2>
            <p className="text-sm text-slate-600">
              Selecciona tu tratamiento, especialista y bloque disponible según su agenda clínica vigente.
            </p>
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          {step < 4 && (
            <div className="bg-slate-50 border-b border-slate-200 grid grid-cols-4">
              {stepsMeta.map((s) => {
                const isDoneOrCurrent = step >= s.num;
                const isCurrent = step === s.num;
                return (
                  <div
                    key={s.num}
                    className={`py-3.5 px-2 text-center text-xs font-semibold border-b-2 transition-colors tabular-nums ${
                      isCurrent
                        ? "border-[#0086C0] text-[#0D1B38] bg-white"
                        : isDoneOrCurrent
                        ? "border-[#0D1B38] text-[#0D1B38]"
                        : "border-transparent text-slate-400"
                    }`}
                  >
                    <span className="hidden sm:inline">0{s.num + 1}. {s.label}</span>
                    <span className="sm:hidden">Paso {s.num + 1}</span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="p-6 sm:p-10">
            {errorMsg && (
              <div
                role="alert"
                className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-xs sm:text-sm text-red-800 font-medium flex items-center gap-2.5"
              >
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* STEP 0: Treatment */}
            {step === 0 && (
              <div className="space-y-6" id="wizard-step-0">
                <div className="space-y-1">
                  <h3 className="font-display text-lg font-bold text-[#0D1B38]">
                    01. Selecciona la especialidad y tratamiento
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500">
                    Elige la categoría clínica para ver los procedimientos disponibles.
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 rounded-xl">
                  {specialties.map((spec) => {
                    const active = selectedSpecialty === spec.name;
                    return (
                      <button
                        key={spec.id}
                        type="button"
                        id={`wizard-spec-${spec.id}`}
                        onClick={() => handleSpecialtyChange(spec.name)}
                        className={`px-3.5 py-2 rounded-lg text-xs font-semibold text-center whitespace-nowrap transition-colors cursor-pointer ${
                          active
                            ? "bg-white text-[#0D1B38] shadow-xs"
                            : "text-slate-600 hover:text-[#0D1B38]"
                        }`}
                      >
                        {spec.name}
                      </button>
                    );
                  })}
                </div>

                <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
                  {getFilteredTreatments().map((t) => {
                    const isSelected = selectedTreatmentId === t.id;
                    return (
                      <label
                        key={t.id}
                        htmlFor={`radio-treatment-${t.id}`}
                        id={`wizard-treatment-opt-${t.id}`}
                        className={`p-4 sm:p-5 flex items-start gap-3.5 cursor-pointer transition-colors ${
                          isSelected ? "bg-[#EBF6FB]/70" : "bg-white hover:bg-slate-50"
                        }`}
                      >
                        <input
                          type="radio"
                          name="treatmentId"
                          id={`radio-treatment-${t.id}`}
                          checked={isSelected}
                          onChange={() => setSelectedTreatmentId(t.id)}
                          className="h-4 w-4 mt-1 accent-[#0086C0] cursor-pointer"
                        />
                        <div className="flex-1 space-y-1">
                          <div className="flex justify-between items-start gap-4">
                            <span className="text-sm font-bold text-[#0D1B38]">
                              {t.name}
                            </span>
                            <span className="text-xs font-medium text-slate-500 tabular-nums shrink-0">
                              {t.duration}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                            {t.description}
                          </p>
                          <p className="text-xs text-slate-500 pt-1 tabular-nums">
                            <span className="font-medium text-[#0086C0]">{t.techUsed}</span>
                            <span aria-hidden="true"> · </span>
                            <span>Estimado: {t.estimatedCost}</span>
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 1: Doctor */}
            {step === 1 && (
              <div className="space-y-6" id="wizard-step-1">
                <div className="space-y-1">
                  <h3 className="font-display text-lg font-bold text-[#0D1B38]">
                    02. Elige tu especialista
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500">
                    Indicamos los especialistas asignados a {selectedSpecialty} y sus días de atención vigentes.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {doctors.map((docItem) => {
                    const isSelected = selectedDoctorId === docItem.id;
                    const isRecommended =
                      docItem.specialty === selectedSpecialty ||
                      (currentTreatment && docItem.specialty === currentTreatment.specialty);
                    const activeDays = getDoctorActiveDays(docItem.schedule);

                    return (
                      <button
                        type="button"
                        key={docItem.id}
                        id={`wizard-doc-opt-${docItem.id}`}
                        onClick={() => handleDoctorSelect(docItem.id)}
                        className={`text-left border rounded-xl p-5 cursor-pointer transition-colors flex flex-col justify-between space-y-4 ${
                          isSelected
                            ? "bg-[#EBF6FB]/70 border-[#0086C0]"
                            : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <img
                            src={docItem.image}
                            alt={docItem.name}
                            className="w-14 h-14 rounded-full object-cover border border-slate-200 shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-medium text-[#0086C0]">
                                {docItem.specialty}
                              </span>
                              {isRecommended && (
                                <>
                                  <span className="text-slate-300" aria-hidden="true">·</span>
                                  <span className="text-xs font-semibold text-[#0D1B38]">
                                    Sugerido
                                  </span>
                                </>
                              )}
                            </div>
                            <h4 className="font-display text-base font-bold text-[#0D1B38]">
                              {docItem.name}
                            </h4>
                            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                              {docItem.bio}
                            </p>
                          </div>
                        </div>

                        <div className="border-t border-slate-200/70 pt-3 flex justify-between items-center text-xs gap-2">
                          <span className="text-slate-500 shrink-0">Disponibilidad</span>
                          <span className="font-semibold text-[#0D1B38] text-right">
                            {activeDays.length > 0 ? activeDays.join(" · ") : "Sin días activos"}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 2: Date & Time with Live Schedule Validation */}
            {step === 2 && (
              <div className="space-y-6" id="wizard-step-2">
                <div className="space-y-1">
                  <h3 className="font-display text-lg font-bold text-[#0D1B38]">
                    03. Fecha y horario disponible · {currentDoctor?.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500">
                    Días de atención del especialista:{" "}
                    <strong className="text-[#0D1B38]">
                      {activeDoctorDays.length > 0 ? activeDoctorDays.join(", ") : "Sin días configurados"}
                    </strong>
                    .
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                  <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl space-y-4">
                    <label
                      htmlFor="wizard-date-input"
                      className="block text-xs font-semibold text-[#0D1B38]"
                    >
                      Fecha de la cita
                    </label>
                    <input
                      type="date"
                      id="wizard-date-input"
                      min={getMinDateString()}
                      value={selectedDate}
                      onChange={(e) => handleDateChange(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-[#0D1B38] tabular-nums focus:outline-none focus:border-[#0086C0] focus:ring-1 focus:ring-[#0086C0]"
                    />

                    {selectedDayName && (
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/80">
                        <span className="text-slate-500">Día seleccionado:</span>
                        <span className="font-semibold text-[#0D1B38] flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-[#0086C0]" />
                          {selectedDayName}
                        </span>
                      </div>
                    )}

                    {selectedDayName === "Domingo" ? (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
                        Los domingos permanecemos cerrados por sanitización. Selecciona otro día.
                      </div>
                    ) : !doctorDaySchedule || !doctorDaySchedule.enabled || doctorDaySchedule.slots.length === 0 ? (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 space-y-2">
                        <p>
                          <strong>{currentDoctor?.name}</strong> no tiene atención los días{" "}
                          <strong>{selectedDayName}</strong>.
                        </p>
                        {activeDoctorDays.length > 0 && (
                          <button
                            type="button"
                            onClick={() => handleDateChange(findNextAvailableDateForDoctor(currentDoctor))}
                            className="font-semibold text-[#0086C0] hover:underline cursor-pointer"
                          >
                            Ir a su próxima fecha disponible &rarr;
                          </button>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-600">
                        Bloques habilitados para este día:{" "}
                        <strong className="tabular-nums text-[#0D1B38]">
                          {doctorDaySchedule.slots.length}
                        </strong>
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-[#0D1B38]">
                      Horarios del profesional
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {ALL_TIME_SLOTS.map((time) => {
                        const booked = isSlotBooked(time);
                        const inDoctorSchedule = Boolean(
                          doctorDaySchedule?.enabled && doctorDaySchedule.slots.includes(time)
                        );
                        const available = inDoctorSchedule && !booked;
                        const isSelected = selectedTime === time && available;

                        return (
                          <button
                            key={time}
                            type="button"
                            disabled={!available}
                            id={`time-slot-${time.replace(":", "-").replace(" ", "-")}`}
                            onClick={() => available && setSelectedTime(time)}
                            className={`py-2.5 px-2 rounded-lg text-xs font-semibold tabular-nums border transition-colors whitespace-nowrap flex flex-col items-center justify-center ${
                              !available
                                ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                                : isSelected
                                ? "bg-[#0086C0] text-white border-[#0086C0] cursor-pointer"
                                : "bg-white text-[#0D1B38] border-slate-200 hover:border-[#0086C0] hover:bg-slate-50 cursor-pointer"
                            }`}
                          >
                            <span>{time}</span>
                            {!inDoctorSchedule ? (
                              <span className="text-[10px] font-normal text-slate-400">
                                No atiende
                              </span>
                            ) : booked ? (
                              <span className="text-[10px] font-normal text-slate-400">
                                Reservado
                              </span>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Patient Info with Chilean RUT */}
            {step === 3 && (
              <div className="space-y-6" id="wizard-step-3">
                <div className="space-y-1">
                  <h3 className="font-display text-lg font-bold text-[#0D1B38]">
                    04. Datos de contacto y RUT del paciente
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500">
                    Tu RUT asociará esta reserva para que puedas consultarla en Mis Citas.
                  </p>
                </div>

                <form id="booking-contact-form" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label htmlFor="patient-name-field" className="block text-xs font-semibold text-[#0D1B38]">
                      Nombre completo
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        id="patient-name-field"
                        required
                        maxLength={120}
                        placeholder="Ej. Sofía Méndez Valenzuela"
                        value={patientName}
                        onChange={(e) => setPatientName(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg pl-10 pr-4 py-2.5 text-sm text-[#0D1B38] focus:outline-none focus:border-[#0086C0] focus:ring-1 focus:ring-[#0086C0]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label htmlFor="patient-rut-field" className="block text-xs font-semibold text-[#0D1B38]">
                        RUT chileno
                      </label>
                      {patientRut.trim().length > 0 && (
                        <span
                          className={`text-[11px] font-medium ${
                            rutIsValid ? "text-teal-700" : "text-red-600"
                          }`}
                        >
                          {rutIsValid ? "RUT válido" : "RUT inválido"}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <CreditCard className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        id="patient-rut-field"
                        required
                        maxLength={15}
                        placeholder="12.345.678-9"
                        value={patientRut}
                        onChange={(e) => setPatientRut(formatRut(e.target.value))}
                        className={`w-full bg-white border rounded-lg pl-10 pr-4 py-2.5 text-sm text-[#0D1B38] tabular-nums focus:outline-none focus:ring-1 ${
                          patientRut.trim().length > 0 && !rutIsValid
                            ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                            : "border-slate-300 focus:border-[#0086C0] focus:ring-[#0086C0]"
                        }`}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="patient-email-field" className="block text-xs font-semibold text-[#0D1B38]">
                      Correo electrónico
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type="email"
                        id="patient-email-field"
                        required
                        maxLength={254}
                        placeholder="sofia@correo.cl"
                        value={patientEmail}
                        onChange={(e) => setPatientEmail(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg pl-10 pr-4 py-2.5 text-sm text-[#0D1B38] focus:outline-none focus:border-[#0086C0] focus:ring-1 focus:ring-[#0086C0]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="patient-phone-field" className="block text-xs font-semibold text-[#0D1B38]">
                      Teléfono móvil
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type="tel"
                        id="patient-phone-field"
                        required
                        maxLength={30}
                        placeholder="+56 9 8765 4321"
                        value={patientPhone}
                        onChange={(e) => setPatientPhone(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg pl-10 pr-4 py-2.5 text-sm text-[#0D1B38] tabular-nums focus:outline-none focus:border-[#0086C0] focus:ring-1 focus:ring-[#0086C0]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label htmlFor="patient-notes-field" className="block text-xs font-semibold text-[#0D1B38]">
                      Observaciones clínicas o solicitudes especiales (opcional)
                    </label>
                    <textarea
                      id="patient-notes-field"
                      rows={3}
                      maxLength={600}
                      placeholder="Indícanos si presentas sensibilidad, ansiedad dental o algún requerimiento previo."
                      value={patientNotes}
                      onChange={(e) => setPatientNotes(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-[#0D1B38] focus:outline-none focus:border-[#0086C0] focus:ring-1 focus:ring-[#0086C0]"
                    />
                  </div>
                </form>

                <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl flex items-start gap-3 text-xs text-slate-600 leading-relaxed">
                  <ShieldCheck className="h-5 w-5 text-[#0086C0] shrink-0" />
                  <span>
                    Tus datos clínicos y RUT se resguardan bajo estricta confidencialidad médica en Clínica IS Dental.
                  </span>
                </div>
              </div>
            )}

            {/* STEP 4: Confirmation Digital Pass */}
            {step === 4 && confirmedTicket && (
              <div className="space-y-8 text-center py-2" id="wizard-step-4-ticket">
                <div className="space-y-2">
                  <div className="mx-auto w-14 h-14 bg-[#EBF6FB] flex items-center justify-center rounded-xl text-[#0086C0]">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <h3 className="font-display text-2xl font-bold text-[#0D1B38]">
                    Cita Confirmada
                  </h3>
                  <p className="text-sm text-slate-600 max-w-md mx-auto">
                    Tu reserva asociada al RUT{" "}
                    <strong className="text-[#0D1B38] tabular-nums">
                      {formatRut(confirmedTicket.patientRut)}
                    </strong>{" "}
                    ha quedado registrada.
                  </p>
                </div>

                <div
                  className="max-w-md mx-auto bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden text-left"
                  id="visual-appointment-ticket"
                >
                  <div className="bg-[#0D1B38] text-white p-5 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-[#7DD3FC] font-medium">Pase Digital de Cita</p>
                      <h4 className="font-display text-base font-bold mt-0.5">
                        Clínica IS Dental
                      </h4>
                    </div>
                    <span className="font-mono text-xs font-semibold text-sky-200 tabular-nums">
                      {confirmedTicket.id}
                    </span>
                  </div>

                  <div className="p-5 space-y-4 text-sm">
                    <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-100">
                      <div>
                        <p className="text-xs text-slate-500">Paciente</p>
                        <p className="font-semibold text-[#0D1B38] mt-0.5 break-words">
                          {confirmedTicket.patientName}
                        </p>
                        <p className="text-xs text-slate-500 tabular-nums mt-0.5">
                          RUT: {formatRut(confirmedTicket.patientRut)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Especialista</p>
                        <p className="font-semibold text-[#0D1B38] mt-0.5">
                          {confirmedTicket.doctorName || currentDoctor?.name || "Por confirmar"}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">Tratamiento</p>
                      <p className="font-bold text-[#0D1B38] mt-0.5">
                        {confirmedTicket.treatmentName || currentTreatment?.name || "Evaluación Clínica"}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-100">
                      <div>
                        <p className="text-xs text-slate-500">Fecha</p>
                        <p className="font-semibold text-[#0D1B38] tabular-nums mt-0.5">
                          {confirmedTicket.date}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Horario</p>
                        <p className="font-semibold text-[#0086C0] tabular-nums mt-0.5">
                          {confirmedTicket.timeSlot}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4 pt-1">
                      <ul className="text-xs text-slate-600 space-y-1">
                        <li>· Presentarse 10 minutos antes</li>
                        <li>· Llevar cédula de identidad</li>
                        <li>· Estacionamiento incluido</li>
                      </ul>
                      <div className="p-2 border border-slate-200 rounded-lg bg-slate-50 shrink-0">
                        <QrCode className="h-12 w-12 text-[#0D1B38] stroke-[1.5]" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 justify-center">
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="px-5 py-2.5 border border-slate-300 text-[#0D1B38] hover:bg-slate-50 bg-white rounded-lg text-xs sm:text-sm font-semibold cursor-pointer"
                  >
                    Agendar Otra Cita
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigateToReservations(confirmedTicket.patientRut)}
                    className="px-6 py-2.5 bg-[#0086C0] hover:bg-[#006C9C] text-white rounded-lg text-xs sm:text-sm font-semibold cursor-pointer"
                  >
                    Ver Mis Citas
                  </button>
                </div>
              </div>
            )}

            {/* Footer Navigation */}
            {step < 4 && (
              <div className="flex justify-between items-center pt-8 border-t border-slate-100 mt-8">
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={step === 0 || submitting}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors ${
                    step === 0 || submitting
                      ? "text-slate-300 pointer-events-none"
                      : "text-slate-600 hover:bg-slate-100 hover:text-[#0D1B38] cursor-pointer"
                  }`}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Atrás</span>
                </button>

                {step === 3 ? (
                  <button
                    type="submit"
                    form="booking-contact-form"
                    id="wizard-final-submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#0086C0] hover:bg-[#006C9C] disabled:opacity-60 text-white font-semibold text-xs sm:text-sm rounded-lg transition-colors cursor-pointer"
                  >
                    <span>{submitting ? "Registrando Cita..." : "Confirmar Cita"}</span>
                    <CheckCircle2 className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    id="wizard-next-btn"
                    onClick={nextStep}
                    className="inline-flex items-center gap-1.5 px-6 py-3 bg-[#0D1B38] hover:bg-[#162B54] text-white font-semibold text-xs sm:text-sm rounded-lg transition-colors cursor-pointer"
                  >
                    <span>Siguiente</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
