import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/order-track")({
  beforeLoad: () => {
    throw redirect({ to: "/track" });
  },
});
