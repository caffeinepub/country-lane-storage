import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { UnitStatusBadge } from "@/components/shared/StatusBadge";
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
import { Textarea } from "@/components/ui/textarea";
import { useAllUnits } from "@/hooks/useBackendData";
import { formatCurrency } from "@/lib/formatters";
import { useAppStore } from "@/store/appStore";
import type { StorageUnit, UnitStatus } from "@/types";
import { Edit, Plus, Trash2, Warehouse } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type UnitForm = Omit<StorageUnit, "id"> & { id?: number };

const EMPTY_FORM: UnitForm = {
  facilityId: 1,
  unitNumber: "",
  size: "6x6",
  floor: 1,
  row: 0,
  col: 0,
  monthlyRent: 49,
  status: "VACANT",
  notes: "",
};

export function AdminUnits() {
  const unitsQuery = useAllUnits();

  const addUnitStore = useAppStore((s) => s.addUnit);
  const updateUnitStore = useAppStore((s) => s.updateUnit);
  const deleteUnitStore = useAppStore((s) => s.deleteUnit);

  const setFn = useAppStore.setState;
  useEffect(() => {
    if (unitsQuery.data) setFn({ units: unitsQuery.data });
  }, [unitsQuery.data, setFn]);

  const storeUnits = useAppStore((s) => s.units);
  const units = unitsQuery.data ?? storeUnits;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<UnitForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setDialogOpen(true);
  };
  const openEdit = (unit: StorageUnit) => {
    setEditingId(unit.id);
    setForm({ ...unit });
    setErrors({});
    setDialogOpen(true);
  };

  const validate = () => {
    const e: typeof errors = {};
    if (!form.unitNumber.trim()) e.unitNumber = "Unit number is required";
    if (form.monthlyRent <= 0) e.monthlyRent = "Rent must be positive";
    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }
    if (editingId) {
      updateUnitStore(editingId, {
        unitNumber: form.unitNumber,
        size: form.size,
        floor: form.floor,
        row: form.row,
        col: form.col,
        monthlyRent: form.monthlyRent,
        status: form.status,
        notes: form.notes,
      });
      toast.success("Unit updated");
    } else {
      addUnitStore({
        facilityId: form.facilityId,
        unitNumber: form.unitNumber,
        size: form.size,
        floor: form.floor,
        row: form.row,
        col: form.col,
        monthlyRent: form.monthlyRent,
        status: form.status,
        notes: form.notes,
      });
      toast.success("Unit added");
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: number) => {
    deleteUnitStore(id);
    toast.success("Unit deleted");
    setDeleteId(null);
  };

  const setField = <K extends keyof UnitForm>(key: K, value: UnitForm[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  return (
    <div>
      <PageHeader
        title="Units"
        description="Manage all storage units"
        actions={
          <Button
            onClick={openAdd}
            className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
            data-ocid="units.add_unit.button"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Unit
          </Button>
        }
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card>
          <CardContent className="p-0">
            {unitsQuery.isPending ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : units.length === 0 ? (
              <EmptyState
                title="No units"
                icon={<Warehouse className="w-12 h-12" />}
                action={
                  <Button
                    onClick={openAdd}
                    size="sm"
                    data-ocid="units.empty_state"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Unit
                  </Button>
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                        Unit #
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                        Size
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase hidden sm:table-cell">
                        Floor
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase hidden md:table-cell">
                        Row/Col
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">
                        Rent
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase hidden lg:table-cell">
                        Notes
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {units.map((unit, idx) => (
                      <tr
                        key={unit.id}
                        data-ocid={`units.item.${idx + 1}`}
                        className="border-b last:border-0 hover:bg-muted/20 transition-colors"
                      >
                        <td className="px-4 py-3 font-semibold text-foreground">
                          {unit.unitNumber}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {unit.size} ft
                        </td>
                        <td className="px-4 py-3 text-center text-muted-foreground hidden sm:table-cell">
                          {unit.floor}
                        </td>
                        <td className="px-4 py-3 text-center text-muted-foreground hidden md:table-cell">
                          R{unit.row}/C{unit.col}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-foreground">
                          {formatCurrency(unit.monthlyRent)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <UnitStatusBadge status={unit.status} />
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs hidden lg:table-cell truncate max-w-[120px]">
                          {unit.notes || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => openEdit(unit)}
                              data-ocid={`units.edit_button.${idx + 1}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              onClick={() => setDeleteId(unit.id)}
                              data-ocid={`units.delete_button.${idx + 1}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
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

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg" data-ocid="units.dialog">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editingId ? "Edit Unit" : "Add Unit"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-1.5">
              <Label>Unit Number</Label>
              <Input
                value={form.unitNumber}
                onChange={(e) => setField("unitNumber", e.target.value)}
                className={errors.unitNumber ? "border-destructive" : ""}
                placeholder="A1"
                data-ocid="units.unit_number.input"
              />
              {errors.unitNumber && (
                <p className="text-xs text-destructive">{errors.unitNumber}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Size</Label>
              <Select
                value={form.size}
                onValueChange={(v) => setField("size", v)}
              >
                <SelectTrigger data-ocid="units.size.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["6x6", "10x14", "12x14", "12x16", "12x28"].map((s) => (
                    <SelectItem key={s} value={s}>
                      {s} ft
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Monthly Rent ($)</Label>
              <Input
                type="number"
                value={form.monthlyRent}
                onChange={(e) =>
                  setField("monthlyRent", Number(e.target.value))
                }
                className={errors.monthlyRent ? "border-destructive" : ""}
                data-ocid="units.monthly_rent.input"
              />
              {errors.monthlyRent && (
                <p className="text-xs text-destructive">{errors.monthlyRent}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setField("status", v as UnitStatus)}
              >
                <SelectTrigger data-ocid="units.status.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(
                    [
                      "VACANT",
                      "OCCUPIED",
                      "RESERVED",
                      "DELINQUENT",
                      "DISABLED",
                    ] as UnitStatus[]
                  ).map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Floor</Label>
              <Input
                type="number"
                min={1}
                value={form.floor}
                onChange={(e) => setField("floor", Number(e.target.value))}
                data-ocid="units.floor.input"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label>Row</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.row}
                  onChange={(e) => setField("row", Number(e.target.value))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Col</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.col}
                  onChange={(e) => setField("col", Number(e.target.value))}
                />
              </div>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setField("notes", e.target.value)}
                rows={2}
                placeholder="Optional notes…"
                data-ocid="units.notes.textarea"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              data-ocid="units.dialog.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
              data-ocid="units.dialog.submit_button"
            >
              {editingId ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog
        open={deleteId !== null}
        onOpenChange={() => setDeleteId(null)}
      >
        <AlertDialogContent data-ocid="units.delete.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Unit</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the unit.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="units.delete.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={() => deleteId && handleDelete(deleteId)}
              data-ocid="units.delete.confirm_button"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
