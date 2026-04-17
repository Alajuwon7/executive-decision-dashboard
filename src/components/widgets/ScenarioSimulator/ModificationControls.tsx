"use client";
import { useState } from "react";
import { Plus, X } from "lucide-react";
import { useFinancialStore } from "@/lib/stores/financialStore";
import { useScenarioStore } from "@/lib/stores/scenarioStore";
import type { ScenarioModification } from "@/lib/data/types";
import { cn } from "@/lib/utils/formatters";
import { formatCompactCurrency } from "@/lib/utils/currency";

type ModKind =
  | "adjust_employee"
  | "remove_employee"
  | "add_employee"
  | "adjust_expense"
  | "remove_expense"
  | "add_expense"
  | "add_revenue"
  | "adjust_draw"
  | "custom";

const KIND_LABELS: Record<ModKind, string> = {
  adjust_employee: "Adjust Employee",
  remove_employee: "Remove Employee",
  add_employee: "Add Employee",
  adjust_expense: "Adjust Expense",
  remove_expense: "Remove Expense",
  add_expense: "Add Expense",
  add_revenue: "Add Revenue Source",
  adjust_draw: "Adjust Personal Draw",
  custom: "Custom Adjustment",
};

export function ModificationControls() {
  const { employees, expenses, businesses, personalDraw } = useFinancialStore();
  const addModification = useScenarioStore((s) => s.addModification);
  const removeModification = useScenarioStore((s) => s.removeModification);
  const modifications = useScenarioStore((s) => s.pendingModifications);

  const [kind, setKind] = useState<ModKind>("adjust_employee");
  const [form, setForm] = useState<Record<string, any>>({});

  const activeEmployees = employees.filter((e) => e.status === "active");
  const activeExpenses = expenses.filter((e) => e.isActive);

  const submit = () => {
    let mod: ScenarioModification | null = null;

    if (kind === "adjust_employee") {
      const emp = activeEmployees.find((e) => e.id === form.employeeId);
      if (!emp) return;
      const field = (form.field ?? "hoursPerWeek") as "hoursPerWeek" | "rate";
      const oldValue = field === "rate" ? emp.rate : (emp.hoursPerWeek ?? 40);
      const newValue = Number(form.newValue ?? oldValue);
      mod = {
        type: "adjust_employee",
        employeeId: emp.id,
        employeeName: emp.name,
        field,
        oldValue,
        newValue,
      };
    } else if (kind === "remove_employee") {
      const emp = activeEmployees.find((e) => e.id === form.employeeId);
      if (!emp) return;
      const monthlySavings = emp.compensationType === "hourly"
        ? (emp.rate * (emp.hoursPerWeek ?? 40) * 4.345)
        : emp.rate / 12;
      mod = { type: "remove_employee", employeeId: emp.id, employeeName: emp.name, monthlySavings };
    } else if (kind === "add_employee") {
      if (!form.name || !form.monthlyCost) return;
      mod = { type: "add_employee", name: form.name, role: form.role ?? "", monthlyCost: Number(form.monthlyCost) };
    } else if (kind === "adjust_expense") {
      const exp = activeExpenses.find((e) => e.id === form.expenseId);
      if (!exp) return;
      mod = {
        type: "adjust_expense",
        expenseId: exp.id,
        expenseName: exp.name,
        oldAmount: exp.amount,
        newAmount: Number(form.newAmount ?? exp.amount),
      };
    } else if (kind === "remove_expense") {
      const exp = activeExpenses.find((e) => e.id === form.expenseId);
      if (!exp) return;
      mod = {
        type: "remove_expense",
        expenseId: exp.id,
        expenseName: exp.name,
        monthlySavings: exp.amount,
      };
    } else if (kind === "add_expense") {
      if (!form.name || !form.amount) return;
      mod = {
        type: "add_expense",
        name: form.name,
        category: form.category ?? "Other",
        amount: Number(form.amount),
      };
    } else if (kind === "add_revenue") {
      if (!form.description || !form.monthlyAmount) return;
      const biz = businesses.find((b) => b.id === form.businessId) ?? businesses[0];
      if (!biz) return;
      mod = {
        type: "add_revenue",
        description: form.description,
        monthlyAmount: Number(form.monthlyAmount),
        businessId: biz.id,
        businessName: biz.displayName,
      };
    } else if (kind === "adjust_draw") {
      const oldDraw = (personalDraw?.his ?? 0) + (personalDraw?.hers ?? 0);
      mod = { type: "adjust_draw", oldDraw, newDraw: Number(form.newDraw ?? oldDraw) };
    } else if (kind === "custom") {
      if (!form.label || !form.monthlyImpact) return;
      mod = {
        type: "custom",
        label: form.label,
        monthlyImpact: Number(form.monthlyImpact),
        description: form.description ?? "",
      };
    }

    if (mod) {
      addModification(mod);
      setForm({});
    }
  };

  const inputCls = "bg-surface border border-border-subtle rounded-button px-2.5 py-1.5 text-xs text-text-primary placeholder:text-text-faint focus:outline-none focus:border-accent w-full";

  return (
    <div className="space-y-3">
      <div>
        <p className="text-[10px] font-semibold text-text-faint uppercase tracking-wider mb-1.5">Add Modification</p>
        <select
          value={kind}
          onChange={(e) => {
            setKind(e.target.value as ModKind);
            setForm({});
          }}
          className={inputCls}
        >
          {Object.entries(KIND_LABELS).map(([k, label]) => (
            <option key={k} value={k}>{label}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {(kind === "adjust_employee" || kind === "remove_employee") && (
          <select
            value={form.employeeId ?? ""}
            onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
            className={cn(inputCls, "col-span-2")}
          >
            <option value="">Select employee...</option>
            {activeEmployees.map((e) => (
              <option key={e.id} value={e.id}>{e.name} — {e.roleTitle}</option>
            ))}
          </select>
        )}
        {kind === "adjust_employee" && (
          <>
            <select
              value={form.field ?? "hoursPerWeek"}
              onChange={(e) => setForm({ ...form, field: e.target.value })}
              className={inputCls}
            >
              <option value="hoursPerWeek">Hours/week</option>
              <option value="rate">Rate</option>
            </select>
            <input
              type="number"
              placeholder="New value"
              value={form.newValue ?? ""}
              onChange={(e) => setForm({ ...form, newValue: e.target.value })}
              className={inputCls}
            />
          </>
        )}
        {kind === "add_employee" && (
          <>
            <input placeholder="Name" value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} />
            <input placeholder="Role" value={form.role ?? ""} onChange={(e) => setForm({ ...form, role: e.target.value })} className={inputCls} />
            <input type="number" placeholder="Monthly cost" value={form.monthlyCost ?? ""} onChange={(e) => setForm({ ...form, monthlyCost: e.target.value })} className={cn(inputCls, "col-span-2")} />
          </>
        )}
        {(kind === "adjust_expense" || kind === "remove_expense") && (
          <select
            value={form.expenseId ?? ""}
            onChange={(e) => setForm({ ...form, expenseId: e.target.value })}
            className={cn(inputCls, "col-span-2")}
          >
            <option value="">Select expense...</option>
            {activeExpenses.map((e) => (
              <option key={e.id} value={e.id}>{e.name} — {formatCompactCurrency(e.amount)}</option>
            ))}
          </select>
        )}
        {kind === "adjust_expense" && (
          <input type="number" placeholder="New amount" value={form.newAmount ?? ""} onChange={(e) => setForm({ ...form, newAmount: e.target.value })} className={cn(inputCls, "col-span-2")} />
        )}
        {kind === "add_expense" && (
          <>
            <input placeholder="Name" value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} />
            <input placeholder="Category" value={form.category ?? ""} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputCls} />
            <input type="number" placeholder="Monthly amount" value={form.amount ?? ""} onChange={(e) => setForm({ ...form, amount: e.target.value })} className={cn(inputCls, "col-span-2")} />
          </>
        )}
        {kind === "add_revenue" && (
          <>
            <input placeholder="Description" value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} className={cn(inputCls, "col-span-2")} />
            <input type="number" placeholder="Monthly amount" value={form.monthlyAmount ?? ""} onChange={(e) => setForm({ ...form, monthlyAmount: e.target.value })} className={inputCls} />
            <select value={form.businessId ?? ""} onChange={(e) => setForm({ ...form, businessId: e.target.value })} className={inputCls}>
              <option value="">Business...</option>
              {businesses.map((b) => <option key={b.id} value={b.id}>{b.displayName}</option>)}
            </select>
          </>
        )}
        {kind === "adjust_draw" && (
          <input type="number" placeholder="New draw" value={form.newDraw ?? ""} onChange={(e) => setForm({ ...form, newDraw: e.target.value })} className={cn(inputCls, "col-span-2")} />
        )}
        {kind === "custom" && (
          <>
            <input placeholder="Label" value={form.label ?? ""} onChange={(e) => setForm({ ...form, label: e.target.value })} className={inputCls} />
            <input type="number" placeholder="Monthly impact (+/-)" value={form.monthlyImpact ?? ""} onChange={(e) => setForm({ ...form, monthlyImpact: e.target.value })} className={inputCls} />
            <input placeholder="Description" value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} className={cn(inputCls, "col-span-2")} />
          </>
        )}
      </div>

      <button
        onClick={submit}
        className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-accent border border-accent/40 bg-accent-subtle hover:bg-accent/20 rounded-button py-2 transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        Add to Scenario
      </button>

      {modifications.length > 0 && (
        <div className="pt-2">
          <p className="text-[10px] font-semibold text-text-faint uppercase tracking-wider mb-1.5">
            Modifications ({modifications.length})
          </p>
          <div className="space-y-1">
            {modifications.map((m, i) => (
              <div key={i} className="flex items-center justify-between bg-surface-elevated border border-border-subtle rounded-button px-2.5 py-1.5">
                <span className="text-xs text-text-muted truncate flex-1">{describeMod(m)}</span>
                <button onClick={() => removeModification(i)} className="text-text-faint hover:text-danger ml-2">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function describeMod(m: ScenarioModification): string {
  switch (m.type) {
    case "adjust_employee":
      return `Adjust ${m.employeeName}: ${m.field} ${m.oldValue}→${m.newValue}`;
    case "remove_employee":
      return `Remove ${m.employeeName} (-${formatCompactCurrency(m.monthlySavings)}/mo)`;
    case "add_employee":
      return `Add ${m.name} (${formatCompactCurrency(m.monthlyCost)}/mo)`;
    case "adjust_expense":
      return `${m.expenseName}: ${formatCompactCurrency(m.oldAmount)}→${formatCompactCurrency(m.newAmount)}`;
    case "remove_expense":
      return `Remove ${m.expenseName} (-${formatCompactCurrency(m.monthlySavings)}/mo)`;
    case "add_expense":
      return `Add ${m.name}: ${formatCompactCurrency(m.amount)}/mo`;
    case "add_revenue":
      return `+${formatCompactCurrency(m.monthlyAmount)}/mo — ${m.description}`;
    case "adjust_draw":
      return `Personal draw ${formatCompactCurrency(m.oldDraw)}→${formatCompactCurrency(m.newDraw)}`;
    case "custom":
      return `${m.label} (${m.monthlyImpact >= 0 ? "+" : ""}${formatCompactCurrency(m.monthlyImpact)}/mo)`;
  }
}
