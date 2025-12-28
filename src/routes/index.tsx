import { createFileRoute, Link } from "@tanstack/react-router";
import { open, ask } from "@tauri-apps/plugin-dialog";
import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { useState } from "react";
import { usePlayerStore } from "../stores/usePlayerStore";
import { AIChatInput } from "../components/AIChatInput";
export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const handleSend = (msg: string) => {
    alert(msg);
  };
  return (
    <div className="flex flex-col justify-center items-center h-full gap-4">
      <h1>本来无一物，何处惹尘埃。</h1>

      <AIChatInput onSend={handleSend} />
    </div>
  );
}
