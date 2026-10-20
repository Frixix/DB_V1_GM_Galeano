import { useState, useEffect } from 'react';
import teacherService from '../services/teacherService.js';
import { getUserAvatar } from '../services/avatarService.js';

/**
 * Botón estándar de retorno al Panel Principal de Módulos
 */
export function SidebarBackBtn({ onBackToModules }) {
  if (!onBackToModules) return null;
  return (
    <div className="sidebar-section sidebar-section-modules-back">
      <button
        type="button"
        className="btn-sidebar-back-modules"
        onClick={onBackToModules}
        title="Volver al Panel Principal de Módulos"
      >
        <i className="ph-bold ph-squares-four"></i>
        <span>Volver a Módulos</span>
      </button>
    </div>
  );
}

/**
 * Tarjeta de Perfil & Dirección de Aula para Docente Titular (Modo No Privilegiado)
 */
export function TeacherOwnCard({
  currentUser,
  selectedGrade = null,
  onOpenProfile = null,
  cardTitle = 'Mi Rol & Dirección de Aula'
}) {
  if (!currentUser) return null;

  const currentUserKey = currentUser?.key || currentUser?.role || (currentUser?.name ? currentUser.name.toLowerCase().replace(/\s+/g, '') : null);
  const currentUserAvatar = (currentUserKey ? getUserAvatar(currentUserKey) : null) || currentUser?.avatar || null;

  return (
    <div className="sidebar-section teacher-own-card obs-teacher-own-card">
      <div className="sidebar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <i className="ph-bold ph-identification-card"></i>
          <span>{cardTitle}</span>
        </div>
        {onOpenProfile && (
          <span
            className="sidebar-profile-badge"
            title="Personalizar mi perfil y foto"
            onClick={() => onOpenProfile(currentUserKey)}
            role="button"
            tabIndex={0}
          >
            <i className="ph-bold ph-sliders"></i>
          </span>
        )}
      </div>

      <div className="teacher-badge-box obs-teacher-badge-box">
        <div className="teacher-badge-icon obs-teacher-badge-icon">
          {currentUserAvatar ? (
            <img
              src={currentUserAvatar}
              alt={currentUser.name}
              className="teacher-avatar-img"
              style={{ width: '100%', height: '100%', borderRadius: '6px', objectFit: 'cover' }}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const f = e.currentTarget.nextSibling;
                if (f) f.style.display = 'inline-block';
              }}
            />
          ) : null}
          <i
            className="ph-bold ph-chalkboard-teacher"
            style={{ display: currentUserAvatar ? 'none' : 'inline-block' }}
          ></i>
        </div>
        <div style={{ minWidth: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <strong style={{ display: 'block', fontSize: '0.9rem', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {currentUser.name}
            </strong>
            {currentUser.role === 'docente' && (
              <span style={{ fontSize: '0.62rem', background: '#fef3c7', color: '#92400e', padding: '1px 4px', borderRadius: '4px', fontWeight: 700 }}>
                Dir
              </span>
            )}
          </div>
          <p style={{ margin: 0, fontSize: '0.75rem', color: '#0f766e', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {selectedGrade ? `${selectedGrade} • ` : ''}{currentUser.label || 'Docente Titular'}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * TeacherAccordion: Componente Base Reutilizable para Sidebars
 * Unifica el acordeón de docentes ("subir y bajar"), presencia en vivo, avatares SVG,
 * estados seleccionados y modo de perfil docente titular en todos los módulos.
 */
export default function TeacherAccordion({
  currentUser = null,
  isPrivileged = true,
  selectedTeacher = 'all',
  currentTeacher = null,
  onSelectTeacher = null,
  onTeacherSelect = null,
  onReset = null,
  selectedGrade = null,
  isTeacherSelected = null,
  getTeacherTitle = null,
  allLabel = 'Todos los docentes',
  defaultExpanded = true,
  onlineMap = {},
  onlineCount = 0,
  onOpenConnectionsModal = null,
  onOpenProfile = null,
  sectionId = 'teacherSection',
  ownCardTitle = 'Mi Rol & Dirección de Aula',
  accentColor = '#059669'
}) {
  // Manejo de alias compatibles para selectedTeacher / currentTeacher
  const activeTeacher = (currentTeacher !== null && currentTeacher !== undefined)
    ? currentTeacher
    : selectedTeacher;

  // Manejo de docentes reactivos desde teacherService
  const [teachersList, setTeachersList] = useState(() => teacherService.getSidebarTeachers());

  useEffect(() => {
    const unsubscribe = teacherService.subscribe(() => {
      setTeachersList(teacherService.getSidebarTeachers());
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Estado del acordeón desplegable (subir / bajar)
  const [isTeacherExpanded, setIsTeacherExpanded] = useState(defaultExpanded);

  // Despacho de selección compatible con ambos callbacks
  const handleSelect = (teacherObj) => {
    if (onSelectTeacher) onSelectTeacher(teacherObj.name, teacherObj);
    else if (onTeacherSelect) onTeacherSelect(teacherObj.name, teacherObj);
  };

  // Despacho de restablecer a todos
  const handleReset = () => {
    if (onReset) {
      onReset();
    } else if (onSelectTeacher) {
      onSelectTeacher('all', null);
    } else if (onTeacherSelect) {
      onTeacherSelect('all', null);
    }
  };

  // CASO 1: Docente Titular No Privilegiada (Muestra su propia tarjeta de aula)
  if (!isPrivileged && currentUser) {
    return (
      <TeacherOwnCard
        currentUser={currentUser}
        selectedGrade={selectedGrade}
        onOpenProfile={onOpenProfile}
        cardTitle={ownCardTitle}
      />
    );
  }

  // CASO 2: Modo Directivo / Coordinador / Administrador (Acordeón de Selección Completo)
  return (
    <div className="sidebar-section" id={sectionId}>
      <div className="sidebar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          type="button"
          className="btn-header-teacher-accordion"
          onClick={() => setIsTeacherExpanded((prev) => !prev)}
          aria-expanded={isTeacherExpanded}
          title={isTeacherExpanded ? "Plegar docentes (subir)" : "Desplegar docentes (bajar)"}
        >
          <i className="ph-bold ph-users"></i>
          <span>Ver por Docente</span>
          <i className={`ph-bold ${isTeacherExpanded ? 'ph-caret-up' : 'ph-caret-down'} teacher-accordion-caret`}></i>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {activeTeacher !== 'all' && (
            <button
              type="button"
              className="btn-teacher-reset-chip"
              onClick={(e) => {
                e.stopPropagation();
                handleReset();
              }}
              title="Docente activo. Clic para restablecer a todos"
            >
              <i className="ph-bold ph-x"></i>
              <span>{activeTeacher}</span>
            </button>
          )}

          {onOpenConnectionsModal && (
            <button 
              type="button" 
              className="btn-header-presence-pill"
              onClick={onOpenConnectionsModal}
              title="Abrir panel de horarios y conexiones"
            >
              <span className="live-status-pulse"></span>
              <span>{onlineCount} en línea</span>
            </button>
          )}
        </div>
      </div>

      {/* Lista del acordeón desplegable */}
      {isTeacherExpanded && (
        <nav className="teacher-list teacher-list-dropdown">
          <button 
            type="button"
            className={`teacher-btn ${activeTeacher === 'all' ? 'active' : ''}`}
            onClick={handleReset}
            title={`Supervisión general de ${allLabel.toLowerCase()}`}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
              <i className="ph-bold ph-users-three"></i>
              <span>{allLabel}</span>
            </div>
            {activeTeacher === 'all' && (
              <i className="ph-bold ph-check" style={{ color: accentColor, fontSize: '0.9rem' }}></i>
            )}
          </button>

          {teachersList.map((t) => {
            const avatarUrl = getUserAvatar(t.key);
            const isOnline = onlineMap[t.key] || onlineMap[t.name];
            const isSelected = isTeacherSelected
              ? isTeacherSelected(t)
              : (activeTeacher === t.name || (activeTeacher === 'all' && selectedGrade && t.grade === selectedGrade));

            return (
              <button
                key={t.key}
                type="button"
                className={`teacher-btn ${t.isRectora ? 'teacher-rectora-btn' : ''} ${
                  isSelected ? 'active' : ''
                }`}
                onClick={() => handleSelect(t)}
                title={getTeacherTitle ? getTeacherTitle(t) : `Seleccionar ${t.name} (${t.label})`}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, overflow: 'hidden' }}>
                  <div className="teacher-avatar-mini">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={t.name}
                        className="teacher-avatar-img"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const f = e.currentTarget.nextSibling;
                          if (f) f.style.display = 'inline-block';
                        }}
                      />
                    ) : null}
                    <i
                      className={`ph-bold ${t.isRectora ? 'ph-crown' : 'ph-user'}`}
                      style={{
                        display: avatarUrl ? 'none' : 'inline-block',
                        color: t.isRectora ? '#d97706' : 'inherit'
                      }}
                    ></i>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0 }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {t.name}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{t.label}</span>
                  </div>
                </div>

                <span
                  className={`teacher-status-indicator ${isOnline ? 'online' : 'offline'}`}
                  title={isOnline ? 'En línea ahora' : 'Desconectado'}
                ></span>

                {onOpenProfile && (
                  <span
                    className="sidebar-profile-badge"
                    title={`Personalizar perfil de ${t.name}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenProfile(t.key);
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <i className="ph-bold ph-sliders"></i>
                  </span>
                )}

                {isSelected && (
                  <i className="ph-bold ph-check" style={{ color: accentColor, fontSize: '0.9rem', marginLeft: '4px' }}></i>
                )}
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
}
