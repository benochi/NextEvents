export type User = {
  id: number;
  messages: string[];
  eventSource: EventSource | null;
};