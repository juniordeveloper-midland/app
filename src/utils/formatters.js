/**
 * Utility functions for date, time, and SOS message formatting.
 */

export function formatTime(dateInput) {
  if (!dateInput) return "--:--:--";
  const date = typeof dateInput === "number" || typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return "--:--:--";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
}

export function formatShortDate(dateInput) {
  if (!dateInput) return "";
  const date = typeof dateInput === "number" || typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

/**
 * Format elapsed seconds into HH:MM:SS
 */
export function formatElapsedTime(totalSeconds) {
  if (!totalSeconds || totalSeconds < 0) return "00:00:00";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  const pad = (num) => String(num).padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Generate Google Maps pin link from coordinates
 */
export function getGoogleMapsLink(lat, lng) {
  if (lat === undefined || lng === undefined) {
    return "https://maps.google.com";
  }
  return `https://maps.google.com/?q=${lat},${lng}`;
}

/**
 * Formats standard SOS payload string
 * e.g. "SOS! Guard Raj Kumar, FIEGE Birmingham, 18:42:00, location: https://maps.google.com/?q=13.0827,80.2707"
 */
export function generateSosMessage({ guardName, siteName, timestamp, lat, lng }) {
  const timeStr = timestamp ? formatTime(timestamp) : formatTime(new Date());
  const mapLink = getGoogleMapsLink(lat, lng);
  return `SOS! Guard ${guardName}, ${siteName}, ${timeStr}, location: ${mapLink}`;
}
