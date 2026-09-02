/**
 * Traductions IPPOO - 4 langues : Français (par défaut), Fon, Yoruba, English.
 * Fon et Yoruba sont les langues majoritaires au Bénin.
 *
 * Source des traductions : équipe locale Cotonou (à valider linguistiquement).
 */
import type { Language } from "../store/app-store";

export type TranslationKey =
  | "common.confirm" | "common.cancel" | "common.back" | "common.next"
  | "common.save" | "common.loading" | "common.retry" | "common.error"
  | "common.success" | "common.offline" | "common.online"
  | "nav.home" | "nav.history" | "nav.wallet" | "nav.profile" | "nav.notifications"
  | "service.taxi_moto" | "service.delivery" | "service.heavy"
  | "service.group" | "service.carpool" | "service.air"
  | "auth.welcome" | "auth.phone" | "auth.otp" | "auth.otp_sent"
  | "auth.login" | "auth.logout"
  | "ride.book" | "ride.from" | "ride.to" | "ride.price" | "ride.requested"
  | "ride.accepted" | "ride.arriving" | "ride.in_progress" | "ride.completed"
  | "ride.cancelled" | "ride.cancel" | "ride.sos"
  | "pay.method" | "pay.amount" | "pay.confirm" | "pay.pending" | "pay.success" | "pay.failed"
  | "sos.title" | "sos.description" | "sos.trigger" | "sos.sent";

type Dict = Record<TranslationKey, string>;

const fr: Dict = {
  "common.confirm": "Confirmer", "common.cancel": "Annuler",
  "common.back": "Retour", "common.next": "Suivant",
  "common.save": "Enregistrer", "common.loading": "Chargement…",
  "common.retry": "Réessayer", "common.error": "Erreur",
  "common.success": "Succès", "common.offline": "Hors ligne",
  "common.online": "En ligne",
  "nav.home": "Accueil", "nav.history": "Historique",
  "nav.wallet": "Portefeuille", "nav.profile": "Profil",
  "nav.notifications": "Notifications",
  "service.taxi_moto": "Taxi-moto", "service.delivery": "Livraison",
  "service.heavy": "Transport lourd", "service.group": "Commande groupée",
  "service.carpool": "Covoiturage", "service.air": "Fret aérien",
  "auth.welcome": "Bienvenue sur IPPOO", "auth.phone": "Numéro de téléphone",
  "auth.otp": "Code de vérification", "auth.otp_sent": "Code envoyé par SMS",
  "auth.login": "Se connecter", "auth.logout": "Se déconnecter",
  "ride.book": "Réserver", "ride.from": "Départ", "ride.to": "Destination",
  "ride.price": "Prix", "ride.requested": "Demande envoyée",
  "ride.accepted": "Chauffeur trouvé", "ride.arriving": "Arrive",
  "ride.in_progress": "En course", "ride.completed": "Terminée",
  "ride.cancelled": "Annulée", "ride.cancel": "Annuler la course",
  "ride.sos": "Urgence",
  "pay.method": "Mode de paiement", "pay.amount": "Montant",
  "pay.confirm": "Confirmer le paiement", "pay.pending": "Paiement en cours",
  "pay.success": "Paiement réussi", "pay.failed": "Paiement échoué",
  "sos.title": "Bouton d'urgence", "sos.description": "Alerter vos contacts et la police",
  "sos.trigger": "Déclencher l'urgence", "sos.sent": "Alerte envoyée",
};

const fon: Dict = {
  "common.confirm": "Ɖó", "common.cancel": "Sɔ́",
  "common.back": "Lɛ̌", "common.next": "Yi nukɔn",
  "common.save": "Hwlɛn", "common.loading": "É wá…",
  "common.retry": "Tɛ́n", "common.error": "Nyaɖe",
  "common.success": "É bí dó", "common.offline": "Akwɛ́ ma ɖè",
  "common.online": "Akwɛ́ ɖè",
  "nav.home": "Xwé", "nav.history": "Tantan",
  "nav.wallet": "Akwɛ́gbó", "nav.profile": "Mì",
  "nav.notifications": "Wɛn",
  "service.taxi_moto": "Zemidjan", "service.delivery": "Nùsɛ́n",
  "service.heavy": "Agbǎn ɖaxó", "service.group": "Nùgbɔ́",
  "service.carpool": "Hɛnnu", "service.air": "Jixwé jɔmɛ",
  "auth.welcome": "Kuabɔ ɖó IPPOO", "auth.phone": "Alokàn nùmèló",
  "auth.otp": "Wɛn jiji", "auth.otp_sent": "Wɛn ɖó SMS mɛ",
  "auth.login": "Byɔ́", "auth.logout": "Tɔ́n",
  "ride.book": "Bló", "ride.from": "Fí ɖègbé", "ride.to": "Fí yiyi",
  "ride.price": "Akwɛ́", "ride.requested": "Byɔbyɔ̀ wá",
  "ride.accepted": "É mɔ kannumɔ̀", "ride.arriving": "É wá",
  "ride.in_progress": "Mì yi", "ride.completed": "É vɔ",
  "ride.cancelled": "É sɔ́", "ride.cancel": "Sɔ́ azɔ̀",
  "ride.sos": "Akwɛ̀!",
  "pay.method": "Akwɛ́ dìdó", "pay.amount": "Akwɛ́ jɛ̌",
  "pay.confirm": "Ɖó akwɛ́", "pay.pending": "Akwɛ́ wá",
  "pay.success": "Akwɛ́ yi", "pay.failed": "Akwɛ́ ma yi ǎ",
  "sos.title": "Akwɛ̀ nù", "sos.description": "Ylɔ́ xɔ́sú kpó polisi kpó",
  "sos.trigger": "Ylɔ́", "sos.sent": "É yi",
};

const yor: Dict = {
  "common.confirm": "Fi idí", "common.cancel": "Pa rẹ",
  "common.back": "Padà", "common.next": "Tẹ̀lé",
  "common.save": "Fi pamọ́", "common.loading": "Ó ń bọ̀…",
  "common.retry": "Tún gbìyànjú", "common.error": "Àṣìṣe",
  "common.success": "Ó yege", "common.offline": "Kò sí lóri ayélujára",
  "common.online": "Wà lóri ayélujára",
  "nav.home": "Ilé", "nav.history": "Ìtàn",
  "nav.wallet": "Àpò owó", "nav.profile": "Mi",
  "nav.notifications": "Ìfìlọ̀",
  "service.taxi_moto": "Okada", "service.delivery": "Ìfijíṣẹ́",
  "service.heavy": "Ẹrù wíwúwo", "service.group": "Pàṣípààrọ̀",
  "service.carpool": "Ìrìnnà", "service.air": "Ọkọ̀ òfurufú",
  "auth.welcome": "Káàbọ̀ sí IPPOO", "auth.phone": "Nọ́mbà fóònù",
  "auth.otp": "Kóòdù ìjẹ́rìí", "auth.otp_sent": "Kóòdù ránṣẹ́ nípa SMS",
  "auth.login": "Wọlé", "auth.logout": "Jáde",
  "ride.book": "Tì wáwà", "ride.from": "Ibẹ̀rẹ̀", "ride.to": "Ibi tí ń lọ",
  "ride.price": "Iye owó", "ride.requested": "Ìbéèrè ránṣẹ́",
  "ride.accepted": "Awakọ̀ rí", "ride.arriving": "Ó ń dé",
  "ride.in_progress": "Ní ọ̀nà", "ride.completed": "Pári",
  "ride.cancelled": "Pa rẹ́", "ride.cancel": "Pa ìrìn rẹ́",
  "ride.sos": "Ìpáyà",
  "pay.method": "Ọ̀nà sísanwó", "pay.amount": "Iye",
  "pay.confirm": "Fi sísanwó hàn", "pay.pending": "Sísanwó ń bọ̀",
  "pay.success": "Sísanwó yege", "pay.failed": "Sísanwó kùnà",
  "sos.title": "Bọ̀tìnì ìpáyà", "sos.description": "Kìlọ̀ àwọn olùbáṣepọ̀ àti ọlọ́pàá",
  "sos.trigger": "Tì ìpáyà ṣẹ", "sos.sent": "Ìkìlọ̀ ránṣẹ́",
};

const en: Dict = {
  "common.confirm": "Confirm", "common.cancel": "Cancel",
  "common.back": "Back", "common.next": "Next",
  "common.save": "Save", "common.loading": "Loading…",
  "common.retry": "Retry", "common.error": "Error",
  "common.success": "Success", "common.offline": "Offline",
  "common.online": "Online",
  "nav.home": "Home", "nav.history": "History",
  "nav.wallet": "Wallet", "nav.profile": "Profile",
  "nav.notifications": "Notifications",
  "service.taxi_moto": "Bike taxi", "service.delivery": "Delivery",
  "service.heavy": "Heavy transport", "service.group": "Group order",
  "service.carpool": "Carpool", "service.air": "Air freight",
  "auth.welcome": "Welcome to IPPOO", "auth.phone": "Phone number",
  "auth.otp": "Verification code", "auth.otp_sent": "Code sent by SMS",
  "auth.login": "Sign in", "auth.logout": "Sign out",
  "ride.book": "Book", "ride.from": "From", "ride.to": "To",
  "ride.price": "Price", "ride.requested": "Request sent",
  "ride.accepted": "Driver found", "ride.arriving": "Arriving",
  "ride.in_progress": "In progress", "ride.completed": "Completed",
  "ride.cancelled": "Cancelled", "ride.cancel": "Cancel ride",
  "ride.sos": "Emergency",
  "pay.method": "Payment method", "pay.amount": "Amount",
  "pay.confirm": "Confirm payment", "pay.pending": "Payment pending",
  "pay.success": "Payment successful", "pay.failed": "Payment failed",
  "sos.title": "Emergency button", "sos.description": "Alert your contacts and the police",
  "sos.trigger": "Trigger emergency", "sos.sent": "Alert sent",
};

export const dictionaries: Record<Language, Dict> = { fr, fon, yor, en };

export const LANGUAGE_OPTIONS: Array<{ code: Language; label: string; native: string }> = [
  { code: "fr", label: "Français", native: "Français" },
  { code: "fon", label: "Fon", native: "Fɔ̀ngbè" },
  { code: "yor", label: "Yoruba", native: "Yorùbá" },
  { code: "en", label: "English", native: "English" },
];
