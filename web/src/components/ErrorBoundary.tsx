"use client";

import { Component, type ReactNode } from "react";

interface Props { children: ReactNode; fallback?: ReactNode; }
interface State { hasError: boolean; error?: Error; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center min-h-[200px] gap-3 p-6 text-center">
          <div className="text-lg font-medium text-[#ca3431]">Something went wrong</div>
          <div className="text-sm text-[#C3C3C0]/60 max-w-md">{this.state.error?.message}</div>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="px-4 py-2 bg-[#454341] hover:bg-[#5a5754] rounded text-sm text-white transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
