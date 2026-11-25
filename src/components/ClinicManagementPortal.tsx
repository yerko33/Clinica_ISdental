import React, { useState, useEffect, useMemo } from "react";
import { User } from "firebase/auth";
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from "firebase/firestore";
import {
  Appointment,
  AppointmentStatus,
  Doctor,
  DayOfWeek,
  DoctorSchedule,
  SpecialtyItem,
  StaffRoleRecord
} from "../types";
import {
  DAYS_OF_WEEK,
  ALL_TIME_SLOTS,
  MORNING_SLOTS,
  AFTERNOON_SLOTS,
  DEFAULT_WEEKLY_SCHEDULE,
  DOCTOR_PORTRAIT_OPTIONS,
  getDoctorActiveDays,
  slugifyId
} from "../data";
import { formatRut } from "../utils/rut";
import {
  db,
  OperationType,
  handleFirestoreError,
  signInAdminWithGoogle,
  signOutAdmin,
  ADMIN_BOOTSTRAP_EMAIL
} from "../firebase";
import {
  CheckCircle2,
  RotateCcw,
  Calendar,
  Clock,
  Save,
  Lock,
  LogOut,
  ShieldAlert,
  ArrowLeft,
  UserPlus,
  Trash2,
  AlertCircle,
  Users,
  Stethoscope,
  ClipboardList,
  ShieldCheck,
  Search,
  Plus
} from "lucide-react";

type PortalTab = "horarios" | "profesionales" | "especialidades" | "citas" | "permisos";

interface ClinicManagementPortalProps {
  doctors: Doctor[];
  specialties: SpecialtyItem[];
  user: User | null;
  authLoading: boolean;
  isAdmin: boolean;
  isRecepcionista: boolean;
  onSaveProfessional: (doctor: Doctor) => Promise<void>;
  onDeleteProfessional: (doctorId: string) => Promise<void>;
  onResetSchedules: () => Promise<void>;
  onAddSpecialty: (name: string, description: string) => Promise<void>;
  onDeleteSpecialty: (specialtyId: string) => Promise<void>;
  onBackToSite: () => void;
}

export default function ClinicManagementPortal({
  doctors,
  specialties,
  user,
  authLoading,
  isAdmin,
  isRecepcionista,
  onSaveProfessional,
  onDeleteProfessional,
  onResetSchedules,
  onAddSpecialty,
  onDeleteSpecialty,
  onBackToSite
}: ClinicManagementPortalProps) {
  const [activePortalTab, setActivePortalTab] = useState<PortalTab>(
    isAdmin ? "horarios" : "citas"
  );

  // Sync default tab when roles load
  useEffect(() => {
    if (isAdmin && !isRecepcionista && activePortalTab === "citas") {
      setActivePortalTab("horarios");
    } else if (!isAdmin && isRecepcionista && activePortalTab !== "citas") {
      setActivePortalTab("citas");
    }
  }, [isAdmin, isRecepcionista, activePortalTab]);

  // Schedule editor state
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(doctors[0]?.id || "");
  const [draftSchedule, setDraftSchedule] = useState<DoctorSchedule | null>(null);
  const [saveMessage, setSaveMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string>("");
  const [signingIn, setSigningIn] = useState<boolean>(false);

  // Add new professional form state
  const [newDocName, setNewDocName] = useState<string>("");
  const [newDocSpecialty, setNewDocSpecialty] = useState<string>(specialties[0]?.name || "");
  const [newDocExp, setNewDocExp] = useState<number>(5);
  const [newDocEducation, setNewDocEducation] = useState<string>("");
  const [newDocBio, setNewDocBio] = useState<string>("");
  const [newDocImage, setNewDocImage] = useState<string>(DOCTOR_PORTRAIT_OPTIONS[0].url);
  const [specialtyEdits, setSpecialtyEdits] = useState<Record<string, string>>({});

  // Add new specialty form state
  const [newSpecName, setNewSpecName] = useState<string>("");
  const [newSpecDesc, setNewSpecDesc] = useState<string>("");

  // Receptionist appointments state
  const [cloudAppointments, setCloudAppointments] = useState<Appointment[]>([]);
  const [aptSearch, setAptSearch] = useState<string>("");
  const [aptStatusFilter, setAptStatusFilter] = useState<string>("ALL");

  // Staff roles management state
  const [staffList, setStaffList] = useState<StaffRoleRecord[]>([]);
  const [newStaffUid, setNewStaffUid] = useState<string>("");
  const [newStaffEmail, setNewStaffEmail] = useState<string>("");
  const [newStaffIsAdmin, setNewStaffIsAdmin] = useState<boolean>(false);
  const [newStaffIsRecep, setNewStaffIsRecep] = useState<boolean>(true);
  const [roleActionMsg, setRoleActionMsg] = useState<string>("");

  const activeDoctor = doctors.find((d) => d.id === selectedDoctorId) || doctors[0];

  // Keep specialty dropdown valid when specialties update
  useEffect(() => {
    if (specialties.length > 0 && !specialties.some((s) => s.name === newDocSpecialty)) {
      setNewDocSpecialty(specialties[0].name);
    }
  }, [specialties, newDocSpecialty]);

  // Keep specialty edits map synced with doctors
  useEffect(() => {
    const nextEdits: Record<string, string> = {};
    doctors.forEach((docItem) => {
      nextEdits[docItem.id] = docItem.specialty;
    });
    setSpecialtyEdits(nextEdits);
  }, [doctors]);

  useEffect(() => {
    if (activeDoctor) {
      const cloned: DoctorSchedule = {} as DoctorSchedule;
      DAYS_OF_WEEK.forEach((day) => {
        const current = activeDoctor.schedule[day];
        cloned[day] = {
          enabled: current?.enabled ?? false,
          slots: current?.slots ? [...current.slots] : []
        };
      });
      setDraftSchedule(cloned);
    }
  }, [activeDoctor]);

  // Listen to staffRoles only when signed in as Admin
  useEffect(() => {
    if (!user || !isAdmin) {
      setStaffList([]);
      return;
    }

    const path = "staffRoles";
    const unsubscribe = onSnapshot(
      collection(db, path),
      (snapshot) => {
        const items: StaffRoleRecord[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data?.uid && data?.email) {
            items.push({
              uid: String(data.uid),
              email: String(data.email),
              isAdmin: data.isAdmin === true,
              isRecepcionista: data.isRecepcionista === true
            });
          }
        });
        setStaffList(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );

    return () => unsubscribe();
  }, [user, isAdmin]);

  // Listen to appointments ONLY when signed in with recepcionista permission
  useEffect(() => {
    if (!user || !isRecepcionista) {
      setCloudAppointments([]);
      return;
    }

    const path = "appointments";
    const unsubscribe = onSnapshot(
      collection(db, path),
      (snapshot) => {
        const items: Appointment[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const createdIso =
            typeof data?.createdAt?.toDate === "function"
              ? data.createdAt.toDate().toISOString()
              : typeof data?.createdAt === "string"
              ? data.createdAt
              : "";
          items.push({
            id: String(data.id || docSnap.id),
            patientName: String(data.patientName || ""),
            patientRut: String(data.patientRut || ""),
            patientEmail: String(data.patientEmail || ""),
            patientPhone: String(data.patientPhone || ""),
            treatmentId: String(data.treatmentId || ""),
            treatmentName: String(data.treatmentName || ""),
            doctorId: String(data.doctorId || ""),
            doctorName: String(data.doctorName || ""),
            date: String(data.date || ""),
            timeSlot: String(data.timeSlot || ""),
            status: (data.status as AppointmentStatus) || "confirmada",
            notes: typeof data.notes === "string" ? data.notes : "",
            createdAt: createdIso
          });
        });

        items.sort((a, b) => {
          if (a.date !== b.date) return b.date.localeCompare(a.date);
          return b.createdAt.localeCompare(a.createdAt);
        });
        setCloudAppointments(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );

    return () => unsubscribe();
  }, [user, isRecepcionista]);

  const filteredAppointments = useMemo(() => {
    const q = aptSearch.trim().toLowerCase();
    return cloudAppointments.filter((apt) => {
      if (aptStatusFilter !== "ALL" && apt.status !== aptStatusFilter) return false;
      if (!q) return true;
      return (
        apt.patientName.toLowerCase().includes(q) ||
        apt.patientRut.toLowerCase().includes(q) ||
        formatRut(apt.patientRut).toLowerCase().includes(q) ||
        (apt.doctorName || "").toLowerCase().includes(q) ||
        (apt.treatmentName || "").toLowerCase().includes(q) ||
        apt.id.toLowerCase().includes(q)
      );
    });
  }, [cloudAppointments, aptSearch, aptStatusFilter]);

  const handleGoogleLogin = async () => {
    setAuthError("");
    setSigningIn(true);
    try {
      await signInAdminWithGoogle();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "No se pudo iniciar sesión.";
      if (!msg.includes("popup-closed-by-user")) {
        setAuthError("Error al autenticar con Google. Inténtalo nuevamente.");
      }
    } finally {
      setSigningIn(false);
    }
  };

  const handleLogout = async () => {
    setAuthError("");
    await signOutAdmin();
  };

  if (authLoading) {
    return (
      <section className="py-20 bg-[#F8FAFC] min-h-[70vh] flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-sm font-semibold text-[#0D1B38]">
            Verificando permisos de acceso...
          </p>
          <p className="text-xs text-slate-500">Clínica IS Dental</p>
        </div>
      </section>
    );
  }

  // Gate 1: Not Signed In
  if (!user) {
    return (
      <section className="py-16 lg:py-24 bg-[#F8FAFC] min-h-[75vh] flex items-center">
        <div className="max-w-md mx-auto w-full px-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-8 space-y-6 text-center">
            <div className="mx-auto w-12 h-12 rounded-xl bg-[#0D1B38] text-[#7DD3FC] flex items-center justify-center">
              <Lock className="h-6 w-6" />
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-[#0086C0]">
                Acceso Restringido al Personal
              </p>
              <h1 className="font-display text-2xl font-bold text-[#0D1B38]">
                Portal de Gestión Clínica
              </h1>
              <p className="text-sm text-slate-600 leading-relaxed">
                Inicia sesión con tu cuenta autorizada de administrador o recepcionista para gestionar profesionales, especialidades, horarios y citas clínicas.
              </p>
            </div>

            {authError && (
              <div
                role="alert"
                className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 font-medium flex items-center gap-2 text-left"
              >
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="button"
              id="admin-google-login-btn"
              disabled={signingIn}
              onClick={handleGoogleLogin}
              className="w-full py-3 px-4 bg-[#0D1B38] hover:bg-[#0086C0] disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
            >
              {signingIn ? "Conectando..." : "Iniciar Sesión con Google"}
            </button>

            <button
              type="button"
              onClick={onBackToSite}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#0D1B38] transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Volver al sitio público</span>
            </button>
          </div>
        </div>
      </section>
    );
  }

  // Gate 2: Signed In, Neither Admin nor Recepcionista
  if (!isAdmin && !isRecepcionista) {
    return (
      <section className="py-16 lg:py-24 bg-[#F8FAFC] min-h-[75vh] flex items-center">
        <div className="max-w-md mx-auto w-full px-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-8 space-y-6 text-center">
            <div className="mx-auto w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <ShieldAlert className="h-6 w-6" />
            </div>

            <div className="space-y-2">
              <h1 className="font-display text-xl font-bold text-[#0D1B38]">
                Cuenta sin permisos asignados
              </h1>
              <p className="text-sm text-slate-600 leading-relaxed">
                La cuenta <strong className="text-[#0D1B38]">{user.email}</strong> no tiene rol de administrador ni permiso de recepcionista autorizado.
              </p>
              <p className="text-xs text-slate-400 font-mono break-all">
                UID: {user.uid}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full py-2.5 px-4 bg-[#0D1B38] hover:bg-[#162B54] text-white text-sm font-semibold rounded-lg inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span>Cerrar Sesión</span>
              </button>
              <button
                type="button"
                onClick={onBackToSite}
                className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#0D1B38] transition-colors cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Volver al sitio público</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const clearAlerts = () => {
    setSaveMessage("");
    setErrorMessage("");
  };

  // Schedule helpers
  const toggleDayEnabled = (day: DayOfWeek) => {
    clearAlerts();
    setDraftSchedule((prev) => {
      if (!prev) return prev;
      const nextEnabled = !prev[day].enabled;
      return {
        ...prev,
        [day]: {
          enabled: nextEnabled,
          slots:
            nextEnabled && prev[day].slots.length === 0
              ? [...MORNING_SLOTS]
              : prev[day].slots
        }
      };
    });
  };

  const toggleSlot = (day: DayOfWeek, slot: string) => {
    clearAlerts();
    setDraftSchedule((prev) => {
      if (!prev) return prev;
      const currentSlots = prev[day].slots;
      const exists = currentSlots.includes(slot);
      const updatedSlots = exists
        ? currentSlots.filter((s) => s !== slot)
        : ALL_TIME_SLOTS.filter((s) => s === slot || currentSlots.includes(s));

      return {
        ...prev,
        [day]: {
          enabled: updatedSlots.length > 0 ? true : prev[day].enabled,
          slots: updatedSlots
        }
      };
    });
  };

  const applyDayPreset = (day: DayOfWeek, preset: "all" | "morning" | "afternoon" | "none") => {
    clearAlerts();
    setDraftSchedule((prev) => {
      if (!prev) return prev;
      if (preset === "none") {
        return { ...prev, [day]: { enabled: false, slots: [] } };
      }
      const slots =
        preset === "all"
          ? [...ALL_TIME_SLOTS]
          : preset === "morning"
          ? [...MORNING_SLOTS]
          : [...AFTERNOON_SLOTS];
      return { ...prev, [day]: { enabled: true, slots } };
    });
  };

  const handleSaveSchedule = async () => {
    if (!activeDoctor || !draftSchedule) return;
    setSaving(true);
    clearAlerts();
    try {
      await onSaveProfessional({
        ...activeDoctor,
        schedule: draftSchedule
      });
      setSaveMessage(
        `Horarios de ${activeDoctor.name} guardados y sincronizados con las reservas.`
      );
      setTimeout(() => setSaveMessage(""), 5000);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "No se pudieron guardar los horarios."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setSaving(true);
    clearAlerts();
    try {
      await onResetSchedules();
      setSaveMessage("Horarios base restablecidos correctamente.");
      setTimeout(() => setSaveMessage(""), 5000);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "No se pudieron restablecer los horarios."
      );
    } finally {
      setSaving(false);
    }
  };

  // Add new professional
  const handleCreateProfessional = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAlerts();
    const cleanName = newDocName.trim();
    if (cleanName.length < 2) {
      setErrorMessage("Ingresa el nombre completo del profesional.");
      return;
    }
    if (!newDocSpecialty) {
      setErrorMessage("Selecciona una especialidad para el profesional.");
      return;
    }

    const baseId = slugifyId(cleanName) || "prof";
    const id = doctors.some((d) => d.id === baseId)
      ? `${baseId}-${Date.now().toString().slice(-4)}`
      : baseId;

    const newDoctor: Doctor = {
      id,
      name: cleanName.slice(0, 120),
      specialty: newDocSpecialty.slice(0, 100),
      experienceYears: Math.min(70, Math.max(0, Number(newDocExp) || 1)),
      image: newDocImage.trim().slice(0, 500) || DOCTOR_PORTRAIT_OPTIONS[0].url,
      bio:
        newDocBio.trim().slice(0, 1000) ||
        `Especialista en ${newDocSpecialty} dedicado a la atención clínica odontológica de precisión.`,
      education:
        newDocEducation.trim().slice(0, 500) ||
        `Cirujano Dentista · Especialidad en ${newDocSpecialty}`,
      rating: 5.0,
      schedule: {
        Lunes: { ...DEFAULT_WEEKLY_SCHEDULE.Lunes, slots: [...DEFAULT_WEEKLY_SCHEDULE.Lunes.slots] },
        Martes: { ...DEFAULT_WEEKLY_SCHEDULE.Martes, slots: [...DEFAULT_WEEKLY_SCHEDULE.Martes.slots] },
        Miércoles: { ...DEFAULT_WEEKLY_SCHEDULE.Miércoles, slots: [...DEFAULT_WEEKLY_SCHEDULE.Miércoles.slots] },
        Jueves: { ...DEFAULT_WEEKLY_SCHEDULE.Jueves, slots: [...DEFAULT_WEEKLY_SCHEDULE.Jueves.slots] },
        Viernes: { ...DEFAULT_WEEKLY_SCHEDULE.Viernes, slots: [...DEFAULT_WEEKLY_SCHEDULE.Viernes.slots] },
        Sábado: { ...DEFAULT_WEEKLY_SCHEDULE.Sábado, slots: [...DEFAULT_WEEKLY_SCHEDULE.Sábado.slots] }
      }
    };

    setSaving(true);
    try {
      await onSaveProfessional(newDoctor);
      setSelectedDoctorId(newDoctor.id);
      setNewDocName("");
      setNewDocEducation("");
      setNewDocBio("");
      setNewDocExp(5);
      setSaveMessage(
        `${newDoctor.name} fue agregado en la especialidad ${newDoctor.specialty}. Puedes ajustar sus horarios en la pestaña Horarios.`
      );
      setTimeout(() => setSaveMessage(""), 5000);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "No se pudo agregar al profesional."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleAssignSpecialtyToDoctor = async (docItem: Doctor) => {
    clearAlerts();
    const targetSpecialty = specialtyEdits[docItem.id];
    if (!targetSpecialty) return;
    setSaving(true);
    try {
      await onSaveProfessional({
        ...docItem,
        specialty: targetSpecialty
      });
      setSaveMessage(`Especialidad de ${docItem.name} actualizada a ${targetSpecialty}.`);
      setTimeout(() => setSaveMessage(""), 4000);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "No se pudo actualizar la especialidad."
      );
    } finally {
      setSaving(false);
    }
  };

  // Add new specialty
  const handleCreateSpecialty = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAlerts();
    const cleanName = newSpecName.trim();
    if (cleanName.length < 2) {
      setErrorMessage("El nombre de la especialidad debe tener al menos 2 caracteres.");
      return;
    }
    if (specialties.some((s) => s.name.toLowerCase() === cleanName.toLowerCase())) {
      setErrorMessage("Ya existe una especialidad con ese nombre.");
      return;
    }

    setSaving(true);
    try {
      await onAddSpecialty(cleanName, newSpecDesc.trim());
      setNewSpecName("");
      setNewSpecDesc("");
      setSaveMessage(`Especialidad "${cleanName}" agregada al catálogo clínico.`);
      setTimeout(() => setSaveMessage(""), 4000);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "No se pudo crear la especialidad."
      );
    } finally {
      setSaving(false);
    }
  };

  // Receptionist appointment status update
  const handleUpdateAppointmentStatus = async (aptId: string, nextStatus: AppointmentStatus) => {
    clearAlerts();
    const path = `appointments/${aptId}`;
    try {
      await updateDoc(doc(db, "appointments", aptId), {
        status: nextStatus
      });
      setSaveMessage(`Cita ${aptId} actualizada a estado "${nextStatus}".`);
      setTimeout(() => setSaveMessage(""), 3500);
    } catch (err) {
      setErrorMessage("No se pudo actualizar el estado de la cita.");
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  // Staff role management
  const handleAddStaffRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setRoleActionMsg("");
    clearAlerts();
    const uid = newStaffUid.trim();
    const email = newStaffEmail.trim();
    if (!/^[a-zA-Z0-9_\-]+$/.test(uid)) {
      setErrorMessage("El UID solo puede contener letras, números, guiones y guiones bajos.");
      return;
    }
    if (!email.includes("@")) {
      setErrorMessage("Ingresa un correo electrónico válido.");
      return;
    }
    if (!newStaffIsAdmin && !newStaffIsRecep) {
      setErrorMessage("Selecciona al menos un permiso (Administrador o Recepcionista).");
      return;
    }

    const existingRole = staffList.find((s) => s.uid === uid);
    const path = `staffRoles/${uid}`;
    try {
      if (existingRole) {
        await updateDoc(doc(db, "staffRoles", uid), {
          email,
          isAdmin: newStaffIsAdmin,
          isRecepcionista: newStaffIsRecep,
          updatedAt: serverTimestamp()
        });
      } else {
        await setDoc(doc(db, "staffRoles", uid), {
          uid,
          email,
          isAdmin: newStaffIsAdmin,
          isRecepcionista: newStaffIsRecep,
          addedBy: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      setNewStaffUid("");
      setNewStaffEmail("");
      setRoleActionMsg(`Permisos actualizados para ${email}.`);
      setTimeout(() => setRoleActionMsg(""), 4000);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const handleToggleStaffPermission = async (
    staff: StaffRoleRecord,
    field: "isAdmin" | "isRecepcionista"
  ) => {
    const path = `staffRoles/${staff.uid}`;
    try {
      await updateDoc(doc(db, "staffRoles", staff.uid), {
        email: staff.email,
        isAdmin: field === "isAdmin" ? !staff.isAdmin : staff.isAdmin,
        isRecepcionista:
          field === "isRecepcionista" ? !staff.isRecepcionista : staff.isRecepcionista,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const handleRemoveStaffRole = async (uid: string) => {
    const path = `staffRoles/${uid}`;
    try {
      await deleteDoc(doc(db, "staffRoles", uid));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const totalWeeklySlots = draftSchedule
    ? DAYS_OF_WEEK.reduce((acc, day) => {
        if (!draftSchedule[day].enabled) return acc;
        return acc + draftSchedule[day].slots.length;
      }, 0)
    : 0;

  const activeDaysCount = draftSchedule ? getDoctorActiveDays(draftSchedule).length : 0;

  const roleLabels: string[] = [];
  if (isAdmin) roleLabels.push("Administrador");
  if (isRecepcionista) roleLabels.push("Recepcionista");

  const portalTabs: { id: PortalTab; label: string; icon: React.ReactNode; visible: boolean }[] = [
    {
      id: "horarios",
      label: "Horarios",
      icon: <Clock className="h-4 w-4" />,
      visible: isAdmin
    },
    {
      id: "profesionales",
      label: "Profesionales",
      icon: <Users className="h-4 w-4" />,
      visible: isAdmin
    },
    {
      id: "especialidades",
      label: "Especialidades",
      icon: <Stethoscope className="h-4 w-4" />,
      visible: isAdmin
    },
    {
      id: "citas",
      label: "Citas Ingresadas",
      icon: <ClipboardList className="h-4 w-4" />,
      visible: isRecepcionista
    },
    {
      id: "permisos",
      label: "Permisos y Roles",
      icon: <ShieldCheck className="h-4 w-4" />,
      visible: isAdmin
    }
  ];

  return (
    <section className="py-10 lg:py-14 bg-[#F8FAFC] min-h-[75vh]" id="clinic-management-portal">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Authenticated Staff Session Banner */}
        <div className="bg-[#0D1B38] text-white rounded-xl px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs sm:text-sm flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>
              <span className="text-[#7DD3FC] font-medium mr-1.5">Personal autorizado:</span>
              <strong className="font-semibold">{user.email}</strong>
            </span>
            <span className="text-slate-400" aria-hidden="true">·</span>
            <span className="text-sky-200 font-medium">
              Roles: {roleLabels.join(" + ")}
            </span>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer self-start sm:self-auto"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <p className="text-sm font-medium text-[#0086C0]">
              Intranet Operativa Clínica
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#0D1B38] tracking-tight">
              Portal de Gestión Clínica
            </h1>
            <p className="text-sm text-slate-600">
              Administra profesionales, especialidades, disponibilidad horaria y visualiza las citas ingresadas por los pacientes según tus permisos.
            </p>
          </div>

          {isAdmin && activePortalTab === "horarios" && (
            <button
              type="button"
              disabled={saving}
              onClick={handleReset}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 hover:border-[#0D1B38] text-slate-700 hover:text-[#0D1B38] rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer self-start md:self-auto"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Restablecer Horarios Base</span>
            </button>
          )}
        </div>

        {/* Segmented Portal Navigation */}
        <div className="overflow-x-auto pb-1">
          <div
            className="inline-flex items-center gap-1 p-1 bg-slate-200/70 rounded-xl"
            role="tablist"
            aria-label="Secciones del Portal de Gestión"
          >
            {portalTabs
              .filter((t) => t.visible)
              .map((tab) => {
                const isActive = activePortalTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    id={`portal-tab-${tab.id}`}
                    aria-selected={isActive}
                    onClick={() => {
                      clearAlerts();
                      setActivePortalTab(tab.id);
                    }}
                    className={`inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                      isActive
                        ? "bg-white text-[#0D1B38] shadow-xs font-semibold"
                        : "text-slate-600 hover:text-[#0D1B38]"
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                );
              })}
          </div>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800 font-medium flex items-center gap-2.5"
          >
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {saveMessage && (
          <div
            role="status"
            className="p-4 bg-[#EBF6FB] border border-[#0086C0]/30 rounded-xl text-sm text-[#0D1B38] font-medium flex items-center gap-2.5"
          >
            <CheckCircle2 className="h-4 w-4 text-[#0086C0] shrink-0" />
            <span>{saveMessage}</span>
          </div>
        )}

        {/* TAB 1: HORARIOS (Admin only) */}
        {isAdmin && activePortalTab === "horarios" && activeDoctor && draftSchedule && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {doctors.map((docItem) => {
                const isSelected = docItem.id === activeDoctor.id;
                const days = getDoctorActiveDays(docItem.schedule);
                return (
                  <button
                    key={docItem.id}
                    type="button"
                    id={`config-doc-${docItem.id}`}
                    onClick={() => {
                      clearAlerts();
                      setSelectedDoctorId(docItem.id);
                    }}
                    className={`text-left p-4 rounded-xl border transition-colors flex items-center gap-3.5 cursor-pointer ${
                      isSelected
                        ? "bg-[#0D1B38] text-white border-[#0D1B38]"
                        : "bg-white text-[#0D1B38] border-slate-200 hover:border-[#0086C0]/50"
                    }`}
                  >
                    <img
                      src={docItem.image}
                      alt={docItem.name}
                      className="w-12 h-12 rounded-full object-cover border border-slate-200 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <p className={`text-xs font-medium truncate ${isSelected ? "text-[#7DD3FC]" : "text-[#0086C0]"}`}>
                        {docItem.specialty}
                      </p>
                      <h2 className="font-display text-sm font-bold truncate">
                        {docItem.name}
                      </h2>
                      <p className={`text-xs truncate ${isSelected ? "text-slate-300" : "text-slate-500"}`}>
                        {days.length > 0 ? days.join(", ") : "Sin días activos"}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/70">
                <div className="space-y-1">
                  <h3 className="font-display text-lg font-bold text-[#0D1B38]">
                    Horarios semanales · {activeDoctor.name}
                  </h3>
                  <p className="text-xs text-slate-600 tabular-nums">
                    <span className="inline-flex items-center gap-1 mr-3">
                      <Calendar className="h-3.5 w-3.5 text-[#0086C0]" />
                      {activeDaysCount} días activos
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-[#0086C0]" />
                      {totalWeeklySlots} bloques horarios semanales
                    </span>
                  </p>
                </div>

                <button
                  type="button"
                  id="save-schedule-btn"
                  disabled={saving}
                  onClick={handleSaveSchedule}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#0086C0] hover:bg-[#006C9C] disabled:opacity-60 text-white text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Save className="h-4 w-4" />
                  <span>{saving ? "Guardando..." : "Guardar Horarios"}</span>
                </button>
              </div>

              <div className="divide-y divide-slate-200">
                {DAYS_OF_WEEK.map((day) => {
                  const dayData = draftSchedule[day];
                  return (
                    <div
                      key={day}
                      className={`p-5 sm:p-6 transition-colors ${
                        dayData.enabled ? "bg-white" : "bg-slate-50/60"
                      }`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex items-center justify-between lg:w-52 shrink-0 gap-4">
                          <label
                            htmlFor={`toggle-day-${day}`}
                            className="flex items-center gap-3 cursor-pointer select-none"
                          >
                            <input
                              id={`toggle-day-${day}`}
                              type="checkbox"
                              checked={dayData.enabled}
                              onChange={() => toggleDayEnabled(day)}
                              className="h-4 w-4 accent-[#0086C0] rounded cursor-pointer"
                            />
                            <span className="font-display text-sm font-bold text-[#0D1B38]">
                              {day}
                            </span>
                          </label>

                          <span
                            className={`text-xs font-medium tabular-nums ${
                              dayData.enabled && dayData.slots.length > 0
                                ? "text-[#0086C0]"
                                : "text-slate-400"
                            }`}
                          >
                            {dayData.enabled
                              ? `${dayData.slots.length} bloques`
                              : "No atiende"}
                          </span>
                        </div>

                        <div className="flex-1 flex flex-wrap gap-2">
                          {ALL_TIME_SLOTS.map((slot) => {
                            const isActiveSlot = dayData.enabled && dayData.slots.includes(slot);
                            return (
                              <button
                                key={slot}
                                type="button"
                                disabled={!dayData.enabled}
                                onClick={() => toggleSlot(day, slot)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold tabular-nums border transition-colors ${
                                  !dayData.enabled
                                    ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                                    : isActiveSlot
                                    ? "bg-[#0086C0] text-white border-[#0086C0] cursor-pointer"
                                    : "bg-white text-slate-600 border-slate-200 hover:border-[#0086C0] hover:text-[#0D1B38] cursor-pointer"
                                }`}
                              >
                                {slot}
                              </button>
                            );
                          })}
                        </div>

                        <div className="flex items-center gap-2 shrink-0 text-xs">
                          <button
                            type="button"
                            onClick={() => applyDayPreset(day, "all")}
                            className="px-2.5 py-1 rounded border border-slate-200 text-slate-600 hover:text-[#0D1B38] hover:border-slate-300 bg-white cursor-pointer"
                          >
                            Todo el día
                          </button>
                          <button
                            type="button"
                            onClick={() => applyDayPreset(day, "morning")}
                            className="px-2.5 py-1 rounded border border-slate-200 text-slate-600 hover:text-[#0D1B38] hover:border-slate-300 bg-white cursor-pointer"
                          >
                            Mañana
                          </button>
                          <button
                            type="button"
                            onClick={() => applyDayPreset(day, "afternoon")}
                            className="px-2.5 py-1 rounded border border-slate-200 text-slate-600 hover:text-[#0D1B38] hover:border-slate-300 bg-white cursor-pointer"
                          >
                            Tarde
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PROFESIONALES (Add + Assign Specialties, Admin only) */}
        {isAdmin && activePortalTab === "profesionales" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Add New Professional Form */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
              <div className="space-y-1">
                <h2 className="font-display text-lg font-bold text-[#0D1B38]">
                  Agregar Nuevo Profesional
                </h2>
                <p className="text-xs text-slate-600">
                  Registra un nuevo especialista y asígnale su especialidad clínica.
                </p>
              </div>

              <form onSubmit={handleCreateProfessional} className="space-y-4">
                <div className="space-y-1">
                  <label htmlFor="new-doc-name" className="block text-xs font-semibold text-[#0D1B38]">
                    Nombre completo
                  </label>
                  <input
                    id="new-doc-name"
                    type="text"
                    required
                    maxLength={120}
                    placeholder="Ej. Dra. Camila Rojas"
                    value={newDocName}
                    onChange={(e) => setNewDocName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-sm text-[#0D1B38] focus:outline-none focus:border-[#0086C0]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label htmlFor="new-doc-specialty" className="block text-xs font-semibold text-[#0D1B38]">
                      Especialidad asignada
                    </label>
                    <select
                      id="new-doc-specialty"
                      value={newDocSpecialty}
                      onChange={(e) => setNewDocSpecialty(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-[#0D1B38] focus:outline-none focus:border-[#0086C0]"
                    >
                      {specialties.map((spec) => (
                        <option key={spec.id} value={spec.name}>
                          {spec.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="new-doc-exp" className="block text-xs font-semibold text-[#0D1B38]">
                      Años de experiencia
                    </label>
                    <input
                      id="new-doc-exp"
                      type="number"
                      min={0}
                      max={70}
                      required
                      value={newDocExp}
                      onChange={(e) => setNewDocExp(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-sm text-[#0D1B38] tabular-nums focus:outline-none focus:border-[#0086C0]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="new-doc-portrait" className="block text-xs font-semibold text-[#0D1B38]">
                    Fotografía clínica
                  </label>
                  <select
                    id="new-doc-portrait"
                    value={newDocImage}
                    onChange={(e) => setNewDocImage(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-[#0D1B38] focus:outline-none focus:border-[#0086C0]"
                  >
                    {DOCTOR_PORTRAIT_OPTIONS.map((opt) => (
                      <option key={opt.url} value={opt.url}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label htmlFor="new-doc-education" className="block text-xs font-semibold text-[#0D1B38]">
                    Formación académica
                  </label>
                  <input
                    id="new-doc-education"
                    type="text"
                    maxLength={500}
                    placeholder="Ej. Cirujano Dentista U. de Chile · Postgrado Ortodoncia"
                    value={newDocEducation}
                    onChange={(e) => setNewDocEducation(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-sm text-[#0D1B38] focus:outline-none focus:border-[#0086C0]"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="new-doc-bio" className="block text-xs font-semibold text-[#0D1B38]">
                    Reseña profesional
                  </label>
                  <textarea
                    id="new-doc-bio"
                    rows={3}
                    maxLength={1000}
                    placeholder="Breve descripción de trayectoria y enfoque clínico..."
                    value={newDocBio}
                    onChange={(e) => setNewDocBio(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-sm text-[#0D1B38] focus:outline-none focus:border-[#0086C0]"
                  />
                </div>

                <button
                  type="submit"
                  id="submit-new-professional"
                  disabled={saving}
                  className="w-full py-2.5 px-4 bg-[#0D1B38] hover:bg-[#0086C0] disabled:opacity-60 text-white text-sm font-semibold rounded-lg inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>{saving ? "Guardando..." : "Agregar Profesional"}</span>
                </button>
              </form>
            </div>

            {/* Existing Professionals & Specialty Assignment */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-slate-200 bg-slate-50/70">
                <h2 className="font-display text-lg font-bold text-[#0D1B38]">
                  Plantel Clínico y Asignación de Especialidades
                </h2>
                <p className="text-xs text-slate-600 mt-1">
                  Asigna o reasigna la especialidad clínica correspondiente a cada profesional.
                </p>
              </div>

              <div className="divide-y divide-slate-200">
                {doctors.map((docItem) => {
                  const selectedVal = specialtyEdits[docItem.id] || docItem.specialty;
                  const changed = selectedVal !== docItem.specialty;
                  return (
                    <div key={docItem.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <img
                          src={docItem.image}
                          alt={docItem.name}
                          className="w-12 h-12 rounded-full object-cover border border-slate-200 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0">
                          <h3 className="font-display text-sm font-bold text-[#0D1B38] truncate">
                            {docItem.name}
                          </h3>
                          <p className="text-xs text-slate-500 tabular-nums">
                            {docItem.experienceYears} años exp. · Actual:{" "}
                            <strong className="text-[#0086C0]">{docItem.specialty}</strong>
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">
                        <select
                          aria-label={`Especialidad de ${docItem.name}`}
                          value={selectedVal}
                          onChange={(e) =>
                            setSpecialtyEdits((prev) => ({
                              ...prev,
                              [docItem.id]: e.target.value
                            }))
                          }
                          className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-[#0D1B38] focus:outline-none focus:border-[#0086C0]"
                        >
                          {specialties.map((spec) => (
                            <option key={spec.id} value={spec.name}>
                              {spec.name}
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          disabled={!changed || saving}
                          onClick={() => handleAssignSpecialtyToDoctor(docItem)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                            changed
                              ? "bg-[#0086C0] hover:bg-[#006C9C] text-white cursor-pointer"
                              : "bg-slate-100 text-slate-400 cursor-not-allowed"
                          }`}
                        >
                          Asignar
                        </button>

                        {!docItem.isDefault && (
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => onDeleteProfessional(docItem.id)}
                            aria-label={`Eliminar a ${docItem.name}`}
                            className="p-1.5 border border-slate-200 hover:border-red-200 hover:bg-red-50 text-slate-500 hover:text-red-700 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ESPECIALIDADES (Admin only) */}
        {isAdmin && activePortalTab === "especialidades" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
              <div className="space-y-1">
                <h2 className="font-display text-lg font-bold text-[#0D1B38]">
                  Nueva Especialidad Odontológica
                </h2>
                <p className="text-xs text-slate-600">
                  Las especialidades agregadas estarán disponibles de inmediato para asignar a profesionales y agendar citas.
                </p>
              </div>

              <form onSubmit={handleCreateSpecialty} className="space-y-4">
                <div className="space-y-1">
                  <label htmlFor="new-spec-name" className="block text-xs font-semibold text-[#0D1B38]">
                    Nombre de la especialidad
                  </label>
                  <input
                    id="new-spec-name"
                    type="text"
                    required
                    maxLength={100}
                    placeholder="Ej. Endodoncia Microscópica"
                    value={newSpecName}
                    onChange={(e) => setNewSpecName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-sm text-[#0D1B38] focus:outline-none focus:border-[#0086C0]"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="new-spec-desc" className="block text-xs font-semibold text-[#0D1B38]">
                    Descripción clínica
                  </label>
                  <textarea
                    id="new-spec-desc"
                    rows={3}
                    maxLength={400}
                    placeholder="Describe brevemente los tratamientos y enfoque de esta especialidad..."
                    value={newSpecDesc}
                    onChange={(e) => setNewSpecDesc(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-sm text-[#0D1B38] focus:outline-none focus:border-[#0086C0]"
                  />
                </div>

                <button
                  type="submit"
                  id="submit-new-specialty"
                  disabled={saving}
                  className="w-full py-2.5 px-4 bg-[#0D1B38] hover:bg-[#0086C0] disabled:opacity-60 text-white text-sm font-semibold rounded-lg inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>{saving ? "Guardando..." : "Agregar Especialidad"}</span>
                </button>
              </form>
            </div>

            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-slate-200 bg-slate-50/70">
                <h2 className="font-display text-lg font-bold text-[#0D1B38]">
                  Especialidades Activas ({specialties.length})
                </h2>
                <p className="text-xs text-slate-600 mt-1">
                  Catálogo oficial visible en el sitio y en la agenda de reservas.
                </p>
              </div>

              <div className="divide-y divide-slate-200">
                {specialties.map((spec) => (
                  <div key={spec.id} className="p-5 flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-display text-sm font-bold text-[#0D1B38]">
                          {spec.name}
                        </h3>
                        {spec.isDefault && (
                          <span className="text-[11px] font-medium text-[#0086C0]">
                            · Base clínica
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {spec.description}
                      </p>
                    </div>

                    {!spec.isDefault && (
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => onDeleteSpecialty(spec.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-slate-200 hover:border-red-200 hover:bg-red-50 text-slate-600 hover:text-red-700 rounded-lg text-xs transition-colors shrink-0 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Eliminar</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: CITAS INGRESADAS (Protected by recepcionista permission) */}
        {isRecepcionista && activePortalTab === "citas" && (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden" id="receptionist-appointments-panel">
            <div className="p-6 border-b border-slate-200 bg-slate-50/70 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-medium text-[#0086C0]">
                  <span>Permiso activo: recepcionista</span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">{cloudAppointments.length} registradas</span>
                </div>
                <h2 className="font-display text-lg font-bold text-[#0D1B38]">
                  Citas Ingresadas por Pacientes
                </h2>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre, RUT, doctor..."
                    value={aptSearch}
                    onChange={(e) => setAptSearch(e.target.value)}
                    className="w-full sm:w-64 bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-xs text-[#0D1B38] focus:outline-none focus:border-[#0086C0]"
                  />
                </div>

                <select
                  aria-label="Filtrar por estado"
                  value={aptStatusFilter}
                  onChange={(e) => setAptStatusFilter(e.target.value)}
                  className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-[#0D1B38] focus:outline-none focus:border-[#0086C0]"
                >
                  <option value="ALL">Todos los estados</option>
                  <option value="confirmada">Confirmadas</option>
                  <option value="atendida">Atendidas</option>
                  <option value="cancelada">Canceladas</option>
                </select>
              </div>
            </div>

            {filteredAppointments.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <p className="font-display text-base font-bold text-[#0D1B38]">
                  Sin citas para mostrar
                </p>
                <p className="text-xs text-slate-500">
                  Las reservas ingresadas por pacientes en el formulario público aparecerán aquí en tiempo real.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {filteredAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-mono font-semibold text-[#0D1B38] tabular-nums">
                          {apt.id}
                        </span>
                        <span className="text-slate-300" aria-hidden="true">·</span>
                        <span className="font-semibold text-[#0086C0] tabular-nums">
                          {apt.date} · {apt.timeSlot}
                        </span>
                        <span className="text-slate-300" aria-hidden="true">·</span>
                        <span
                          className={`font-semibold capitalize ${
                            apt.status === "confirmada"
                              ? "text-teal-700"
                              : apt.status === "atendida"
                              ? "text-[#0086C0]"
                              : "text-red-700"
                          }`}
                        >
                          {apt.status}
                        </span>
                      </div>

                      <h3 className="font-display text-sm sm:text-base font-bold text-[#0D1B38]">
                        {apt.patientName}{" "}
                        <span className="font-normal text-xs text-slate-500 tabular-nums">
                          (RUT {formatRut(apt.patientRut)})
                        </span>
                      </h3>

                      <p className="text-xs text-slate-600">
                        <strong className="text-[#0D1B38]">{apt.treatmentName || "Consulta"}</strong>
                        {" · "}
                        Especialista: <strong className="text-[#0D1B38]">{apt.doctorName || apt.doctorId}</strong>
                      </p>

                      <p className="text-xs text-slate-500 tabular-nums">
                        {apt.patientEmail} · {apt.patientPhone}
                      </p>

                      {apt.notes && (
                        <p className="text-xs text-slate-600 bg-slate-100/80 rounded-lg px-3 py-2 mt-1">
                          Nota clínica: {apt.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <label htmlFor={`status-${apt.id}`} className="text-xs text-slate-500">
                        Estado:
                      </label>
                      <select
                        id={`status-${apt.id}`}
                        value={apt.status}
                        onChange={(e) =>
                          handleUpdateAppointmentStatus(
                            apt.id,
                            e.target.value as AppointmentStatus
                          )
                        }
                        className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-[#0D1B38] focus:outline-none focus:border-[#0086C0]"
                      >
                        <option value="confirmada">Confirmada</option>
                        <option value="atendida">Atendida</option>
                        <option value="cancelada">Cancelada</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: PERMISOS Y ROLES (Admin only) */}
        {isAdmin && activePortalTab === "permisos" && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="space-y-1">
              <h2 className="font-display text-lg font-bold text-[#0D1B38]">
                Gestión de Permisos (Administrador y Recepcionista)
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                Cuenta principal con acceso total: <strong className="text-[#0D1B38]">{ADMIN_BOOTSTRAP_EMAIL}</strong>. Asigna permisos <strong className="text-[#0D1B38]">admin</strong> o <strong className="text-[#0D1B38]">recepcionista</strong> a otras cuentas mediante su UID de Firebase.
              </p>
            </div>

            {roleActionMsg && (
              <div className="p-3 bg-[#EBF6FB] border border-[#0086C0]/30 rounded-xl text-xs font-medium text-[#0D1B38]">
                {roleActionMsg}
              </div>
            )}

            <form onSubmit={handleAddStaffRole} className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
              <div className="lg:col-span-4 space-y-1">
                <label htmlFor="new-staff-uid" className="block text-xs font-semibold text-[#0D1B38]">
                  UID de usuario
                </label>
                <input
                  id="new-staff-uid"
                  type="text"
                  required
                  placeholder="Ej. a1b2c3d4e5"
                  value={newStaffUid}
                  onChange={(e) => setNewStaffUid(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-[#0D1B38] font-mono focus:outline-none focus:border-[#0086C0]"
                />
              </div>

              <div className="lg:col-span-4 space-y-1">
                <label htmlFor="new-staff-email" className="block text-xs font-semibold text-[#0D1B38]">
                  Correo Google
                </label>
                <input
                  id="new-staff-email"
                  type="email"
                  required
                  placeholder="recepcion@clinicaisdental.cl"
                  value={newStaffEmail}
                  onChange={(e) => setNewStaffEmail(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-[#0D1B38] focus:outline-none focus:border-[#0086C0]"
                />
              </div>

              <div className="lg:col-span-2 flex flex-col gap-1.5 text-xs text-[#0D1B38]">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newStaffIsRecep}
                    onChange={(e) => setNewStaffIsRecep(e.target.checked)}
                    className="h-4 w-4 accent-[#0086C0]"
                  />
                  <span>Recepcionista</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newStaffIsAdmin}
                    onChange={(e) => setNewStaffIsAdmin(e.target.checked)}
                    className="h-4 w-4 accent-[#0086C0]"
                  />
                  <span>Administrador</span>
                </label>
              </div>

              <div className="lg:col-span-2">
                <button
                  type="submit"
                  className="w-full py-2 px-3 bg-[#0D1B38] hover:bg-[#0086C0] text-white text-xs font-semibold rounded-lg inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>Guardar</span>
                </button>
              </div>
            </form>

            {staffList.length > 0 && (
              <div className="border border-slate-200 rounded-xl divide-y divide-slate-100">
                {staffList.map((staff) => (
                  <div
                    key={staff.uid}
                    className="px-4 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                  >
                    <div>
                      <p className="font-semibold text-[#0D1B38]">{staff.email}</p>
                      <p className="font-mono text-slate-500">{staff.uid}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                      <label className="inline-flex items-center gap-1.5 cursor-pointer text-[#0D1B38] font-medium">
                        <input
                          type="checkbox"
                          checked={staff.isRecepcionista}
                          onChange={() => handleToggleStaffPermission(staff, "isRecepcionista")}
                          className="h-4 w-4 accent-[#0086C0]"
                        />
                        <span>recepcionista</span>
                      </label>

                      <label className="inline-flex items-center gap-1.5 cursor-pointer text-[#0D1B38] font-medium">
                        <input
                          type="checkbox"
                          checked={staff.isAdmin}
                          onChange={() => handleToggleStaffPermission(staff, "isAdmin")}
                          className="h-4 w-4 accent-[#0086C0]"
                        />
                        <span>admin</span>
                      </label>

                      <button
                        type="button"
                        onClick={() => handleRemoveStaffRole(staff.uid)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 border border-slate-200 hover:border-red-200 hover:bg-red-50 text-slate-600 hover:text-red-700 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Quitar</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
