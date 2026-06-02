import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/app/")({
  component: AppRedirect,
});

function AppRedirect() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate({ to: "/app/gestao", replace: true });
  }, [navigate]);
  return null;
}