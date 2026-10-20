import './LoadingSpinner.css';

/**
 * LoadingSpinner: Componente institucional de carga bajo demanda
 * Diseñado para transiciones fluidas de Suspense al cargar módulos con React.lazy
 */
export default function LoadingSpinner({ 
  message = 'Cargando módulo institucional...', 
  subMessage = 'Gimnasio Martin Galeano • Sincronización en curso' 
}) {
  return (
    <div className="institutional-loader-screen" role="status" aria-live="polite">
      <div className="institutional-loader-card">
        <div className="institutional-spinner-box">
          <div className="institutional-spinner-ring"></div>
          <div className="institutional-spinner-core">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L3 6V12C3 17.5 6.8 22.3 12 23.5C17.2 22.3 21 17.5 21 12V6L12 2Z" fill="#15803d" />
              <path d="M12 3.8L4.5 7.2V12C4.5 16.5 7.6 20.6 12 21.8C16.4 20.6 19.5 16.5 19.5 12V7.2L12 3.8Z" fill="#16a34a" fillOpacity="0.85" />
            </svg>
          </div>
        </div>
        <div className="institutional-loader-text">
          <h4 className="institutional-loader-title">{message}</h4>
          <p className="institutional-loader-sub">{subMessage}</p>
        </div>
      </div>
    </div>
  );
}
