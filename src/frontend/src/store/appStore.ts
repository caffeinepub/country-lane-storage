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

const DEMO_UNITS: StorageUnit[] = [
  // Row 0 — 6x6 units
  {
    id: 1,
    facilityId: 1,
    unitNumber: "A1",
    size: "6x6",
    floor: 1,
    row: 0,
    col: 0,
    monthlyRent: 49,
    status: "VACANT",
    notes: "",
  },
  {
    id: 2,
    facilityId: 1,
    unitNumber: "A2",
    size: "6x6",
    floor: 1,
    row: 0,
    col: 1,
    monthlyRent: 49,
    status: "OCCUPIED",
    notes: "",
  },
  {
    id: 3,
    facilityId: 1,
    unitNumber: "A3",
    size: "6x6",
    floor: 1,
    row: 0,
    col: 2,
    monthlyRent: 49,
    status: "OCCUPIED",
    notes: "",
  },
  {
    id: 4,
    facilityId: 1,
    unitNumber: "A4",
    size: "6x6",
    floor: 1,
    row: 0,
    col: 3,
    monthlyRent: 49,
    status: "RESERVED",
    notes: "",
  },
  // Row 1 — 10x14 units
  {
    id: 5,
    facilityId: 1,
    unitNumber: "B1",
    size: "10x14",
    floor: 1,
    row: 1,
    col: 0,
    monthlyRent: 89,
    status: "VACANT",
    notes: "",
  },
  {
    id: 6,
    facilityId: 1,
    unitNumber: "B2",
    size: "10x14",
    floor: 1,
    row: 1,
    col: 1,
    monthlyRent: 89,
    status: "OCCUPIED",
    notes: "",
  },
  {
    id: 7,
    facilityId: 1,
    unitNumber: "B3",
    size: "10x14",
    floor: 1,
    row: 1,
    col: 2,
    monthlyRent: 89,
    status: "VACANT",
    notes: "",
  },
  {
    id: 8,
    facilityId: 1,
    unitNumber: "B4",
    size: "10x14",
    floor: 1,
    row: 1,
    col: 3,
    monthlyRent: 89,
    status: "DELINQUENT",
    notes: "",
  },
  // Row 2 — 12x14 and 12x16 units
  {
    id: 9,
    facilityId: 1,
    unitNumber: "C1",
    size: "12x14",
    floor: 1,
    row: 2,
    col: 0,
    monthlyRent: 129,
    status: "VACANT",
    notes: "",
  },
  {
    id: 10,
    facilityId: 1,
    unitNumber: "C2",
    size: "12x14",
    floor: 1,
    row: 2,
    col: 1,
    monthlyRent: 129,
    status: "OCCUPIED",
    notes: "",
  },
  {
    id: 11,
    facilityId: 1,
    unitNumber: "C3",
    size: "12x16",
    floor: 1,
    row: 2,
    col: 2,
    monthlyRent: 149,
    status: "VACANT",
    notes: "",
  },
  {
    id: 12,
    facilityId: 1,
    unitNumber: "C4",
    size: "12x16",
    floor: 1,
    row: 2,
    col: 3,
    monthlyRent: 149,
    status: "DISABLED",
    notes: "Under maintenance",
  },
  // Row 3 — 12x28 units
  {
    id: 13,
    facilityId: 1,
    unitNumber: "D1",
    size: "12x28",
    floor: 1,
    row: 3,
    col: 0,
    monthlyRent: 249,
    status: "VACANT",
    notes: "",
  },
  {
    id: 14,
    facilityId: 1,
    unitNumber: "D2",
    size: "12x28",
    floor: 1,
    row: 3,
    col: 1,
    monthlyRent: 249,
    status: "OCCUPIED",
    notes: "",
  },
  {
    id: 15,
    facilityId: 1,
    unitNumber: "D3",
    size: "12x28",
    floor: 1,
    row: 3,
    col: 2,
    monthlyRent: 249,
    status: "OCCUPIED",
    notes: "",
  },
  {
    id: 16,
    facilityId: 1,
    unitNumber: "D4",
    size: "12x28",
    floor: 1,
    row: 3,
    col: 3,
    monthlyRent: 249,
    status: "RESERVED",
    notes: "",
  },
];

const DEMO_TENANTS: Tenant[] = [
  {
    id: 1,
    name: "Alice Johnson",
    email: "alice@example.com",
    phone: "555-0101",
    address: "45 Oak Avenue, Springfield, IL",
    preferredPaymentMethod: "CARD",
  },
  {
    id: 2,
    name: "Bob Martinez",
    email: "bob@example.com",
    phone: "555-0202",
    address: "78 Elm Street, Springfield, IL",
    preferredPaymentMethod: "ACH",
  },
  {
    id: 3,
    name: "Carol Smith",
    email: "carol@example.com",
    phone: "555-0303",
    address: "12 Pine Road, Springfield, IL",
    preferredPaymentMethod: "CARD",
  },
];

const DEMO_LEASES: Lease[] = [
  {
    id: 1,
    tenantId: 1,
    unitId: 2,
    startDate: "2025-01-15",
    monthlyRent: 49,
    billingDay: 15,
    autoPay: true,
    status: "ACTIVE",
  },
  {
    id: 2,
    tenantId: 1,
    unitId: 6,
    startDate: "2025-03-01",
    monthlyRent: 89,
    billingDay: 1,
    autoPay: false,
    status: "ACTIVE",
  },
  {
    id: 3,
    tenantId: 2,
    unitId: 10,
    startDate: "2024-11-10",
    monthlyRent: 149,
    billingDay: 10,
    autoPay: true,
    status: "ACTIVE",
  },
  {
    id: 4,
    tenantId: 3,
    unitId: 14,
    startDate: "2025-02-20",
    monthlyRent: 249,
    billingDay: 20,
    autoPay: false,
    status: "ACTIVE",
  },
  {
    id: 5,
    tenantId: 2,
    unitId: 15,
    startDate: "2025-01-01",
    monthlyRent: 249,
    billingDay: 1,
    autoPay: false,
    status: "DELINQUENT",
  },
  {
    id: 6,
    tenantId: 3,
    unitId: 3,
    startDate: "2025-02-01",
    monthlyRent: 49,
    billingDay: 1,
    autoPay: true,
    status: "ACTIVE",
  },
];

const DEMO_INVOICES: Invoice[] = [
  {
    id: 1,
    leaseId: 1,
    periodStart: "2026-02-15",
    periodEnd: "2026-03-14",
    dueDate: "2026-02-15",
    amount: 49,
    status: "PAID",
    lastSentAt: "2026-02-10",
  },
  {
    id: 2,
    leaseId: 1,
    periodStart: "2026-03-15",
    periodEnd: "2026-04-14",
    dueDate: "2026-03-15",
    amount: 49,
    status: "SENT",
    lastSentAt: "2026-03-01",
  },
  {
    id: 3,
    leaseId: 2,
    periodStart: "2026-03-01",
    periodEnd: "2026-03-31",
    dueDate: "2026-03-01",
    amount: 89,
    status: "OVERDUE",
    lastSentAt: "2026-02-25",
  },
  {
    id: 4,
    leaseId: 3,
    periodStart: "2026-02-10",
    periodEnd: "2026-03-09",
    dueDate: "2026-02-10",
    amount: 149,
    status: "PAID",
    lastSentAt: "2026-02-05",
  },
  {
    id: 5,
    leaseId: 4,
    periodStart: "2026-02-20",
    periodEnd: "2026-03-19",
    dueDate: "2026-02-20",
    amount: 249,
    status: "OVERDUE",
    lastSentAt: "2026-02-15",
  },
  {
    id: 6,
    leaseId: 5,
    periodStart: "2026-01-01",
    periodEnd: "2026-01-31",
    dueDate: "2026-01-01",
    amount: 249,
    status: "OVERDUE",
    lastSentAt: "2025-12-27",
  },
];

const DEMO_PAYMENTS: Payment[] = [
  {
    id: 1,
    tenantId: 1,
    invoiceId: 1,
    paymentDate: "2026-02-14",
    amount: 49,
    method: "CARD",
    transactionId: "ch_demo_001",
    status: "SUCCESS",
  },
  {
    id: 2,
    tenantId: 2,
    invoiceId: 4,
    paymentDate: "2026-02-09",
    amount: 149,
    method: "ACH",
    transactionId: "ch_demo_002",
    status: "SUCCESS",
  },
];

const DEMO_USERS: (User & { password: string })[] = [
  {
    id: 1,
    email: "admin@storage.com",
    password: "Admin1234!",
    role: "ADMIN",
    name: "Admin User",
    tenantId: undefined,
  },
  {
    id: 2,
    email: "alice@example.com",
    password: "Customer1!",
    role: "CUSTOMER",
    name: "Alice Johnson",
    tenantId: 1,
  },
  {
    id: 3,
    email: "bob@example.com",
    password: "Customer1!",
    role: "CUSTOMER",
    name: "Bob Martinez",
    tenantId: 2,
  },
  {
    id: 4,
    email: "carol@example.com",
    password: "Customer1!",
    role: "CUSTOMER",
    name: "Carol Smith",
    tenantId: 3,
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

let _nextId = {
  unit: 17,
  tenant: 4,
  lease: 7,
  invoice: 7,
  payment: 3,
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
      name: "countrylane-storage",
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
