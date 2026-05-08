import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Toaster } from "sonner";
import { Sidebar } from "@/components/Sidebar";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { SettingsModal } from "@/components/SettingsModal";
import { ThemeBridge } from "@/components/ThemeBridge";
import { CreateProjectModal } from "@/components/CreateProjectModal";
import { useUIStore } from "@/lib/ui-store";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const [collapsed, setCollapsed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { createProjectOpen, closeCreateProject } = useUIStore();

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      <ThemeBridge />
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        onOpenSettings={() => setSettingsOpen(true)}
      />
      <main className="relative min-w-0 flex-1 overflow-hidden">
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
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <CreateProjectModal open={createProjectOpen} onClose={closeCreateProject} />
    </div>
  );
}
