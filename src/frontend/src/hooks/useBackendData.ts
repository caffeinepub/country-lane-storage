/**
 * useBackendData.ts
 *
 * React Query hooks for all backend data. Uses the actor from useActor hook.
 */

import { useActor } from "@/hooks/useActor";
import * as svc from "@/lib/backendService";
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// ─── Helper ───────────────────────────────────────────────────────────────────

function useActorReady() {
  const { actor, isFetching } = useActor();
  return { actor, enabled: !!actor && !isFetching };
}

// ─── Facilities ───────────────────────────────────────────────────────────────

export function useFacilities() {
  const { actor, enabled } = useActorReady();
  return useQuery<Facility[]>({
    queryKey: ["facilities"],
    queryFn: () => svc.listFacilities(actor!),
    enabled,
  });
}

// ─── Units ────────────────────────────────────────────────────────────────────

export function useAllUnits() {
  const { actor, enabled } = useActorReady();
  return useQuery<StorageUnit[]>({
    queryKey: ["units"],
    queryFn: () => svc.listAllUnits(actor!),
    enabled,
  });
}

// ─── Tenants ──────────────────────────────────────────────────────────────────

export function useAllTenants() {
  const { actor, enabled } = useActorReady();
  return useQuery<Tenant[]>({
    queryKey: ["tenants"],
    queryFn: () => svc.listTenants(actor!),
    enabled,
  });
}

// ─── Leases ───────────────────────────────────────────────────────────────────

export function useAllLeases() {
  const { actor, enabled } = useActorReady();
  return useQuery<Lease[]>({
    queryKey: ["leases"],
    queryFn: () => svc.listAllLeases(actor!),
    enabled,
  });
}

export function useMyLeases() {
  const { actor, enabled } = useActorReady();
  return useQuery<Lease[]>({
    queryKey: ["myLeases"],
    queryFn: () => svc.getMyLeases(actor!),
    enabled,
  });
}

// ─── Invoices ─────────────────────────────────────────────────────────────────

export function useAllInvoices() {
  const { actor, enabled } = useActorReady();
  return useQuery<Invoice[]>({
    queryKey: ["invoices"],
    queryFn: () => svc.listAllInvoices(actor!),
    enabled,
  });
}

export function useMyInvoices() {
  const { actor, enabled } = useActorReady();
  return useQuery<Invoice[]>({
    queryKey: ["myInvoices"],
    queryFn: () => svc.getMyInvoices(actor!),
    enabled,
  });
}

// ─── Payments ─────────────────────────────────────────────────────────────────

export function useMyPayments() {
  const { actor, enabled } = useActorReady();
  return useQuery<Payment[]>({
    queryKey: ["myPayments"],
    queryFn: () => svc.getMyPayments(actor!),
    enabled,
  });
}

// ─── Admin Stats ──────────────────────────────────────────────────────────────

export function useAdminStats() {
  const { actor, enabled } = useActorReady();
  return useQuery<svc.AdminStats>({
    queryKey: ["adminStats"],
    queryFn: () => svc.getAdminStats(actor!),
    enabled,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useUpdateFacility() {
  const { actor } = useActorReady();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      name,
      address,
      tz,
    }: { id: number; name: string; address: string; tz: string }) =>
      svc.updateFacilityOnBackend(actor!, id, name, address, tz),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["facilities"] }),
  });
}

export function useCreateUnit() {
  const { actor } = useActorReady();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: {
      fid: number;
      num: string;
      sz: string;
      fl: number;
      rw: number;
      cl: number;
      rent: number;
      notes: string;
    }) =>
      svc.createUnitOnBackend(
        actor!,
        args.fid,
        args.num,
        args.sz,
        args.fl,
        args.rw,
        args.cl,
        args.rent,
        args.notes,
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["units"] }),
  });
}

export function useUpdateUnit() {
  const { actor } = useActorReady();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: {
      id: number;
      num: string;
      sz: string;
      fl: number;
      rw: number;
      cl: number;
      rent: number;
      status: UnitStatus;
      notes: string;
    }) =>
      svc.updateUnitOnBackend(
        actor!,
        args.id,
        args.num,
        args.sz,
        args.fl,
        args.rw,
        args.cl,
        args.rent,
        args.status,
        args.notes,
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["units"] }),
  });
}

export function useDeleteUnit() {
  const { actor } = useActorReady();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => svc.deleteUnitOnBackend(actor!, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["units"] }),
  });
}

export function useCreateTenant() {
  const { actor } = useActorReady();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: {
      name: string;
      email: string;
      phone: string;
      addr: string;
      payMethod: string;
    }) =>
      svc.createTenantOnBackend(
        actor!,
        args.name,
        args.email,
        args.phone,
        args.addr,
        args.payMethod,
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tenants"] }),
  });
}

export function useUpdateTenant() {
  const { actor } = useActorReady();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: {
      id: number;
      name: string;
      email: string;
      phone: string;
      addr: string;
      payMethod: string;
    }) =>
      svc.updateTenantOnBackend(
        actor!,
        args.id,
        args.name,
        args.email,
        args.phone,
        args.addr,
        args.payMethod,
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tenants"] }),
  });
}

export function useCreateLease() {
  const { actor } = useActorReady();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: {
      tenantId: number;
      unitId: number;
      startDate: string;
      rent: number;
      billingDay: number;
    }) =>
      svc.createLeaseOnBackend(
        actor!,
        args.tenantId,
        args.unitId,
        args.startDate,
        args.rent,
        args.billingDay,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leases"] });
      qc.invalidateQueries({ queryKey: ["units"] });
    },
  });
}

export function useUpdateLease() {
  const { actor } = useActorReady();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: {
      leaseId: number;
      rent: number;
      billingDay: number;
      autoPay: boolean;
      status: LeaseStatus;
    }) =>
      svc.updateLeaseOnBackend(
        actor!,
        args.leaseId,
        args.rent,
        args.billingDay,
        args.autoPay,
        args.status,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leases"] });
      qc.invalidateQueries({ queryKey: ["myLeases"] });
    },
  });
}

export function useEndLease() {
  const { actor } = useActorReady();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (leaseId: number) => svc.endLeaseOnBackend(actor!, leaseId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leases"] });
      qc.invalidateQueries({ queryKey: ["units"] });
      qc.invalidateQueries({ queryKey: ["myLeases"] });
    },
  });
}

export function useSetAutoPay() {
  const { actor } = useActorReady();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { leaseId: number; enabled: boolean }) =>
      svc.setAutoPayOnBackend(actor!, args.leaseId, args.enabled),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leases"] });
      qc.invalidateQueries({ queryKey: ["myLeases"] });
    },
  });
}

export function useUpdateInvoiceStatus() {
  const { actor } = useActorReady();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { invoiceId: number; status: InvoiceStatus }) =>
      svc.updateInvoiceStatusOnBackend(actor!, args.invoiceId, args.status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["myInvoices"] });
      qc.invalidateQueries({ queryKey: ["adminStats"] });
    },
  });
}

export function useMarkOverdueInvoices() {
  const { actor } = useActorReady();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => svc.markOverdueInvoicesOnBackend(actor!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["myInvoices"] });
      qc.invalidateQueries({ queryKey: ["adminStats"] });
    },
  });
}

export function useGenerateDueInvoices() {
  const { actor } = useActorReady();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => svc.generateDueInvoicesOnBackend(actor!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["adminStats"] });
    },
  });
}

export function useCreatePaymentRecord() {
  const { actor } = useActorReady();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: {
      tenantId: number;
      invoiceId: number;
      amount: number;
      method: PaymentMethod;
      txId: string;
      status: PaymentStatus;
    }) =>
      svc.createPaymentRecord(
        actor!,
        args.tenantId,
        args.invoiceId,
        args.amount,
        args.method,
        args.txId,
        args.status,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myPayments"] });
      qc.invalidateQueries({ queryKey: ["adminStats"] });
    },
  });
}

export function useCreateCheckoutSession() {
  const { actor } = useActorReady();
  return useMutation({
    mutationFn: (invoiceId: number) =>
      svc.createCheckoutSession(actor!, invoiceId),
  });
}

export function useConfirmPayment() {
  const { actor } = useActorReady();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { invoiceId: number; sessionId: string }) =>
      svc.confirmPayment(actor!, args.invoiceId, args.sessionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myInvoices"] });
      qc.invalidateQueries({ queryKey: ["myPayments"] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["adminStats"] });
    },
  });
}
