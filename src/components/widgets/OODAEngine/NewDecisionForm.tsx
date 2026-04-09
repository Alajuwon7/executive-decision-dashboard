"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useFinancialStore } from "@/lib/stores/financialStore";
import { useOODAStore } from "@/lib/stores/oodaStore";
import { repository } from "@/lib/data";
import { buildFinancialSnapshot } from "@/lib/utils/snapshot";
import { toast } from "sonner";
import type { DecisionType } from "@/lib/data/ooda-types";

const schema = z.object({
  title: z.string().min(2, "Title is required"),
  type: z.string().min(1, "Select a decision type"),
  relatedEmployeeId: z.string().optional(),
  relatedBusinessId: z.string().optional(),
  description: z.string().optional(),
  // Large purchase fields
  purchaseAmount: z.coerce.number().optional(),
  purchaseItem: z.string().optional(),
  purchaseTargetDate: z.string().optional(),
  // New hire fields
  proposedRole: z.string().optional(),
  estimatedSalary: z.coerce.number().optional(),
  // New business fields
  estimatedStartupCost: z.coerce.number().optional(),
  projectedMonthlyRevenue: z.coerce.number().optional(),
  // New product fields
  productName: z.string().optional(),
  developmentCost: z.coerce.number().optional(),
  projectedPrice: z.coerce.number().optional(),
  // Partnership fields
  partnerName: z.string().optional(),
  termsSummary: z.string().optional(),
  expectedValue: z.coerce.number().optional(),
});

type FormData = z.output<typeof schema>;

const DECISION_TYPES = [
  { value: "termination", label: "Termination Assessment" },
  { value: "large_purchase", label: "Large Purchase" },
  { value: "new_hire", label: "New Hire" },
  { value: "new_business", label: "New Business" },
  { value: "new_product", label: "New Product/Service" },
  { value: "partnership", label: "Partnership" },
  { value: "other", label: "Other" },
];

interface NewDecisionFormProps {
  onClose: () => void;
}

function buildDetailsFromForm(data: FormData): Record<string, any> {
  switch (data.type) {
    case "large_purchase":
      return {
        amount: data.purchaseAmount,
        item: data.purchaseItem,
        targetDate: data.purchaseTargetDate,
        description: data.description,
      };
    case "new_hire":
      return {
        proposedRole: data.proposedRole,
        estimatedSalary: data.estimatedSalary,
        business: data.relatedBusinessId,
        description: data.description,
      };
    case "new_business":
      return {
        businessName: data.title,
        estimatedStartupCost: data.estimatedStartupCost,
        projectedMonthlyRevenue: data.projectedMonthlyRevenue,
        description: data.description,
      };
    case "new_product":
      return {
        productName: data.productName,
        developmentCost: data.developmentCost,
        projectedPrice: data.projectedPrice,
        description: data.description,
      };
    case "partnership":
      return {
        partnerName: data.partnerName,
        termsSummary: data.termsSummary,
        expectedValue: data.expectedValue,
        description: data.description,
      };
    default:
      return { description: data.description };
  }
}

export function NewDecisionForm({ onClose }: NewDecisionFormProps) {
  const { businesses, employees, expenses, revenueEntries } = useFinancialStore();
  const { prefillType, prefillEmployeeId, prefillBusinessId, openDecision } = useOODAStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultEmployee = prefillEmployeeId ? employees.find((e) => e.id === prefillEmployeeId) : null;
  const defaultTitle = prefillType === "termination" && defaultEmployee
    ? `Review: ${defaultEmployee.name}`
    : "";

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      title: defaultTitle,
      type: prefillType ?? "",
      relatedEmployeeId: prefillEmployeeId ?? "",
      relatedBusinessId: prefillBusinessId ?? defaultEmployee?.businessId ?? "",
    },
  });

  const watchType = watch("type");

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const snapshot = buildFinancialSnapshot(businesses, employees, expenses, revenueEntries);
      const details = buildDetailsFromForm(data);

      const decision = await repository.createOODADecision({
        title: data.title,
        type: data.type as DecisionType,
        relatedEmployeeId: data.relatedEmployeeId || null,
        relatedBusinessId: data.relatedBusinessId || null,
        observeData: { ...snapshot, decisionDetails: details },
      });

      await repository.updateOODADecision(decision.id, { stage: "orient" });

      toast.success("Decision created");
      onClose();
      openDecision(decision.id, "orient");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to create decision");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4">
      <Select
        label="Decision Type"
        {...register("type")}
        error={errors.type?.message}
        placeholder="Select type"
        options={DECISION_TYPES}
      />

      <Input label="Title" {...register("title")} error={errors.title?.message} placeholder="e.g. Review: Sarah Chen" />

      {/* Termination: employee selector */}
      {watchType === "termination" && (
        <Select
          label="Related Employee"
          {...register("relatedEmployeeId")}
          placeholder="Select employee"
          options={employees.filter((e) => e.status === "active").map((e) => ({ value: e.id, label: `${e.name} — ${e.roleTitle}` }))}
        />
      )}

      {/* Large Purchase: amount, item, target date */}
      {watchType === "large_purchase" && (
        <>
          <Input label="Item / Description" {...register("purchaseItem")} placeholder="e.g. New office equipment" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Amount ($)" type="number" step="0.01" {...register("purchaseAmount")} placeholder="0.00" />
            <Input label="Target Date" type="date" {...register("purchaseTargetDate")} />
          </div>
        </>
      )}

      {/* New Hire: role, salary */}
      {watchType === "new_hire" && (
        <div className="grid grid-cols-2 gap-3">
          <Input label="Proposed Role" {...register("proposedRole")} placeholder="e.g. Marketing Manager" />
          <Input label="Estimated Annual Salary ($)" type="number" {...register("estimatedSalary")} placeholder="0" />
        </div>
      )}

      {/* New Business: startup cost, projected revenue */}
      {watchType === "new_business" && (
        <div className="grid grid-cols-2 gap-3">
          <Input label="Estimated Startup Cost ($)" type="number" {...register("estimatedStartupCost")} placeholder="0" />
          <Input label="Projected Monthly Revenue ($)" type="number" {...register("projectedMonthlyRevenue")} placeholder="0" />
        </div>
      )}

      {/* New Product: name, dev cost, price */}
      {watchType === "new_product" && (
        <>
          <Input label="Product Name" {...register("productName")} placeholder="e.g. Online Course Platform" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Development Cost ($)" type="number" {...register("developmentCost")} placeholder="0" />
            <Input label="Projected Unit Price ($)" type="number" step="0.01" {...register("projectedPrice")} placeholder="0" />
          </div>
        </>
      )}

      {/* Partnership: partner, terms, value */}
      {watchType === "partnership" && (
        <>
          <Input label="Partner Name" {...register("partnerName")} placeholder="e.g. Acme Corp" />
          <Input label="Terms Summary" {...register("termsSummary")} placeholder="Brief description of partnership terms" />
          <Input label="Expected Annual Value ($)" type="number" {...register("expectedValue")} placeholder="0" />
        </>
      )}

      {/* Business selector (all types) */}
      <Select
        label="Related Business"
        {...register("relatedBusinessId")}
        placeholder="Select business (optional)"
        options={businesses.map((b) => ({ value: b.id, label: b.displayName }))}
      />

      {/* Description (all types except termination which uses employee context) */}
      {watchType && watchType !== "termination" && (
        <div>
          <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">Additional Context</label>
          <textarea
            {...register("description")}
            placeholder="Any additional details or context for this decision..."
            className="w-full bg-bg border border-border rounded-[8px] px-3 py-2.5 text-sm text-text-primary placeholder:text-text-faint focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 min-h-[60px] resize-y"
          />
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
        <Button type="submit" isLoading={isSubmitting} className="flex-1">Start Decision</Button>
      </div>
    </form>
  );
}
