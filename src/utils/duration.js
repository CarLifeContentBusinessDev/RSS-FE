export function formatDuration(totalSeconds) {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return "";

  const seconds = Math.round(totalSeconds);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n) => String(n).padStart(2, "0");

  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

export function parseDurationToSeconds(text) {
  if (!text || typeof text !== "string") return null;

  const parts = text.split(":").map((part) => Number(part.trim()));
  if (parts.length === 0 || parts.some((n) => !Number.isFinite(n))) {
    return null;
  }

  return parts.reduce((total, part) => total * 60 + part, 0);
}
