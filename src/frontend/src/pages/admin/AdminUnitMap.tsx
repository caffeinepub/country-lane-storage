import { UnitStatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate, unitStatusConfig } from "@/lib/formatters";
import { useAppStore } from "@/store/appStore";
import type { StorageUnit, UnitStatus } from "@/types";
import { useNavigate } from "@tanstack/react-router";
import {
  Calendar,
  CheckSquare,
  DollarSign,
  FileText,
  User,
  UserPlus,
  Warehouse,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

const STATUS_COLORS: Record<
  UnitStatus,
  { bg: string; border: string; text: string; dot: string }
> = {
  VACANT: {
    bg: "bg-emerald-50  hover:bg-emerald-100",
    border: "border-emerald-300",
    text: "text-emerald-800",
    dot: "bg-emerald-500",
  },
  OCCUPIED: {
    bg: "bg-blue-50     hover:bg-blue-100",
    border: "border-blue-300",
    text: "text-blue-800",
    dot: "bg-blue-500",
  },
  RESERVED: {
    bg: "bg-amber-50    hover:bg-amber-100",
    border: "border-amber-300",
    text: "text-amber-800",
    dot: "bg-amber-500",
  },
  DELINQUENT: {
    bg: "bg-red-50      hover:bg-red-100",
    border: "border-red-300",
    text: "text-red-800",
    dot: "bg-red-500",
  },
  DISABLED: {
    bg: "bg-gray-100    hover:bg-gray-200",
    border: "border-gray-300",
    text: "text-gray-500",
    dot: "bg-gray-400",
  },
};

const ALL_STATUSES: UnitStatus[] = [
  "VACANT",
  "OCCUPIED",
  "RESERVED",
  "DELINQUENT",
  "DISABLED",
];

export function AdminUnitMap() {
  const navigate = useNavigate();
  const { units, tenants, leases, facilities, updateUnit } = useAppStore();
  const [selectedUnit, setSelectedUnit] = useState<StorageUnit | null>(null);
  const [activeFilters, setActiveFilters] = useState<Set<UnitStatus>>(
    new Set(ALL_STATUSES),
  );
  const [selectedFacilityId, setSelectedFacilityId] = useState(1);

  const facilityUnits = units.filter(
    (u) => u.facilityId === selectedFacilityId,
  );

  // Build grid
  const maxRow = Math.max(...facilityUnits.map((u) => u.row), 0);
  const maxCol = Math.max(...facilityUnits.map((u) => u.col), 0);

  const rows = Array.from({ length: maxRow + 1 }, (_, r) => r);
  const cols = Array.from({ length: maxCol + 1 }, (_, c) => c);

  const getUnitAt = (row: number, col: number) =>
    facilityUnits.find((u) => u.row === row && u.col === col);

  const toggleFilter = (status: UnitStatus) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  };

  const getActiveLease = (unitId: number) =>
    leases.find(
      (l) =>
        l.unitId === unitId &&
        (l.status === "ACTIVE" || l.status === "DELINQUENT"),
    );

  const getTenantForUnit = (unitId: number) => {
    const lease = getActiveLease(unitId);
    return lease ? tenants.find((t) => t.id === lease.tenantId) : undefined;
  };

  const handleMarkVacant = (unit: StorageUnit) => {
    const lease = getActiveLease(unit.id);
    if (lease) {
      useAppStore.getState().endLease(lease.id);
    } else {
      updateUnit(unit.id, { status: "VACANT" });
    }
    toast.success(`Unit ${unit.unitNumber} marked as vacant`);
    setSelectedUnit(null);
  };

  const selectedLease = selectedUnit
    ? getActiveLease(selectedUnit.id)
    : undefined;
  const selectedTenant = selectedUnit
    ? getTenantForUnit(selectedUnit.id)
    : undefined;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">
            Unit Map
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {facilities.find((f) => f.id === selectedFacilityId)?.name} — Visual
            unit layout
          </p>
        </div>
        {facilities.length > 1 && (
          <div className="flex gap-2">
            {facilities.map((f) => (
              <Button
                key={f.id}
                variant={selectedFacilityId === f.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedFacilityId(f.id)}
              >
                {f.name}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Legend + Filters */}
      <div className="bg-card rounded-xl border p-4 mb-6 shadow-xs">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Filter by Status
        </div>
        <div className="flex flex-wrap gap-2">
          {ALL_STATUSES.map((status) => {
            const colors = STATUS_COLORS[status];
            const config = unitStatusConfig[status];
            const active = activeFilters.has(status);
            const count = facilityUnits.filter(
              (u) => u.status === status,
            ).length;
            return (
              <button
                type="button"
                key={status}
                onClick={() => toggleFilter(status)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                  active
                    ? `${colors.bg.split(" ")[0]} ${colors.border} ${colors.text}`
                    : "bg-muted/30 border-border text-muted-foreground opacity-50"
                }`}
              >
                <span
                  className={`w-2.5 h-2.5 rounded-full ${active ? colors.dot : "bg-gray-400"}`}
                />
                {config.label}
                <span className="bg-black/10 rounded-full px-1.5 py-0.5 text-[10px] font-bold">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid */}
      <div className="bg-card rounded-xl border shadow-xs overflow-hidden">
        <div className="p-4 border-b bg-muted/20 flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            {facilityUnits.length} units · Click a unit for details
          </span>
          <span className="text-xs text-muted-foreground">
            {facilityUnits.filter((u) => activeFilters.has(u.status)).length}{" "}
            shown
          </span>
        </div>

        <div className="p-6 overflow-x-auto">
          {/* Column headers */}
          <div
            className="grid gap-2 mb-2"
            style={{
              gridTemplateColumns: `40px repeat(${cols.length}, minmax(100px, 130px))`,
            }}
          >
            <div />
            {cols.map((c) => (
              <div
                key={c}
                className="text-center text-xs font-semibold text-muted-foreground"
              >
                Col {c + 1}
              </div>
            ))}
          </div>

          {/* Grid rows */}
          <div className="space-y-2">
            {rows.map((r) => (
              <div
                key={r}
                className="grid gap-2"
                style={{
                  gridTemplateColumns: `40px repeat(${cols.length}, minmax(100px, 130px))`,
                }}
              >
                {/* Row label */}
                <div className="flex items-center justify-center text-xs font-semibold text-muted-foreground">
                  Row {r + 1}
                </div>

                {/* Unit cells */}
                {cols.map((c) => {
                  const unit = getUnitAt(r, c);
                  if (!unit) {
                    return (
                      <div
                        key={c}
                        className="h-[90px] rounded-lg border border-dashed border-border/40 bg-muted/10"
                      />
                    );
                  }

                  const colors = STATUS_COLORS[unit.status];
                  const isVisible = activeFilters.has(unit.status);
                  const tenant = getTenantForUnit(unit.id);

                  return (
                    <motion.button
                      key={c}
                      whileHover={{ scale: 1.04, y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => isVisible && setSelectedUnit(unit)}
                      className={`h-[90px] rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer shadow-xs ${
                        isVisible
                          ? `${colors.bg} ${colors.border}`
                          : "opacity-20 bg-muted/20 border-border cursor-default"
                      } ${selectedUnit?.id === unit.id ? "ring-2 ring-primary ring-offset-2" : ""}`}
                    >
                      <span
                        className={`text-base font-bold font-display ${colors.text}`}
                      >
                        {unit.unitNumber}
                      </span>
                      <span
                        className={`text-[11px] font-medium ${colors.text} opacity-80`}
                      >
                        {unit.size} ft
                      </span>
                      {tenant && (
                        <span
                          className={`text-[10px] ${colors.text} opacity-60 truncate max-w-[90px] px-1`}
                        >
                          {tenant.name.split(" ")[0]}
                        </span>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Unit Detail Panel */}
      <AnimatePresence>
        {selectedUnit && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40"
              onClick={() => setSelectedUnit(null)}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, x: 40, scale: 0.97 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.97 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-card border-l shadow-2xl z-50 overflow-y-auto"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold font-display text-foreground">
                      Unit {selectedUnit.unitNumber}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {selectedUnit.size} ft · Floor {selectedUnit.floor}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedUnit(null)}
                    className="p-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Status */}
                <div className="mb-6">
                  <UnitStatusBadge
                    status={selectedUnit.status}
                    className="text-sm px-3 py-1"
                  />
                </div>

                {/* Details */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <div className="text-xs text-muted-foreground">
                        Monthly Rent
                      </div>
                      <div className="font-semibold">
                        {formatCurrency(selectedUnit.monthlyRent)}
                      </div>
                    </div>
                  </div>

                  {selectedUnit.notes && (
                    <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800">
                      <span className="font-medium">Note: </span>
                      {selectedUnit.notes}
                    </div>
                  )}
                </div>

                {/* Tenant Info */}
                {selectedTenant && selectedLease && (
                  <div className="mb-6 space-y-3">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Current Tenant
                    </h3>
                    <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-blue-600" />
                        <span className="font-semibold text-blue-900">
                          {selectedTenant.name}
                        </span>
                      </div>
                      <div className="text-sm text-blue-700">
                        {selectedTenant.email}
                      </div>
                      <div className="text-sm text-blue-700">
                        {selectedTenant.phone}
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-muted/50 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Lease Start
                        </span>
                        <span className="font-medium">
                          {formatDate(selectedLease.startDate)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Monthly Rent
                        </span>
                        <span className="font-medium">
                          {formatCurrency(selectedLease.monthlyRent)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Billing Day
                        </span>
                        <span className="font-medium">
                          Day {selectedLease.billingDay}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Auto-Pay</span>
                        <span
                          className={`font-medium ${selectedLease.autoPay ? "text-green-600" : "text-muted-foreground"}`}
                        >
                          {selectedLease.autoPay ? "Enabled" : "Disabled"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    Quick Actions
                  </h3>

                  {selectedTenant && (
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2"
                      onClick={() => {
                        navigate({
                          to: "/admin/tenants/$id",
                          params: { id: String(selectedTenant.id) },
                        });
                        setSelectedUnit(null);
                      }}
                    >
                      <User className="w-4 h-4" />
                      View Tenant Profile
                    </Button>
                  )}

                  {selectedLease && (
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2"
                      onClick={() => {
                        navigate({ to: "/admin/leases" });
                        setSelectedUnit(null);
                      }}
                    >
                      <FileText className="w-4 h-4" />
                      View Lease
                    </Button>
                  )}

                  {(selectedUnit.status === "OCCUPIED" ||
                    selectedUnit.status === "DELINQUENT") && (
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/5 border-destructive/30"
                      onClick={() => handleMarkVacant(selectedUnit)}
                    >
                      <CheckSquare className="w-4 h-4" />
                      Mark as Vacant
                    </Button>
                  )}

                  {selectedUnit.status === "VACANT" && (
                    <Button
                      className="w-full justify-start gap-2 bg-accent hover:bg-accent/90 text-accent-foreground"
                      onClick={() => {
                        navigate({ to: "/admin/leases" });
                        setSelectedUnit(null);
                        toast.info("Create a lease to assign this unit.");
                      }}
                    >
                      <UserPlus className="w-4 h-4" />
                      Assign Tenant
                    </Button>
                  )}

                  {selectedUnit.status === "RESERVED" && (
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2"
                      onClick={() => {
                        navigate({ to: "/admin/leases" });
                        setSelectedUnit(null);
                      }}
                    >
                      <Calendar className="w-4 h-4" />
                      Create Lease
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
