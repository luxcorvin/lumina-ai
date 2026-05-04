import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Chat, Message, Project } from "./chat-types";
import { uid } from "./chat-types";

interface ChatStore {
  projects: Project[];
  chats: Chat[];
  activeChatId: string | null;

  createChat: (projectId?: string | null) => string;
  setActiveChat: (id: string | null) => void;
  appendMessage: (chatId: string, msg: Message) => void;
  updateLastAssistant: (chatId: string, content: string) => void;
  setChatTitle: (chatId: string, title: string) => void;
  deleteChat: (chatId: string) => void;

  createProject: (name: string, emoji?: string) => string;
  renameProject: (id: string, name: string) => void;
  deleteProject: (id: string) => void;
}

const COLORS = ["#10b97c", "#38bdf8", "#fbbf24", "#f472b6", "#a78bfa", "#fb7185"];

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      projects: [
        { id: "p1", name: "Research", emoji: "🔬", color: "#10b97c" },
        { id: "p2", name: "Writing", emoji: "✍️", color: "#38bdf8" },
      ],
      chats: [],
      activeChatId: null,

      createChat: (projectId = null) => {
        const id = uid();
        const chat: Chat = {
          id,
          title: "New conversation",
          projectId,
          messages: [],
          updatedAt: Date.now(),
        };
        set({ chats: [chat, ...get().chats], activeChatId: id });
        return id;
      },
      setActiveChat: (id) => set({ activeChatId: id }),
      appendMessage: (chatId, msg) =>
        set({
          chats: get().chats.map((c) =>
            c.id === chatId
              ? {
                  ...c,
                  messages: [...c.messages, msg],
                  updatedAt: Date.now(),
                  title:
                    c.messages.length === 0 && msg.role === "user"
                      ? msg.content.slice(0, 60)
                      : c.title,
                }
              : c,
          ),
        }),
      updateLastAssistant: (chatId, content) =>
        set({
          chats: get().chats.map((c) => {
            if (c.id !== chatId) return c;
            const msgs = [...c.messages];
            const last = msgs[msgs.length - 1];
            if (last && last.role === "assistant") {
              msgs[msgs.length - 1] = { ...last, content };
            }
            return { ...c, messages: msgs, updatedAt: Date.now() };
          }),
        }),
      setChatTitle: (chatId, title) =>
        set({
          chats: get().chats.map((c) => (c.id === chatId ? { ...c, title } : c)),
        }),
      deleteChat: (chatId) =>
        set({
          chats: get().chats.filter((c) => c.id !== chatId),
          activeChatId: get().activeChatId === chatId ? null : get().activeChatId,
        }),

      createProject: (name, emoji = "📁") => {
        const id = uid();
        const project: Project = {
          id,
          name,
          emoji,
          color: COLORS[get().projects.length % COLORS.length],
        };
        set({ projects: [...get().projects, project] });
        return id;
      },
      renameProject: (id, name) =>
        set({ projects: get().projects.map((p) => (p.id === id ? { ...p, name } : p)) }),
      deleteProject: (id) =>
        set({
          projects: get().projects.filter((p) => p.id !== id),
          chats: get().chats.map((c) => (c.projectId === id ? { ...c, projectId: null } : c)),
        }),
    }),
    { name: "aether-chat-store" },
  ),
);
