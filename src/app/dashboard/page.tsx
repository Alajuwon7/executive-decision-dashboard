"use client";
import { useEffect, useState } from "react";
import { Users, BrainCircuit, Target, GitBranch, Activity, Plus } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { DashboardGrid } from "@/components/layout/DashboardGrid";
import { WidgetWrapper } from "@/components/layout/WidgetWrapper";
import { FinancialCommandCenter } from "@/components/widgets/FinancialCommandCenter";
import { PlaceholderWidget } from "@/components/widgets/PlaceholderWidget";
import { useFinancialStore } from "@/lib/stores/financialStore";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { AddBusinessForm } from "@/components/forms/AddBusinessForm";
import { AddExpenseForm } from "@/components/forms/AddExpenseForm";
import { AddRevenueForm } from "@/components/forms/AddRevenueForm";
import { WorkforceBoard } from "@/components/widgets/WorkforceBoard";
import { AddEmployeeForm } from "@/components/forms/AddEmployeeForm";
import { OODAEngine } from "@/components/widgets/OODAEngine";
import { MetricSkeleton } from "@/components/ui/Skeleton";
import type { LayoutItem } from "@/lib/data/types";

const defaultLayouts: Record<string, LayoutItem[]> = {
  lg: [
    { i: "financial", x: 0, y: 0, w: 12, h: 8, minW: 6, minH: 4 },
    { i: "workforce", x: 0, y: 8, w: 6, h: 5, minW: 4, minH: 3 },
    { i: "ooda", x: 6, y: 8, w: 6, h: 5, minW: 3, minH: 2 },
    { i: "goals", x: 0, y: 13, w: 4, h: 3, minW: 3, minH: 2 },
    { i: "scenarios", x: 4, y: 13, w: 4, h: 3, minW: 3, minH: 2 },
    { i: "pulse", x: 8, y: 13, w: 4, h: 3, minW: 3, minH: 2 },
  ],
};

type FormType = "business" | "expense" | "revenue" | "employee" | null;

export default function DashboardPage() {
  const fetchAll = useFinancialStore((s) => s.fetchAll);
  const isLoading = useFinancialStore((s) => s.isLoading);
  const [formType, setFormType] = useState<FormType>(null);
  const [showFormPicker, setShowFormPicker] = useState(false);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleAddEntry = () => setShowFormPicker(true);
  const closeForm = () => { setFormType(null); setShowFormPicker(false); };

  return (
    <div>
      <TopBar onAddEntry={handleAddEntry} />
      <div className="p-4">
        {isLoading ? (
          <div className="grid grid-cols-4 gap-3">
            <MetricSkeleton /><MetricSkeleton /><MetricSkeleton /><MetricSkeleton />
          </div>
        ) : (
          <DashboardGrid defaultLayouts={defaultLayouts}>
            <div key="financial">
              <WidgetWrapper id="financial" title="Financial Command Center">
                <FinancialCommandCenter />
              </WidgetWrapper>
            </div>
            <div key="workforce">
              <WidgetWrapper id="workforce" title="Workforce Intelligence">
                <WorkforceBoard />
              </WidgetWrapper>
            </div>
            <div key="ooda">
              <WidgetWrapper id="ooda" title="OODA Decision Engine">
                <OODAEngine />
              </WidgetWrapper>
            </div>
            <div key="goals">
              <WidgetWrapper id="goals" title="Strategic Goals">
                <PlaceholderWidget title="Strategic Goals" description="OKR tracking and goal alignment" icon={Target} />
              </WidgetWrapper>
            </div>
            <div key="scenarios">
              <WidgetWrapper id="scenarios" title="Scenario Planning">
                <PlaceholderWidget title="Scenario Planning" description="What-if analysis and financial modeling" icon={GitBranch} />
              </WidgetWrapper>
            </div>
            <div key="pulse">
              <WidgetWrapper id="pulse" title="Business Pulse">
                <PlaceholderWidget title="Business Pulse" description="Real-time health scores and alerts" icon={Activity} />
              </WidgetWrapper>
            </div>
          </DashboardGrid>
        )}
      </div>

      <Modal isOpen={showFormPicker && !formType} onClose={closeForm} title="Add Entry">
        <div className="space-y-2">
          <Button variant="secondary" className="w-full justify-start" onClick={() => { setShowFormPicker(false); setFormType("business"); }}>
            <Plus className="w-4 h-4" /> Add Business
          </Button>
          <Button variant="secondary" className="w-full justify-start" onClick={() => { setShowFormPicker(false); setFormType("expense"); }}>
            <Plus className="w-4 h-4" /> Add Expense
          </Button>
          <Button variant="secondary" className="w-full justify-start" onClick={() => { setShowFormPicker(false); setFormType("revenue"); }}>
            <Plus className="w-4 h-4" /> Add Revenue Entry
          </Button>
          <Button variant="secondary" className="w-full justify-start" onClick={() => { setShowFormPicker(false); setFormType("employee"); }}>
            <Plus className="w-4 h-4" /> Add Employee
          </Button>
        </div>
      </Modal>

      <Modal isOpen={formType === "business"} onClose={closeForm} title="Add Business">
        <AddBusinessForm onClose={closeForm} />
      </Modal>
      <Modal isOpen={formType === "expense"} onClose={closeForm} title="Add Expense">
        <AddExpenseForm onClose={closeForm} />
      </Modal>
      <Modal isOpen={formType === "revenue"} onClose={closeForm} title="Add Revenue Entry">
        <AddRevenueForm onClose={closeForm} />
      </Modal>
      <Modal isOpen={formType === "employee"} onClose={closeForm} title="Add Employee">
        <AddEmployeeForm onClose={closeForm} />
      </Modal>
    </div>
  );
}
