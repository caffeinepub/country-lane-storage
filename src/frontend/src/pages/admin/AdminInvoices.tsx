import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { InvoiceStatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { useAppStore } from "@/store/appStore";
import type { InvoiceStatus } from "@/types";
import { AlertTriangle, CheckCircle, Receipt, Send, Zap } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

export function AdminInvoices() {
  const invoices = useAppStore((s) => s.invoices);
  const leases = useAppStore((s) => s.leases);
  const tenants = useAppStore((s) => s.tenants);
  const units = useAppStore((s) => s.units);
  const updateInvoice = useAppStore((s) => s.updateInvoice);
  const markOverdueInvoices = useAppStore((s) => s.markOverdueInvoices);
  const generateInvoices = useAppStore((s) => s.generateInvoices);

  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "ALL">(
    "ALL",
  );
  const [tenantFilter, setTenantFilter] = useState<string>("ALL");

  const getTenant = (invoiceId: number) => {
    const inv = invoices.find((i) => i.id === invoiceId);
    const lease = inv ? leases.find((l) => l.id === inv.leaseId) : undefined;
    return lease ? tenants.find((t) => t.id === lease.tenantId) : undefined;
  };

  const getUnit = (invoiceId: number) => {
    const inv = invoices.find((i) => i.id === invoiceId);
    const lease = inv ? leases.find((l) => l.id === inv.leaseId) : undefined;
    return lease ? units.find((u) => u.id === lease.unitId) : undefined;
  };

  const filtered = invoices
    .filter((i) => statusFilter === "ALL" || i.status === statusFilter)
    .filter((i) => {
      if (tenantFilter === "ALL") return true;
      const tenant = getTenant(i.id);
      return tenant?.id === Number(tenantFilter);
    })
    .sort((a, b) => b.dueDate.localeCompare(a.dueDate));

  const handleMarkOverdue = () => {
    const count = markOverdueInvoices();
    toast[count > 0 ? "success" : "info"](
      count > 0
        ? `Marked ${count} invoice(s) as overdue`
        : "No invoices to mark as overdue",
    );
  };

  const handleGenerate = () => {
    const newInvoices = generateInvoices();
    const count = newInvoices.length;
    toast[count > 0 ? "success" : "info"](
      count > 0
        ? `Generated ${count} invoice(s)`
        : "No invoices to generate today",
    );
  };

  const handleMarkSent = (id: number) => {
    updateInvoice(id, { status: "SENT" });
    toast.success("Invoice marked as sent");
  };

  const handleMarkPaid = (id: number) => {
    updateInvoice(id, { status: "PAID" });
    toast.success("Invoice marked as paid");
  };

  return (
    <div>
      <PageHeader
        title="Invoices"
        description="Manage all tenant invoices"
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkOverdue}
              data-ocid="invoices.mark_overdue.button"
            >
              <AlertTriangle className="w-4 h-4 mr-1.5" />
              Mark Overdue
            </Button>
            <Button
              size="sm"
              onClick={handleGenerate}
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
              data-ocid="invoices.generate.button"
            >
              <Zap className="w-4 h-4 mr-1.5" />
              Generate
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as InvoiceStatus | "ALL")}
        >
          <SelectTrigger className="w-36" data-ocid="invoices.status.select">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="SENT">Sent</SelectItem>
            <SelectItem value="PAID">Paid</SelectItem>
            <SelectItem value="OVERDUE">Overdue</SelectItem>
          </SelectContent>
        </Select>
        <Select value={tenantFilter} onValueChange={setTenantFilter}>
          <SelectTrigger
            className="w-44"
            data-ocid="invoices.tenant_filter.select"
          >
            <SelectValue placeholder="All Tenants" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Tenants</SelectItem>
            {tenants.map((t) => (
              <SelectItem key={t.id} value={String(t.id)}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card>
          <CardContent className="p-0">
            {filtered.length === 0 ? (
              <EmptyState
                title="No invoices found"
                description="Adjust your filters or generate new invoices."
                icon={<Receipt className="w-12 h-12" />}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        #
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Tenant
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">
                        Unit
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">
                        Period
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">
                        Due Date
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Status
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((invoice, idx) => {
                      const tenant = getTenant(invoice.id);
                      const unit = getUnit(invoice.id);
                      return (
                        <tr
                          key={invoice.id}
                          data-ocid={`invoices.item.${idx + 1}`}
                          className="border-b last:border-0 hover:bg-muted/20 transition-colors"
                        >
                          <td className="px-4 py-3 font-medium text-foreground">
                            #{invoice.id}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {tenant?.name ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                            {unit?.unitNumber ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground text-xs hidden lg:table-cell">
                            {formatDate(invoice.periodStart)} –{" "}
                            {formatDate(invoice.periodEnd)}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                            {formatDate(invoice.dueDate)}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-foreground">
                            {formatCurrency(invoice.amount)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <InvoiceStatusBadge status={invoice.status} />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-1">
                              {invoice.status === "DRAFT" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-xs"
                                  onClick={() => handleMarkSent(invoice.id)}
                                  data-ocid={`invoices.mark_sent.button.${idx + 1}`}
                                >
                                  <Send className="w-3 h-3 mr-1" />
                                  Send
                                </Button>
                              )}
                              {(invoice.status === "SENT" ||
                                invoice.status === "OVERDUE") && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-xs text-green-700 hover:text-green-700 hover:bg-green-50"
                                  onClick={() => handleMarkPaid(invoice.id)}
                                  data-ocid={`invoices.mark_paid.button.${idx + 1}`}
                                >
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Paid
                                </Button>
                              )}
                            </div>
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
