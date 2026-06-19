/**
 * Fallback USSD IPPOO — pour zones sans data ou téléphones non-smartphones.
 *
 * Principe : encoder une action en short-code que l'utilisateur compose.
 * Côté opérateur télécom : le menu USSD pointe vers une API gateway IPPOO.
 *
 * Côté app : génère un lien `tel:` qui pré-remplit l'appel USSD,
 * et un QR code à montrer à un agent IPPOO si le téléphone ne peut pas appeler.
 */

const IPPOO_USSD_ROOT = "*888*"; // à négocier avec ARCEP/opérateurs Bénin

export type UssdAction =
  | { kind: "book_ride"; service: "moto" | "delivery"; zone?: string }
  | { kind: "wallet_balance" }
  | { kind: "wallet_topup"; amount: number }
  | { kind: "support" };

export function encodeUssd(action: UssdAction): string {
  switch (action.kind) {
    case "book_ride":
      return `${IPPOO_USSD_ROOT}1*${action.service === "moto" ? 1 : 2}${
        action.zone ? `*${action.zone}` : ""
      }#`;
    case "wallet_balance": return `${IPPOO_USSD_ROOT}2*1#`;
    case "wallet_topup": return `${IPPOO_USSD_ROOT}2*2*${action.amount}#`;
    case "support": return `${IPPOO_USSD_ROOT}9#`;
  }
}

export function dialUssd(action: UssdAction): void {
  const code = encodeUssd(action);
  // Sur mobile, tel: + code USSD ouvre le composeur
  window.location.href = `tel:${encodeURIComponent(code)}`;
}

/** Lien partageable (SMS, WhatsApp) pour qu'un proche compose le code */
export function ussdShareText(action: UssdAction): string {
  return `Composez ${encodeUssd(action)} sur votre téléphone pour utiliser IPPOO sans Internet.`;
}
