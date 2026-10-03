import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/mandata")({
  beforeLoad: () => {
    throw redirect({ to: "/platform" });
  },
});
