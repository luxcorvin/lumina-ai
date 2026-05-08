export type Role = "user" | "assistant";

export interface Attachment {
  id: string;
  name: string;
  mime: string;
  size: number;
  /** data URL for images, or text excerpt for text-like files */
  dataUrl?: string;
  text?: string;
  kind: "image" | "file";
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  createdAt: number;
  attachments?: Attachment[];
  tool?: "web_search" | "deep_research" | null;
}

export interface Chat {
  id: string;
  title: string;
  projectId: string | null;
  messages: Message[];
  updatedAt: number;
}

export type MemoryScope = "default" | "project_only";

export interface ProjectFile {
  id: string;
  name: string;
  mime: string;
  size: number;
  text?: string;
  addedAt: number;
}

export interface Project {
  id: string;
  name: string;
  emoji: string;
  color: string;
  description?: string;
  instructions?: string;
  memoryScope: MemoryScope;
  files: ProjectFile[];
  createdAt: number;
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
