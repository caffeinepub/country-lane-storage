/**
 * backendService.ts
 *
 * Adapter layer between the Motoko backend canister and the frontend type system.
 * - Converts Motoko variant types (e.g., { VACANT: null }) ↔ frontend string unions (e.g., "VACANT")
 * - Converts bigint ↔ number
 * - Maps abbreviated backend field names to frontend camelCase names
 *
 * All functions accept an `actor` parameter (the backendInterface) since the
 * backend module does not export a singleton — it is created via createActorWithConfig.
 */

import type { backendInterface } from "@/backend";
import type {
  Facility,
  Invoice,
  InvoiceStatus,
  Lease,
  LeaseStatus,
  Payment,
  PaymentMethod,
  PaymentStatus,
  StorageUnit,
  Tenant,
  UnitStatus,
} from "@/types";

// ─── Variant Converters ────────────────────────────────────────────────────────

type BackendUnitStatus =
  | { VACANT: null }
  | { OCCUPIED: null }
  | { RESERVED: null }
  | { DELINQUENT: null }
  | { DISABLED: null };

type BackendLeaseStatus =
  | { ACTIVE: null }
  | { ENDED: null }
  | { DELINQUENT: null };

type BackendInvoiceStatus =
  | { DRAFT: null }
  | { SENT: null }
  | { PAID: null }
  | { OVERDUE: null };

type BackendPayMethod = { CARD: null } | { ACH: null } | { OTHER: null };

type BackendPayStatus =
  | { PENDING: null }
  | { SUCCESS: null }
  | { FAILED: null };

function variantToString<T extends string>(v: Record<string, null>): T {
  return Object.keys(v)[0] as T;
}

function unitStatusToVariant(s: UnitStatus): BackendUnitStatus {
  return { [s]: null } as unknown as BackendUnitStatus;
}

function leaseStatusToVariant(s: LeaseStatus): BackendLeaseStatus {
  return { [s]: null } as unknown as BackendLeaseStatus;
}

function invoiceStatusToVariant(s: InvoiceStatus): BackendInvoiceStatus {
  return { [s]: null } as unknown as BackendInvoiceStatus;
}

function payMethodToVariant(m: PaymentMethod): BackendPayMethod {
  return { [m]: null } as unknown as BackendPayMethod;
}

function payStatusToVariant(s: PaymentStatus): BackendPayStatus {
  return { [s]: null } as unknown as BackendPayStatus;
}

// Optional type unwrapping: [T] | [] → T | undefined
function unwrapOpt<T>(opt: [T] | []): T | undefined {
  return opt.length > 0 ? opt[0] : undefined;
}

// ─── Actor Type ────────────────────────────────────────────────────────────────

// We cast actor to an extended type to access dynamic backend methods
type AnyActor = backendInterface &
  Record<string, (...args: unknown[]) => Promise<unknown>>;

// ─── Backend Type Definitions ─────────────────────────────────────────────────

interface BackendFacility {
  id: bigint;
  name: string;
  address: string;
  tz: string;
}

interface BackendStorageUnit {
  id: bigint;
  fid: bigint;
  num: string;
  sz: string;
  fl: bigint;
  rw: bigint;
  cl: bigint;
  rent: number;
  status: BackendUnitStatus;
  notes: string;
}

interface BackendTenant {
  id: bigint;
  name: string;
  email: string;
  phone: string;
  addr: string;
  payMethod: string;
}

interface BackendLease {
  id: bigint;
  tenantId: bigint;
  unitId: bigint;
  startDate: string;
  endDate: [string] | [];
  rent: number;
  billingDay: bigint;
  autoPay: boolean;
  status: BackendLeaseStatus;
}

interface BackendInvoice {
  id: bigint;
  leaseId: bigint;
  pStart: string;
  pEnd: string;
  dueDate: string;
  amount: number;
  invStatus: BackendInvoiceStatus;
  sentAt: [string] | [];
}

interface BackendPayment {
  id: bigint;
  tenantId: bigint;
  invoiceId: bigint;
  pDate: string;
  amount: number;
  method: BackendPayMethod;
  txId: string;
  payStatus: BackendPayStatus;
}

// ─── Mappers: Backend → Frontend ──────────────────────────────────────────────

function mapFacility(f: BackendFacility): Facility {
  return {
    id: Number(f.id),
    name: f.name,
    address: f.address,
    timeZone: f.tz,
  };
}

function mapUnit(u: BackendStorageUnit): StorageUnit {
  return {
    id: Number(u.id),
    facilityId: Number(u.fid),
    unitNumber: u.num,
    size: u.sz,
    floor: Number(u.fl),
    row: Number(u.rw),
    col: Number(u.cl),
    monthlyRent: u.rent,
    status: variantToString<UnitStatus>(u.status as Record<string, null>),
    notes: u.notes,
  };
}

function mapTenant(t: BackendTenant): Tenant {
  return {
    id: Number(t.id),
    name: t.name,
    email: t.email,
    phone: t.phone,
    address: t.addr,
    preferredPaymentMethod: t.payMethod,
  };
}

function mapLease(l: BackendLease): Lease {
  return {
    id: Number(l.id),
    tenantId: Number(l.tenantId),
    unitId: Number(l.unitId),
    startDate: l.startDate,
    endDate: unwrapOpt(l.endDate),
    monthlyRent: l.rent,
    billingDay: Number(l.billingDay),
    autoPay: l.autoPay,
    status: variantToString<LeaseStatus>(l.status as Record<string, null>),
  };
}

function mapInvoice(i: BackendInvoice): Invoice {
  return {
    id: Number(i.id),
    leaseId: Number(i.leaseId),
    periodStart: i.pStart,
    periodEnd: i.pEnd,
    dueDate: i.dueDate,
    amount: i.amount,
    status: variantToString<InvoiceStatus>(i.invStatus as Record<string, null>),
    lastSentAt: unwrapOpt(i.sentAt),
  };
}

function mapPayment(p: BackendPayment): Payment {
  return {
    id: Number(p.id),
    tenantId: Number(p.tenantId),
    invoiceId: Number(p.invoiceId),
    paymentDate: p.pDate,
    amount: p.amount,
    method: variantToString<PaymentMethod>(p.method as Record<string, null>),
    transactionId: p.txId,
    status: variantToString<PaymentStatus>(p.payStatus as Record<string, null>),
  };
}

// ─── Service Functions ─────────────────────────────────────────────────────────

// Seed demo data (idempotent)
export async function seedDemoData(actor: backendInterface): Promise<string> {
  return await (actor as AnyActor).seedDemoData();
}

// Facilities
export async function listFacilities(
  actor: backendInterface,
): Promise<Facility[]> {
  const raw: BackendFacility[] = await (actor as AnyActor).listFacilities();
  return raw.map(mapFacility);
}

export async function updateFacilityOnBackend(
  actor: backendInterface,
  id: number,
  name: string,
  address: string,
  tz: string,
): Promise<void> {
  await (actor as AnyActor).updateFacility(BigInt(id), name, address, tz);
}

// Units
export async function listAllUnits(
  actor: backendInterface,
): Promise<StorageUnit[]> {
  const raw: BackendStorageUnit[] = await (actor as AnyActor).listAllUnits();
  return raw.map(mapUnit);
}

export async function createUnitOnBackend(
  actor: backendInterface,
  fid: number,
  num: string,
  sz: string,
  fl: number,
  rw: number,
  cl: number,
  rent: number,
  notes: string,
): Promise<number> {
  const id: bigint = await (actor as AnyActor).createUnit(
    BigInt(fid),
    num,
    sz,
    BigInt(fl),
    BigInt(rw),
    BigInt(cl),
    rent,
    notes,
  );
  return Number(id);
}

export async function updateUnitOnBackend(
  actor: backendInterface,
  id: number,
  num: string,
  sz: string,
  fl: number,
  rw: number,
  cl: number,
  rent: number,
  status: UnitStatus,
  notes: string,
): Promise<void> {
  await (actor as AnyActor).updateUnit(
    BigInt(id),
    num,
    sz,
    BigInt(fl),
    BigInt(rw),
    BigInt(cl),
    rent,
    unitStatusToVariant(status),
    notes,
  );
}

export async function deleteUnitOnBackend(
  actor: backendInterface,
  id: number,
): Promise<void> {
  await (actor as AnyActor).deleteUnit(BigInt(id));
}

// Tenants
export async function listTenants(actor: backendInterface): Promise<Tenant[]> {
  const raw: BackendTenant[] = await (actor as AnyActor).listTenants();
  return raw.map(mapTenant);
}

export async function createTenantOnBackend(
  actor: backendInterface,
  name: string,
  email: string,
  phone: string,
  addr: string,
  payMethod: string,
): Promise<number> {
  const id: bigint = await (actor as AnyActor).createTenant(
    name,
    email,
    phone,
    addr,
    payMethod,
  );
  return Number(id);
}

export async function updateTenantOnBackend(
  actor: backendInterface,
  id: number,
  name: string,
  email: string,
  phone: string,
  addr: string,
  payMethod: string,
): Promise<void> {
  await (actor as AnyActor).updateTenant(
    BigInt(id),
    name,
    email,
    phone,
    addr,
    payMethod,
  );
}

// Leases
export async function listAllLeases(actor: backendInterface): Promise<Lease[]> {
  const raw: BackendLease[] = await (actor as AnyActor).listAllLeases();
  return raw.map(mapLease);
}

export async function getMyLeases(actor: backendInterface): Promise<Lease[]> {
  const raw: BackendLease[] = await (actor as AnyActor).getMyLeases();
  return raw.map(mapLease);
}

export async function createLeaseOnBackend(
  actor: backendInterface,
  tenantId: number,
  unitId: number,
  startDate: string,
  rent: number,
  billingDay: number,
): Promise<number> {
  const id: bigint = await (actor as AnyActor).createLease(
    BigInt(tenantId),
    BigInt(unitId),
    startDate,
    rent,
    BigInt(billingDay),
  );
  return Number(id);
}

export async function updateLeaseOnBackend(
  actor: backendInterface,
  leaseId: number,
  rent: number,
  billingDay: number,
  autoPay: boolean,
  status: LeaseStatus,
): Promise<void> {
  await (actor as AnyActor).updateLease(
    BigInt(leaseId),
    rent,
    BigInt(billingDay),
    autoPay,
    leaseStatusToVariant(status),
  );
}

export async function endLeaseOnBackend(
  actor: backendInterface,
  leaseId: number,
): Promise<void> {
  await (actor as AnyActor).endLease(BigInt(leaseId));
}

export async function setAutoPayOnBackend(
  actor: backendInterface,
  leaseId: number,
  enabled: boolean,
): Promise<void> {
  await (actor as AnyActor).setAutoPay(BigInt(leaseId), enabled);
}

// Invoices
export async function listAllInvoices(
  actor: backendInterface,
): Promise<Invoice[]> {
  const raw: BackendInvoice[] = await (actor as AnyActor).listAllInvoices();
  return raw.map(mapInvoice);
}

export async function getMyInvoices(
  actor: backendInterface,
): Promise<Invoice[]> {
  const raw: BackendInvoice[] = await (actor as AnyActor).getMyInvoices();
  return raw.map(mapInvoice);
}

export async function updateInvoiceStatusOnBackend(
  actor: backendInterface,
  invoiceId: number,
  status: InvoiceStatus,
): Promise<void> {
  await (actor as AnyActor).updateInvoiceStatus(
    BigInt(invoiceId),
    invoiceStatusToVariant(status),
  );
}

export async function markOverdueInvoicesOnBackend(
  actor: backendInterface,
): Promise<number> {
  const count: bigint = await (actor as AnyActor).markOverdueInvoices();
  return Number(count);
}

export async function generateDueInvoicesOnBackend(
  actor: backendInterface,
): Promise<number> {
  const count: bigint = await (actor as AnyActor).generateDueInvoices();
  return Number(count);
}

// Payments
export async function getMyPayments(
  actor: backendInterface,
): Promise<Payment[]> {
  const raw: BackendPayment[] = await (actor as AnyActor).getMyPayments();
  return raw.map(mapPayment);
}

export async function listPaymentsByTenant(
  actor: backendInterface,
  tenantId: number,
): Promise<Payment[]> {
  const raw: BackendPayment[] = await (actor as AnyActor).listPaymentsByTenant(
    BigInt(tenantId),
  );
  return raw.map(mapPayment);
}

export async function createPaymentRecord(
  actor: backendInterface,
  tenantId: number,
  invoiceId: number,
  amount: number,
  method: PaymentMethod,
  txId: string,
  status: PaymentStatus,
): Promise<number> {
  const id: bigint = await (actor as AnyActor).createPaymentRecord(
    BigInt(tenantId),
    BigInt(invoiceId),
    amount,
    payMethodToVariant(method),
    txId,
    payStatusToVariant(status),
  );
  return Number(id);
}

// Stripe / Payments
export async function createCheckoutSession(
  actor: backendInterface,
  invoiceId: number,
): Promise<string> {
  return await (actor as AnyActor).createCheckoutSession(BigInt(invoiceId));
}

export async function confirmPayment(
  actor: backendInterface,
  invoiceId: number,
  sessionId: string,
): Promise<string> {
  return await (actor as AnyActor).confirmPayment(BigInt(invoiceId), sessionId);
}

// Admin Stats
export interface AdminStats {
  totalUnits: number;
  occupiedUnits: number;
  occupancyRate: number;
  mrr: number;
  overdueCount: number;
}

export async function getAdminStats(
  actor: backendInterface,
): Promise<AdminStats> {
  const raw = await (actor as AnyActor).getAdminStats();
  return {
    totalUnits: Number(raw.totalUnits),
    occupiedUnits: Number(raw.occupiedUnits),
    occupancyRate: raw.occupancyRate,
    mrr: raw.mrr,
    overdueCount: Number(raw.overdueCount),
  };
}
