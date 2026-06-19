/**
 * Hook paiement Mobile Money IPPOO.
 * Flow : initiate → user compose USSD → polling → success/failed.
 */
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import {
  initiatePayment,
  pollPaymentStatus,
  detectOperator,
  operatorLabel,
  operatorUssdCode,
  type MomoOperator,
} from "../services/mobile-money";
import { logger } from "../services/logger";

export type PaymentState =
  | { status: "idle" }
  | { status: "initiating" }
  | { status: "awaiting_user"; transactionId: string; ussdHint: string; operator: MomoOperator }
  | { status: "polling"; transactionId: string }
  | { status: "success"; transactionId: string }
  | { status: "failed"; reason: string };

export function usePayment() {
  const [state, setState] = useState<PaymentState>({ status: "idle" });
  const abortRef = useRef<AbortController | null>(null);

  const pay = useCallback(async (input: {
    phone: string;
    amountXOF: number;
    operator?: MomoOperator;
    rideId?: string;
    description?: string;
  }) => {
    const operator = input.operator ?? detectOperator(input.phone);
    if (!operator) {
      toast.error("Opérateur inconnu", { description: "Choisissez MTN, Moov ou Celtiis" });
      setState({ status: "failed", reason: "operator_unknown" });
      return false;
    }

    setState({ status: "initiating" });
    abortRef.current = new AbortController();

    try {
      const init = await initiatePayment({ ...input, operator });
      setState({
        status: "awaiting_user",
        transactionId: init.transactionId,
        ussdHint: init.ussdHint || operatorUssdCode(operator),
        operator,
      });
      toast.info(`Composez ${operatorUssdCode(operator)} sur ${operatorLabel(operator)}`, {
        description: "Validez la demande pour finaliser",
        duration: 6000,
      });

      setState({ status: "polling", transactionId: init.transactionId });
      const result = await pollPaymentStatus(init.transactionId, { timeoutMs: 120_000 });

      if (result === "success") {
        setState({ status: "success", transactionId: init.transactionId });
        toast.success("Paiement validé");
        logger.info("payment.success", { tx: init.transactionId });
        return true;
      }
      setState({ status: "failed", reason: result });
      toast.error(result === "timeout" ? "Délai dépassé" : "Paiement refusé");
      return false;
    } catch (e) {
      setState({ status: "failed", reason: String(e) });
      toast.error("Échec du paiement");
      logger.error("payment.error", { e: String(e) });
      return false;
    }
  }, []);

  const reset = useCallback(() => setState({ status: "idle" }), []);

  return { state, pay, reset };
}
