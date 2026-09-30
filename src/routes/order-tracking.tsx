import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/order-tracking")({
  beforeLoad: () => {
    throw redirect({ to: "/track" });
  },
});
