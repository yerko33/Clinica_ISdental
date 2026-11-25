import React, { useState } from "react";
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2, AlertCircle } from "lucide-react";
import { formatRut, validateRut } from "../utils/rut";

interface ContactMessage {
  id: string;
  name: string;
  rut?: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  createdAt: string;
}

export default function ContactPage() {
  const [name, setName] = useState("");
  const [rut, setRut] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("Evaluación general");
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!name.trim()) {
      setErrorMsg("Por favor, ingresa tu nombre completo.");
      return;
    }
    if (rut.trim() && !validateRut(rut)) {
      setErrorMsg("El RUT ingresado no es válido. Verifícalo o déjalo en blanco.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMsg("Por favor, ingresa un correo electrónico válido.");
      return;
    }
    if (phone.trim().replace(/\D/g, "").length < 7) {
      setErrorMsg("Por favor, ingresa un teléfono de contacto válido.");
      return;
    }
    if (!message.trim()) {
      setErrorMsg("Por favor, escribe tu consulta o mensaje.");
      return;
    }

    const existingRaw = localStorage.getItem("is_dental_contact_messages");
    const existing: ContactMessage[] = existingRaw ? JSON.parse(existingRaw) : [];
    const entry: ContactMessage = {
      id: "MSG-" + Date.now(),
      name: name.trim(),
      rut: rut.trim() || undefined,
      email: email.trim(),
      phone: phone.trim(),
      subject,
      message: message.trim(),
      createdAt: new Date().toISOString()
    };
    localStorage.setItem("is_dental_contact_messages", JSON.stringify([entry, ...existing]));

    setSubmitted(true);
    setName("");
    setRut("");
    setEmail("");
    setPhone("");
    setMessage("");
    setTimeout(() => setSubmitted(false), 6000);
  };

  return (
    <section className="py-12 lg:py-16 bg-[#F8FAFC] min-h-[75vh]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl space-y-2 mb-12">
          <p className="text-sm font-medium text-[#0086C0]">Canales de Atención</p>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-[#0D1B38] tracking-tight">
            Contacto Directo
          </h1>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Resolvemos tus dudas sobre tratamientos, convenios, presupuestos o reprogramación de horas médicas.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Column: Clinic Information */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6">
              <div className="flex items-start gap-3.5">
                <MapPin className="h-5 w-5 text-[#0086C0] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h2 className="font-display text-sm font-bold text-[#0D1B38]">
                    Dirección Clínica
                  </h2>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Av. Apoquindo 4500, Piso 5<br />
                    Las Condes, Santiago, Chile
                  </p>
                </div>
              </div>

              <div className="pt-5 border-t border-slate-100 flex items-start gap-3.5">
                <Phone className="h-5 w-5 text-[#0086C0] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h2 className="font-display text-sm font-bold text-[#0D1B38]">
                    Teléfono & Urgencias
                  </h2>
                  <p className="text-sm text-slate-600 tabular-nums">
                    Central: +56 2 2450 8900<br />
                    Móvil / WhatsApp: +56 9 8765 4321
                  </p>
                </div>
              </div>

              <div className="pt-5 border-t border-slate-100 flex items-start gap-3.5">
                <Mail className="h-5 w-5 text-[#0086C0] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h2 className="font-display text-sm font-bold text-[#0D1B38]">
                    Correo Institucional
                  </h2>
                  <p className="text-sm text-slate-600">
                    contacto@clinicaisdental.cl
                  </p>
                </div>
              </div>

              <div className="pt-5 border-t border-slate-100 flex items-start gap-3.5">
                <Clock className="h-5 w-5 text-[#0086C0] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h2 className="font-display text-sm font-bold text-[#0D1B38]">
                    Horarios de Atención
                  </h2>
                  <p className="text-sm text-slate-600 tabular-nums">
                    Lunes a Viernes: 08:30 a 19:30 hrs<br />
                    Sábado: 08:30 a 14:00 hrs<br />
                    Domingo: Cerrado por sanitización
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-[#0D1B38] text-white rounded-2xl p-6 space-y-2">
              <p className="text-xs font-medium text-[#7DD3FC]">Estacionamiento Privado</p>
              <p className="text-sm text-slate-200 leading-relaxed">
                Contamos con acceso subterráneo liberado para pacientes con hora confirmada durante toda la atención clínica.
              </p>
            </div>
          </div>

          {/* Right Column: Contact Form */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="space-y-1">
              <h2 className="font-display text-xl font-bold text-[#0D1B38]">
                Envíanos un mensaje
              </h2>
              <p className="text-sm text-slate-600">
                Nuestro equipo de coordinación clínica responderá en menos de 2 horas hábiles.
              </p>
            </div>

            {errorMsg && (
              <div
                role="alert"
                className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800 font-medium flex items-center gap-2.5"
              >
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {submitted && (
              <div
                role="status"
                className="p-4 bg-[#EBF6FB] border border-[#0086C0]/30 rounded-xl text-sm text-[#0D1B38] font-medium flex items-center gap-2.5"
              >
                <CheckCircle2 className="h-4 w-4 text-[#0086C0] shrink-0" />
                <span>Mensaje enviado con éxito. Te contactaremos a la brevedad.</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label htmlFor="contact-name" className="block text-xs font-semibold text-[#0D1B38]">
                  Nombre completo
                </label>
                <input
                  id="contact-name"
                  type="text"
                  required
                  placeholder="Ej. Camila Rojas"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-[#0D1B38] focus:outline-none focus:border-[#0086C0] focus:ring-1 focus:ring-[#0086C0]"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="contact-rut" className="block text-xs font-semibold text-[#0D1B38]">
                  RUT chileno (opcional)
                </label>
                <input
                  id="contact-rut"
                  type="text"
                  placeholder="12.345.678-9"
                  value={rut}
                  onChange={(e) => setRut(formatRut(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-[#0D1B38] tabular-nums focus:outline-none focus:border-[#0086C0] focus:ring-1 focus:ring-[#0086C0]"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="contact-email" className="block text-xs font-semibold text-[#0D1B38]">
                  Correo electrónico
                </label>
                <input
                  id="contact-email"
                  type="email"
                  required
                  placeholder="camila@correo.cl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-[#0D1B38] focus:outline-none focus:border-[#0086C0] focus:ring-1 focus:ring-[#0086C0]"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="contact-phone" className="block text-xs font-semibold text-[#0D1B38]">
                  Teléfono
                </label>
                <input
                  id="contact-phone"
                  type="tel"
                  required
                  placeholder="+56 9 8765 4321"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-[#0D1B38] tabular-nums focus:outline-none focus:border-[#0086C0] focus:ring-1 focus:ring-[#0086C0]"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label htmlFor="contact-subject" className="block text-xs font-semibold text-[#0D1B38]">
                  Motivo de consulta
                </label>
                <select
                  id="contact-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-[#0D1B38] focus:outline-none focus:border-[#0086C0] focus:ring-1 focus:ring-[#0086C0]"
                >
                  <option value="Evaluación general">Evaluación clínica general</option>
                  <option value="Presupuesto de tratamiento">Presupuesto de tratamiento</option>
                  <option value="Reprogramación de cita">Reprogramación o consulta de cita</option>
                  <option value="Urgencia dental">Urgencia odontológica</option>
                </select>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label htmlFor="contact-message" className="block text-xs font-semibold text-[#0D1B38]">
                  Mensaje
                </label>
                <textarea
                  id="contact-message"
                  rows={4}
                  required
                  placeholder="Cuéntanos en qué podemos ayudarte..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-[#0D1B38] focus:outline-none focus:border-[#0086C0] focus:ring-1 focus:ring-[#0086C0]"
                />
              </div>

              <div className="sm:col-span-2">
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#0D1B38] hover:bg-[#0086C0] text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  <Send className="h-4 w-4" />
                  <span>Enviar Consulta</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
