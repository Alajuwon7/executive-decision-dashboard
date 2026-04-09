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
  amount: z.coerce.number().positive("Must be positive"),
  currency: z.string().default("USD"),
  source: z.string().min(1, "Source is required"),
  description: z.string().default(""),
  date: z.string().min(1, "Date is required"),
});

type FormData = z.output<typeof schema>;

export function AddRevenueForm({ onClose }: { onClose: () => void }) {
  const addRevenue = useFinancialStore((s) => s.addRevenue);
  const businesses = useFinancialStore((s) => s.businesses);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: { currency: "USD", source: "manual", date: new Date().toISOString().split("T")[0] },
  });

  const onSubmit = async (data: FormData) => {
    await addRevenue(data);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4">
      <Select label="Business" {...register("businessId")} error={errors.businessId?.message} placeholder="Select business" options={businesses.map((b) => ({ value: b.id, label: b.displayName }))} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Amount" type="number" step="0.01" {...register("amount")} error={errors.amount?.message} placeholder="0.00" />
        <Input label="Date" type="date" {...register("date")} error={errors.date?.message} />
      </div>
      <Input label="Source" {...register("source")} error={errors.source?.message} placeholder="e.g. Client payment" />
      <Input label="Description" {...register("description")} placeholder="Optional notes" />
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
        <Button type="submit" isLoading={isSubmitting} className="flex-1">Add Revenue</Button>
      </div>
    </form>
  );
}
