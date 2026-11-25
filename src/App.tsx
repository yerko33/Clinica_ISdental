import React, { useState, useEffect } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  serverTimestamp
} from "firebase/firestore";
import Header from "./components/Header";
import Hero from "./components/Hero";
import AboutUs from "./components/AboutUs";
import Specialties from "./components/Specialties";
import ProfessionalsPage from "./components/ProfessionalsPage";
import ContactPage from "./components/ContactPage";
import ClinicManagementPortal from "./components/ClinicManagementPortal";
import MyReservations from "./components/MyReservations";
import AppointmentWizard from "./components/AppointmentWizard";
import {
  Appointment,
  Doctor,
  DoctorSchedule,
  SpecialtyItem,
  Testimonial
} from "./types";
import {
  DEFAULT_SPECIALTIES,
  INITIAL_DOCTORS,
  INITIAL_TESTIMONIALS,
  resolveClinicImage,
  slugifyId
} from "./data";
import { normalizeRut } from "./utils/rut";
import {
  auth,
  db,
  getUserRoles,
  OperationType,
  handleFirestoreError
} from "./firebase";
import {
  Star,
  MapPin,
  Clock,
  Phone,
  Send,
  CheckCircle2,
  ArrowRight,
  Lock
} from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("inicio");

  const [prefilledTreatmentId, setPrefilledTreatmentId] = useState<string>("");
  const [prefilledSpecialtyName, setPrefilledSpecialtyName] = useState<string>("");
  const [prefilledDoctorId, setPrefilledDoctorId] = useState<string>("");

  // Firebase Auth & RBAC Roles state
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isRecepcionista, setIsRecepcionista] = useState<boolean>(false);

  // Live Specialties & Professionals synced with Firestore
  const [specialties, setSpecialties] = useState<SpecialtyItem[]>(DEFAULT_SPECIALTIES);
  const [doctors, setDoctors] = useState<Doctor[]>(INITIAL_DOCTORS);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [queriedRut, setQueriedRut] = useState<string>("");
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);

  const [reviewName, setReviewName] = useState<string>("");
  const [reviewText, setReviewText] = useState<string>("");
  const [reviewTreatment, setReviewTreatment] = useState<string>("");
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewSuccess, setReviewSuccess] = useState<boolean>(false);

  // Auth listener & role verification
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setAuthUser(user);
      if (user) {
        const roles = await getUserRoles(user);
        setIsAdmin(roles.isAdmin);
        setIsRecepcionista(roles.isRecepcionista);
      } else {
        setIsAdmin(false);
        setIsRecepcionista(false);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Live Firestore subscription for specialties
  useEffect(() => {
    const path = "specialties";
    const unsubscribe = onSnapshot(
      collection(db, path),
      (snapshot) => {
        const customMap = new Map<string, SpecialtyItem>();
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data?.name) {
            const id = String(data.id || docSnap.id);
            customMap.set(id, {
              id,
              name: String(data.name),
              description: String(data.description || ""),
              isDefault: DEFAULT_SPECIALTIES.some((d) => d.id === id)
            });
          }
        });

        const mergedDefaults = DEFAULT_SPECIALTIES.map((def) =>
          customMap.has(def.id) ? { ...customMap.get(def.id)!, isDefault: true } : def
        );
        const addedCustom = Array.from(customMap.values()).filter(
          (item) => !DEFAULT_SPECIALTIES.some((def) => def.id === item.id)
        );
        setSpecialties([...mergedDefaults, ...addedCustom]);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );

    return () => unsubscribe();
  }, []);

  // Live Firestore subscription for professionals
  useEffect(() => {
    const path = "professionals";
    const unsubscribe = onSnapshot(
      collection(db, path),
      (snapshot) => {
        const cloudMap = new Map<string, Doctor>();
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data?.name && data?.schedule) {
            const id = String(data.id || docSnap.id);
            cloudMap.set(id, {
              id,
              name: String(data.name),
              specialty: String(data.specialty || "Odontología General"),
              experienceYears: Number(data.experienceYears ?? 5),
              image: resolveClinicImage(
                typeof data.image === "string" ? data.image : undefined
              ),
              bio: String(data.bio || ""),
              education: String(data.education || ""),
              rating: Number(data.rating ?? 5.0),
              schedule: data.schedule as DoctorSchedule,
              isDefault: INITIAL_DOCTORS.some((d) => d.id === id)
            });
          }
        });

        const mergedInitials = INITIAL_DOCTORS.map((def) =>
          cloudMap.has(def.id) ? { ...cloudMap.get(def.id)!, isDefault: true } : def
        );
        const addedProfessionals = Array.from(cloudMap.values()).filter(
          (docItem) => !INITIAL_DOCTORS.some((def) => def.id === docItem.id)
        );
        setDoctors([...mergedInitials, ...addedProfessionals]);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );

    return () => unsubscribe();
  }, []);

  // Load local patient appointments and testimonials
  useEffect(() => {
    const savedAppts = localStorage.getItem("is_dental_appointments");
    if (savedAppts) {
      try {
        setAppointments(JSON.parse(savedAppts));
      } catch (err) {
        console.error("Error parsing appointments", err);
      }
    }

    const savedReviews = localStorage.getItem("is_dental_testimonials");
    if (savedReviews) {
      try {
        setTestimonials(JSON.parse(savedReviews));
      } catch (err) {
        console.error("Error parsing testimonials", err);
        setTestimonials(INITIAL_TESTIMONIALS);
      }
    } else {
      setTestimonials(INITIAL_TESTIMONIALS);
      localStorage.setItem("is_dental_testimonials", JSON.stringify(INITIAL_TESTIMONIALS));
    }
  }, []);

  const handleSaveProfessional = async (doctor: Doctor) => {
    if (!auth.currentUser || !isAdmin) {
      throw new Error("Se requieren permisos de administrador para guardar profesionales.");
    }
    const docPath = `professionals/${doctor.id}`;
    try {
      await setDoc(doc(db, "professionals", doctor.id), {
        id: doctor.id.slice(0, 64),
        name: doctor.name.trim().slice(0, 120),
        specialty: doctor.specialty.trim().slice(0, 100),
        experienceYears: Math.min(70, Math.max(0, Number(doctor.experienceYears) || 0)),
        image: doctor.image.trim().slice(0, 500),
        bio: doctor.bio.trim().slice(0, 1000),
        education: doctor.education.trim().slice(0, 500),
        rating: Math.min(5, Math.max(1, Number(doctor.rating) || 5)),
        schedule: doctor.schedule,
        updatedBy: auth.currentUser.uid,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, docPath);
    }
  };

  const handleDeleteProfessional = async (doctorId: string) => {
    if (!auth.currentUser || !isAdmin) {
      throw new Error("Se requieren permisos de administrador para eliminar profesionales.");
    }
    const docPath = `professionals/${doctorId}`;
    try {
      await deleteDoc(doc(db, "professionals", doctorId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, docPath);
    }
  };

  const handleResetSchedules = async () => {
    if (!auth.currentUser || !isAdmin) {
      throw new Error("Se requieren permisos de administrador para restablecer horarios.");
    }
    for (const initialDoc of INITIAL_DOCTORS) {
      const docPath = `professionals/${initialDoc.id}`;
      try {
        await setDoc(doc(db, "professionals", initialDoc.id), {
          id: initialDoc.id,
          name: initialDoc.name,
          specialty: initialDoc.specialty,
          experienceYears: initialDoc.experienceYears,
          image: initialDoc.image,
          bio: initialDoc.bio,
          education: initialDoc.education,
          rating: initialDoc.rating,
          schedule: initialDoc.schedule,
          updatedBy: auth.currentUser.uid,
          updatedAt: serverTimestamp()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, docPath);
      }
    }
  };

  const handleAddSpecialty = async (name: string, description: string) => {
    if (!auth.currentUser || !isAdmin) {
      throw new Error("Se requieren permisos de administrador para agregar especialidades.");
    }
    const baseSlug = slugifyId(name) || `esp-${Date.now()}`;
    const id = specialties.some((s) => s.id === baseSlug)
      ? `${baseSlug}-${Date.now().toString().slice(-4)}`
      : baseSlug;
    const docPath = `specialties/${id}`;
    try {
      await setDoc(doc(db, "specialties", id), {
        id: id.slice(0, 64),
        name: name.trim().slice(0, 100),
        description: description.trim().slice(0, 400),
        createdBy: auth.currentUser.uid,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, docPath);
    }
  };

  const handleDeleteSpecialty = async (specialtyId: string) => {
    if (!auth.currentUser || !isAdmin) {
      throw new Error("Se requieren permisos de administrador para eliminar especialidades.");
    }
    const docPath = `specialties/${specialtyId}`;
    try {
      await deleteDoc(doc(db, "specialties", specialtyId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, docPath);
    }
  };

  const handleAppointmentCreated = (newAppointment: Appointment) => {
    const updated = [newAppointment, ...appointments];
    setAppointments(updated);
    localStorage.setItem("is_dental_appointments", JSON.stringify(updated));
    setPrefilledTreatmentId("");
    setPrefilledSpecialtyName("");
    setPrefilledDoctorId("");
  };

  const handleCancelAppointment = (id: string) => {
    const updated = appointments.map((apt) =>
      apt.id === id ? { ...apt, status: "cancelada" as const } : apt
    );
    setAppointments(updated);
    localStorage.setItem("is_dental_appointments", JSON.stringify(updated));
  };

  const handleSelectTreatmentFromSpecialties = (
    treatmentId: string,
    specialtyName?: string
  ) => {
    setPrefilledTreatmentId(treatmentId);
    setPrefilledSpecialtyName(specialtyName || "");
    setPrefilledDoctorId("");
    setActiveTab("reserva");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBookWithDoctor = (doctorId: string) => {
    setPrefilledDoctorId(doctorId);
    setPrefilledTreatmentId("");
    setPrefilledSpecialtyName("");
    setActiveTab("reserva");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewName.trim() || !reviewText.trim()) return;

    const newReview: Testimonial = {
      id: "rev-" + Date.now(),
      name: reviewName.trim(),
      treatment: reviewTreatment.trim() || "Atención Odontológica",
      text: reviewText.trim(),
      rating: reviewRating,
      date: new Date().toISOString().split("T")[0],
      verified: true
    };

    const updated = [newReview, ...testimonials];
    setTestimonials(updated);
    localStorage.setItem("is_dental_testimonials", JSON.stringify(updated));

    setReviewName("");
    setReviewText("");
    setReviewTreatment("");
    setReviewRating(5);
    setReviewSuccess(true);
    setTimeout(() => setReviewSuccess(false), 4000);
  };

  const navigateTo = (tab: string) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const pillars = [
    {
      num: "01.",
      tag: "CAD/CAM & Escaneo 3D",
      title: "Planificación Digital Predictiva",
      description:
        "Modelamos tu sonrisa mediante escaneo intraoral óptico de alta resolución, permitiéndote visualizar el diseño final antes de iniciar cualquier intervención."
    },
    {
      num: "02.",
      tag: "Láser Clínico",
      title: "Intervenciones Mínimamente Invasivas",
      description:
        "Aplicamos tecnología láser de diodo y Er,Cr:YSGG en periodoncia y cirugía blanda para reducir sangrado, prescindir de suturas y acelerar la recuperación."
    },
    {
      num: "03.",
      tag: "Biomateriales",
      title: "Porcelana Feldespática Biocompatible",
      description:
        "Trabajamos con cerámicas prensadas de alta resistencia óptica que replican la translucidez natural del esmalte dental con mínima preparación."
    }
  ];

  return (
    <div className="bg-[#F8FAFC] min-h-screen flex flex-col font-sans antialiased text-slate-800">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-grow">
        {activeTab === "inicio" && (
          <div>
            <Hero
              onBookNow={() => {
                setPrefilledTreatmentId("");
                setPrefilledSpecialtyName("");
                setPrefilledDoctorId("");
                navigateTo("reserva");
              }}
              onViewSpecialties={() => navigateTo("especialidades")}
            />

            {/* Capabilities Section */}
            <section className="py-16 lg:py-20 bg-[#F8FAFC]">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                  <div className="max-w-2xl space-y-2">
                    <p className="text-sm font-medium text-[#0086C0]">
                      Metodología Clínica
                    </p>
                    <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[#0D1B38] tracking-tight text-balance">
                      Tecnología aplicada al cuidado dental de precisión
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigateTo("especialidades")}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0D1B38] hover:text-[#0086C0] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <span>Ver catálogo de tratamientos</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-5 bg-[#0D1B38] text-white rounded-2xl p-8 flex flex-col justify-between space-y-8">
                    <div className="space-y-3">
                      <p className="text-xs font-medium text-[#7DD3FC]">
                        {pillars[0].num} {pillars[0].tag}
                      </p>
                      <h3 className="font-display text-2xl font-bold text-white leading-snug">
                        {pillars[0].title}
                      </h3>
                      <p className="text-sm text-slate-300 leading-relaxed tracking-[0.01em]">
                        {pillars[0].description}
                      </p>
                    </div>
                    <div className="pt-6 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
                      <span>Sin moldes tradicionales</span>
                      <span className="font-semibold text-[#7DD3FC]">Escáner Intraoral 3D</span>
                    </div>
                  </div>

                  <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {pillars.slice(1).map((p) => (
                      <div
                        key={p.num}
                        className="bg-white border border-slate-200 rounded-2xl p-7 flex flex-col justify-between space-y-5"
                      >
                        <div className="space-y-3">
                          <p className="text-xs font-medium text-[#0086C0]">
                            {p.num} {p.tag}
                          </p>
                          <h3 className="font-display text-xl font-bold text-[#0D1B38] leading-snug">
                            {p.title}
                          </h3>
                          <p className="text-sm text-slate-600 leading-relaxed">
                            {p.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Testimonials & Review Submission */}
            <section className="py-16 lg:py-20 bg-white border-y border-slate-200">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                  <div className="lg:col-span-7 space-y-6">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-[#0086C0]">
                        Experiencia de Pacientes
                      </p>
                      <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[#0D1B38] tracking-tight">
                        Testimonios Verificados
                      </h2>
                    </div>

                    <div className="divide-y divide-slate-200 border border-slate-200 rounded-2xl bg-[#F8FAFC]">
                      {testimonials.map((test) => (
                        <article key={test.id} className="p-6 space-y-3">
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <h4 className="font-display font-bold text-[#0D1B38] text-sm">
                                {test.name}
                              </h4>
                              <p className="text-xs text-[#0086C0] font-medium mt-0.5">
                                {test.treatment}
                                <span className="text-slate-400 mx-1.5" aria-hidden="true">·</span>
                                <span className="text-slate-500 tabular-nums">{test.date}</span>
                              </p>
                            </div>

                            <div className="flex items-center gap-0.5 shrink-0" aria-label={`Calificación ${test.rating} de 5`}>
                              {Array.from({ length: test.rating }).map((_, i) => (
                                <Star
                                  key={i}
                                  className="h-3.5 w-3.5 text-[#0086C0] fill-[#0086C0]"
                                />
                              ))}
                            </div>
                          </div>

                          <p className="text-sm text-slate-600 leading-relaxed">
                            “{test.text}”
                          </p>
                        </article>
                      ))}
                    </div>
                  </div>

                  <div className="lg:col-span-5 bg-[#F8FAFC] border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-5">
                    <div className="space-y-1">
                      <h3 className="font-display text-lg font-bold text-[#0D1B38]">
                        Comparte tu experiencia
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600">
                        ¿Te atendiste en Clínica IS Dental? Tu valoración ayuda a otros pacientes a conocernos.
                      </p>
                    </div>

                    {reviewSuccess && (
                      <div
                        role="status"
                        className="p-3.5 bg-[#EBF6FB] border border-[#0086C0]/30 rounded-xl text-xs sm:text-sm text-[#0D1B38] font-medium flex items-center gap-2"
                      >
                        <CheckCircle2 className="h-4 w-4 text-[#0086C0] shrink-0" />
                        <span>Gracias, tu reseña fue publicada correctamente.</span>
                      </div>
                    )}

                    <form onSubmit={handleAddReview} className="space-y-4">
                      <div className="space-y-1.5">
                        <label htmlFor="review-name" className="block text-xs font-semibold text-[#0D1B38]">
                          Tu nombre
                        </label>
                        <input
                          id="review-name"
                          type="text"
                          required
                          placeholder="Ej. Juan Domínguez"
                          value={reviewName}
                          onChange={(e) => setReviewName(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-[#0D1B38] focus:outline-none focus:border-[#0086C0] focus:ring-1 focus:ring-[#0086C0]"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label htmlFor="review-treatment" className="block text-xs font-semibold text-[#0D1B38]">
                          Tratamiento recibido
                        </label>
                        <input
                          id="review-treatment"
                          type="text"
                          required
                          placeholder="Ej. Carillas de Porcelana o Invisalign"
                          value={reviewTreatment}
                          onChange={(e) => setReviewTreatment(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-[#0D1B38] focus:outline-none focus:border-[#0086C0] focus:ring-1 focus:ring-[#0086C0]"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <span className="block text-xs font-semibold text-[#0D1B38]">
                          Calificación
                        </span>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setReviewRating(star)}
                              aria-label={`${star} estrellas`}
                              className="p-1 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#0086C0] rounded"
                            >
                              <Star
                                className={`h-5 w-5 transition-colors ${
                                  star <= reviewRating
                                    ? "text-[#0086C0] fill-[#0086C0]"
                                    : "text-slate-300"
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label htmlFor="review-text" className="block text-xs font-semibold text-[#0D1B38]">
                          Tu comentario
                        </label>
                        <textarea
                          id="review-text"
                          required
                          rows={3}
                          placeholder="Cuéntanos sobre la atención recibida y los resultados..."
                          value={reviewText}
                          onChange={(e) => setReviewText(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-[#0D1B38] focus:outline-none focus:border-[#0086C0] focus:ring-1 focus:ring-[#0086C0]"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 bg-[#0D1B38] hover:bg-[#0086C0] text-white rounded-lg text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                      >
                        <Send className="h-4 w-4" />
                        <span>Publicar Reseña</span>
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </section>

            {/* Location & Contact Band */}
            <section className="py-12 bg-[#F8FAFC]">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[#0D1B38] font-display font-bold text-sm">
                      <MapPin className="h-4 w-4 text-[#0086C0]" />
                      <h4>Ubicación de la Clínica</h4>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed pl-6">
                      Av. Apoquindo 4500, Piso 5, Las Condes, Santiago. Estacionamiento privado incluido para pacientes.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[#0D1B38] font-display font-bold text-sm">
                      <Clock className="h-4 w-4 text-[#0086C0]" />
                      <h4>Horarios de Atención</h4>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed pl-6 tabular-nums">
                      Lunes a Viernes: 08:30 AM – 19:30 PM<br />
                      Sábados: 08:30 AM – 14:00 PM
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[#0D1B38] font-display font-bold text-sm">
                      <Phone className="h-4 w-4 text-[#0086C0]" />
                      <h4>Contacto Directo</h4>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed pl-6 tabular-nums">
                      Tel: +56 2 2450 8900<br />
                      contacto@clinicaisdental.cl
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === "nosotros" && (
          <AboutUs
            onBookNow={() => {
              setPrefilledTreatmentId("");
              setPrefilledSpecialtyName("");
              setPrefilledDoctorId("");
              navigateTo("reserva");
            }}
            onViewSpecialties={() => navigateTo("especialidades")}
          />
        )}

        {activeTab === "profesionales" && (
          <ProfessionalsPage
            doctors={doctors}
            onBookWithDoctor={handleBookWithDoctor}
          />
        )}

        {activeTab === "especialidades" && (
          <Specialties
            specialties={specialties}
            onSelectTreatment={handleSelectTreatmentFromSpecialties}
          />
        )}

        {activeTab === "contacto" && <ContactPage />}

        {activeTab === "portal-gestion" && (
          <ClinicManagementPortal
            doctors={doctors}
            specialties={specialties}
            user={authUser}
            authLoading={authLoading}
            isAdmin={isAdmin}
            isRecepcionista={isRecepcionista}
            onSaveProfessional={handleSaveProfessional}
            onDeleteProfessional={handleDeleteProfessional}
            onResetSchedules={handleResetSchedules}
            onAddSpecialty={handleAddSpecialty}
            onDeleteSpecialty={handleDeleteSpecialty}
            onBackToSite={() => navigateTo("inicio")}
          />
        )}

        {activeTab === "reserva" && (
          <AppointmentWizard
            specialties={specialties}
            doctors={doctors}
            existingAppointments={appointments}
            prefilledTreatmentId={prefilledTreatmentId}
            prefilledSpecialtyName={prefilledSpecialtyName}
            prefilledDoctorId={prefilledDoctorId}
            onAppointmentCreated={handleAppointmentCreated}
            onNavigateToReservations={(rut) => {
              setQueriedRut(normalizeRut(rut));
              navigateTo("citas");
            }}
          />
        )}

        {activeTab === "citas" && (
          <MyReservations
            appointments={appointments}
            doctors={doctors}
            activeQueriedRut={queriedRut}
            onSetQueriedRut={setQueriedRut}
            onCancelAppointment={handleCancelAppointment}
            onNavigateToBooking={() => {
              setPrefilledDoctorId("");
              setPrefilledTreatmentId("");
              setPrefilledSpecialtyName("");
              navigateTo("reserva");
            }}
          />
        )}
      </main>

      {/* Quiet Corporate Navy Footer (exclusive entry point to Management Portal & Mis Citas) */}
      <footer className="bg-[#081226] text-slate-300 py-12 border-t border-[#162B54]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6 pb-6 border-b border-white/10">
            <div className="text-center sm:text-left">
              <p className="font-display font-bold text-white text-base tracking-tight">
                Clínica <span className="text-[#38BDF8]">IS</span> Dental
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Odontología Especializada & Tecnología Digital 3D
              </p>
            </div>

            <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs sm:text-sm text-slate-300" aria-label="Navegación pie de página">
              <button type="button" onClick={() => navigateTo("inicio")} className="hover:text-white transition-colors cursor-pointer">
                Inicio
              </button>
              <button type="button" onClick={() => navigateTo("profesionales")} className="hover:text-white transition-colors cursor-pointer">
                Profesionales
              </button>
              <button type="button" onClick={() => navigateTo("especialidades")} className="hover:text-white transition-colors cursor-pointer">
                Especialidades
              </button>
              <button type="button" onClick={() => navigateTo("nosotros")} className="hover:text-white transition-colors cursor-pointer">
                Nosotros
              </button>
              <button type="button" onClick={() => navigateTo("contacto")} className="hover:text-white transition-colors cursor-pointer">
                Contacto
              </button>
              <button type="button" onClick={() => navigateTo("citas")} className="text-[#7DD3FC] hover:text-white transition-colors cursor-pointer font-medium">
                Mis Citas
              </button>
            </nav>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-400 text-center sm:text-left">
            <p>
              © {new Date().getFullYear()} Clínica IS Dental · Av. Apoquindo 4500, Piso 5, Las Condes, Santiago
            </p>
            <button
              type="button"
              id="footer-admin-portal-btn"
              onClick={() => navigateTo("portal-gestion")}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-[#7DD3FC] transition-colors cursor-pointer"
            >
              <Lock className="h-3.5 w-3.5" />
              <span>Portal de Gestión Clínica</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
