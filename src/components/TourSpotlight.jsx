import { useState, useEffect } from 'react';
import { TOUR_STEPS_DOCENTE, TOUR_STEPS_RECTORA } from '../data/tourSteps';

export default function TourSpotlight({ currentUser }) {
  const isInduccionUser = currentUser && (
    currentUser.role === 'induccion' || 
    currentUser.role === 'induccion_rectora' || 
    currentUser.key === 'induccion' || 
    currentUser.key === 'induccion_rectora'
  );

  if (!isInduccionUser) {
    return null;
  }

  const isRectoraInduccion = currentUser?.role === 'induccion_rectora' || currentUser?.key === 'induccion_rectora';

  const defaultSteps = isRectoraInduccion ? TOUR_STEPS_RECTORA : TOUR_STEPS_DOCENTE;
  const isAutoStart = isInduccionUser;

  const [isOpen, setIsOpen] = useState(isAutoStart);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const steps = defaultSteps;
  const currentStep = steps[currentStepIndex];

  // Manejar el resaltado del elemento
  useEffect(() => {
    if (!isOpen || !currentStep) return;

    const targetId = currentStep.targetId;
    let targetEl = null;

    if (targetId) {
      targetEl = document.getElementById(targetId);
      if (targetEl) {
        targetEl.classList.add('tour-highlighted-target');
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    return () => {
      if (targetEl) {
        targetEl.classList.remove('tour-highlighted-target');
      }
    };
  }, [isOpen, currentStepIndex, currentStep]);

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      setIsOpen(false);
      setCurrentStepIndex(0);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setCurrentStepIndex(0);
  };

  const handleOpen = () => {
    setCurrentStepIndex(0);
    setIsOpen(true);
  };

  // Escuchar evento global para iniciar la guía desde el botón de la barra superior
  useEffect(() => {
    const handleTriggerTour = () => {
      setCurrentStepIndex(0);
      setIsOpen(true);
    };
    window.addEventListener('gmg_open_tour', handleTriggerTour);
    return () => window.removeEventListener('gmg_open_tour', handleTriggerTour);
  }, []);

  const renderIcon = (iconName) => {
    const map = {
      HandWaving: 'ph-hand-waving',
      Folders: 'ph-folders',
      MagnifyingGlass: 'ph-magnifying-glass',
      CloudArrowUp: 'ph-cloud-arrow-up',
      FileArrowDown: 'ph-file-arrow-down',
      Crown: 'ph-crown',
      UsersThree: 'ph-users-three',
      Megaphone: 'ph-megaphone',
      Vault: 'ph-vault',
      HardDrive: 'ph-hard-drive',
      ChartLineUp: 'ph-chart-line-up',
      BellRinging: 'ph-bell-ringing',
      UserList: 'ph-user-list',
      Sparkle: 'ph-sparkle',
      CheckCircle: 'ph-check-circle',
      IdentificationBadge: 'ph-identification-badge',
      Broadcast: 'ph-broadcast',
      GraduationCap: 'ph-graduation-cap',
      ChalkboardTeacher: 'ph-chalkboard-teacher'
    };
    const cls = map[iconName] || 'ph-info';
    return <i className={`ph-bold ${cls}`}></i>;
  };

  // Teclas de navegación en el tour (Flechas / Enter / Escape)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStepIndex, steps.length]);

  return (
    <>
      {isOpen && currentStep && (
        <>
          <div className="tour-backdrop" onClick={handleClose}></div>
          <div 
            className={`tour-box ${currentStep?.targetId ? 'has-target' : ''}`}
            style={
              currentStep?.targetId
                ? undefined
                : {
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                  }
            }
          >
            <span className="tour-badge-step">
              Paso {currentStepIndex + 1} de {steps.length}
            </span>

            <div className="tour-content">
              <div className="tour-header-icon">
                {renderIcon(currentStep.icon)}
              </div>
              <h3>{currentStep.title}</h3>
              <p>{currentStep.desc}</p>
            </div>

            <div className="tour-actions">
              <button type="button" className="btn btn-secondary" onClick={handleClose}>
                Omitir
              </button>

              <div className="tour-nav-btns">
                {currentStepIndex > 0 && (
                  <button type="button" className="btn btn-secondary" onClick={handlePrev}>
                    Anterior
                  </button>
                )}
                <button type="button" className="btn btn-primary" onClick={handleNext}>
                  {currentStepIndex === steps.length - 1 ? '¡Listo, entendido!' : 'Siguiente'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
