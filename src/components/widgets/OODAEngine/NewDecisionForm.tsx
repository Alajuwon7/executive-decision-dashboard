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

      const decision = await repository.createOODADecision({
        title: data.title,
        type: data.type as DecisionType,
        relatedEmployeeId: data.relatedEmployeeId || null,
        relatedBusinessId: data.relatedBusinessId || null,
        observeData: snapshot,
      });

      // Advance to orient stage immediately
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

      {watchType === "termination" && (
        <Select
          label="Related Employee"
          {...register("relatedEmployeeId")}
          placeholder="Select employee"
          options={employees.filter((e) => e.status === "active").map((e) => ({ value: e.id, label: `${e.name} — ${e.roleTitle}` }))}
        />
      )}

      <Select
        label="Related Business"
        {...register("relatedBusinessId")}
        placeholder="Select business (optional)"
        options={businesses.map((b) => ({ value: b.id, label: b.displayName }))}
      />

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
        <Button type="submit" isLoading={isSubmitting} className="flex-1">Start Decision</Button>
      </div>
    </form>
  );
}
