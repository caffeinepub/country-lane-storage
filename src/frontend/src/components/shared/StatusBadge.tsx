import {
  invoiceStatusConfig,
  leaseStatusConfig,
  paymentStatusConfig,
  unitStatusConfig,
} from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type {
  InvoiceStatus,
  LeaseStatus,
  PaymentStatus,
  UnitStatus,
} from "@/types";

interface UnitStatusBadgeProps {
  status: UnitStatus;
  className?: string;
}
export function UnitStatusBadge({ status, className }: UnitStatusBadgeProps) {
  const config = unitStatusConfig[status];
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium",
        config.className,
        className,
      )}
    >
      {config.label}
    </span>
  );
}

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus;
  className?: string;
}
export function InvoiceStatusBadge({
  status,
  className,
}: InvoiceStatusBadgeProps) {
  const config = invoiceStatusConfig[status];
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium",
        config.className,
        className,
      )}
    >
      {config.label}
    </span>
  );
}

interface LeaseStatusBadgeProps {
  status: LeaseStatus;
  className?: string;
}
export function LeaseStatusBadge({ status, className }: LeaseStatusBadgeProps) {
  const config = leaseStatusConfig[status];
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium",
        config.className,
        className,
      )}
    >
      {config.label}
    </span>
  );
}

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
  className?: string;
}
export function PaymentStatusBadge({
  status,
  className,
}: PaymentStatusBadgeProps) {
  const config = paymentStatusConfig[status];
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium",
        config.className,
        className,
      )}
    >
      {config.label}
    </span>
  );
}
