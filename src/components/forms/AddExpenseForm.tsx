"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useFinancialStore } from "@/lib/stores/financialStore";

const schema = z.object({
  businessId: z.string().min(1, "Select a business"),
  category: z.string().min(1, "Select a category"),
  name: z.string().min(1, "Name is required"),
  amount: z.coerce.number().positive("Must be positive"),
  currency: z.string().default("USD"),
  frequency: z.enum(["monthly", "weekly", "yearly", "one-time"]),
});

type FormData = z.output<typeof schema>;

export function AddExpenseForm({ onClose }: { onClose: () => void }) {
  const addExpense = useFinancialStore((s) => s.addExpense);
  const businesses = useFinancialStore((s) => s.businesses);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: { currency: "USD", frequency: "monthly" },
  });

  const onSubmit = async (data: FormData) => {
    await addExpense(data);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4">
      <Select label="Business" {...register("businessId")} error={errors.businessId?.message} placeholder="Select business" options={businesses.map((b) => ({ value: b.id, label: b.displayName }))} />
      <Select label="Category" {...register("category")} error={errors.category?.message} placeholder="Select category" options={["Payroll", "Software", "Marketing", "Rent", "Utilities", "Other"].map((c) => ({ value: c, label: c }))} />
      <Input label="Name" {...register("name")} error={errors.name?.message} placeholder="e.g. Office lease" />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Amount" type="number" step="0.01" {...register("amount")} error={errors.amount?.message} placeholder="0.00" />
        <Select label="Frequency" {...register("frequency")} error={errors.frequency?.message} options={[
          { value: "monthly", label: "Monthly" }, { value: "weekly", label: "Weekly" },
          { value: "yearly", label: "Yearly" }, { value: "one-time", label: "One-time" },
        ]} />
      </div>
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
        <Button type="submit" isLoading={isSubmitting} className="flex-1">Add Expense</Button>
      </div>
    </form>
  );
}
