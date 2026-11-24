import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught render error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="subpage-container" style={{ padding: "80px 20px", textAlign: "center" }}>
          <h1 className="page-title" style={{ marginBottom: "12px" }}>
            Something went wrong
          </h1>
          <p className="page-description" style={{ margin: "0 auto 24px" }}>
            An unexpected application error occurred. Reloading the page will restart your session cleanly.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
            <button
              type="button"
              className="btn-primary"
              onClick={() => window.location.reload()}
            >
              Reload application
            </button>
            <a
              href="https://github.com/IronAlpha3528/sdocx2obsidian/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
            >
              Report issue on GitHub
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
