import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { InvoiceStatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCreateCheckoutSession,
  useMyInvoices,
  useMyLeases,
} from "@/hooks/useBackendData";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { useAppStore } from "@/store/appStore";
import { useNavigate } from "@tanstack/react-router";
import { CreditCard, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

export function CustomerInvoices() {
  const { currentUser, units } = useAppStore();
  const navigate = useNavigate();

  const leasesQuery = useMyLeases();
  const invoicesQuery = useMyInvoices();
  const checkoutMut = useCreateCheckoutSession();

  const [payingInvoiceId, setPayingInvoiceId] = useState<number | null>(null);

  if (!currentUser?.tenantId) return null;

  const leases = leasesQuery.data ?? [];
  const invoices = invoicesQuery.data ?? [];

  const tenantLeases = leases.filter(
    (l) => l.tenantId === currentUser.tenantId,
  );
  const leaseIds = tenantLeases.map((l) => l.id);
  const tenantInvoices = [...invoices]
    .filter((i) => leaseIds.includes(i.leaseId))
    .sort((a, b) => b.dueDate.localeCompare(a.dueDate));

  const getUnitForInvoice = (invoiceId: number) => {
    const inv = invoices.find((i) => i.id === invoiceId);
    const lease = inv
      ? tenantLeases.find((l) => l.id === inv.leaseId)
      : undefined;
    return lease ? units.find((u) => u.id === lease.unitId) : undefined;
  };

  const handlePay = async (invoiceId: number) => {
    setPayingInvoiceId(invoiceId);
    try {
      const url = await checkoutMut.mutateAsync(invoiceId);
      if (url.startsWith("demo://")) {
        const sessionId = url.replace("demo://", "demo_session_");
        navigate({
          to: "/portal/payment-success",
          search: { invoice_id: invoiceId, session_id: sessionId },
        });
      } else {
        window.location.href = url;
      }
    } catch {
      toast.error("Failed to initiate payment");
      setPayingInvoiceId(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Invoices"
        description="View and pay your storage invoices"
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card>
          <CardContent className="p-0">
            {invoicesQuery.isPending ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : tenantInvoices.length === 0 ? (
              <EmptyState
                title="No invoices yet"
                description="Your invoices will appear here once generated."
                icon={<CreditCard className="w-12 h-12" />}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Invoice #
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Unit
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">
                        Period
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Due Date
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Status
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tenantInvoices.map((invoice, idx) => {
                      const unit = getUnitForInvoice(invoice.id);
                      const canPay =
                        invoice.status === "SENT" ||
                        invoice.status === "OVERDUE";
                      const isPaying = payingInvoiceId === invoice.id;
                      return (
                        <tr
                          key={invoice.id}
                          data-ocid={`portal.invoice.item.${idx + 1}`}
                          className="border-b last:border-0 hover:bg-muted/20 transition-colors"
                        >
                          <td className="px-4 py-3 font-medium text-foreground">
                            #{invoice.id}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {unit ? `Unit ${unit.unitNumber}` : "—"}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell text-xs">
                            {formatDate(invoice.periodStart)} –{" "}
                            {formatDate(invoice.periodEnd)}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {formatDate(invoice.dueDate)}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-foreground">
                            {formatCurrency(invoice.amount)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <InvoiceStatusBadge status={invoice.status} />
                          </td>
                          <td className="px-4 py-3 text-center">
                            {canPay ? (
                              <Button
                                size="sm"
                                className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold text-xs h-7"
                                onClick={() => handlePay(invoice.id)}
                                disabled={isPaying || checkoutMut.isPending}
                                data-ocid={`portal.invoice.pay_button.${idx + 1}`}
                              >
                                {isPaying ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  "Pay Now"
                                )}
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                —
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
