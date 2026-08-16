"use client";
import { useMemo, useState } from "react";
import { Plus, LayoutGrid, List } from "lucide-react";
import { useFinancialStore } from "@/lib/stores/financialStore";
import { useWorkforceStore } from "@/lib/stores/workforceStore";
import { WorkforceStats } from "./WorkforceStats";
import { EmployeeGrid } from "./EmployeeGrid";
import { ImpactPreview } from "./ImpactPreview";
import { EmployeeDetailModal } from "./EmployeeDetailModal";
import { AddEmployeeForm } from "@/components/forms/AddEmployeeForm";
import { EditEmployeeForm } from "@/components/forms/EditEmployeeForm";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils/formatters";

export function WorkforceBoard() {
  const { employees, businesses } = useFinancialStore();
  const { businessFilter, setBusinessFilter, sortBy, setSortBy, viewMode, setViewMode, editingEmployeeId, setEditingEmployee } = useWorkforceStore();
  const [showAddForm, setShowAddForm] = useState(false);

  const filtered = useMemo(
    () => businessFilter ? employees.filter((e) => e.businessId === businessFilter) : employees,
    [employees, businessFilter]
  );

  const editingEmployee = useMemo(
    () => employees.find((e) => e.id === editingEmployeeId),
    [employees, editingEmployeeId]
  );

  return (
    <div>
      {/* Stats bar */}
      <WorkforceStats />

      {/* Filter bar */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {/* Business filter pills */}
        <div className="flex gap-1">
          <button
            onClick={() => setBusinessFilter(null)}
            className={cn(
              "px-3 py-1.5 rounded-button text-xs font-semibold transition-all duration-150 border",
              !businessFilter ? "bg-accent-subtle text-accent border-accent/30" : "bg-transparent text-text-muted border-border-subtle hover:border-text-muted"
            )}
          >
            All
          </button>
          {businesses.map((biz) => (
            <button
              key={biz.id}
              onClick={() => setBusinessFilter(biz.id)}
              className={cn(
                "px-3 py-1.5 rounded-button text-xs font-semibold transition-all duration-150 border",
                businessFilter === biz.id ? "bg-accent-subtle text-accent border-accent/30" : "bg-transparent text-text-muted border-border-subtle hover:border-text-muted"
              )}
            >
              {biz.displayName}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* Sort */}
        <Select
          options={[
            { value: "name", label: "Sort: Name" },
            { value: "cost", label: "Sort: Cost" },
            { value: "startDate", label: "Sort: Date" },
            { value: "status", label: "Sort: Status" },
          ]}
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="w-32 !py-1.5 text-xs"
        />

        {/* View toggle */}
        <div className="flex border border-border-subtle rounded-button overflow-hidden">
          <button
            onClick={() => setViewMode("grid")}
            aria-label="Grid view"
            aria-pressed={viewMode === "grid"}
            className={cn(
              "p-1.5 transition-colors",
              viewMode === "grid" ? "bg-surface-elevated text-text-primary" : "text-text-faint hover:text-text-muted"
            )}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            aria-label="List view"
            aria-pressed={viewMode === "list"}
            className={cn(
              "p-1.5 transition-colors",
              viewMode === "list" ? "bg-surface-elevated text-text-primary" : "text-text-faint hover:text-text-muted"
            )}
          >
            <List className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Add employee button */}
        <Button size="sm" onClick={() => setShowAddForm(true)}>
          <Plus className="w-3.5 h-3.5" />
          Add Employee
        </Button>
      </div>

      {/* Employee grid/list */}
      <EmployeeGrid employees={filtered} businesses={businesses} onAddEmployee={() => setShowAddForm(true)} />

      {/* Aggregate impact preview */}
      <ImpactPreview />

      {/* Detail modal */}
      <EmployeeDetailModal />

      {/* Add Employee modal */}
      <Modal isOpen={showAddForm} onClose={() => setShowAddForm(false)} title="Add Employee">
        <AddEmployeeForm onClose={() => setShowAddForm(false)} />
      </Modal>

      {/* Edit Employee modal */}
      <Modal isOpen={!!editingEmployeeId} onClose={() => setEditingEmployee(null)} title="Edit Employee">
        {editingEmployee && <EditEmployeeForm employee={editingEmployee} onClose={() => setEditingEmployee(null)} />}
      </Modal>
    </div>
  );
}
