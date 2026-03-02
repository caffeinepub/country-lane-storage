import { Button } from "@/components/ui/button";
import { useConfirmPayment } from "@/hooks/useBackendData";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

export function PaymentSuccess() {
  const search = useSearch({ from: "/portal-layout/portal/payment-success" });
  const navigate = useNavigate();
  const confirmMut = useConfirmPayment();
  const [status, setStatus] = useState<"confirming" | "success" | "failed">(
    "confirming",
  );
  const hasConfirmed = useRef(false);

  const invoiceId = Number((search as Record<string, unknown>).invoice_id ?? 0);
  const sessionId = String(
    (search as Record<string, unknown>).session_id ?? "",
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally run only on mount
  useEffect(() => {
    if (!invoiceId || !sessionId || hasConfirmed.current) return;
    hasConfirmed.current = true;

    confirmMut
      .mutateAsync({ invoiceId, sessionId })
      .then((result) => {
        if (result === "paid") {
          setStatus("success");
          // Auto-redirect after 3 seconds
          setTimeout(() => {
            navigate({ to: "/portal/invoices" });
          }, 3000);
        } else {
          setStatus("failed");
        }
      })
      .catch(() => {
        setStatus("failed");
      });
  }, []);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-card rounded-2xl p-10 max-w-sm w-full shadow-xl text-center border"
        data-ocid="payment_success.card"
      >
        {status === "confirming" && (
          <>
            <Loader2 className="w-16 h-16 text-primary mx-auto mb-5 animate-spin" />
            <h2 className="text-xl font-bold font-display text-foreground mb-2">
              Confirming Payment…
            </h2>
            <p className="text-muted-foreground text-sm">
              Please wait while we confirm your payment with our payment
              processor.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 12, stiffness: 200 }}
            >
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-5" />
            </motion.div>
            <h2 className="text-xl font-bold font-display text-foreground mb-2">
              Payment Successful!
            </h2>
            <p className="text-muted-foreground text-sm mb-6">
              Invoice #{invoiceId} has been marked as paid. You'll be redirected
              to your invoices in a moment.
            </p>
            <Link to="/portal/invoices">
              <Button
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
                data-ocid="payment_success.view_invoices.button"
              >
                View Invoices
              </Button>
            </Link>
          </>
        )}

        {status === "failed" && (
          <>
            <XCircle className="w-16 h-16 text-destructive mx-auto mb-5" />
            <h2 className="text-xl font-bold font-display text-foreground mb-2">
              Payment Failed
            </h2>
            <p className="text-muted-foreground text-sm mb-6">
              We couldn't confirm your payment. Please try again or contact
              support.
            </p>
            <div className="flex flex-col gap-2">
              <Link to="/portal/invoices">
                <Button
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
                  data-ocid="payment_success.retry.button"
                >
                  Try Again
                </Button>
              </Link>
              <Link to="/portal">
                <Button
                  variant="outline"
                  className="w-full"
                  data-ocid="payment_success.dashboard.button"
                >
                  Go to Dashboard
                </Button>
              </Link>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
