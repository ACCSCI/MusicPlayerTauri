import { createFileRoute } from "@tanstack/react-router";
import { AIChatInput } from "../components/AIChatInput";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="flex flex-col justify-center items-center h-full gap-4">
      <h1>本来无一物，何处惹尘埃。</h1>
      <AIChatInput />
    </div>
  );
}