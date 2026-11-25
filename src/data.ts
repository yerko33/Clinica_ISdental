import {
  Specialty,
  SpecialtyItem,
  Treatment,
  Doctor,
  Testimonial,
  DayOfWeek,
  DoctorSchedule
} from "./types";
import clinicHeroImg from "./assets/images/clinic_hero_1781296076431.jpg";
import highTechDentalImg from "./assets/images/high_tech_dental_1781296096733.jpg";
import doctorFemaleImg from "./assets/images/doctor_headshot_1781296086374.jpg";
import doctorMaleImg from "./assets/images/doctor_male_headshot_1781296109194.jpg";

export const DAYS_OF_WEEK: DayOfWeek[] = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado"
];

export const ALL_TIME_SLOTS: string[] = [
  "08:30 AM",
  "09:30 AM",
  "10:30 AM",
  "11:30 AM",
  "01:30 PM",
  "02:30 PM",
  "03:30 PM",
  "04:30 PM",
  "05:30 PM"
];

export const MORNING_SLOTS: string[] = [
  "08:30 AM",
  "09:30 AM",
  "10:30 AM",
  "11:30 AM"
];

export const AFTERNOON_SLOTS: string[] = [
  "01:30 PM",
  "02:30 PM",
  "03:30 PM",
  "04:30 PM",
  "05:30 PM"
];

export const DEFAULT_WEEKLY_SCHEDULE: DoctorSchedule = {
  Lunes: { enabled: true, slots: [...MORNING_SLOTS] },
  Martes: { enabled: true, slots: [...MORNING_SLOTS] },
  Miércoles: { enabled: true, slots: [...MORNING_SLOTS] },
  Jueves: { enabled: true, slots: [...MORNING_SLOTS] },
  Viernes: { enabled: true, slots: [...MORNING_SLOTS] },
  Sábado: { enabled: false, slots: [] }
};

export const DEFAULT_SPECIALTIES: SpecialtyItem[] = [
  {
    id: "estetica-dental",
    name: Specialty.Estetica,
    description:
      "Diseño de sonrisa digital en 3D, carillas cerámicas ultrafinas y blanqueamiento láser clínico de alta precisión.",
    isDefault: true
  },
  {
    id: "implantologia-3d",
    name: Specialty.Implantologia,
    description:
      "Cirugía guiada computarizada en 3D, implantes de carga inmediata y regeneración ósea avanzada.",
    isDefault: true
  },
  {
    id: "ortodoncia-invisible",
    name: Specialty.Ortodoncia,
    description:
      "Alineadores transparentes removibles planificados digitalmente para corregir mordida y alineación.",
    isDefault: true
  },
  {
    id: "laser-preventiva",
    name: Specialty.LaserPreventiva,
    description:
      "Terapia periodontal láser mínimamente invasiva y evaluaciones diagnósticas preventivas en 3D.",
    isDefault: true
  }
];

export const DOCTOR_PORTRAIT_OPTIONS = [
  {
    label: "Retrato Especialista Femenino",
    url: doctorFemaleImg
  },
  {
    label: "Retrato Especialista Masculino",
    url: doctorMaleImg
  }
];

export function resolveClinicImage(imagePath?: string): string {
  if (!imagePath) return doctorFemaleImg;
  if (imagePath.includes("doctor_headshot_1781296086374.jpg")) return doctorFemaleImg;
  if (imagePath.includes("doctor_male_headshot_1781296109194.jpg")) return doctorMaleImg;
  if (imagePath.includes("clinic_hero_1781296076431.jpg")) return clinicHeroImg;
  if (imagePath.includes("high_tech_dental_1781296096733.jpg")) return highTechDentalImg;
  return imagePath;
}

const VALENZUELA_SCHEDULE: DoctorSchedule = {
  Lunes: { enabled: true, slots: [...ALL_TIME_SLOTS] },
  Martes: { enabled: false, slots: [] },
  Miércoles: { enabled: true, slots: [...ALL_TIME_SLOTS] },
  Jueves: { enabled: false, slots: [] },
  Viernes: { enabled: true, slots: [...MORNING_SLOTS, "01:30 PM", "02:30 PM", "03:30 PM"] },
  Sábado: { enabled: false, slots: [] }
};

const MENDEZ_SCHEDULE: DoctorSchedule = {
  Lunes: { enabled: false, slots: [] },
  Martes: { enabled: true, slots: [...ALL_TIME_SLOTS] },
  Miércoles: { enabled: false, slots: [] },
  Jueves: { enabled: true, slots: [...ALL_TIME_SLOTS] },
  Viernes: { enabled: false, slots: [] },
  Sábado: { enabled: true, slots: [...MORNING_SLOTS] }
};

export const TREATMENTS: Treatment[] = [
  {
    id: "d-smile",
    name: "Diseño de Sonrisa Digital 3D",
    specialty: Specialty.Estetica,
    description: "Visualiza digitalmente tu sonrisa ideal en 3D antes de comenzar el tratamiento, con planificación facial totalmente personalizada.",
    duration: "2 sesiones",
    highlight: "Resultados predictivos y armónicos",
    techUsed: "Escáner intraoral 3D & software CAD/CAM",
    estimatedCost: "$1,200 - $3,500"
  },
  {
    id: "porcelain-ven",
    name: "Carillas de Porcelana Ultrafinas",
    specialty: Specialty.Estetica,
    description: "Láminas cerámicas de alta resistencia que corrigen color, forma y alineación con mínimo desgaste estructural.",
    duration: "2-3 sesiones",
    highlight: "Estabilidad óptica y durabilidad prolongada",
    techUsed: "Porcelana feldespática biocompatible prensada",
    estimatedCost: "$450 por pieza"
  },
  {
    id: "laser-whitening",
    name: "Blanqueamiento Láser Clínico",
    specialty: Specialty.Estetica,
    description: "Aclara hasta 8 tonos en una sola sesión clínica controlada sin provocar sensibilidad dental posterior.",
    duration: "45 minutos",
    highlight: "Aclarado uniforme en una visita",
    techUsed: "Láser de diodo clínico & gel fotoactivado",
    estimatedCost: "$299"
  },
  {
    id: "guided-implant",
    name: "Carga Inmediata Quirúrgica Guiada",
    specialty: Specialty.Implantologia,
    description: "Colocación de implante y corona provisional fija en un solo día mediante guía quirúrgica computarizada 3D.",
    duration: "1 día",
    highlight: "Cirugía guiada mínimamente invasiva",
    techUsed: "Biomodelos 3D y Tomografía Cone Beam",
    estimatedCost: "$950 - $1,800"
  },
  {
    id: "sinus-lift",
    name: "Elevación de Seno Maxilar con PRF",
    specialty: Specialty.Implantologia,
    description: "Regeneración ósea de alta precisión para pacientes que requieren implantes y necesitan optimizar su volumen óseo.",
    duration: "1 sesión principal",
    highlight: "Recuperación biológica acelerada",
    techUsed: "Plasma rico en fibrina & piezo-cirugía",
    estimatedCost: "$800"
  },
  {
    id: "invisalign-adv",
    name: "Ortodoncia Invisible Invisalign",
    specialty: Specialty.Ortodoncia,
    description: "Alineadores transparentes removibles y discretos, planificados milimétricamente por biomecánica digital.",
    duration: "6 a 18 meses",
    highlight: "Máxima discreción e higiene diaria",
    techUsed: "Software ClinCheck & polímero SmartTrack",
    estimatedCost: "$2,200 - $4,500"
  },
  {
    id: "laser-perio",
    name: "Terapia Periodontal Láser Sin Suturas",
    specialty: Specialty.LaserPreventiva,
    description: "Tratamiento de encías inflamadas mediante energía láser que descontamina bolsas periodontales y favorece la regeneración.",
    duration: "1-2 sesiones",
    highlight: "Sin bisturí ni puntos de sutura",
    techUsed: "Láser Er,Cr:YSGG de precisión",
    estimatedCost: "$150 - $400"
  },
  {
    id: "eval-3d",
    name: "Evaluación Clínica Integral 3D",
    specialty: Specialty.LaserPreventiva,
    description: "Chequeo preventivo completo con escaneo intraoral digital y radiografía panorámica de alta definición para un plan preciso.",
    duration: "30 minutos",
    highlight: "Plan de tratamiento transparente desde el día uno",
    techUsed: "Escáner 3D & Radiografía Digital Panorámica",
    estimatedCost: "Cortesía en primera visita"
  }
];

export const INITIAL_DOCTORS: Doctor[] = [
  {
    id: "dr-valenzuela",
    name: "Dra. Sofía Valenzuela",
    specialty: Specialty.Estetica,
    experienceYears: 12,
    image: doctorFemaleImg,
    bio: "Especialista reconocida en Estética Dental y Rehabilitación Oral. Graduada con honores en Barcelona, lidera los protocolos de Diseño de Sonrisa Digital (DSD) en Clínica IS Dental con enfoque conservador y natural.",
    education: "Máster en Odontología Estética y CAD/CAM (Universidad Europea de Madrid) · Certificada DSD",
    rating: 4.9,
    schedule: VALENZUELA_SCHEDULE,
    isDefault: true
  },
  {
    id: "dr-mendez",
    name: "Dr. Alejandro Méndez",
    specialty: Specialty.Implantologia,
    experienceYears: 16,
    image: doctorMaleImg,
    bio: "Cirujano Maxilofacial con amplia trayectoria en implantología de carga inmediata guiada por tomografía 3D y reconstrucción ósea compleja. Conferencista internacional en cirugía mínimamente invasiva.",
    education: "Especialidad en Cirugía Oral y Maxilofacial (UBA) · Fellow de Implantología (Gotemburgo)",
    rating: 5.0,
    schedule: MENDEZ_SCHEDULE,
    isDefault: true
  }
];

export const INITIAL_TESTIMONIALS: Testimonial[] = [
  {
    id: "t-1",
    name: "Valeria Santillán",
    treatment: "Diseño de Sonrisa Digital 3D",
    text: "Mi experiencia en Clínica IS Dental superó cualquier expectativa. El escáner 3D me permitió visualizar el resultado antes de empezar y la atención fue sumamente cálida y puntual.",
    rating: 5,
    date: "2026-05-18",
    verified: true
  },
  {
    id: "t-2",
    name: "Ing. Carlos Mendoza",
    treatment: "Carga Inmediata y Dos Implantes",
    text: "Excelente rigor clínico. El Dr. Alejandro planificó mis implantes con guía digital y la recuperación fue sorprendentemente rápida y sin molestias.",
    rating: 5,
    date: "2026-06-01",
    verified: true
  },
  {
    id: "t-3",
    name: "Andrea Luján",
    treatment: "Ortodoncia Invisible Invisalign",
    text: "Instalaciones impecables y un equipo humano muy profesional. Los alineadores son cómodos y el seguimiento digital en cada control da mucha tranquilidad.",
    rating: 5,
    date: "2026-06-10",
    verified: true
  }
];

export function getDoctorActiveDays(schedule: DoctorSchedule): DayOfWeek[] {
  return DAYS_OF_WEEK.filter(
    (day) => schedule[day]?.enabled && schedule[day].slots.length > 0
  );
}

export function getSpanishDayFromDate(dateStr: string): DayOfWeek | "Domingo" | null {
  if (!dateStr) return null;
  const date = new Date(dateStr + "T00:00:00");
  if (Number.isNaN(date.getTime())) return null;
  const map: Record<number, DayOfWeek | "Domingo"> = {
    0: "Domingo",
    1: "Lunes",
    2: "Martes",
    3: "Miércoles",
    4: "Jueves",
    5: "Viernes",
    6: "Sábado"
  };
  return map[date.getDay()] ?? null;
}

export function slugifyId(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}
