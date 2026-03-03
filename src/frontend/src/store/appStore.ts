import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { backendInterface } from "../backend";
import * as svc from "../lib/backendService";
import type {
  Facility,
  Invoice,
  InvoiceStatus,
  Lease,
  LeaseStatus,
  Payment,
  PaymentMethod,
  StorageUnit,
  Tenant,
  UnitStatus,
  User,
} from "../types";

// ─── Demo Data ────────────────────────────────────────────────────────────────

const DEMO_FACILITIES: Facility[] = [
  {
    id: 1,
    name: "Country Lane Storage",
    address: "123 Main Street, Springfield, IL 62701",
    timeZone: "America/Chicago",
  },
];

// Unit layout: units 1-24 are 10x14, 25-34 are 12x14, 35-40 are 10x14,
// 41-47 are 12x14, 48-58 are 12x16, 59-63 are 6x6.
// Row/col layout groups by size section for the unit map.
// Rent defaults: 6x6=$49, 10x14=$89, 12x14=$109, 12x16=$129, 12x28=$199
const UNIT_RENT: Record<string, number> = {
  "6x6": 49,
  "10x14": 89,
  "12x14": 109,
  "12x16": 129,
  "12x28": 199,
};

// Raw facility data: [unitNumber, tenantName|"", size]
const RAW_UNITS: [number, string, string][] = [
  [1, "Jodi Bosly", "10x14"],
  [2, "Darrell Trip", "10x14"],
  [3, "Seth Fesler", "10x14"],
  [4, "Natalie Murphy", "10x14"],
  [5, "Brandy (Thomas) Burton", "10x14"],
  [6, "Rebecca Smith", "10x14"],
  [7, "Rebecca Smith", "10x14"],
  [8, "Steve Bowen", "10x14"],
  [9, "A to Z", "10x14"],
  [10, "Seth Fesler", "10x14"],
  [11, "Jodi Bosly", "10x14"],
  [12, "Rachel Beitzel", "10x14"],
  [13, "Teeples", "10x14"],
  [14, "Kathy Smith", "10x14"],
  [15, "Colleen Romero", "10x14"],
  [16, "Tami Smith", "10x14"],
  [17, "Andy Gardner", "10x14"],
  [18, "Joan Oglasbee", "10x14"],
  [19, "Rick Roedl", "10x14"],
  [20, "Rick Roedl", "10x14"],
  [21, "Trudy Ward", "10x14"],
  [22, "Steve Bowen", "10x14"],
  [23, "Jana Wagner", "10x14"],
  [24, "Russell Talbet", "10x14"],
  [25, "Ricci Walters", "12x14"],
  [26, "Ed Jones", "12x14"],
  [27, "Susan Wittman", "12x14"],
  [28, "Lana Tripp", "12x14"],
  [29, "Polly Scott", "12x14"],
  [30, "", "12x14"],
  [31, "Travis Whipple", "12x14"],
  [32, "Debra Browning", "12x14"],
  [33, "Norm Jaussi", "12x14"],
  [34, "", "12x14"],
  [35, "Denise Thomas", "10x14"],
  [36, "Pat Rojas", "10x14"],
  [37, "Fonnie Miller", "10x14"],
  [38, "Frank (Warren) Schieman", "10x14"],
  [39, "", "10x14"],
  [40, "", "10x14"],
  [41, "Dan Couch", "12x14"],
  [42, "Tyra Neal", "12x14"],
  [43, "Nicole Martin", "12x14"],
  [44, "Frank (Warren) Schieman", "12x14"],
  [45, "Christi Murdock", "12x14"],
  [46, "Gayla Clark", "12x14"],
  [47, "", "12x14"],
  [48, "Susan Wittman", "12x16"],
  [49, "Judy Jones", "12x16"],
  [50, "William (Harley) Jeppsen", "12x16"],
  [51, "Josh Wray", "12x16"],
  [52, "Don Olson", "12x16"],
  [53, "Sandra McBride", "12x16"],
  [54, "Frank (Warren) Schieman", "12x16"],
  [55, "Frank (Warren) Schieman", "12x16"],
  [56, "Jones Heating", "12x16"],
  [57, "Debora Petit", "12x16"],
  [58, "Nicole Martin", "12x16"],
  [59, "", "6x6"],
  [60, "MVI", "6x6"],
  [61, "Lorranie", "6x6"],
  [62, "", "6x6"],
  [63, "", "6x6"],
];

// Assign row/col: units 1-24 (10x14, cols 0-11 rows 0-1),
// 25-34 (12x14, row 2), 35-40 (10x14, row 3), 41-47 (12x14, row 4),
// 48-58 (12x16, row 5), 59-63 (6x6, row 6)
function assignRowCol(unitNum: number): { row: number; col: number } {
  if (unitNum >= 1 && unitNum <= 12) return { row: 0, col: unitNum - 1 };
  if (unitNum >= 13 && unitNum <= 24) return { row: 1, col: unitNum - 13 };
  if (unitNum >= 25 && unitNum <= 34) return { row: 2, col: unitNum - 25 };
  if (unitNum >= 35 && unitNum <= 40) return { row: 3, col: unitNum - 35 };
  if (unitNum >= 41 && unitNum <= 47) return { row: 4, col: unitNum - 41 };
  if (unitNum >= 48 && unitNum <= 58) return { row: 5, col: unitNum - 48 };
  if (unitNum >= 59 && unitNum <= 63) return { row: 6, col: unitNum - 59 };
  return { row: 0, col: 0 };
}

const DEMO_UNITS: StorageUnit[] = RAW_UNITS.map(([num, tenant, size]) => {
  const { row, col } = assignRowCol(num);
  return {
    id: num,
    facilityId: 1,
    unitNumber: String(num),
    size,
    floor: 1,
    row,
    col,
    monthlyRent: UNIT_RENT[size] ?? 89,
    status: tenant ? "OCCUPIED" : ("VACANT" as UnitStatus),
    notes: "",
  };
});

// Build unique tenant list from RAW_UNITS
const _uniqueTenantNames = [
  ...new Set(RAW_UNITS.map(([, name]) => name).filter((n) => n !== "")),
];
const TENANT_ID_MAP: Record<string, number> = {};
_uniqueTenantNames.forEach((name, idx) => {
  TENANT_ID_MAP[name] = idx + 1;
});

const DEMO_TENANTS: Tenant[] = _uniqueTenantNames.map((name, idx) => {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 12);
  return {
    id: idx + 1,
    name,
    email: `${slug}@countrylanestorage.com`,
    phone: "",
    address: "",
    preferredPaymentMethod: "CARD",
  };
});

// Generate one lease per occupied unit
const DEMO_LEASES: Lease[] = RAW_UNITS.filter(
  ([, tenant]) => tenant !== "",
).map(([num, tenant, size], idx) => ({
  id: idx + 1,
  tenantId: TENANT_ID_MAP[tenant],
  unitId: num,
  startDate: "2024-01-01",
  monthlyRent: UNIT_RENT[size] ?? 89,
  billingDay: 1,
  autoPay: false,
  status: "ACTIVE" as LeaseStatus,
}));

const DEMO_INVOICES: Invoice[] = [];
const DEMO_PAYMENTS: Payment[] = [];

const DEMO_USERS: (User & { password: string })[] = [
  {
    id: 1,
    email: "admin@storage.com",
    password: "Admin1234!",
    role: "ADMIN",
    name: "Admin User",
    tenantId: undefined,
  },
];

// ─── Store Types ──────────────────────────────────────────────────────────────

interface AppState {
  // Data
  facilities: Facility[];
  units: StorageUnit[];
  tenants: Tenant[];
  leases: Lease[];
  invoices: Invoice[];
  payments: Payment[];

  // Auth
  currentUser: User | null;

  // Auth actions
  login: (
    email: string,
    password: string,
  ) => { success: boolean; error?: string };
  logout: () => void;

  // Backend sync
  initFromBackend: (actor: backendInterface) => Promise<void>;

  // Facility CRUD
  updateFacility: (id: number, data: Partial<Facility>) => void;

  // Unit CRUD
  addUnit: (data: Omit<StorageUnit, "id">) => StorageUnit;
  updateUnit: (id: number, data: Partial<StorageUnit>) => void;
  deleteUnit: (id: number) => void;

  // Tenant CRUD
  addTenant: (data: Omit<Tenant, "id">) => Tenant;
  updateTenant: (id: number, data: Partial<Tenant>) => void;
  deleteTenant: (id: number) => void;

  // Lease CRUD
  addLease: (data: Omit<Lease, "id">) => Lease;
  updateLease: (id: number, data: Partial<Lease>) => void;
  endLease: (id: number) => void;

  // Invoice CRUD
  addInvoice: (data: Omit<Invoice, "id">) => Invoice;
  updateInvoice: (id: number, data: Partial<Invoice>) => void;
  markInvoicePaid: (id: number) => void;
  markOverdueInvoices: () => number;
  generateInvoices: () => Invoice[];

  // Payment CRUD
  addPayment: (data: Omit<Payment, "id">) => Payment;
  payInvoice: (invoiceId: number, method: PaymentMethod) => Payment;

  // Selectors
  getLeasesByTenant: (tenantId: number) => Lease[];
  getInvoicesByLease: (leaseId: number) => Invoice[];
  getInvoicesByTenant: (tenantId: number) => Invoice[];
  getPaymentsByTenant: (tenantId: number) => Payment[];
  getPaymentsByInvoice: (invoiceId: number) => Payment[];
  getTenantById: (id: number) => Tenant | undefined;
  getUnitById: (id: number) => StorageUnit | undefined;
  getLeaseById: (id: number) => Lease | undefined;
  getInvoiceById: (id: number) => Invoice | undefined;
  getActiveLeaseForUnit: (unitId: number) => Lease | undefined;

  // KPIs
  getKPIs: () => {
    totalUnits: number;
    occupiedUnits: number;
    occupancyRate: number;
    monthlyRevenue: number;
    overdueInvoices: number;
    overdueBalance: number;
  };
}

// ─── ID Generators ────────────────────────────────────────────────────────────

// These are computed at module load time after the demo data arrays are built
// unit IDs go 1–63, tenant IDs 1–N_unique_tenants, lease IDs 1–N_occupied
let _nextId = {
  unit: 64,
  tenant: 100,
  lease: 100,
  invoice: 1,
  payment: 1,
  facility: 2,
};

function nextId(entity: keyof typeof _nextId): number {
  return _nextId[entity]++;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      facilities: DEMO_FACILITIES,
      units: DEMO_UNITS,
      tenants: DEMO_TENANTS,
      leases: DEMO_LEASES,
      invoices: DEMO_INVOICES,
      payments: DEMO_PAYMENTS,
      currentUser: null,

      // ── Auth ──
      login: (email, password) => {
        const user = DEMO_USERS.find(
          (u) =>
            u.email.toLowerCase() === email.toLowerCase() &&
            u.password === password,
        );
        if (!user)
          return { success: false, error: "Invalid email or password." };
        const { password: _pw, ...userWithoutPw } = user;
        void _pw;
        set({ currentUser: userWithoutPw });
        return { success: true };
      },

      logout: () => set({ currentUser: null }),

      // ── Backend Sync ──
      initFromBackend: async (actor: backendInterface) => {
        try {
          const [facilities, units, tenants, leases, invoices] =
            await Promise.all([
              svc.listFacilities(actor),
              svc.listAllUnits(actor),
              svc.listTenants(actor),
              svc.listAllLeases(actor),
              svc.listAllInvoices(actor),
            ]);

          // Get payments for all unique tenant IDs
          const tenantIds = [...new Set(leases.map((l) => l.tenantId))];
          const paymentArrays = await Promise.all(
            tenantIds.map((tid) => svc.listPaymentsByTenant(actor, tid)),
          );
          const payments = paymentArrays.flat();

          set({ facilities, units, tenants, leases, invoices, payments });
        } catch {
          // Silently fail — local demo data remains
        }
      },

      // ── Facility ──
      updateFacility: (id, data) =>
        set((state) => ({
          facilities: state.facilities.map((f) =>
            f.id === id ? { ...f, ...data } : f,
          ),
        })),

      // ── Unit ──
      addUnit: (data) => {
        const unit: StorageUnit = { ...data, id: nextId("unit") };
        set((state) => ({ units: [...state.units, unit] }));
        return unit;
      },
      updateUnit: (id, data) =>
        set((state) => ({
          units: state.units.map((u) => (u.id === id ? { ...u, ...data } : u)),
        })),
      deleteUnit: (id) =>
        set((state) => ({ units: state.units.filter((u) => u.id !== id) })),

      // ── Tenant ──
      addTenant: (data) => {
        const tenant: Tenant = { ...data, id: nextId("tenant") };
        set((state) => ({ tenants: [...state.tenants, tenant] }));
        return tenant;
      },
      updateTenant: (id, data) =>
        set((state) => ({
          tenants: state.tenants.map((t) =>
            t.id === id ? { ...t, ...data } : t,
          ),
        })),
      deleteTenant: (id) =>
        set((state) => ({ tenants: state.tenants.filter((t) => t.id !== id) })),

      // ── Lease ──
      addLease: (data) => {
        const lease: Lease = { ...data, id: nextId("lease") };
        set((state) => ({
          leases: [...state.leases, lease],
          // Mark unit as OCCUPIED
          units: state.units.map((u) =>
            u.id === data.unitId
              ? { ...u, status: "OCCUPIED" as UnitStatus }
              : u,
          ),
        }));
        return lease;
      },
      updateLease: (id, data) =>
        set((state) => ({
          leases: state.leases.map((l) =>
            l.id === id ? { ...l, ...data } : l,
          ),
        })),
      endLease: (id) => {
        const state = get();
        const lease = state.leases.find((l) => l.id === id);
        if (!lease) return;
        set((st) => ({
          leases: st.leases.map((l) =>
            l.id === id
              ? {
                  ...l,
                  status: "ENDED" as LeaseStatus,
                  endDate: new Date().toISOString().split("T")[0],
                }
              : l,
          ),
          units: st.units.map((u) =>
            u.id === lease.unitId
              ? { ...u, status: "VACANT" as UnitStatus }
              : u,
          ),
        }));
      },

      // ── Invoice ──
      addInvoice: (data) => {
        const invoice: Invoice = { ...data, id: nextId("invoice") };
        set((state) => ({ invoices: [...state.invoices, invoice] }));
        return invoice;
      },
      updateInvoice: (id, data) =>
        set((state) => ({
          invoices: state.invoices.map((i) =>
            i.id === id ? { ...i, ...data } : i,
          ),
        })),
      markInvoicePaid: (id) =>
        set((state) => ({
          invoices: state.invoices.map((i) =>
            i.id === id ? { ...i, status: "PAID" as InvoiceStatus } : i,
          ),
        })),
      markOverdueInvoices: () => {
        const today = new Date().toISOString().split("T")[0];
        let count = 0;
        set((state) => ({
          invoices: state.invoices.map((i) => {
            if (
              (i.status === "SENT" || i.status === "DRAFT") &&
              i.dueDate < today
            ) {
              count++;
              return { ...i, status: "OVERDUE" as InvoiceStatus };
            }
            return i;
          }),
        }));
        return count;
      },
      generateInvoices: () => {
        const state = get();
        const today = new Date().toISOString().split("T")[0];
        const todayDate = new Date(today);
        const currentYear = todayDate.getFullYear();
        const currentMonth = todayDate.getMonth();
        const newInvoices: Invoice[] = [];

        for (const lease of state.leases) {
          if (lease.status !== "ACTIVE") continue;

          // Check if an invoice already exists for this lease this month
          const existing = state.invoices.find((i) => {
            if (i.leaseId !== lease.id) return false;
            const d = new Date(i.periodStart);
            return (
              d.getFullYear() === currentYear && d.getMonth() === currentMonth
            );
          });
          if (existing) continue;

          // Use the lease's billing day as the due date, clamped to the last day of the month
          const billingDay = lease.billingDay;
          const daysInMonth = new Date(
            currentYear,
            currentMonth + 1,
            0,
          ).getDate();
          const dueDayOfMonth = Math.min(billingDay, daysInMonth);
          const dueDate = new Date(currentYear, currentMonth, dueDayOfMonth);

          // Period: billing day of this month → billing day - 1 of next month
          const periodStart = new Date(
            currentYear,
            currentMonth,
            dueDayOfMonth,
          );
          const periodEnd = new Date(
            currentYear,
            currentMonth + 1,
            dueDayOfMonth - 1,
          );

          const invoice = get().addInvoice({
            leaseId: lease.id,
            periodStart: periodStart.toISOString().split("T")[0],
            periodEnd: periodEnd.toISOString().split("T")[0],
            dueDate: dueDate.toISOString().split("T")[0],
            amount: lease.monthlyRent,
            status: "SENT",
            lastSentAt: today,
          });
          newInvoices.push(invoice);
        }

        return newInvoices;
      },

      // ── Payment ──
      addPayment: (data) => {
        const payment: Payment = { ...data, id: nextId("payment") };
        set((state) => ({ payments: [...state.payments, payment] }));
        return payment;
      },
      payInvoice: (invoiceId, method) => {
        const state = get();
        const invoice = state.invoices.find((i) => i.id === invoiceId);
        if (!invoice) throw new Error("Invoice not found");

        const lease = state.leases.find((l) => l.id === invoice.leaseId);
        if (!lease) throw new Error("Lease not found");

        const transactionId = `ch_demo_${Date.now()}`;
        const payment = get().addPayment({
          tenantId: lease.tenantId,
          invoiceId,
          paymentDate: new Date().toISOString().split("T")[0],
          amount: invoice.amount,
          method,
          transactionId,
          status: "SUCCESS",
        });

        get().markInvoicePaid(invoiceId);
        return payment;
      },

      // ── Selectors ──
      getLeasesByTenant: (tenantId) =>
        get().leases.filter((l) => l.tenantId === tenantId),

      getInvoicesByLease: (leaseId) =>
        get().invoices.filter((i) => i.leaseId === leaseId),

      getInvoicesByTenant: (tenantId) => {
        const leaseIds = get()
          .leases.filter((l) => l.tenantId === tenantId)
          .map((l) => l.id);
        return get().invoices.filter((i) => leaseIds.includes(i.leaseId));
      },

      getPaymentsByTenant: (tenantId) =>
        get().payments.filter((p) => p.tenantId === tenantId),

      getPaymentsByInvoice: (invoiceId) =>
        get().payments.filter((p) => p.invoiceId === invoiceId),

      getTenantById: (id) => get().tenants.find((t) => t.id === id),
      getUnitById: (id) => get().units.find((u) => u.id === id),
      getLeaseById: (id) => get().leases.find((l) => l.id === id),
      getInvoiceById: (id) => get().invoices.find((i) => i.id === id),

      getActiveLeaseForUnit: (unitId) =>
        get().leases.find((l) => l.unitId === unitId && l.status === "ACTIVE"),

      getKPIs: () => {
        const { units, leases, invoices } = get();
        const totalUnits = units.length;
        const occupiedUnits = units.filter(
          (u) => u.status === "OCCUPIED" || u.status === "DELINQUENT",
        ).length;
        const occupancyRate =
          totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;
        const activeLeases = leases.filter(
          (l) => l.status === "ACTIVE" || l.status === "DELINQUENT",
        );
        const monthlyRevenue = activeLeases.reduce(
          (sum, l) => sum + l.monthlyRent,
          0,
        );
        const overdueInvoices = invoices.filter(
          (i) => i.status === "OVERDUE",
        ).length;
        const overdueBalance = invoices
          .filter((i) => i.status === "OVERDUE")
          .reduce((sum, i) => sum + i.amount, 0);
        return {
          totalUnits,
          occupiedUnits,
          occupancyRate,
          monthlyRevenue,
          overdueInvoices,
          overdueBalance,
        };
      },
    }),
    {
      name: "countrylane-storage-v2",
      partialize: (state) => ({
        currentUser: state.currentUser,
        facilities: state.facilities,
        units: state.units,
        tenants: state.tenants,
        leases: state.leases,
        invoices: state.invoices,
        payments: state.payments,
      }),
    },
  ),
);
