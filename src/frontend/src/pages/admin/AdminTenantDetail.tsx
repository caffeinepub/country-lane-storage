import { EmptyState } from "@/components/shared/EmptyState";
import {
  InvoiceStatusBadge,
  LeaseStatusBadge,
  PaymentStatusBadge,
} from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { useAppStore } from "@/store/appStore";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, CreditCard, FileText, Warehouse } from "lucide-react";

export function AdminTenantDetail({ tenantId }: { tenantId: number }) {
  const { tenants, leases, invoices, payments, units } = useAppStore();

  const tenant = tenants.find((t) => t.id === tenantId);
  if (!tenant) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Tenant not found.</p>
        <Link to="/admin/tenants">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
      </div>
    );
  }

  const tenantLeases = leases.filter((l) => l.tenantId === tenantId);
  const leaseIds = tenantLeases.map((l) => l.id);
  const tenantInvoices = invoices
    .filter((i) => leaseIds.includes(i.leaseId))
    .sort((a, b) => b.dueDate.localeCompare(a.dueDate));
  const tenantPayments = payments
    .filter((p) => p.tenantId === tenantId)
    .sort((a, b) => b.paymentDate.localeCompare(a.paymentDate));
  const balance = tenantInvoices
    .filter((i) => i.status !== "PAID")
    .reduce((sum, i) => sum + i.amount, 0);

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Link to="/admin/tenants">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">
            {tenant.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            Tenant ID: {tenant.id}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* Contact Info */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="font-display text-base">
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Email", value: tenant.email },
              { label: "Phone", value: tenant.phone },
              { label: "Address", value: tenant.address },
              { label: "Payment", value: tenant.preferredPaymentMethod },
            ].map((f) => (
              <div key={f.label}>
                <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  {f.label}
                </div>
                <div className="text-sm text-foreground mt-0.5">{f.value}</div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* KPIs */}
        <div className="lg:col-span-2 grid sm:grid-cols-3 gap-4">
          {[
            {
              title: "Active Leases",
              value: tenantLeases.filter((l) => l.status !== "ENDED").length,
            },
            { title: "Total Invoices", value: tenantInvoices.length },
            {
              title: "Outstanding",
              value: formatCurrency(balance),
              alert: balance > 0,
            },
          ].map((k) => (
            <Card
              key={k.title}
              className={
                k.alert ? "border-destructive/30 bg-destructive/5" : ""
              }
            >
              <CardContent className="pt-5">
                <div className="text-xs text-muted-foreground font-medium">
                  {k.title}
                </div>
                <div
                  className={`text-2xl font-bold font-display mt-1 ${k.alert ? "text-destructive" : "text-foreground"}`}
                >
                  {k.value}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Leases */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="font-display text-base flex items-center gap-2">
            <Warehouse className="w-4 h-4" />
            Leases
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {tenantLeases.length === 0 ? (
            <EmptyState
              title="No leases"
              icon={<Warehouse className="w-10 h-10" />}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground">
                      Unit
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground">
                      Start Date
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-muted-foreground">
                      Rent
                    </th>
                    <th className="px-4 py-2 text-center text-xs font-semibold text-muted-foreground">
                      Auto-Pay
                    </th>
                    <th className="px-4 py-2 text-center text-xs font-semibold text-muted-foreground">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tenantLeases.map((lease) => {
                    const unit = units.find((u) => u.id === lease.unitId);
                    return (
                      <tr key={lease.id} className="border-b last:border-0">
                        <td className="px-4 py-2.5 font-medium">
                          {unit?.unitNumber ?? `Unit ${lease.unitId}`} (
                          {unit?.size})
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground">
                          {formatDate(lease.startDate)}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          {formatCurrency(lease.monthlyRent)}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          {lease.autoPay ? "✓" : "—"}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <LeaseStatusBadge status={lease.status} />
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

      {/* Invoices */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="font-display text-base flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Invoices
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {tenantInvoices.length === 0 ? (
            <EmptyState
              title="No invoices"
              icon={<FileText className="w-10 h-10" />}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground">
                      Invoice #
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground">
                      Period
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground">
                      Due Date
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-muted-foreground">
                      Amount
                    </th>
                    <th className="px-4 py-2 text-center text-xs font-semibold text-muted-foreground">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tenantInvoices.map((inv) => (
                    <tr key={inv.id} className="border-b last:border-0">
                      <td className="px-4 py-2.5 font-medium">#{inv.id}</td>
                      <td className="px-4 py-2.5 text-muted-foreground text-xs">
                        {formatDate(inv.periodStart)} –{" "}
                        {formatDate(inv.periodEnd)}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {formatDate(inv.dueDate)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold">
                        {formatCurrency(inv.amount)}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <InvoiceStatusBadge status={inv.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payments */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Payment History
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {tenantPayments.length === 0 ? (
            <EmptyState
              title="No payments"
              icon={<CreditCard className="w-10 h-10" />}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground">
                      Date
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground">
                      Invoice
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-muted-foreground">
                      Amount
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground">
                      Method
                    </th>
                    <th className="px-4 py-2 text-center text-xs font-semibold text-muted-foreground">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tenantPayments.map((p) => (
                    <tr key={p.id} className="border-b last:border-0">
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {formatDate(p.paymentDate)}
                      </td>
                      <td className="px-4 py-2.5 font-medium">
                        #{p.invoiceId}
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {p.method}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <PaymentStatusBadge status={p.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
