"use client";
import { useEffect, useMemo } from "react";
import { Plug } from "lucide-react";
import { useFinancialStore } from "@/lib/stores/financialStore";
import { useIntegrationStore } from "@/lib/stores/integrationStore";
import { QuickBooksConnectionCard } from "./QuickBooksConnectionCard";

export function Integrations() {
  const { businesses } = useFinancialStore();
  const { integrations, fetchIntegrations } = useIntegrationStore();

  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  const integrationsByBusiness = useMemo(() => {
    return businesses.map((biz) => ({
      business: biz,
      quickbooks: integrations.find((i) => i.businessId === biz.id && i.provider === "quickbooks") ?? null,
    }));
  }, [businesses, integrations]);

  return (
    <div>
      <p className="font-serif text-sm text-text-muted mb-3">
        Connect services to auto-sync financial data
      </p>

      {businesses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 gap-2">
          <Plug className="w-8 h-8 text-text-faint" />
          <p className="text-sm text-text-muted">Add a business first, then connect integrations.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {integrationsByBusiness.map(({ business, quickbooks }) => (
            <QuickBooksConnectionCard
              key={business.id}
              business={business}
              integration={quickbooks}
            />
          ))}
        </div>
      )}
    </div>
  );
}
