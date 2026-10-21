export function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function formatDateTime(date = new Date()) {
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(date);
}

export function generateRadicado(input = 0) {
  const year = new Date().getFullYear();
  if (Array.isArray(input)) {
    let maxNum = 0;
    for (const item of input) {
      const rawId = typeof item === 'string' ? item : item?.id;
      if (!rawId) continue;
      const match = String(rawId).match(/(\d+)$/);
      if (match) {
        const n = parseInt(match[1], 10);
        if (!isNaN(n) && n > maxNum) {
          maxNum = n;
        }
      }
    }
    const nextNum = String(maxNum + 1).padStart(4, '0');
    return `MG-PRI-${year}-${nextNum}`;
  }

  const num = typeof input === 'number' ? input : (parseInt(input, 10) || 0);
  const nextNum = String(num + 1).padStart(4, '0');
  return `MG-PRI-${year}-${nextNum}`;
}

export function formatTimeOnly(dateInput) {
  if (!dateInput) return '--:--';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '--:--';
  return new Intl.DateTimeFormat('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(d);
}

export function formatPresenceDate(dateInput) {
  if (!dateInput) return 'Sin registro reciente';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return 'Sin registro reciente';

  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();

  const timeStr = formatTimeOnly(d);

  if (isToday) {
    return `Hoy a las ${timeStr}`;
  }
  if (isYesterday) {
    return `Ayer a las ${timeStr}`;
  }

  const dateStr = new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    year: d.getFullYear() === now.getFullYear() ? undefined : 'numeric'
  }).format(d);

  return `${dateStr}, ${timeStr}`;
}

export function formatTimeAgo(dateInput) {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);

  if (diffSec < 45) return 'Hace un momento';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `Hace ${diffMin} min`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `Hace ${diffHours} h`;
  const diffDays = Math.floor(diffHours / 24);
  return `Hace ${diffDays} d`;
}

