"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useGoalStore } from "@/lib/stores/goalStore";
import type { CreateGoal } from "@/lib/data/types";

const schema = z.object({
  owner: z.enum(["his", "hers", "shared", "company"]),
  type: z.enum(["personal", "company", "operational"]),
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().optional(),
  itemName: z.string().optional(),
  targetValue: z.coerce.number().optional(),
  targetDate: z.string().optional(),
  revenueTarget: z.coerce.number().optional(),
  notes: z.string().optional(),
});

type FormData = z.output<typeof schema>;

export function AddGoalForm({ onClose }: { onClose: () => void }) {
  const createGoal = useGoalStore((s) => s.createGoal);
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      owner: "his",
      type: "personal",
    },
  });

  const type = watch("type");

  const onSubmit = async (data: FormData) => {
    const payload: CreateGoal = {
      owner: data.owner,
      type: data.type,
      title: data.title,
      description: data.description,
      targetValue: data.type === "operational" ? undefined : data.targetValue,
      targetDate: data.targetDate,
      metadata: {
        itemName: data.itemName,
        revenueTarget: data.type === "company" ? data.revenueTarget : undefined,
        isMilestoneBased: data.type === "operational",
        notes: data.notes,
      },
    };
    const goal = await createGoal(payload);
    if (goal) onClose();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Owner"
          {...register("owner")}
          error={errors.owner?.message}
          options={[
            { value: "his", label: "His" },
            { value: "hers", label: "Hers" },
            { value: "shared", label: "Shared" },
            { value: "company", label: "Company" },
          ]}
        />
        <Select
          label="Type"
          {...register("type")}
          error={errors.type?.message}
          options={[
            { value: "personal", label: "Personal" },
            { value: "company", label: "Company" },
            { value: "operational", label: "Operational" },
          ]}
        />
      </div>

      <Input
        label="Title"
        {...register("title")}
        error={errors.title?.message}
        placeholder="e.g. 2026 Cadillac Escalade"
      />

      <Input
        label="Description (optional)"
        {...register("description")}
        error={errors.description?.message}
        placeholder="Short description"
      />

      {type === "personal" && (
        <>
          <Input
            label="Item Name (optional)"
            {...register("itemName")}
            placeholder="e.g. 2026 Cadillac Escalade"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Target Amount"
              type="number"
              step="100"
              {...register("targetValue")}
              error={errors.targetValue?.message}
              placeholder="25000"
            />
            <Input
              label="Target Date"
              type="date"
              {...register("targetDate")}
              error={errors.targetDate?.message}
            />
          </div>
        </>
      )}

      {type === "company" && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Revenue Target (/mo)"
              type="number"
              step="100"
              {...register("revenueTarget")}
              error={errors.revenueTarget?.message}
              placeholder="30000"
            />
            <Input
              label="Target Date"
              type="date"
              {...register("targetDate")}
              error={errors.targetDate?.message}
            />
          </div>
          <Input
            label="Cumulative Target (optional)"
            type="number"
            step="100"
            {...register("targetValue")}
            placeholder="Leave blank for monthly goal"
          />
        </>
      )}

      {type === "operational" && (
        <Input
          label="Target Date (optional)"
          type="date"
          {...register("targetDate")}
          error={errors.targetDate?.message}
        />
      )}

      <Input
        label="Notes (optional)"
        {...register("notes")}
        placeholder="Anything to remember"
      />

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting} className="flex-1">
          Create Goal
        </Button>
      </div>
    </form>
  );
}
