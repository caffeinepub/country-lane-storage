import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { PaymentStatusBadge } from "@/components/shared/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyPayments } from "@/hooks/useBackendData";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { useAppStore } from "@/store/appStore";
import { CreditCard } from "lucide-react";
import { motion } from "motion/react";

const methodLabels: Record<string, string> = {
  CARD: "Credit/Debit Card",
  ACH: "ACH Bank Transfer",
  OTHER: "Other",
};

export function CustomerPayments() {
  const { currentUser } = useAppStore();
  const paymentsQuery = useMyPayments();

  if (!currentUser?.tenantId) return null;

  const payments = paymentsQuery.data ?? [];
  const tenantPayments = [...payments].sort((a, b) =>
    b.paymentDate.localeCompare(a.paymentDate),
  );

  return (
    <div>
      <PageHeader
        title="Payment History"
        description="View all your past payments and transactions"
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card>
          <CardContent className="p-0">
            {paymentsQuery.isPending ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : tenantPayments.length === 0 ? (
              <EmptyState
                title="No payments yet"
                description="Your payment history will appear here after your first payment."
                icon={<CreditCard className="w-12 h-12" />}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Invoice
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">
                        Method
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">
                        Transaction ID
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tenantPayments.map((payment, idx) => (
                      <tr
                        key={payment.id}
                        data-ocid={`portal.payment.item.${idx + 1}`}
                        className="border-b last:border-0 hover:bg-muted/20 transition-colors"
                      >
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatDate(payment.paymentDate)}
                        </td>
                        <td className="px-4 py-3 font-medium text-foreground">
                          #{payment.invoiceId}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-foreground">
                          {formatCurrency(payment.amount)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                          {methodLabels[payment.method] ?? payment.method}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <code className="text-xs bg-muted px-2 py-0.5 rounded font-mono text-muted-foreground">
                            {payment.transactionId}
                          </code>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <PaymentStatusBadge status={payment.status} />
                        </td>
                      </tr>
                    ))}
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
