/**
 * Carte de réglages avancés IPPOO - à insérer dans la page Profil.
 *   - Thème (clair/sombre)
 *   - Mode basse data
 *   - Langue (FR/Fon/Yoruba/EN)
 *   - Contacts d'urgence SOS (jusqu'à 5)
 */
import { useEffect, useState } from "react";
import { Plus, Trash2, ShieldAlert, Bell } from "lucide-react";
import { toast } from "sonner";
import { LowDataToggle, LanguagePicker, haptic } from "./ui-extras";
import { getEmergencyContacts, setEmergencyContacts, type EmergencyContact } from "../services/sos";
import { PhoneBJSchema } from "../types/domain";
import { isPushEnabled, pushPermission, enablePush, disablePush, getLastFcmError, isFcmPushSupported } from "../services/firebase";

export function SettingsCard() {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pushOn, setPushOn] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushBlocked, setPushBlocked] = useState(false);
  // undefined = en cours de détection ; false = SW non servi (ex: figma.site)
  const [pushSupported, setPushSupported] = useState<boolean | undefined>(undefined);

  useEffect(() => { setContacts(getEmergencyContacts()); }, []);

  useEffect(() => {
    setPushOn(isPushEnabled());
    setPushBlocked(pushPermission() === "denied");
    isFcmPushSupported().then(setPushSupported).catch(() => setPushSupported(false));
  }, []);

  const togglePush = async () => {
    if (pushBusy) return;
    haptic();
    if (!pushOn && pushSupported === false) {
      toast.info("Push système indisponible sur ce domaine", {
        description: "Les notifications en temps réel dans l'app restent actives.",
        duration: 8000,
      });
      return;
    }
    // Permission refusée au niveau navigateur : impossible de re-prompter par code.
    if (!pushOn && pushPermission() === "denied") {
      toast.error("Notifications bloquées par le navigateur", {
        description: "Autorisez-les dans les réglages du site (cadenas de la barre d'adresse).",
      });
      return;
    }
    setPushBusy(true);
    try {
      if (pushOn) {
        await disablePush();
        setPushOn(false);
        toast.success("Notifications désactivées");
      } else {
        const ok = await enablePush();
        setPushOn(ok);
        setPushBlocked(pushPermission() === "denied");
        toast[ok ? "success" : "error"](
          ok ? "Notifications activées" : "Activation impossible",
          ok
            ? undefined
            : {
                description:
                  pushPermission() === "denied"
                    ? "Autorisez les notifications dans le navigateur."
                    : getLastFcmError() ?? "Impossible d'obtenir le token FCM.",
                duration: 10000,
              },
        );
      }
    } finally {
      setPushBusy(false);
    }
  };

  const addContact = () => {
    const parsed = PhoneBJSchema.safeParse(phone.trim());
    if (!parsed.success) { toast.error("Numéro béninois invalide"); return; }
    if (!name.trim()) { toast.error("Nom requis"); return; }
    if (contacts.length >= 5) { toast.error("Maximum 5 contacts"); return; }
    const next = [...contacts, { name: name.trim(), phone: parsed.data }];
    setContacts(next); setEmergencyContacts(next);
    setName(""); setPhone(""); haptic();
    toast.success("Contact ajouté");
  };

  const removeContact = (idx: number) => {
    const next = contacts.filter((_, i) => i !== idx);
    setContacts(next); setEmergencyContacts(next); haptic();
  };

  return (
    <section
      aria-labelledby="settings-title"
      className="bg-white rounded-2xl p-4 mb-4 border border-gray-100"
    >
      <h2 id="settings-title" className="mb-3">Réglages</h2>

      {/* Préférences */}
      <div className="space-y-3 mb-5">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-gray-700">
            <Bell className="w-4 h-4 text-[#F77F00]" aria-hidden />
            Notifications push
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={pushOn}
            aria-label="Activer les notifications push"
            disabled={pushBusy || pushSupported === false}
            onClick={togglePush}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
              pushOn ? "bg-[#F77F00]" : "bg-gray-300"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                pushOn ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
        {pushBlocked && !pushOn && pushSupported !== false && (
          <p className="text-xs text-[#D62828] -mt-1">
            Bloquées par le navigateur — réactivez-les via le cadenas de la barre d'adresse.
          </p>
        )}
        {pushSupported === false && (
          <p className="text-xs text-gray-400 -mt-1">
            Push système indisponible sur ce domaine. Les notifications en temps réel dans l'app fonctionnent normalement.
          </p>
        )}
        <div className="flex items-center justify-between">
          <span className="text-gray-700">Économie de données</span>
          <LowDataToggle />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-700">Langue</span>
          <LanguagePicker />
        </div>
      </div>

      {/* Contacts d'urgence */}
      <div className="border-t border-gray-100 pt-4">
        <div className="flex items-center gap-2 mb-2">
          <ShieldAlert className="w-4 h-4 text-[#D62828]" aria-hidden />
          <h3>Contacts d'urgence ({contacts.length}/5)</h3>
        </div>
        <p className="text-xs text-gray-500 mb-3">
          Ces contacts recevront un SMS avec votre position lors d'un SOS.
        </p>

        <ul className="space-y-2 mb-3" role="list">
          {contacts.map((c, i) => (
            <li
              key={`${c.phone}-${i}`}
              className="flex items-center justify-between p-2 rounded-lg bg-gray-50"
            >
              <div>
                <div>{c.name}</div>
                <div className="text-xs text-gray-500">{c.phone}</div>
              </div>
              <button
                aria-label={`Supprimer ${c.name}`}
                onClick={() => removeContact(i)}
                className="p-2 text-red-600"
              >
                <Trash2 className="w-4 h-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>

        {contacts.length < 5 && (
          <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
            <input
              aria-label="Nom du contact"
              placeholder="Nom"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-200"
            />
            <input
              aria-label="Téléphone du contact"
              placeholder="+22997…"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="tel"
              className="px-3 py-2 rounded-lg border border-gray-200"
            />
            <button
              onClick={addContact}
              aria-label="Ajouter le contact"
              className="px-3 rounded-lg bg-[#F77F00] text-black flex items-center justify-center"
            >
              <Plus className="w-4 h-4" aria-hidden />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
