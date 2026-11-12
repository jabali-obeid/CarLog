import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || 'Error inesperado al reanudar.' };
  }

  componentDidCatch(error) {
    const msg = String(error?.message || '');
    const isChunkError =
      msg.includes('dynamically imported module') ||
      msg.includes('ChunkLoadError') ||
      msg.includes('Importing a module script failed');

    if (isChunkError && !sessionStorage.getItem('carlog_chunk_reload')) {
      sessionStorage.setItem('carlog_chunk_reload', '1');
      window.location.reload();
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#07080d] text-zinc-100 flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-white text-black font-black text-xl flex items-center justify-center">
            CL
          </div>
          <h2 className="text-lg font-bold">CarLog necesitó reiniciar la vista</h2>
          <p className="text-xs text-zinc-400 max-w-xs">
            Ocurrió una interrupción al volver desde segundo plano. Toca abajo para recargar sin perder tus autos.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 rounded-xl bg-white text-black font-bold text-xs shadow-lg active:scale-95 transition"
          >
            Recargar CarLog
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>,
)
