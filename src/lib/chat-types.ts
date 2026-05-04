export type Role = "user" | "assistant";

export interface Message {
  id: string;
  role: Role;
  content: string;
  createdAt: number;
}

export interface Chat {
  id: string;
  title: string;
  projectId: string | null;
  messages: Message[];
  updatedAt: number;
}

export interface Project {
  id: string;
  name: string;
  emoji: string;
  color: string;
  pinned?: boolean;
}

export const uid = () => Math.random().toString(36).slice(2, 10);

export function groupChatsByDate(chats: Chat[]) {
  const now = Date.now();
  const day = 86_400_000;
  const groups: Record<string, Chat[]> = {
    Today: [],
    Yesterday: [],
    "Last 7 Days": [],
    "Last 30 Days": [],
    Older: [],
  };
  for (const c of chats) {
    const diff = now - c.updatedAt;
    if (diff < day) groups.Today.push(c);
    else if (diff < day * 2) groups.Yesterday.push(c);
    else if (diff < day * 7) groups["Last 7 Days"].push(c);
    else if (diff < day * 30) groups["Last 30 Days"].push(c);
    else groups.Older.push(c);
  }
  return groups;
}
