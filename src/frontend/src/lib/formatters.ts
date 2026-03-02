import type {
  InvoiceStatus,
  LeaseStatus,
  PaymentStatus,
  UnitStatus,
} from "../types";

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  const d = new Date(`${dateStr}T00:00:00`);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

export function formatShortDate(dateStr: string): string {
  if (!dateStr) return "—";
  const d = new Date(`${dateStr}T00:00:00`);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(d);
}

export function isOverdue(dueDate: string): boolean {
  return new Date(`${dueDate}T00:00:00`) < new Date();
}

export const unitStatusConfig: Record<
  UnitStatus,
  { label: string; className: string; mapClass: string }
> = {
  VACANT: {
    label: "Vacant",
    className: "bg-green-100 text-green-800 border border-green-200",
    mapClass: "unit-vacant",
  },
  OCCUPIED: {
    label: "Occupied",
    className: "bg-blue-100 text-blue-800 border border-blue-200",
    mapClass: "unit-occupied",
  },
  RESERVED: {
    label: "Reserved",
    className: "bg-amber-100 text-amber-800 border border-amber-200",
    mapClass: "unit-reserved",
  },
  DELINQUENT: {
    label: "Delinquent",
    className: "bg-red-100 text-red-800 border border-red-200",
    mapClass: "unit-delinquent",
  },
  DISABLED: {
    label: "Disabled",
    className: "bg-gray-100 text-gray-500 border border-gray-200",
    mapClass: "unit-disabled",
  },
};

export const invoiceStatusConfig: Record<
  InvoiceStatus,
  { label: string; className: string }
> = {
  PAID: {
    label: "Paid",
    className: "bg-green-100 text-green-800 border border-green-200",
  },
  SENT: {
    label: "Sent",
    className: "bg-blue-100 text-blue-800 border border-blue-200",
  },
  OVERDUE: {
    label: "Overdue",
    className: "bg-red-100 text-red-800 border border-red-200",
  },
  DRAFT: {
    label: "Draft",
    className: "bg-gray-100 text-gray-500 border border-gray-200",
  },
};

export const leaseStatusConfig: Record<
  LeaseStatus,
  { label: string; className: string }
> = {
  ACTIVE: {
    label: "Active",
    className: "bg-green-100 text-green-800 border border-green-200",
  },
  ENDED: {
    label: "Ended",
    className: "bg-gray-100 text-gray-500 border border-gray-200",
  },
  DELINQUENT: {
    label: "Delinquent",
    className: "bg-red-100 text-red-800 border border-red-200",
  },
};

export const paymentStatusConfig: Record<
  PaymentStatus,
  { label: string; className: string }
> = {
  SUCCESS: {
    label: "Success",
    className: "bg-green-100 text-green-800 border border-green-200",
  },
  PENDING: {
    label: "Pending",
    className: "bg-amber-100 text-amber-800 border border-amber-200",
  },
  FAILED: {
    label: "Failed",
    className: "bg-red-100 text-red-800 border border-red-200",
  },
};

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
