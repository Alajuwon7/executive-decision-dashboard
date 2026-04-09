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
  name: z.string().min(2, "Name must be at least 2 characters"),
  roleTitle: z.string().min(2, "Role must be at least 2 characters"),
  roleDescription: z.string().optional(),
  compensationType: z.enum(["hourly", "salary"]),
  rate: z.coerce.number().positive("Must be positive"),
  currency: z.string().default("USD"),
  hoursPerWeek: z.coerce.number().min(0).max(80).nullable().optional(),
  startDate: z.string().optional(),
  performanceNotes: z.string().optional(),
});

type FormData = z.output<typeof schema>;

const currencyOptions = [
  { value: "USD", label: "USD ($)" },
  { value: "CAD", label: "CAD (CA$)" },
  { value: "GBP", label: "GBP (£)" },
  { value: "EUR", label: "EUR (€)" },
  { value: "NGN", label: "NGN (₦)" },
  { value: "GHS", label: "GHS (GH₵)" },
  { value: "JMD", label: "JMD (J$)" },
  { value: "TTD", label: "TTD (TT$)" },
];

export function AddEmployeeForm({ onClose }: { onClose: () => void }) {
  const addEmployee = useFinancialStore((s) => s.addEmployee);
  const businesses = useFinancialStore((s) => s.businesses);
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      compensationType: "hourly",
      currency: "USD",
      hoursPerWeek: 40,
      startDate: new Date().toISOString().split("T")[0],
    },
  });

  const compensationType = watch("compensationType");

  const onSubmit = async (data: FormData) => {
    await addEmployee({
      ...data,
      hoursPerWeek: data.compensationType === "hourly" ? (data.hoursPerWeek ?? 40) : null,
    });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4">
      <Select
        label="Business"
        {...register("businessId")}
        error={errors.businessId?.message}
        placeholder="Select business"
        options={businesses.map((b) => ({ value: b.id, label: b.displayName }))}
      />
      <Input label="Full Name" {...register("name")} error={errors.name?.message} placeholder="e.g. Sarah Chen" />
      <Input label="Role Title" {...register("roleTitle")} error={errors.roleTitle?.message} placeholder="e.g. Immigration Attorney" />

      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Compensation Type"
          {...register("compensationType")}
          error={errors.compensationType?.message}
          options={[
            { value: "hourly", label: "Hourly" },
            { value: "salary", label: "Salary" },
          ]}
        />
        <Select
          label="Currency"
          {...register("currency")}
          error={errors.currency?.message}
          options={currencyOptions}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input
          label={compensationType === "hourly" ? "Hourly Rate" : "Annual Salary"}
          type="number"
          step={compensationType === "hourly" ? "0.50" : "1000"}
          {...register("rate")}
          error={errors.rate?.message}
          placeholder={compensationType === "hourly" ? "25.00" : "85000"}
        />
        {compensationType === "hourly" && (
          <Input
            label="Hours per Week"
            type="number"
            step="1"
            {...register("hoursPerWeek")}
            error={errors.hoursPerWeek?.message}
            placeholder="40"
          />
        )}
      </div>

      <Input label="Start Date" type="date" {...register("startDate")} error={errors.startDate?.message} />

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
        <Button type="submit" isLoading={isSubmitting} className="flex-1">Add Employee</Button>
      </div>
    </form>
  );
}
