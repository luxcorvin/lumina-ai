import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Toaster } from "sonner";
import { Sidebar } from "@/components/Sidebar";
import { ChatWindow } from "@/components/chat/ChatWindow";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const [collapsed, setCollapsed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        onOpenSettings={() => setSettingsOpen(true)}
      />
      <main className="relative flex-1 overflow-hidden">
        <ChatWindow />
      </main>
      <Toaster
        theme="dark"
        position="top-center"
        toastOptions={{
          style: {
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            color: "var(--text-primary)",
          },
        }}
      />
      {settingsOpen && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm"
          onClick={() => setSettingsOpen(false)}
        >
          <div
            className="glass w-full max-w-md rounded-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-display text-lg font-semibold">Settings</h2>
            <p className="mt-2 text-sm text-text-secondary">
              Full settings panel coming next. (Phase 1 ships sidebar + chat + streaming AI.)
            </p>
            <button
              onClick={() => setSettingsOpen(false)}
              className="mt-4 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
