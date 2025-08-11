/**
 * Date utility functions for QuickCourt backend
 */

/**
 * Format date to YYYY-MM-DD
 */
const formatDate = (date) => {
  return new Date(date).toISOString().split('T')[0];
};

/**
 * Format time to HH:MM
 */
const formatTime = (date) => {
  return new Date(date).toTimeString().split(' ')[0].substring(0, 5);
};

/**
 * Get start and end of day
 */
const getStartOfDay = (date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
};

const getEndOfDay = (date) => {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end;
};

/**
 * Get date range for different periods
 */
const getDateRange = (period) => {
  const now = new Date();
  let startDate, endDate = now;

  switch (period) {
    case 'today':
      startDate = getStartOfDay(now);
      endDate = getEndOfDay(now);
      break;
    case 'yesterday':
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      startDate = getStartOfDay(yesterday);
      endDate = getEndOfDay(yesterday);
      break;
    case 'week':
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - startDate.getDay());
      startDate = getStartOfDay(startDate);
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'quarter':
      const quarter = Math.floor(now.getMonth() / 3);
      startDate = new Date(now.getFullYear(), quarter * 3, 1);
      break;
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    case 'last7days':
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'last30days':
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 30);
      break;
    default:
      startDate = getStartOfDay(now);
  }

  return { startDate, endDate };
};

/**
 * Check if date is in the past
 */
const isPastDate = (date) => {
  const today = getStartOfDay(new Date());
  const checkDate = getStartOfDay(new Date(date));
  return checkDate < today;
};

/**
 * Check if date is in the future
 */
const isFutureDate = (date) => {
  const today = getStartOfDay(new Date());
  const checkDate = getStartOfDay(new Date(date));
  return checkDate > today;
};

/**
 * Get days between two dates
 */
const getDaysBetween = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Get hours between two times (HH:MM format)
 */
const getHoursBetween = (startTime, endTime) => {
  const [startHours, startMinutes] = startTime.split(':').map(Number);
  const [endHours, endMinutes] = endTime.split(':').map(Number);
  
  const startTotalMinutes = startHours * 60 + startMinutes;
  const endTotalMinutes = endHours * 60 + endMinutes;
  
  return (endTotalMinutes - startTotalMinutes) / 60;
};

/**
 * Check if time is within operating hours
 */
const isWithinOperatingHours = (time, operatingHours, dayOfWeek) => {
  const daySchedule = operatingHours[dayOfWeek.toLowerCase()];
  
  if (!daySchedule || daySchedule.closed) {
    return false;
  }

  if (!daySchedule.open || !daySchedule.close) {
    return true; // No specific hours set, assume always open
  }

  return time >= daySchedule.open && time <= daySchedule.close;
};

/**
 * Generate time slots for a day
 */
const generateTimeSlots = (startHour = 6, endHour = 23, intervalMinutes = 60) => {
  const slots = [];
  
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += intervalMinutes) {
      const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const endMinute = minute + intervalMinutes;
      const endHour = endMinute >= 60 ? hour + 1 : hour;
      const endMin = endMinute >= 60 ? endMinute - 60 : endMinute;
      const endTime = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;
      
      if (endHour <= endHour) {
        slots.push({ startTime, endTime });
      }
    }
  }
  
  return slots;
};

/**
 * Get day of week from date
 */
const getDayOfWeek = (date) => {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[new Date(date).getDay()];
};

/**
 * Add days to date
 */
const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * Add hours to date
 */
const addHours = (date, hours) => {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
};

/**
 * Format date for display
 */
const formatDisplayDate = (date, locale = 'en-IN') => {
  return new Date(date).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Format date and time for display
 */
const formatDisplayDateTime = (date, locale = 'en-IN') => {
  return new Date(date).toLocaleString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Get relative time (e.g., "2 hours ago", "in 3 days")
 */
const getRelativeTime = (date) => {
  const now = new Date();
  const diffMs = now - new Date(date);
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return 'just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } else {
    return formatDisplayDate(date);
  }
};

module.exports = {
  formatDate,
  formatTime,
  getStartOfDay,
  getEndOfDay,
  getDateRange,
  isPastDate,
  isFutureDate,
  getDaysBetween,
  getHoursBetween,
  isWithinOperatingHours,
  generateTimeSlots,
  getDayOfWeek,
  addDays,
  addHours,
  formatDisplayDate,
  formatDisplayDateTime,
  getRelativeTime,
};
