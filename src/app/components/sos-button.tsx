import { useState } from "react";
import { AlertOctagon, Phone, MessageSquare, X } from "lucide-react";
import { toast } from "sonner";
import { triggerSos, callPolice, callGendarmerie, smsContacts, getEmergencyContacts } from "../services/sos";
import { useT } from "../i18n/use-t";

type Props = { rideId?: string; className?: string };

export function SosButton({ rideId, className }: Props) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const onTrigger = async () => {
    setBusy(true);
    try {
      const r = await triggerSos({ rideId });
      toast.success(t("sos.sent"), {
        description: r.contactsNotified
          ? `${r.contactsNotified} contact(s) alerté(s)`
          : "Alerte envoyée à IPPOO",
      });
      const contacts = getEmergencyContacts();
      if (contacts.length) smsContacts(r.smsBody, contacts.map((c) => c.phone));
    } catch (e) {
      toast.error("Échec de l'alerte", { description: String(e) });
    } finally {
      setBusy(false);
      setOpen(false);
    }
  };

  return (
    <>
      <button
        type="button"
        aria-label={t("sos.title")}
        onClick={() => setOpen(true)}
        className={`fixed bottom-24 right-4 z-40 w-14 h-14 rounded-full bg-[#D62828] text-white shadow-lg flex items-center justify-center active:scale-95 transition ${className ?? ""}`}
      >
        <AlertOctagon className="w-6 h-6" aria-hidden />
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="sos-title"
          className="fixed inset-0 z-50 bg-black/60 flex items-end justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 id="sos-title" className="text-[#D62828]">{t("sos.title")}</h2>
              <button aria-label={t("common.cancel")} onClick={() => setOpen(false)}>
                <X className="w-5 h-5" aria-hidden />
              </button>
            </div>
            <p className="text-gray-600 mb-4">{t("sos.description")}</p>

            <button
              disabled={busy}
              onClick={onTrigger}
              className="w-full py-4 rounded-xl bg-[#D62828] text-white mb-3 flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <AlertOctagon className="w-5 h-5" aria-hidden />
              {busy ? t("common.loading") : t("sos.trigger")}
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={callPolice}
                className="py-3 rounded-xl border border-gray-200 flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4" aria-hidden /> Police 117
              </button>
              <button
                onClick={callGendarmerie}
                className="py-3 rounded-xl border border-gray-200 flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4" aria-hidden /> Gend. 118
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-3 text-center">
              <MessageSquare className="inline w-3 h-3 mr-1" aria-hidden />
              Un SMS sera envoyé à vos contacts d'urgence avec votre position.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
