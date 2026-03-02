import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { LeaseStatusBadge } from "@/components/shared/StatusBadge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  useAllLeases,
  useAllTenants,
  useAllUnits,
} from "@/hooks/useBackendData";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { useAppStore } from "@/store/appStore";
import type { Lease } from "@/types";
import { Edit, FileText, Plus, StopCircle } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface LeaseFormData {
  tenantId: string;
  unitId: string;
  startDate: string;
  monthlyRent: string;
  billingDay: string;
  autoPay: boolean;
}

const EMPTY_FORM: LeaseFormData = {
  tenantId: "",
  unitId: "",
  startDate: new Date().toISOString().split("T")[0],
  monthlyRent: "",
  billingDay: "1",
  autoPay: false,
};

export function AdminLeases() {
  const leasesQuery = useAllLeases();
  const tenantsQuery = useAllTenants();
  const unitsQuery = useAllUnits();

  const addLeaseStore = useAppStore((s) => s.addLease);
  const updateLeaseStore = useAppStore((s) => s.updateLease);
  const endLeaseStore = useAppStore((s) => s.endLease);

  const setFn = useAppStore.setState;
  useEffect(() => {
    if (leasesQuery.data) setFn({ leases: leasesQuery.data });
  }, [leasesQuery.data, setFn]);
  useEffect(() => {
    if (tenantsQuery.data) setFn({ tenants: tenantsQuery.data });
  }, [tenantsQuery.data, setFn]);
  useEffect(() => {
    if (unitsQuery.data) setFn({ units: unitsQuery.data });
  }, [unitsQuery.data, setFn]);

  const storeLeases = useAppStore((s) => s.leases);
  const storeTenants = useAppStore((s) => s.tenants);
  const storeUnits = useAppStore((s) => s.units);

  const tenants = tenantsQuery.data ?? storeTenants;
  const leases = leasesQuery.data ?? storeLeases;
  const units = unitsQuery.data ?? storeUnits;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [endingId, setEndingId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<LeaseFormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<
    Partial<Record<keyof LeaseFormData, string>>
  >({});

  const vacantUnits = units.filter((u) => u.status === "VACANT");

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setDialogOpen(true);
  };

  const openEdit = (lease: Lease) => {
    setEditingId(lease.id);
    setForm({
      tenantId: String(lease.tenantId),
      unitId: String(lease.unitId),
      startDate: lease.startDate,
      monthlyRent: String(lease.monthlyRent),
      billingDay: String(lease.billingDay),
      autoPay: lease.autoPay,
    });
    setErrors({});
    setDialogOpen(true);
  };

  const validate = () => {
    const e: Partial<Record<keyof LeaseFormData, string>> = {};
    if (!form.tenantId) e.tenantId = "Select a tenant";
    if (!form.unitId && !editingId) e.unitId = "Select a unit";
    if (!form.monthlyRent || Number(form.monthlyRent) <= 0)
      e.monthlyRent = "Enter a valid rent";
    const bd = Number(form.billingDay);
    if (!form.billingDay || bd < 1 || bd > 28)
      e.billingDay = "Billing day must be 1–28";
    if (!form.startDate) e.startDate = "Start date is required";
    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }

    if (editingId) {
      const currentLease = leases.find((l) => l.id === editingId);
      updateLeaseStore(editingId, {
        monthlyRent: Number(form.monthlyRent),
        billingDay: Number(form.billingDay),
        autoPay: form.autoPay,
        status: currentLease?.status ?? "ACTIVE",
      });
      toast.success("Lease updated");
    } else {
      const unit = units.find((u) => u.id === Number(form.unitId));
      addLeaseStore({
        tenantId: Number(form.tenantId),
        unitId: Number(form.unitId),
        startDate: form.startDate,
        monthlyRent: Number(form.monthlyRent) || unit?.monthlyRent || 0,
        billingDay: Number(form.billingDay),
        autoPay: form.autoPay,
        status: "ACTIVE",
      });
      toast.success("Lease created");
    }
    setDialogOpen(false);
  };

  const handleEnd = (id: number) => {
    endLeaseStore(id);
    toast.success("Lease ended and unit marked vacant");
    setEndingId(null);
  };

  return (
    <div>
      <PageHeader
        title="Leases"
        description="Manage tenant lease agreements"
        actions={
          <Button
            onClick={openAdd}
            className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
            data-ocid="leases.create_lease.button"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Lease
          </Button>
        }
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card>
          <CardContent className="p-0">
            {leasesQuery.isPending ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : leases.length === 0 ? (
              <EmptyState
                title="No leases"
                description="Create your first lease to get started."
                icon={<FileText className="w-12 h-12" />}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Tenant
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Unit
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">
                        Start Date
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Rent
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">
                        Billing Day
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">
                        Auto-Pay
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
                    {leases.map((lease, idx) => {
                      const tenant = tenants.find(
                        (t) => t.id === lease.tenantId,
                      );
                      const unit = units.find((u) => u.id === lease.unitId);
                      return (
                        <tr
                          key={lease.id}
                          data-ocid={`leases.item.${idx + 1}`}
                          className="border-b last:border-0 hover:bg-muted/20 transition-colors"
                        >
                          <td className="px-4 py-3 font-medium text-foreground">
                            {tenant?.name ?? `Tenant ${lease.tenantId}`}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {unit?.unitNumber ?? `Unit ${lease.unitId}`}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                            {formatDate(lease.startDate)}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold">
                            {formatCurrency(lease.monthlyRent)}
                          </td>
                          <td className="px-4 py-3 text-center text-muted-foreground hidden md:table-cell">
                            Day {lease.billingDay}
                          </td>
                          <td className="px-4 py-3 text-center hidden lg:table-cell">
                            <span
                              className={`text-xs font-medium ${lease.autoPay ? "text-green-600" : "text-muted-foreground"}`}
                            >
                              {lease.autoPay ? "ON" : "OFF"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <LeaseStatusBadge status={lease.status} />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => openEdit(lease)}
                                data-ocid={`leases.edit_button.${idx + 1}`}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              {lease.status !== "ENDED" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                  onClick={() => setEndingId(lease.id)}
                                  data-ocid={`leases.end_lease.button.${idx + 1}`}
                                >
                                  <StopCircle className="w-4 h-4" />
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md" data-ocid="leases.dialog">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editingId ? "Edit Lease" : "Create Lease"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Tenant</Label>
              <Select
                value={form.tenantId}
                onValueChange={(v) => setForm((f) => ({ ...f, tenantId: v }))}
              >
                <SelectTrigger
                  className={errors.tenantId ? "border-destructive" : ""}
                  data-ocid="leases.tenant.select"
                >
                  <SelectValue placeholder="Select tenant…" />
                </SelectTrigger>
                <SelectContent>
                  {tenants.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.tenantId && (
                <p className="text-xs text-destructive">{errors.tenantId}</p>
              )}
            </div>

            {!editingId && (
              <div className="space-y-1.5">
                <Label>Unit (Vacant Only)</Label>
                <Select
                  value={form.unitId}
                  onValueChange={(v) => {
                    const u = units.find((u) => u.id === Number(v));
                    setForm((f) => ({
                      ...f,
                      unitId: v,
                      monthlyRent: u ? String(u.monthlyRent) : f.monthlyRent,
                    }));
                  }}
                >
                  <SelectTrigger
                    className={errors.unitId ? "border-destructive" : ""}
                    data-ocid="leases.unit.select"
                  >
                    <SelectValue placeholder="Select unit…" />
                  </SelectTrigger>
                  <SelectContent>
                    {vacantUnits.map((u) => (
                      <SelectItem key={u.id} value={String(u.id)}>
                        {u.unitNumber} ({u.size}) —{" "}
                        {formatCurrency(u.monthlyRent)}/mo
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.unitId && (
                  <p className="text-xs text-destructive">{errors.unitId}</p>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Monthly Rent</Label>
                <Input
                  type="number"
                  value={form.monthlyRent}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, monthlyRent: e.target.value }))
                  }
                  className={errors.monthlyRent ? "border-destructive" : ""}
                  placeholder="0"
                  data-ocid="leases.monthly_rent.input"
                />
                {errors.monthlyRent && (
                  <p className="text-xs text-destructive">
                    {errors.monthlyRent}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Billing Day (1–28)</Label>
                <Input
                  type="number"
                  min={1}
                  max={28}
                  value={form.billingDay}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, billingDay: e.target.value }))
                  }
                  className={errors.billingDay ? "border-destructive" : ""}
                  data-ocid="leases.billing_day.input"
                />
                {errors.billingDay && (
                  <p className="text-xs text-destructive">
                    {errors.billingDay}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, startDate: e.target.value }))
                }
                className={errors.startDate ? "border-destructive" : ""}
                data-ocid="leases.start_date.input"
              />
              {errors.startDate && (
                <p className="text-xs text-destructive">{errors.startDate}</p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="autoPay"
                checked={form.autoPay}
                onCheckedChange={(v) => setForm((f) => ({ ...f, autoPay: v }))}
                data-ocid="leases.autopay.switch"
              />
              <Label htmlFor="autoPay">Enable Auto-Pay</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              data-ocid="leases.dialog.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
              data-ocid="leases.dialog.submit_button"
            >
              {editingId ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* End Lease Confirm */}
      <AlertDialog
        open={endingId !== null}
        onOpenChange={() => setEndingId(null)}
      >
        <AlertDialogContent data-ocid="leases.end_lease.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>End Lease</AlertDialogTitle>
            <AlertDialogDescription>
              This will end the lease and mark the unit as vacant. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="leases.end_lease.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={() => endingId && handleEnd(endingId)}
              data-ocid="leases.end_lease.confirm_button"
            >
              End Lease
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
