import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { logger } from "../services/logger";

type Props = { children: ReactNode; fallback?: ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    logger.error("UI crash", { error: error.message, stack: info.componentStack });
  }

  reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    return (
      <div
        role="alert"
        className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-white"
      >
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8 text-red-500" aria-hidden />
        </div>
        <h1 className="mb-2">Une erreur est survenue</h1>
        <p className="text-gray-600 mb-6 max-w-sm">
          Nous avons enregistré le problème. Réessayez ou revenez à l'accueil.
        </p>
        <button
          onClick={this.reset}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#F77F00] text-white"
        >
          <RefreshCw className="w-4 h-4" aria-hidden /> Réessayer
        </button>
        {import.meta.env?.DEV && (
          <pre className="mt-6 p-3 rounded-lg bg-gray-50 text-xs text-left overflow-auto max-w-full">
            {this.state.error.message}
          </pre>
        )}
      </div>
    );
  }
}
