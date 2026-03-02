export type UnitStatus =
  | "VACANT"
  | "OCCUPIED"
  | "RESERVED"
  | "DELINQUENT"
  | "DISABLED";
export type LeaseStatus = "ACTIVE" | "ENDED" | "DELINQUENT";
export type InvoiceStatus = "DRAFT" | "SENT" | "PAID" | "OVERDUE";
export type PaymentMethod = "CARD" | "ACH" | "OTHER";
export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED";
export type UserRole = "ADMIN" | "CUSTOMER";

export interface Facility {
  id: number;
  name: string;
  address: string;
  timeZone: string;
}

export interface StorageUnit {
  id: number;
  facilityId: number;
  unitNumber: string;
  size: string;
  floor: number;
  row: number;
  col: number;
  monthlyRent: number;
  status: UnitStatus;
  notes: string;
}

export interface Tenant {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  preferredPaymentMethod: string;
}

export interface Lease {
  id: number;
  tenantId: number;
  unitId: number;
  startDate: string;
  endDate?: string;
  monthlyRent: number;
  billingDay: number;
  autoPay: boolean;
  status: LeaseStatus;
}

export interface Invoice {
  id: number;
  leaseId: number;
  periodStart: string;
  periodEnd: string;
  dueDate: string;
  amount: number;
  status: InvoiceStatus;
  lastSentAt?: string;
}

export interface Payment {
  id: number;
  tenantId: number;
  invoiceId: number;
  paymentDate: string;
  amount: number;
  method: PaymentMethod;
  transactionId: string;
  status: PaymentStatus;
}

export interface User {
  id: number;
  email: string;
  role: UserRole;
  tenantId?: number;
  name: string;
}
