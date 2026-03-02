import { InvoiceStatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCreateCheckoutSession,
  useFacilities,
  useMyInvoices,
  useMyLeases,
  useMyPayments,
  useSetAutoPay,
} from "@/hooks/useBackendData";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { useAppStore } from "@/store/appStore";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  CreditCard,
  DollarSign,
  Loader2,
  ToggleLeft,
  ToggleRight,
  Warehouse,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function CustomerDashboard() {
  const {
    currentUser,
    units,
    facilities: storeFacilities,
    updateFacility,
  } = useAppStore();
  const navigate = useNavigate();

  const leasesQuery = useMyLeases();
  const invoicesQuery = useMyInvoices();
  const paymentsQuery = useMyPayments();
  const setAutoPayMut = useSetAutoPay();
  const checkoutMut = useCreateCheckoutSession();
  const facilitiesQuery = useFacilities();

  // Sync backend facility data into store so address stays current for all users
  useEffect(() => {
    if (!facilitiesQuery.data || facilitiesQuery.data.length === 0) return;
    const bf = facilitiesQuery.data[0];
    const sf = storeFacilities[0];
    if (
      sf &&
      (bf.name !== sf.name ||
        bf.address !== sf.address ||
        bf.timeZone !== sf.timeZone)
    ) {
      updateFacility(bf.id, {
        name: bf.name,
        address: bf.address,
        timeZone: bf.timeZone,
      });
    }
  }, [facilitiesQuery.data, storeFacilities, updateFacility]);

  const facilities = facilitiesQuery.data ?? storeFacilities;

  const [togglingLeaseId, setTogglingLeaseId] = useState<number | null>(null);
  const [payingInvoiceId, setPayingInvoiceId] = useState<number | null>(null);

  if (!currentUser?.tenantId) return null;

  const leases = leasesQuery.data ?? [];
  const invoices = invoicesQuery.data ?? [];
  const payments = paymentsQuery.data ?? [];

  const tenantLeases = leases.filter((l) => l.status !== "ENDED");
  const leaseIds = tenantLeases.map((l) => l.id);
  const tenantInvoices = invoices.filter((i) => leaseIds.includes(i.leaseId));

  const recentPayments = [...payments]
    .sort((a, b) => b.paymentDate.localeCompare(a.paymentDate))
    .slice(0, 3);

  const unpaidInvoices = tenantInvoices.filter(
    (i) => i.status === "SENT" || i.status === "OVERDUE",
  );
  const totalBalance = unpaidInvoices.reduce((sum, i) => sum + i.amount, 0);
  const nextDue = [...unpaidInvoices].sort((a, b) =>
    a.dueDate.localeCompare(b.dueDate),
  )[0];

  const facility = facilities[0];

  const toggleAutoPay = async (leaseId: number, current: boolean) => {
    setTogglingLeaseId(leaseId);
    try {
      await setAutoPayMut.mutateAsync({ leaseId, enabled: !current });
      toast.success(`Auto-pay ${!current ? "enabled" : "disabled"}`);
    } catch {
      toast.error("Failed to update auto-pay");
    } finally {
      setTogglingLeaseId(null);
    }
  };

  const handlePayNow = async (invoiceId: number) => {
    setPayingInvoiceId(invoiceId);
    try {
      const url = await checkoutMut.mutateAsync(invoiceId);
      if (url.startsWith("demo://")) {
        // Simulate payment confirmation for demo mode
        const sessionId = url.replace("demo://", "demo_session_");
        navigate({
          to: "/portal/payment-success",
          search: { invoice_id: invoiceId, session_id: sessionId },
        });
      } else {
        // Real Stripe redirect
        window.location.href = url;
      }
    } catch {
      toast.error("Failed to initiate payment");
      setPayingInvoiceId(null);
    }
  };

  const isLoading = leasesQuery.isPending || invoicesQuery.isPending;

  return (
    <div>
      {/* Welcome */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold font-display text-foreground">
          Welcome back, {currentUser.name.split(" ")[0]}! 👋
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {facility?.name} · {facility?.address}
        </p>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Warehouse className="w-4 h-4" />
                Active Units
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-9 w-12 mb-1" />
              ) : (
                <div className="text-3xl font-bold text-foreground font-display">
                  {tenantLeases.length}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Across {tenantLeases.length} lease
                {tenantLeases.length !== 1 ? "s" : ""}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Outstanding Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-9 w-20 mb-1" />
              ) : (
                <div
                  className={`text-3xl font-bold font-display ${totalBalance > 0 ? "text-destructive" : "text-green-600"}`}
                >
                  {formatCurrency(totalBalance)}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {unpaidInvoices.length} unpaid invoice
                {unpaidInvoices.length !== 1 ? "s" : ""}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Next Due Date
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-9 w-24 mb-1" />
              ) : (
                <div className="text-3xl font-bold font-display text-foreground">
                  {nextDue ? formatDate(nextDue.dueDate) : "—"}
                </div>
              )}
              {nextDue && (
                <p className="text-xs text-muted-foreground mt-1">
                  {formatCurrency(nextDue.amount)} due
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Your Units */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-base flex items-center justify-between">
                Your Storage Units
                <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {tenantLeases.length} active
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-lg" />
                  ))}
                </div>
              ) : tenantLeases.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No active leases
                </p>
              ) : (
                <div className="space-y-3">
                  {tenantLeases.map((lease, idx) => {
                    const unit = units.find((u) => u.id === lease.unitId);
                    const isToggling = togglingLeaseId === lease.id;
                    return (
                      <div
                        key={lease.id}
                        data-ocid={`portal.unit.item.${idx + 1}`}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Warehouse className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <div className="font-semibold text-sm text-foreground">
                              Unit {unit?.unitNumber ?? lease.unitId}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {unit?.size ?? "—"} ft · {facility?.name}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-foreground">
                            {formatCurrency(lease.monthlyRent)}/mo
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              !isToggling &&
                              toggleAutoPay(lease.id, lease.autoPay)
                            }
                            disabled={isToggling}
                            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mt-0.5 disabled:opacity-50"
                            data-ocid={`portal.autopay.toggle.${idx + 1}`}
                          >
                            {isToggling ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : lease.autoPay ? (
                              <ToggleRight className="w-3.5 h-3.5 text-green-600" />
                            ) : (
                              <ToggleLeft className="w-3.5 h-3.5" />
                            )}
                            Auto-pay {lease.autoPay ? "on" : "off"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <div className="space-y-4">
          {/* Pay Now */}
          {nextDue && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <Card
                className={
                  nextDue.status === "OVERDUE"
                    ? "border-destructive/30 bg-destructive/5"
                    : "border-accent/30 bg-accent/5"
                }
              >
                <CardContent className="pt-5">
                  <div className="flex items-start gap-3">
                    <AlertCircle
                      className={`w-5 h-5 shrink-0 mt-0.5 ${nextDue.status === "OVERDUE" ? "text-destructive" : "text-accent"}`}
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-sm text-foreground">
                        {nextDue.status === "OVERDUE"
                          ? "Overdue Payment"
                          : "Invoice Ready"}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        Invoice #{nextDue.id} · Due{" "}
                        {formatDate(nextDue.dueDate)} ·{" "}
                        {formatCurrency(nextDue.amount)}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold shrink-0"
                      onClick={() => handlePayNow(nextDue.id)}
                      disabled={
                        payingInvoiceId === nextDue.id || checkoutMut.isPending
                      }
                      data-ocid="portal.pay_now.primary_button"
                    >
                      {payingInvoiceId === nextDue.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Pay Now"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-base flex items-center justify-between">
                  Recent Activity
                  <Link
                    to="/portal/payments"
                    className="text-xs font-normal text-primary hover:underline"
                    data-ocid="portal.view_payments.link"
                  >
                    View all
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {paymentsQuery.isPending ? (
                  <div className="space-y-3">
                    {[1, 2].map((i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                ) : recentPayments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    No payments yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {recentPayments.map((payment) => (
                      <div key={payment.id} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-foreground">
                            Invoice #{payment.invoiceId} paid
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatDate(payment.paymentDate)} · {payment.method}
                          </div>
                        </div>
                        <div className="text-sm font-semibold text-green-600">
                          {formatCurrency(payment.amount)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick links */}
          <div className="grid grid-cols-2 gap-3">
            <Link to="/portal/invoices" data-ocid="portal.invoices.link">
              <Card className="hover:shadow-card-hover transition-shadow cursor-pointer">
                <CardContent className="pt-4 pb-4 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">
                    View Invoices
                  </span>
                </CardContent>
              </Card>
            </Link>
            <Link to="/portal/payments" data-ocid="portal.payments.link">
              <Card className="hover:shadow-card-hover transition-shadow cursor-pointer">
                <CardContent className="pt-4 pb-4 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-foreground">
                    Payment History
                  </span>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Invoices Summary */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="mt-6"
      >
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-base flex items-center justify-between">
              Recent Invoices
              <Link
                to="/portal/invoices"
                className="text-xs font-normal text-primary hover:underline"
                data-ocid="portal.recent_invoices.link"
              >
                View all
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {invoicesQuery.isPending ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : tenantInvoices.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No invoices yet
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-2 pr-4 text-muted-foreground font-medium text-xs">
                        Invoice
                      </th>
                      <th className="pb-2 pr-4 text-muted-foreground font-medium text-xs">
                        Due Date
                      </th>
                      <th className="pb-2 pr-4 text-muted-foreground font-medium text-xs">
                        Amount
                      </th>
                      <th className="pb-2 text-muted-foreground font-medium text-xs">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tenantInvoices.slice(0, 4).map((invoice) => (
                      <tr key={invoice.id} className="border-b last:border-0">
                        <td className="py-2.5 pr-4 font-medium text-foreground">
                          #{invoice.id}
                        </td>
                        <td className="py-2.5 pr-4 text-muted-foreground">
                          {formatDate(invoice.dueDate)}
                        </td>
                        <td className="py-2.5 pr-4 font-semibold">
                          {formatCurrency(invoice.amount)}
                        </td>
                        <td className="py-2.5">
                          <InvoiceStatusBadge status={invoice.status} />
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
