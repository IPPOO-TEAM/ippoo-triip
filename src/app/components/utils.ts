/* ─── Utilitaires partagés IPPOO ─── */

/** Géolocalisation réelle via navigator.geolocation */
export function getGPSPosition(
  onSuccess: (label: string, lat: number, lng: number) => void,
  onError: (fallback: string) => void
) {
  if (!navigator.geolocation) {
    onError("Cotonou, Bénin (GPS non disponible)");
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude, accuracy } = pos.coords;
      const label = `Ma position (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
      onSuccess(label, latitude, longitude);
    },
    (err) => {
      const fallback =
        err.code === 1
          ? "GPS refusé — Cotonou, Bénin"
          : "Position non disponible — Cotonou, Bénin";
      onError(fallback);
    },
    { timeout: 8000, enableHighAccuracy: true }
  );
}

/** Télécharge un Blob sous forme de fichier */
export function downloadBlob(content: string, filename: string, type = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Génère un OTP aléatoire à 6 chiffres */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/** Formate une date JS en "JJ Mmm AAAA à HH:MM" */
export function formatDateFr(date = new Date()): string {
  const months = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
  return `${date.getDate().toString().padStart(2, "0")} ${months[date.getMonth()]} ${date.getFullYear()} à ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
}
