"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useFinancialStore } from "@/lib/stores/financialStore";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  displayName: z.string().min(1, "Display name is required"),
  currency: z.string().min(1, "Currency is required"),
  revenueLow: z.coerce.number().min(0, "Must be positive"),
  revenueHigh: z.coerce.number().min(0, "Must be positive"),
});

type FormData = z.infer<typeof schema>;

export function AddBusinessForm({ onClose }: { onClose: () => void }) {
  const addBusiness = useFinancialStore((s) => s.addBusiness);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { currency: "USD", revenueLow: 0, revenueHigh: 0 },
  });

  const onSubmit = async (data: FormData) => {
    await addBusiness(data);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input label="Business Name" {...register("name")} error={errors.name?.message} placeholder="e.g. Acme Corp" />
      <Input label="Display Name" {...register("displayName")} error={errors.displayName?.message} placeholder="e.g. Acme" />
      <Select label="Currency" {...register("currency")} error={errors.currency?.message} options={[
        { value: "USD", label: "USD ($)" }, { value: "CAD", label: "CAD (CA$)" },
        { value: "GBP", label: "GBP (\u00a3)" }, { value: "EUR", label: "EUR (\u20ac)" },
      ]} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Revenue Low" type="number" {...register("revenueLow")} error={errors.revenueLow?.message} placeholder="0" />
        <Input label="Revenue High" type="number" {...register("revenueHigh")} error={errors.revenueHigh?.message} placeholder="0" />
      </div>
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
        <Button type="submit" isLoading={isSubmitting} className="flex-1">Add Business</Button>
      </div>
    </form>
  );
}
