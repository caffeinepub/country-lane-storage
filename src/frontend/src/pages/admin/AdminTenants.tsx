import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAllInvoices,
  useAllLeases,
  useAllTenants,
} from "@/hooks/useBackendData";
import { formatCurrency } from "@/lib/formatters";
import { useAppStore } from "@/store/appStore";
import type { Tenant } from "@/types";
import { Link } from "@tanstack/react-router";
import { Edit, Eye, Plus, Search, Users } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const EMPTY_FORM: Omit<Tenant, "id"> = {
  name: "",
  email: "",
  phone: "",
  address: "",
  preferredPaymentMethod: "CARD",
};

export function AdminTenants() {
  const tenantsQuery = useAllTenants();
  const leasesQuery = useAllLeases();
  const invoicesQuery = useAllInvoices();

  const addTenant = useAppStore((s) => s.addTenant);
  const updateTenantStore = useAppStore((s) => s.updateTenant);

  // Keep store in sync
  const setFn = useAppStore.setState;
  useEffect(() => {
    if (tenantsQuery.data) setFn({ tenants: tenantsQuery.data });
  }, [tenantsQuery.data, setFn]);
  useEffect(() => {
    if (leasesQuery.data) setFn({ leases: leasesQuery.data });
  }, [leasesQuery.data, setFn]);
  useEffect(() => {
    if (invoicesQuery.data) setFn({ invoices: invoicesQuery.data });
  }, [invoicesQuery.data, setFn]);

  const storeTenants = useAppStore((s) => s.tenants);
  const storeLeases = useAppStore((s) => s.leases);
  const storeInvoices = useAppStore((s) => s.invoices);

  const tenants = tenantsQuery.data ?? storeTenants;
  const leases = leasesQuery.data ?? storeLeases;
  const invoices = invoicesQuery.data ?? storeInvoices;

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<typeof form>>({});

  const filtered = tenants.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.email.toLowerCase().includes(search.toLowerCase()) ||
      t.phone.includes(search),
  );

  const getBalance = (tenantId: number) => {
    const leaseIds = leases
      .filter((l) => l.tenantId === tenantId)
      .map((l) => l.id);
    return invoices
      .filter((i) => leaseIds.includes(i.leaseId) && i.status !== "PAID")
      .reduce((sum, i) => sum + i.amount, 0);
  };

  const getActiveLeases = (tenantId: number) =>
    leases.filter((l) => l.tenantId === tenantId && l.status !== "ENDED")
      .length;

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setDialogOpen(true);
  };

  const openEdit = (tenant: Tenant) => {
    setEditingId(tenant.id);
    setForm({
      name: tenant.name,
      email: tenant.email,
      phone: tenant.phone,
      address: tenant.address,
      preferredPaymentMethod: tenant.preferredPaymentMethod,
    });
    setErrors({});
    setDialogOpen(true);
  };

  const validate = () => {
    const e: Partial<typeof form> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid email";
    if (!form.phone.trim()) e.phone = "Phone is required";
    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }
    const tenantData = {
      name: form.name,
      email: form.email,
      phone: form.phone,
      address: form.address,
      preferredPaymentMethod: form.preferredPaymentMethod,
    };
    if (editingId) {
      updateTenantStore(editingId, tenantData);
      toast.success("Tenant updated");
    } else {
      addTenant(tenantData);
      toast.success("Tenant added");
    }
    setDialogOpen(false);
  };

  const isSaving = false;

  return (
    <div>
      <PageHeader
        title="Tenants"
        description="Manage all tenants and their accounts"
        actions={
          <Button
            onClick={openAdd}
            className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
            data-ocid="tenants.add_tenant.button"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Tenant
          </Button>
        }
      />

      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by name, email, or phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-ocid="tenants.search_input"
          />
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card>
          <CardContent className="p-0">
            {tenantsQuery.isPending ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState
                title={
                  search ? "No tenants match your search" : "No tenants yet"
                }
                description={
                  search
                    ? "Try adjusting your search."
                    : "Add your first tenant to get started."
                }
                icon={<Users className="w-12 h-12" />}
                action={
                  !search ? (
                    <Button
                      onClick={openAdd}
                      size="sm"
                      data-ocid="tenants.empty_state"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Tenant
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">
                        Email
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">
                        Phone
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Leases
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Balance
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((tenant, idx) => {
                      const balance = getBalance(tenant.id);
                      const activeLeases = getActiveLeases(tenant.id);
                      return (
                        <tr
                          key={tenant.id}
                          data-ocid={`tenants.item.${idx + 1}`}
                          className="border-b last:border-0 hover:bg-muted/20 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <div className="font-medium text-foreground">
                              {tenant.name}
                            </div>
                            <div className="text-xs text-muted-foreground sm:hidden">
                              {tenant.email}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                            {tenant.email}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                            {tenant.phone}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="text-sm font-medium text-foreground">
                              {activeLeases}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span
                              className={`text-sm font-semibold ${balance > 0 ? "text-destructive" : "text-green-600"}`}
                            >
                              {formatCurrency(balance)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-1">
                              <Link
                                to="/admin/tenants/$id"
                                params={{ id: String(tenant.id) }}
                              >
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  data-ocid={`tenants.view_tenant.button.${idx + 1}`}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </Link>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => openEdit(tenant)}
                                data-ocid={`tenants.edit_button.${idx + 1}`}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
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

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md" data-ocid="tenants.dialog">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editingId ? "Edit Tenant" : "Add Tenant"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {(["name", "email", "phone", "address"] as const).map((field) => (
              <div key={field} className="space-y-1.5">
                <Label htmlFor={field} className="capitalize">
                  {field}
                </Label>
                <Input
                  id={field}
                  value={form[field]}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, [field]: e.target.value }))
                  }
                  className={errors[field] ? "border-destructive" : ""}
                  placeholder={
                    field === "address"
                      ? "123 Main St, City, ST"
                      : field === "phone"
                        ? "555-0000"
                        : undefined
                  }
                  data-ocid={`tenants.${field}.input`}
                />
                {errors[field] && (
                  <p className="text-xs text-destructive">{errors[field]}</p>
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              data-ocid="tenants.dialog.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
              data-ocid="tenants.dialog.submit_button"
            >
              {editingId ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm — kept for UI completeness but backend delete not wired since there's no deleteTenant in API */}
      <AlertDialog
        open={deleteId !== null}
        onOpenChange={() => setDeleteId(null)}
      >
        <AlertDialogContent data-ocid="tenants.delete.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tenant</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the tenant. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="tenants.delete.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => setDeleteId(null)}
              data-ocid="tenants.delete.confirm_button"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
