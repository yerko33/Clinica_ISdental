import React, { useState } from "react";
import { Calendar, Menu, X } from "lucide-react";

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Header({ activeTab, setActiveTab }: HeaderProps) {
  const [logoError, setLogoError] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: "inicio", label: "Inicio" },
    { id: "profesionales", label: "Profesionales" },
    { id: "especialidades", label: "Especialidades" },
    { id: "nosotros", label: "Nosotros" },
    { id: "contacto", label: "Contacto" }
  ];

  const handleNav = (id: string) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 md:gap-8 h-18 sm:h-20">
          {/* Zone 1: Brand Wordmark / Corporate Logo */}
          <button
            type="button"
            id="logo-container"
            onClick={() => handleNav("inicio")}
            className="flex items-center whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0086C0] rounded-md"
            aria-label="Ir al inicio de Clínica IS Dental"
          >
            {!logoError ? (
              <img
                src="/assets/aistudio/cropped-dentalsoft-logo-175x58_25e18286.jpg"
                alt="Clínica IS Dental"
                className="h-8 sm:h-11 w-auto object-contain"
                referrerPolicy="no-referrer"
                onError={() => setLogoError(true)}
              />
            ) : (
              <span className="font-display text-lg sm:text-xl font-bold tracking-tight text-[#0D1B38] whitespace-nowrap">
                Clínica <span className="text-[#0086C0]">IS</span> Dental
              </span>
            )}
          </button>

          {/* Zone 2: Desktop Single-Line Navigation Links */}
          <nav className="hidden md:flex items-center gap-5 lg:gap-7" aria-label="Navegación principal">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  id={`nav-btn-${item.id}`}
                  onClick={() => handleNav(item.id)}
                  className={`relative py-2 text-sm font-medium whitespace-nowrap shrink-0 transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0086C0] ${
                    isActive
                      ? "text-[#0D1B38] font-semibold"
                      : "text-slate-600 hover:text-[#0D1B38]"
                  }`}
                >
                  <span>{item.label}</span>
                  <span
                    className={`absolute inset-x-0 -bottom-[1px] h-0.5 rounded-full transition-opacity duration-150 ${
                      isActive ? "bg-[#0086C0] opacity-100" : "opacity-0"
                    }`}
                  />
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Primary Action & Mobile Hamburger Toggle */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              id="header-book-btn"
              onClick={() => handleNav("reserva")}
              className={`inline-flex items-center gap-2 px-3.5 sm:px-5 py-2.5 text-xs sm:text-sm font-semibold rounded-lg whitespace-nowrap shrink-0 transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0086C0] ${
                activeTab === "reserva"
                  ? "bg-[#0086C0] text-white"
                  : "bg-[#0D1B38] text-white hover:bg-[#162B54]"
              }`}
            >
              <Calendar className="h-4 w-4 text-[#7DD3FC]" />
              <span>Reservar Cita</span>
            </button>

            <button
              type="button"
              id="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-nav-drawer"
              aria-label={mobileMenuOpen ? "Cerrar menú de navegación" : "Abrir menú de navegación"}
              className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-lg border border-slate-200 text-[#0D1B38] hover:bg-slate-50 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#0086C0]"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Hamburger Menu Drawer */}
      {mobileMenuOpen && (
        <nav
          id="mobile-nav-drawer"
          className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1 shadow-sm"
          aria-label="Navegación móvil"
        >
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                id={`mobile-nav-${item.id}`}
                onClick={() => handleNav(item.id)}
                className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors cursor-pointer flex items-center justify-between ${
                  isActive
                    ? "bg-[#EBF6FB] text-[#0D1B38] font-semibold"
                    : "text-slate-700 hover:bg-slate-50 hover:text-[#0D1B38]"
                }`}
              >
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      )}
    </header>
  );
}
