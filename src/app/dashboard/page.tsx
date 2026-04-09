"use client";
import { TopBar } from "@/components/layout/TopBar";

export default function DashboardPage() {
  return (
    <div>
      <TopBar onAddEntry={() => {}} />
      <div className="p-6">
        <p className="text-text-muted">Dashboard widgets loading...</p>
      </div>
    </div>
  );
}
