import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Globe,
  LogOut,
  Search,
  MessageSquare,
  Trash2,
} from "lucide-react";
import { Logo } from "./Logo";
import { useChatStore } from "@/lib/chat-store";
import { groupChatsByDate } from "@/lib/chat-types";
import { cn } from "@/lib/utils";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  onOpenSettings: () => void;
}

export function Sidebar({ collapsed, onToggle, onOpenSettings }: SidebarProps) {
  const {
    projects,
    chats,
    activeChatId,
    activeProjectId,
    createChat,
    setActiveChat,
    setActiveProject,
    createProject,
    deleteChat,
    deleteProject,
  } = useChatStore();

  const [projectsOpen, setProjectsOpen] = useState(true);
  const [creatingProject, setCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--sidebar-w",
      collapsed ? "68px" : "304px",
    );
  }, [collapsed]);

  const filteredChats = chats.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase()),
  );
  const grouped = groupChatsByDate(filteredChats);

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 68 : 304 }}
      transition={{ type: "spring", stiffness: 280, damping: 32 }}
      className="relative z-20 flex h-screen flex-col border-r border-border bg-surface-1"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-5 pb-3">
        <AnimatePresence mode="wait">
          {!collapsed ? (
            <motion.div
              key="logo-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Logo />
            </motion.div>
          ) : (
            <motion.div
              key="logo-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="grid h-8 w-8 place-items-center rounded-xl"
              style={{ background: "var(--gradient-brand)" }}
            >
              <span className="font-display text-sm font-bold text-primary-foreground">Æ</span>
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={onToggle}
          className="rounded-md p-1.5 text-text-secondary transition-colors hover:bg-surface-3 hover:text-text-primary"
          aria-label="Toggle sidebar"
        >
          {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>

      {/* New chat */}
      <div className="px-3 pb-3">
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => createChat()}
          className={cn(
            "group relative flex w-full items-center gap-2 overflow-hidden rounded-xl px-3 py-2.5 text-sm font-medium text-primary-foreground transition-all",
            collapsed && "justify-center px-0",
          )}
          style={{ background: "var(--gradient-brand)", boxShadow: "var(--shadow-elegant)" }}
        >
          <span
            className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full"
            aria-hidden
          />
          <Plus size={16} strokeWidth={2.5} className="relative" />
          {!collapsed && <span className="relative">New chat</span>}
        </motion.button>
      </div>

      {!collapsed && (
        <div className="px-3 pb-2">
          <div className="relative">
            <Search
              size={14}
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-text-muted"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search chats…"
              className="w-full rounded-lg border border-border bg-surface-2 py-2 pr-3 pl-8 text-xs text-text-primary placeholder:text-text-muted focus:border-border-hover focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>
      )}

      {/* Scroll area */}
      <div className="flex-1 overflow-y-auto px-2 pb-3">
        {!collapsed && (
          <>
            {/* Projects */}
            <div className="mt-2 px-1">
              <button
                onClick={() => setProjectsOpen((o) => !o)}
                className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs font-semibold tracking-wider text-text-muted uppercase transition-colors hover:text-text-secondary"
              >
                <span className="flex items-center gap-1.5">
                  {projectsOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  Projects
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCreatingProject(true);
                    setProjectsOpen(true);
                  }}
                  className="rounded p-1 text-text-muted hover:bg-surface-3 hover:text-text-primary"
                  aria-label="New project"
                >
                  <Plus size={12} />
                </button>
              </button>

              <AnimatePresence initial={false}>
                {projectsOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-1 space-y-0.5">
                      {projects.map((p) => (
                        <ProjectRow
                          key={p.id}
                          emoji={p.emoji}
                          name={p.name}
                          color={p.color}
                          active={p.id === activeProjectId && !activeChatId}
                          onSelect={() => setActiveProject(p.id)}
                          onDelete={() => {
                            if (confirm(`Delete project "${p.name}"?`)) deleteProject(p.id);
                          }}
                        />
                      ))}
                      {creatingProject && (
                        <motion.form
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          onSubmit={(e) => {
                            e.preventDefault();
                            if (newProjectName.trim()) {
                              createProject(newProjectName.trim());
                              setNewProjectName("");
                            }
                            setCreatingProject(false);
                          }}
                          className="px-2 py-1"
                        >
                          <input
                            autoFocus
                            value={newProjectName}
                            onChange={(e) => setNewProjectName(e.target.value)}
                            onBlur={() => setCreatingProject(false)}
                            placeholder="Project name…"
                            className="w-full rounded-md border border-border bg-surface-2 px-2 py-1.5 text-sm focus:border-primary focus:outline-none"
                          />
                        </motion.form>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Recent */}
            <div className="mt-5 px-1">
              <div className="px-2 pb-1 text-xs font-semibold tracking-wider text-text-muted uppercase">
                Recent
              </div>
              {chats.length === 0 && (
                <div className="px-2 py-3 text-xs text-text-muted">
                  Your conversations will appear here.
                </div>
              )}
              {(["Today", "Yesterday", "Last 7 Days", "Last 30 Days", "Older"] as const).map(
                (label) => {
                  const items = grouped[label];
                  if (!items || items.length === 0) return null;
                  return (
                    <div key={label} className="mt-2">
                      <div className="px-2 py-1 text-[10px] font-medium tracking-wide text-text-muted uppercase">
                        {label}
                      </div>
                      <div className="space-y-0.5">
                        {items.map((c) => (
                          <ChatRow
                            key={c.id}
                            id={c.id}
                            title={c.title}
                            active={c.id === activeChatId}
                            onSelect={() => setActiveChat(c.id)}
                            onDelete={() => deleteChat(c.id)}
                          />
                        ))}
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          </>
        )}

        {collapsed && (
          <div className="mt-3 flex flex-col items-center gap-1">
            <CollapsedIcon
              icon={<Search size={16} />}
              label="Search"
              onClick={onToggle}
            />
            {chats.slice(0, 8).map((c) => (
              <CollapsedIcon
                key={c.id}
                icon={<MessageSquare size={15} />}
                label={c.title}
                active={c.id === activeChatId}
                onClick={() => setActiveChat(c.id)}
              />
            ))}
            {projects.length > 0 && <div className="my-1 h-px w-6 bg-border" />}
            {projects.slice(0, 6).map((p) => (
              <CollapsedIcon
                key={p.id}
                icon={<span className="text-base leading-none">{p.emoji}</span>}
                label={p.name}
                active={p.id === activeProjectId && !activeChatId}
                onClick={() => setActiveProject(p.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* User profile */}
      <div ref={profileRef} className="relative border-t border-border p-3">
        <button
          onClick={() => setProfileOpen((o) => !o)}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-surface-3",
            collapsed && "justify-center",
          )}
        >
          <div className="relative">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-surface-4 font-semibold text-text-primary">
              A
            </div>
            <span className="absolute right-0 bottom-0 h-2 w-2 rounded-full border border-surface-1 bg-success" />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1 text-left">
              <div className="truncate text-sm font-medium">Anonymous</div>
              <div className="truncate text-xs text-text-muted">Free plan</div>
            </div>
          )}
        </button>

        <AnimatePresence>
          {profileOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 6 }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
                transition: { type: "spring", stiffness: 500, damping: 28 },
              }}
              exit={{ opacity: 0, scale: 0.9, y: 4, transition: { duration: 0.12 } }}
              className="glass absolute bottom-[68px] left-3 z-50 w-64 rounded-xl p-2 shadow-2xl"
            >
              <div className="flex items-center gap-3 px-3 py-2.5">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-surface-4 font-semibold">
                  A
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">Anonymous</div>
                  <div className="truncate text-xs text-text-muted">guest@aether.app</div>
                </div>
              </div>
              <div className="my-1 h-px bg-border" />
              <PopupItem
                icon={<Settings size={14} />}
                label="Settings"
                onClick={() => {
                  setProfileOpen(false);
                  onOpenSettings();
                }}
              />
              <PopupItem icon={<Globe size={14} />} label="Language" />
              <div className="my-1 h-px bg-border" />
              <PopupItem icon={<LogOut size={14} />} label="Log out" danger />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.aside>
  );
}

function CollapsedIcon({
  icon,
  label,
  onClick,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={cn(
        "group relative grid h-9 w-9 place-items-center rounded-lg transition-colors",
        active
          ? "bg-surface-3 text-text-primary"
          : "text-text-secondary hover:bg-surface-3 hover:text-text-primary",
      )}
    >
      {icon}
      <span className="pointer-events-none absolute left-full z-50 ml-2 hidden whitespace-nowrap rounded-md border border-border bg-surface-2 px-2 py-1 text-[11px] text-text-primary shadow-lg group-hover:block">
        {label}
      </span>
    </button>
  );
}

function PopupItem({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-surface-3",
        danger ? "text-destructive" : "text-text-primary",
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function ChatRow({
  title,
  active,
  onSelect,
  onDelete,
}: {
  id: string;
  title: string;
  active: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const [hover, setHover] = useState(false);
  const [menu, setMenu] = useState(false);
  return (
    <div
      className="relative"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => {
        setHover(false);
        setMenu(false);
      }}
    >
      <button
        onClick={onSelect}
        className={cn(
          "group flex w-full items-center rounded-md py-1.5 pr-2 pl-3 text-sm transition-all",
          active
            ? "border-l-2 border-primary bg-surface-3 text-text-primary"
            : "border-l-2 border-transparent text-text-secondary hover:bg-surface-2 hover:text-text-primary",
        )}
      >
        <span className="truncate">{title}</span>
      </button>
      {hover && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMenu((m) => !m);
          }}
          className="absolute top-1/2 right-1 -translate-y-1/2 rounded p-1 text-text-muted hover:bg-surface-4 hover:text-text-primary"
        >
          <MoreHorizontal size={12} />
        </button>
      )}
      <AnimatePresence>
        {menu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass absolute top-7 right-1 z-30 w-36 rounded-lg p-1 shadow-xl"
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
                setMenu(false);
              }}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-destructive hover:bg-surface-3"
            >
              <Trash2 size={12} />
              Delete
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ProjectRow({
  emoji,
  name,
  color,
  active,
  onSelect,
  onDelete,
}: {
  emoji: string;
  name: string;
  color: string;
  active: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const [hover, setHover] = useState(false);
  const [menu, setMenu] = useState(false);
  return (
    <div
      className="relative"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => {
        setHover(false);
        setMenu(false);
      }}
    >
      <button
        onClick={onSelect}
        className={cn(
          "group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
          active
            ? "bg-surface-3 text-text-primary"
            : "text-text-secondary hover:bg-surface-3 hover:text-text-primary",
        )}
      >
        <span className="text-base">{emoji}</span>
        <span className="truncate">{name}</span>
        <span
          className="ml-auto h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: color }}
        />
      </button>
      {hover && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMenu((m) => !m);
          }}
          className="absolute top-1/2 right-4 -translate-y-1/2 rounded p-1 text-text-muted hover:bg-surface-4 hover:text-text-primary"
        >
          <MoreHorizontal size={12} />
        </button>
      )}
      <AnimatePresence>
        {menu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass absolute top-7 right-1 z-30 w-36 rounded-lg p-1 shadow-xl"
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
                setMenu(false);
              }}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-destructive hover:bg-surface-3"
            >
              <Trash2 size={12} />
              Delete
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
