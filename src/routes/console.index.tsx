import { createFileRoute } from "@tanstack/react-router";
import { ConstituencyConsole } from "@/components/console/constituency-console";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/console/")({
  head: () =>
    pageHead(
      "Console | mandata.ai",
      "Sample constituency console for AC-25 Panipat City. Booth heat, Jan-Sunwai, turnout, and weekly contacts.",
      "/console",
    ),
  component: ConsolePage,
});

function ConsolePage() {
  return (
    <main className="flex flex-1 flex-col">
      <ConstituencyConsole />
    </main>
  );
}
