export type QueuedRequest = {
  id: string;
  path: string;
  method: string;
  body?: unknown;
  createdAt: string;
};

const QUEUE_KEY = 'launchx-project-os:offline-queue';

export function getOfflineQueue(): QueuedRequest[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]') as QueuedRequest[];
  } catch {
    return [];
  }
}

export function queueOfflineRequest(request: Omit<QueuedRequest, 'id' | 'createdAt'>) {
  const queue = getOfflineQueue();
  queue.push({
    ...request,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  });
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export async function flushOfflineQueue(apiBase: string, token: string) {
  const queue = getOfflineQueue();
  if (!queue.length || !token) return { flushed: 0 };

  const remaining: QueuedRequest[] = [];
  let flushed = 0;

  for (const item of queue) {
    try {
      const response = await fetch(`${apiBase.replace(/\/$/, '')}${item.path}`, {
        method: item.method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: item.body ? JSON.stringify(item.body) : undefined,
      });
      if (!response.ok) throw new Error('Replay failed');
      flushed += 1;
    } catch {
      remaining.push(item);
    }
  }

  localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
  return { flushed };
}
