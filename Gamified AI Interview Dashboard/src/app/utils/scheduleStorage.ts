const STORAGE_KEY = 'interview_schedule_times';

export const loadScheduleTimes = (): Record<string, string> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
};

export const saveScheduleTimes = (map: Record<string, string>) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
};

export const removeScheduledTime = (sessionId: number) => {
  const map = loadScheduleTimes();
  delete map[String(sessionId)];
  saveScheduleTimes(map);
};

export const getScheduledTime = (sessionId: number): string | null => {
  const map = loadScheduleTimes();
  return map[String(sessionId)] || null;
};
