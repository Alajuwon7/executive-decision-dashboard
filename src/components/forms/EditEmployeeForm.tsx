"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useFinancialStore } from "@/lib/stores/financialStore";
import type { Employee } from "@/lib/data/types";

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
  status: z.enum(["active", "on-leave", "terminated"]),
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

interface EditEmployeeFormProps {
  employee: Employee;
  onClose: () => void;
}

export function EditEmployeeForm({ employee, onClose }: EditEmployeeFormProps) {
  const { updateEmployee, deleteEmployee } = useFinancialStore();
  const businesses = useFinancialStore((s) => s.businesses);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      businessId: employee.businessId,
      name: employee.name,
      roleTitle: employee.roleTitle,
      roleDescription: employee.roleDescription ?? "",
      compensationType: employee.compensationType,
      rate: employee.rate,
      currency: employee.currency,
      hoursPerWeek: employee.hoursPerWeek ?? 40,
      startDate: employee.startDate ?? "",
      performanceNotes: employee.performanceNotes ?? "",
      status: employee.status,
    },
  });

  const compensationType = watch("compensationType");

  const onSubmit = async (data: FormData) => {
    await updateEmployee(employee.id, {
      ...data,
      hoursPerWeek: data.compensationType === "hourly" ? (data.hoursPerWeek ?? 40) : null,
      roleDescription: data.roleDescription || null,
      performanceNotes: data.performanceNotes || null,
      startDate: data.startDate || null,
    });
    onClose();
  };

  const handleDelete = async () => {
    await deleteEmployee(employee.id);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4">
      <Select
        label="Business"
        {...register("businessId")}
        error={errors.businessId?.message}
        options={businesses.map((b) => ({ value: b.id, label: b.displayName }))}
      />
      <Input label="Full Name" {...register("name")} error={errors.name?.message} />
      <Input label="Role Title" {...register("roleTitle")} error={errors.roleTitle?.message} />

      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Compensation Type"
          {...register("compensationType")}
          options={[
            { value: "hourly", label: "Hourly" },
            { value: "salary", label: "Salary" },
          ]}
        />
        <Select
          label="Currency"
          {...register("currency")}
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
        />
        {compensationType === "hourly" && (
          <Input
            label="Hours per Week"
            type="number"
            step="1"
            {...register("hoursPerWeek")}
            error={errors.hoursPerWeek?.message}
          />
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input label="Start Date" type="date" {...register("startDate")} />
        <Select
          label="Status"
          {...register("status")}
          options={[
            { value: "active", label: "Active" },
            { value: "on-leave", label: "On Leave" },
            { value: "terminated", label: "Terminated" },
          ]}
        />
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
        <Button type="submit" isLoading={isSubmitting} className="flex-1">Save Changes</Button>
      </div>

      {/* Delete section */}
      <div className="pt-3 border-t border-border">
        {showDeleteConfirm ? (
          <div className="flex items-center gap-2">
            <p className="text-xs text-danger flex-1">Are you sure? This cannot be undone.</p>
            <Button size="sm" variant="danger" onClick={handleDelete}>Confirm Delete</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
          </div>
        ) : (
          <Button size="sm" variant="ghost" className="text-danger" onClick={() => setShowDeleteConfirm(true)}>
            Delete Employee
          </Button>
        )}
      </div>
    </form>
  );
}
