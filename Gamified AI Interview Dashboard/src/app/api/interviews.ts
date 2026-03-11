const API_GATEWAY = '/api';

export const fetchInterviewTemplates = async (token: string) => {
  const res = await fetch(`${API_GATEWAY}/interviews/templates`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error('Failed to load interview templates');
  }
  return res.json();
};

export const fetchUserSessions = async (token: string) => {
  const res = await fetch(`${API_GATEWAY}/interviews/sessions`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error('Failed to load interview sessions');
  }
  return res.json();
};

export const createInterviewSession = async (token: string, templateId: number, scheduledAt?: string) => {
  const queryParams = new URLSearchParams({ template_id: String(templateId) });
  if (scheduledAt) {
    queryParams.set('scheduled_at', scheduledAt);
  }

  const res = await fetch(`${API_GATEWAY}/interviews/sessions?${queryParams.toString()}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error('Failed to create interview session');
  }

  return res.json();
};

export const rescheduleInterviewSession = async (token: string, sessionId: number, scheduledAt: string) => {
  const queryParams = new URLSearchParams({ scheduled_at: scheduledAt });
  const res = await fetch(`${API_GATEWAY}/interviews/sessions/${sessionId}/reschedule?${queryParams.toString()}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error('Failed to reschedule interview session');
  }

  return res.json();
};

export const startInterviewSession = async (token: string, sessionId: number) => {
  const res = await fetch(`${API_GATEWAY}/interviews/sessions/${sessionId}/start`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error('Failed to start interview session');
  }

  return res.json();
};

export const cancelInterviewSession = async (token: string, sessionId: number) => {
  const res = await fetch(`${API_GATEWAY}/interviews/sessions/${sessionId}/cancel`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error('Failed to cancel interview session');
  }

  return res.json();
};
