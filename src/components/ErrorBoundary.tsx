import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export default class ErrorBoundary extends Component<Props, State> {
  declare props: Readonly<Props>;

  constructor(props: Props) {
    super(props);
  }

  public state: State = {
    hasError: false,
    message: ""
  };

  public static getDerivedStateFromError(error: Error): State {
    let readable = "Ocurrió un error inesperado al cargar la plataforma.";
    try {
      const parsed = JSON.parse(error.message);
      if (parsed?.error) {
        readable =
          parsed.error.includes("Missing or insufficient permissions")
            ? "No tienes permisos suficientes para realizar esta operación."
            : parsed.error;
      }
    } catch {
      if (error.message) readable = error.message;
    }
    return { hasError: true, message: readable };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-5">
            <div className="mx-auto w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h1 className="font-display text-xl font-bold text-[#0D1B38]">
                Error de aplicación
              </h1>
              <p className="text-sm text-slate-600 leading-relaxed">
                {this.state.message}
              </p>
            </div>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0D1B38] hover:bg-[#0086C0] text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Recargar página</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
