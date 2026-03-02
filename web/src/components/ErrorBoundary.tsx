import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });

    // Enviar para serviço de monitoramento (Sentry, etc)
    if (import.meta.env.PROD) {
      // window.Sentry?.captureException(error);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-dark flex items-center justify-center p-4">
          <div className="bg-dark-light rounded-lg shadow-2xl max-w-2xl w-full p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-16 w-16 bg-red-600/20 rounded-full flex items-center justify-center">
                <AlertTriangle className="text-red-600" size={32} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white mb-1">
                  Oops! Algo deu errado
                </h1>
                <p className="text-gray-400">
                  Ocorreu um erro inesperado na aplicação
                </p>
              </div>
            </div>

            {/* Error details */}
            {import.meta.env.DEV && this.state.error && (
              <div className="bg-dark rounded-lg p-4 mb-6 border border-gray-700">
                <h3 className="text-sm font-semibold text-red-400 mb-2">
                  Error Message:
                </h3>
                <p className="text-xs text-gray-300 font-mono mb-4">
                  {this.state.error.message}
                </p>

                {this.state.errorInfo && (
                  <>
                    <h3 className="text-sm font-semibold text-red-400 mb-2">
                      Stack Trace:
                    </h3>
                    <pre className="text-xs text-gray-400 overflow-auto max-h-48">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary hover:bg-orange-600 text-white rounded-lg transition-colors font-medium"
              >
                <RefreshCw size={20} />
                Tentar Novamente
              </button>
              <button
                onClick={() => (window.location.href = "/")}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
              >
                <Home size={20} />
                Ir para Início
              </button>
            </div>

            {/* Help text */}
            <p className="text-center text-sm text-gray-500 mt-6">
              Se o problema persistir, entre em contato com o suporte
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
