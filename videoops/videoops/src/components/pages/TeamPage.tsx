"use client";

import TeamManagement from "./team/TeamManagement";

export default function TeamPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  return <TeamManagement onNavigate={onNavigate} />;
}
