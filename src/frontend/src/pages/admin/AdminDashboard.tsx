import { InvoiceStatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAdminStats,
  useAllInvoices,
  useAllLeases,
  useAllTenants,
  useAllUnits,
  useGenerateDueInvoices,
  useMarkOverdueInvoices,
} from "@/hooks/useBackendData";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { useAppStore } from "@/store/appStore";
import {
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Loader2,
  TrendingUp,
  Users,
  Warehouse,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect } from "react";
import { toast } from "sonner";

export function AdminDashboard() {
  const storeInvoices = useAppStore((s) => s.invoices);
  const storePayments = useAppStore((s) => s.payments);
  const storeTenants = useAppStore((s) => s.tenants);
  const storeLeases = useAppStore((s) => s.leases);
  const storeUnits = useAppStore((s) => s.units);

  // Backend data
  const statsQuery = useAdminStats();
  const unitsQuery = useAllUnits();
  const leasesQuery = useAllLeases();
  const tenantsQuery = useAllTenants();
  const invoicesQuery = useAllInvoices();

  // Sync backend data into store when loaded
  const setFn = useAppStore.setState;
  useEffect(() => {
    if (unitsQuery.data) setFn({ units: unitsQuery.data });
  }, [unitsQuery.data, setFn]);
  useEffect(() => {
    if (leasesQuery.data) setFn({ leases: leasesQuery.data });
  }, [leasesQuery.data, setFn]);
  useEffect(() => {
    if (tenantsQuery.data) setFn({ tenants: tenantsQuery.data });
  }, [tenantsQuery.data, setFn]);
  useEffect(() => {
    if (invoicesQuery.data) setFn({ invoices: invoicesQuery.data });
  }, [invoicesQuery.data, setFn]);

  const markOverdueMut = useMarkOverdueInvoices();
  const generateMut = useGenerateDueInvoices();

  // Use backend stats if available, otherwise fall back to store
  const stats = statsQuery.data;
  const units = unitsQuery.data ?? storeUnits;
  const leases = leasesQuery.data ?? storeLeases;
  const tenants = tenantsQuery.data ?? storeTenants;
  const invoices = invoicesQuery.data ?? storeInvoices;

  const totalUnits = stats?.totalUnits ?? units.length;
  const occupiedUnits =
    stats?.occupiedUnits ??
    units.filter((u) => u.status === "OCCUPIED" || u.status === "DELINQUENT")
      .length;
  const occupancyRate = stats?.occupancyRate
    ? stats.occupancyRate * 100
    : totalUnits > 0
      ? (occupiedUnits / totalUnits) * 100
      : 0;
  const mrr =
    stats?.mrr ??
    leases
      .filter((l) => l.status === "ACTIVE" || l.status === "DELINQUENT")
      .reduce((s, l) => s + l.monthlyRent, 0);
  const overdueCount =
    stats?.overdueCount ??
    invoices.filter((i) => i.status === "OVERDUE").length;
  const overdueBalance = invoices
    .filter((i) => i.status === "OVERDUE")
    .reduce((s, i) => s + i.amount, 0);

  const recentActivity = [
    ...invoices.map((i) => ({
      type: "invoice" as const,
      id: i.id,
      date: i.dueDate,
      label: `Invoice #${i.id}`,
      status: i.status,
      amount: i.amount,
    })),
    ...storePayments.map((p) => ({
      type: "payment" as const,
      id: p.id,
      date: p.paymentDate,
      label: `Payment for Invoice #${p.invoiceId}`,
      status: p.status,
      amount: p.amount,
    })),
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6);

  const handleGenerateInvoices = async () => {
    try {
      const count = await generateMut.mutateAsync();
      if (count === 0) {
        toast.info(
          "No invoices to generate today. (Billing days must match today.)",
        );
      } else {
        toast.success(
          `Generated ${count} new invoice${count !== 1 ? "s" : ""}`,
        );
      }
    } catch {
      toast.error("Failed to generate invoices");
    }
  };

  const handleMarkOverdue = async () => {
    try {
      const count = await markOverdueMut.mutateAsync();
      if (count === 0) {
        toast.info("No invoices to mark as overdue.");
      } else {
        toast.success(
          `Marked ${count} invoice${count !== 1 ? "s" : ""} as overdue`,
        );
      }
    } catch {
      toast.error("Failed to mark overdue invoices");
    }
  };

  const kpiCards = [
    {
      title: "Total Units",
      value: totalUnits,
      icon: Warehouse,
      sub: `${occupiedUnits} occupied`,
    },
    {
      title: "Occupancy Rate",
      value: `${occupancyRate.toFixed(1)}%`,
      icon: TrendingUp,
      sub: `${occupiedUnits} of ${totalUnits} units`,
    },
    {
      title: "Monthly Revenue",
      value: formatCurrency(mrr),
      icon: DollarSign,
      sub: `${leases.filter((l) => l.status === "ACTIVE").length} active leases`,
    },
    {
      title: "Overdue Invoices",
      value: overdueCount,
      icon: AlertTriangle,
      sub: `${formatCurrency(overdueBalance)} total`,
      alert: overdueCount > 0,
    },
  ];

  const isLoadingStats = statsQuery.isPending;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">
            Dashboard
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Country Lane Storage · Overview
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkOverdue}
            disabled={markOverdueMut.isPending}
            data-ocid="admin.mark_overdue.button"
          >
            {markOverdueMut.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <AlertTriangle className="w-4 h-4 mr-2" />
            )}
            Mark Overdue
          </Button>
          <Button
            size="sm"
            onClick={handleGenerateInvoices}
            disabled={generateMut.isPending}
            className="bg-accent hover:bg-accent/90 text-accent-foreground"
            data-ocid="admin.generate_invoices.button"
          >
            {generateMut.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Zap className="w-4 h-4 mr-2" />
            )}
            Generate Invoices
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {kpiCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <Card
                className={
                  card.alert ? "border-destructive/30 bg-destructive/5" : ""
                }
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground flex items-center justify-between">
                    {card.title}
                    <Icon
                      className={`w-4 h-4 ${card.alert ? "text-destructive" : "text-muted-foreground"}`}
                    />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingStats ? (
                    <Skeleton className="h-8 w-24 mb-1" />
                  ) : (
                    <div
                      className={`text-2xl font-bold font-display ${card.alert ? "text-destructive" : "text-foreground"}`}
                    >
                      {card.value}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {card.sub}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Occupancy Bar */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-sm text-muted-foreground">
              Occupancy Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 mb-3">
              <Progress value={occupancyRate} className="flex-1 h-3" />
              <span className="text-sm font-semibold text-foreground w-12 text-right">
                {occupancyRate.toFixed(0)}%
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                {
                  label: "Vacant",
                  count: units.filter((u) => u.status === "VACANT").length,
                  color: "bg-green-500",
                },
                {
                  label: "Occupied",
                  count: units.filter((u) => u.status === "OCCUPIED").length,
                  color: "bg-blue-500",
                },
                {
                  label: "Reserved",
                  count: units.filter((u) => u.status === "RESERVED").length,
                  color: "bg-amber-500",
                },
                {
                  label: "Delinquent",
                  count: units.filter((u) => u.status === "DELINQUENT").length,
                  color: "bg-red-500",
                },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${s.color} shrink-0`} />
                  <span className="text-xs text-muted-foreground">
                    {s.label}
                  </span>
                  <span className="text-xs font-semibold text-foreground ml-auto">
                    {s.count}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-base">
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity.map((item, i) => (
                  <div
                    key={`${item.type}-${item.id}-${i}`}
                    className="flex items-center gap-3"
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${item.type === "payment" ? "bg-green-100" : "bg-blue-100"}`}
                    >
                      {item.type === "payment" ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <DollarSign className="w-4 h-4 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">
                        {item.label}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(item.date)}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-semibold">
                        {formatCurrency(item.amount)}
                      </div>
                      {item.type === "invoice" && (
                        <InvoiceStatusBadge
                          status={
                            item.status as "PAID" | "SENT" | "OVERDUE" | "DRAFT"
                          }
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-base">
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { label: "Total Tenants", value: tenants.length },
                  {
                    label: "Active Leases",
                    value: leases.filter((l) => l.status === "ACTIVE").length,
                  },
                  {
                    label: "Delinquent Leases",
                    value: leases.filter((l) => l.status === "DELINQUENT")
                      .length,
                  },
                  {
                    label: "Auto-Pay Enabled",
                    value: leases.filter(
                      (l) => l.autoPay && l.status === "ACTIVE",
                    ).length,
                  },
                  {
                    label: "Paid Invoices",
                    value: `${invoices.filter((i) => i.status === "PAID").length} invoices`,
                  },
                  {
                    label: "Outstanding Balance",
                    value: formatCurrency(
                      invoices
                        .filter((i) => i.status !== "PAID")
                        .reduce((s, i) => s + i.amount, 0),
                    ),
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm text-muted-foreground">
                      {stat.label}
                    </span>
                    {isLoadingStats ? (
                      <Skeleton className="h-4 w-16" />
                    ) : (
                      <span className="text-sm font-semibold text-foreground">
                        {stat.value}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
