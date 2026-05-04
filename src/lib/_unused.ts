import { create } from "zustand";

// Minimal local zustand-like store without adding dependency.
// (But we don't have zustand installed; implement a tiny store.)

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
