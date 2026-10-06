import React from 'react';
import { AlertTriangle, RotateCw, Home, ChevronDown } from 'lucide-react';
import { safeString } from '../lib/safeString.js';

/**
 * Top-level application Error Boundary.
 * Catches JavaScript runtime rendering errors and displays a clean recovery interface.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('MC RailAdmin Application Error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoDashboard = () => {
    this.setState({ hasError: false, error: null });
    window.location.hash = '#/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0f1115] text-[#e5e7eb] flex items-center justify-center p-4 select-none">
          <div className="w-full max-w-[420px] bg-[#1a1d24] border border-[#262a33] rounded-[16px] p-6 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-[#ef4444]/15 border border-[#ef4444]/30 text-[#ef4444] flex items-center justify-center mx-auto">
              <AlertTriangle size={28} />
            </div>

            <div>
              <h2 className="text-[17px] font-bold text-[#e5e7eb]">
                Something went wrong
              </h2>
              <p className="text-[12.5px] text-[#9ca3af] mt-1 leading-normal">
                An unexpected rendering error occurred. The Minecraft server continues running unaffected.
              </p>
            </div>

            {/* Error Message Details (collapsible) */}
            {this.state.error && (
              <div className="text-left">
                <button
                  type="button"
                  onClick={() =>
                    this.setState((prev) => ({ showDetails: !prev.showDetails }))
                  }
                  className="text-[11.5px] text-[#9ca3af] hover:text-[#e5e7eb] flex items-center gap-1 mx-auto cursor-pointer"
                >
                  <span>{this.state.showDetails ? 'Hide' : 'Show'} error details</span>
                  <ChevronDown
                    size={13}
                    className={`transition-transform ${
                      this.state.showDetails ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {this.state.showDetails && (
                  <pre className="mt-2 p-3 rounded-[8px] bg-[#0f1115] border border-[#262a33] text-[11px] font-mono text-[#ef4444] overflow-x-auto whitespace-pre-wrap max-h-36">
                    {safeString(this.state.error?.message || String(this.state.error || ""))}
                  </pre>
                )}
              </div>
            )}

            {/* Recovery Actions */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={this.handleGoDashboard}
                className="flex-1 h-[42px] px-3 rounded-[8px] bg-[#262a33] hover:bg-[#323742] text-[#e5e7eb] text-[13px] font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Home size={15} />
                <span>Dashboard</span>
              </button>
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 h-[42px] px-3 rounded-[8px] bg-[#4ade80] hover:bg-[#22c55e] text-[#0f1115] text-[13px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCw size={15} />
                <span>Reload App</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
