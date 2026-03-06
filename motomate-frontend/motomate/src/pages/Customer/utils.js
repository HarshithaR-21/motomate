import { SERVICE_OPTIONS } from './constants';

export function convertTo24(timeStr) {
    if (!timeStr) return null;
    const parts = timeStr.trim().split(' ');
    if (parts.length === 1) return parts[0].includes(':') ? parts[0] : parts[0] + ':00';
    const [time, modifier] = parts;
    let [hours, minutes] = time.split(':').map(Number);
    if (modifier.toUpperCase() === 'PM' && hours !== 12) hours += 12;
    if (modifier.toUpperCase() === 'AM' && hours === 12) hours = 0;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
}

export function getPriceById(id) {
    return SERVICE_OPTIONS.find(s => s.id === id)?.price || 0;
}
