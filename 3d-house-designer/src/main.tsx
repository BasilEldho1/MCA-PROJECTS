import React, { StrictMode, Component, ErrorInfo, ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class RootErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught application error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', backgroundColor: '#f8fafc', padding: '20px' }}>
          <div style={{ maxWidth: '480px', width: '100%', background: '#ffffff', borderRadius: '16px', padding: '32px', boxShadow: '0 10px 25px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0f172a', marginBottom: '12px' }}>Studio Recovery</h2>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>An unexpected error occurred while loading the studio interface.</p>
            <div style={{ textAlign: 'left', background: '#f1f5f9', padding: '12px', borderRadius: '8px', fontSize: '11px', fontFamily: 'monospace', color: '#dc2626', marginBottom: '20px', overflowX: 'auto' }}>
              {this.state.error?.message || 'Unknown error'}
            </div>
            <button
              onClick={() => {
                try {
                  localStorage.removeItem('3d_floorplan_projects');
                  localStorage.removeItem('3d_floorplan_user');
                  localStorage.removeItem('3d_floorplan_users_db');
                  localStorage.removeItem('3d_floorplan_token');
                } catch (e) {
                  console.error('Failed to clear localStorage keys', e);
                }
                window.location.reload();
              }}
              style={{ background: '#059669', color: '#ffffff', border: 'none', padding: '10px 24px', borderRadius: '10px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
            >
              Reset Cache &amp; Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </StrictMode>,
)
