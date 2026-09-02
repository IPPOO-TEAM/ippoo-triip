import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "../../api/client";
import { broadcastPush } from "../../store/push-notifications";

interface PushRow { id: string; title: string; body: string; target: string; created_at: string }

const TARGET_LABEL: Record<string, string> = { all: "Tous", clients: "Clients", drivers: "Chauffeurs" };

function formatSent(iso: string) {
  try {
    return new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch { return iso; }
}

function MIcon({ name, size = 20, color, filled = false }: { name: string; size?: number; color?: string; filled?: boolean }) {
  return (
    <span className="material-symbols-rounded leading-none select-none"
      style={{ fontSize: size, color, fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' ${size <= 20 ? 20 : 24}` }}>
      {name}
    </span>
  );
}

export function AdminNotificationsPage() {
  const [tab, setTab]             = useState<"send" | "history">("send");
  const [history, setHistory]     = useState<PushRow[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [title, setTitle]         = useState("");
  const [body, setBody]           = useState("");
  const [url, setUrl]             = useState("");
  const [target, setTarget]       = useState<"all" | "clients" | "drivers">("all");
  const [notifType, setNotifType] = useState<"info" | "promo" | "alert" | "success">("info");
  const [sending, setSending]     = useState(false);

  async function loadHistory() {
    setLoadingHistory(true);
    try {
      const rows = await api.get<PushRow[]>("/push-notifications/pending?since=1970-01-01T00:00:00.000Z");
      setHistory(Array.isArray(rows) ? rows : []);
    } catch {
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }

  useEffect(() => { if (tab === "history") loadHistory(); }, [tab]);

  async function handleSend() {
    if (!title.trim() || !body.trim()) return toast.error("Titre et message requis");
    setSending(true);
    try {
      /* Envoi via backend : enregistre les notifs in-app, diffuse en Realtime
         (broadcast global → tous les appareils, via <RealtimeBridge/>) et
         envoie les push FCM. Plus besoin de broadcastPush local : le Realtime
         revient aussi jusqu'à cet onglet admin. */
      await api.post("/notifications/send", {
        title: title.trim(),
        message: body.trim(),
        target,
        type: notifType,
        url: url.trim() || undefined,
      });
      toast.success(`Push envoyee a ${target === "all" ? "tous les utilisateurs" : target}`);
      setTitle(""); setBody(""); setUrl("");
      loadHistory();
    } catch {
      /* fallback local si backend indisponible */
      broadcastPush({ title: title.trim(), body: body.trim(), type: notifType, target });
      toast.success("Notification diffusee (mode local)");
      setTitle(""); setBody(""); setUrl("");
    } finally {
      setSending(false);
    }
  }

  const TABS = [
    { key: "send"    as const, label: "Envoyer",    icon: "send",    badge: 0 },
    { key: "history" as const, label: "Historique", icon: "history", badge: 0 },
  ];

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-3xl">
      <div>
        <h1 className="text-[22px] font-extrabold text-foreground">Notifications</h1>
        <p className="text-muted-foreground text-[13px] mt-0.5">Push FCM + alertes systeme en temps reel</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted/40 p-1 rounded-2xl w-fit">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-bold transition ${tab === t.key ? "bg-white shadow-sm text-foreground" : "text-muted-foreground"}`}>
            <MIcon name={t.icon} size={16} />
            {t.label}
            {t.badge > 0 && <span className="w-5 h-5 rounded-full bg-[#D62828] text-white text-[9px] flex items-center justify-center">{t.badge}</span>}
          </button>
        ))}
      </div>

      {/* ---- SEND TAB ---- */}
      {tab === "send" && (
        <div className="bg-card rounded-2xl p-5 border border-border/40 shadow-sm space-y-5">
          <h3 className="text-[16px] font-extrabold text-foreground">Nouvelle notification push</h3>

          {/* Target */}
          <div>
            <label className="text-[12px] font-bold text-muted-foreground mb-2 block">Destinataires</label>
            <div className="flex gap-2 flex-wrap">
              {([
                { key: "all"     as const, label: "Tous",       icon: "groups"     },
                { key: "clients" as const, label: "Clients",    icon: "person"     },
                { key: "drivers" as const, label: "Chauffeurs", icon: "two_wheeler"},
              ] as const).map(t => (
                <button key={t.key} onClick={() => setTarget(t.key)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold transition`}
                  style={{ background: target === t.key ? "#BF360C" : "#F5F5F5", color: target === t.key ? "#fff" : "#555" }}>
                  <MIcon name={t.icon} size={16} color={target === t.key ? "#fff" : "#555"} />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Type */}
          <div>
            <label className="text-[12px] font-bold text-muted-foreground mb-2 block">Type</label>
            <div className="flex gap-2 flex-wrap">
              {([
                { key: "info"    as const, label: "Info",    color: "#006A6B", icon: "info"           },
                { key: "promo"   as const, label: "Promo",   color: "#BF360C", icon: "local_activity" },
                { key: "success" as const, label: "Succes",  color: "#1B6B42", icon: "check_circle"   },
                { key: "alert"   as const, label: "Alerte",  color: "#D62828", icon: "warning"        },
              ] as const).map(t => (
                <button key={t.key} onClick={() => setNotifType(t.key)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-bold transition"
                  style={{ background: notifType === t.key ? t.color : `${t.color}15`, color: notifType === t.key ? "#fff" : t.color }}>
                  <MIcon name={t.icon} size={14} color={notifType === t.key ? "#fff" : t.color} filled />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-[12px] font-bold text-muted-foreground mb-1.5 block">Titre</label>
            <input type="text" placeholder="Ex: Nouvelle fonctionnalite disponible"
              value={title} onChange={e => setTitle(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-[14px] text-foreground outline-none focus:border-primary transition" />
          </div>

          {/* Body */}
          <div>
            <label className="text-[12px] font-bold text-muted-foreground mb-1.5 block">Message</label>
            <textarea placeholder="Ecrivez votre message ici..." value={body} onChange={e => setBody(e.target.value)} rows={4}
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-[14px] text-foreground outline-none focus:border-primary transition resize-none" />
          </div>

          {/* URL (optional) */}
          <div>
            <label className="text-[12px] font-bold text-muted-foreground mb-1.5 block">URL de destination (optionnel)</label>
            <input type="url" placeholder="Ex: /wallet ou https://ippoo-triip.app/promo/1"
              value={url} onChange={e => setUrl(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-[14px] text-foreground outline-none focus:border-primary transition" />
          </div>

          {/* Preview */}
          {(title || body) && (
            <div className="rounded-2xl p-4 border-2 border-dashed border-border/60">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Apercu</p>
              <div className="flex items-start gap-3 bg-white rounded-xl p-3 shadow-sm">
                <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: notifType === "info" ? "#9CF1F1" : notifType === "promo" ? "#FFDBCC" : notifType === "success" ? "#B7F2D5" : "#FFDADA" }}>
                  <MIcon name={notifType === "info" ? "info" : notifType === "promo" ? "local_activity" : notifType === "success" ? "check_circle" : "warning"}
                    size={18} filled
                    color={notifType === "info" ? "#006A6B" : notifType === "promo" ? "#BF360C" : notifType === "success" ? "#1B6B42" : "#D62828"} />
                </span>
                <div>
                  <p className="text-[13px] font-bold text-gray-800">{title || "Titre de la notification"}</p>
                  <p className="text-[12px] text-gray-500 mt-0.5">{body || "Corps du message..."}</p>
                </div>
              </div>
            </div>
          )}

          <button onClick={handleSend} disabled={sending || !title.trim() || !body.trim()}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-[14px] font-bold text-white disabled:opacity-50 transition"
            style={{ background: "linear-gradient(135deg, #BF360C 0%, #6750A4 100%)" }}>
            {sending
              ? <span className="material-symbols-rounded text-[18px] animate-spin" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>progress_activity</span>
              : <MIcon name="send" size={18} color="#fff" filled />}
            {sending ? "Envoi en cours..." : "Envoyer maintenant"}
          </button>
        </div>
      )}

      {/* ---- HISTORY TAB ---- */}
      {tab === "history" && (
        <div className="space-y-3">
          {loadingHistory ? (
            <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground text-[13px]">
              <span className="material-symbols-rounded text-[18px] animate-spin" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>progress_activity</span>
              Chargement de l'historique…
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <span className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "#FFDBCC" }}>
                <MIcon name="campaign" size={26} color="#BF360C" filled />
              </span>
              <div>
                <p className="text-[14px] font-bold text-foreground">Aucune notification envoyee</p>
                <p className="text-[12px] text-muted-foreground mt-0.5">Vos notifications push apparaitront ici une fois envoyees.</p>
              </div>
            </div>
          ) : (
            history.map(n => (
              <div key={n.id} className="bg-card rounded-2xl p-4 border border-border/40">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#FFDBCC" }}>
                    <MIcon name="campaign" size={20} color="#BF360C" filled />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold text-foreground truncate">{n.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted font-bold text-muted-foreground">{TARGET_LABEL[n.target] ?? n.target}</span>
                      <span className="text-[10px] text-muted-foreground">{formatSent(n.created_at)}</span>
                    </div>
                  </div>
                </div>
                <p className="text-[12px] text-muted-foreground mt-3">{n.body}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
