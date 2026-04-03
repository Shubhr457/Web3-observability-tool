export interface Notification {
  type: string;
  severity: string;
  message: string;
  metadata: Record<string, unknown>;
}

// Stub — extend with email / Slack / webhook in production
export function sendNotification(n: Notification): void {
  console.warn(`[ALERT ${n.severity.toUpperCase()}] ${n.message}`, n.metadata);
}
