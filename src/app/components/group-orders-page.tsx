import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { ChevronLeft, ChevronRight, Plus, Users, ShoppingCart, Check, X, MapPin, Link2, Camera, Copy, QrCode, Trash2, Package } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { api } from "../api/client";
import { useAppStore } from "../store/app-store";
import { M3Page, SectionHeader, M3Card, M3Button, EmptyState, StatTile } from "./m3";

const GO_STATUS: Record<string, Group["status"]> = {
  open: "active", in_delivery: "active", delivered: "delivered", locked: "pending", cancelled: "pending",
};

const GROUP_IMG = "https://images.unsplash.com/photo-1625989744655-9bff7a23dac4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwbWFya2V0JTIwZ3JvdXAlMjBzaG9wcGluZyUyMGNvbW11bml0eXxlbnwxfHx8fDE3NzU5MTY0NTh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";

interface GroupMember {
  id: number;
  name: string;
  items: number;
  amount: number;
}

interface Group {
  id: number;
  name: string;
  members: GroupMember[];
  deliveryPoint: string;
  status: "active" | "delivered" | "pending";
  totalItems: number;
  totalAmount: number;
  createdAt: string;
}

const statusConfig = {
  active: { label: "En cours", color: "bg-amber-50 text-amber-600", dot: "bg-amber-400" },
  delivered: { label: "Livree", color: "bg-emerald-50 text-emerald-600", dot: "bg-emerald-400" },
  pending: { label: "En attente", color: "bg-blue-50 text-blue-600", dot: "bg-blue-400" },
};

export function GroupOrdersPage() {
  const { state } = useAppStore();
  const meLabel = `${(state.user?.fullName ?? "Moi").split(" ")[0]} (vous)`;
  const [tab, setTab] = useState<"join" | "create">("join");
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [showGroupQr, setShowGroupQr] = useState(false);

  // Create group state
  const [groupName, setGroupName] = useState("");
  const [deliveryPoint, setDeliveryPoint] = useState("");
  const [inviteLink] = useState("https://ippoo.app/group/" + Math.random().toString(36).slice(2, 8));
  const [joinCode, setJoinCode] = useState("");
  const qrScannerInputRef = useRef<HTMLInputElement>(null);

  // Charge les commandes groupées depuis le backend mock (repli sur les données locales)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await api.get<any[]>("/group-orders");
        if (cancelled) return;
        setGroups((list ?? []).map((g, i) => {
          const members: GroupMember[] = (g.participants ?? []).map((p: any, j: number) => ({
            id: j + 1, name: p.name, items: p.items, amount: p.amountXOF,
          }));
          return {
            id: i + 1,
            name: g.title,
            members,
            deliveryPoint: g.vendor,
            status: GO_STATUS[g.status] ?? "active",
            totalItems: members.reduce((s, m) => s + m.items, 0),
            totalAmount: g.totalXOF,
            createdAt: new Date(g.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }),
          };
        }));
      } catch {
        if (!cancelled) setGroups([]);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleCreateGroup = () => {
    if (!groupName.trim()) { toast.error("Donnez un nom au groupe"); return; }
    if (!deliveryPoint.trim()) { toast.error("Indiquez le point de livraison"); return; }
    const newGroup: Group = {
      id: Date.now(),
      name: groupName,
      members: [{ id: 1, name: meLabel, items: 0, amount: 0 }],
      deliveryPoint,
      status: "pending",
      totalItems: 0,
      totalAmount: 0,
      createdAt: "A l'instant",
    };
    setGroups(prev => [newGroup, ...prev]);
    toast.success("Groupe cree !", { description: `"${groupName}" - Invitez vos amis a rejoindre` });
    setGroupName("");
    setDeliveryPoint("");
    setTab("join");
  };

  const handleJoinByCode = () => {
    if (!joinCode.trim()) { toast.error("Entrez un code ou lien d'invitation"); return; }
    const fakeGroup: Group = {
      id: Date.now(),
      name: "Groupe rejoint",
      members: [
        { id: 1, name: "Organisateur", items: 5, amount: 4000 },
        { id: 2, name: meLabel, items: 0, amount: 0 },
      ],
      deliveryPoint: "A definir",
      status: "active",
      totalItems: 5,
      totalAmount: 4000,
      createdAt: "A l'instant",
    };
    setGroups(prev => [fakeGroup, ...prev]);
    toast.success("Vous avez rejoint le groupe !");
    setJoinCode("");
  };

  const handleDeleteGroup = (id: number) => {
    setGroups(prev => prev.filter(g => g.id !== id));
    setSelectedGroup(null);
    toast("Groupe supprime");
  };

  const handleScanQr = () => {
    qrScannerInputRef.current?.click();
  };

  const TabSwitcher = (
    <div className="flex gap-1.5 rounded-full bg-white/15 p-1.5 backdrop-blur-md border border-white/15">
      {([["join", "Mes groupes"], ["create", "Creer un groupe"]] as const).map(([id, label]) => (
        <button
          key={id}
          onClick={() => { setTab(id); setSelectedGroup(null); }}
          className={`flex-1 rounded-full py-2.5 text-[13px] font-semibold transition ${tab === id ? "bg-white text-[var(--m3-primary)] shadow-sm" : "text-[var(--m3-on-primary)]/90"}`}
        >
          {label}
        </button>
      ))}
    </div>
  );

  return (
    <M3Page
      title="Commandes groupees"
      subtitle="Achetez ensemble, economisez plus"
      icon={Users}
      hero={TabSwitcher}
    >
      {/* --- MES GROUPES --- */}
      {tab === "join" && !selectedGroup && (
        <div className="mx-auto max-w-md space-y-4">
          <input
            ref={qrScannerInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                toast.success("QR Code scanné !", { description: "Traitement du code en cours..." });
                setTimeout(() => {
                  const code = "IPPOO-GRP-" + Math.random().toString(36).slice(2, 8).toUpperCase();
                  setJoinCode(code);
                  toast("Code extrait : " + code, { description: "Appuyez sur Rejoindre pour confirmer" });
                }, 1500);
              }
            }}
          />

          {groups.length === 0 && (
            <EmptyState
              icon={Users}
              title="Aucun groupe"
              description="Creez ou rejoignez un groupe pour commencer a economiser ensemble."
              action={<M3Button icon={Plus} onClick={() => setTab("create")}>Creer un groupe</M3Button>}
            />
          )}

          {groups.map((g, i) => {
            const st = statusConfig[g.status];
            return (
              <M3Card key={g.id} delay={i * 0.05}>
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h4 className="font-bold text-[var(--m3-on-container)]" style={{ color: "#1a1a2e" }}>{g.name}</h4>
                  <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] ${st.color}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                    {st.label}
                  </span>
                </div>
                <div className="mb-3 flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <span className="grid h-6 w-6 place-items-center rounded-lg" style={{ background: "var(--m3-container)", color: "var(--m3-primary)" }}>
                      <Users className="h-3 w-3" />
                    </span>
                    {g.members.length} membres
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="grid h-6 w-6 place-items-center rounded-lg" style={{ background: "var(--m3-container)", color: "var(--m3-primary)" }}>
                      <Package className="h-3 w-3" />
                    </span>
                    {g.totalItems} articles
                  </span>
                  <span className="ml-auto font-semibold text-[var(--m3-primary)]" style={{ fontFamily: "'Space Grotesk', monospace" }}>
                    {g.totalAmount.toLocaleString()} F
                  </span>
                </div>
                <div className="mb-3 flex items-center gap-1.5 text-[11px] text-slate-400">
                  <MapPin className="h-3 w-3" /> {g.deliveryPoint}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedGroup(g)}
                    className="flex flex-1 items-center justify-center gap-1 rounded-full px-3 py-2.5 text-sm font-semibold"
                    style={{ background: "var(--m3-container)", color: "var(--m3-primary)" }}
                  >
                    Voir details <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                  {g.status === "active" && (
                    <button
                      onClick={() => {
                        toast.success("Articles ajoutes au groupe", { description: `+2 articles dans "${g.name}"` });
                        setGroups(prev => prev.map(gr => gr.id === g.id ? { ...gr, totalItems: gr.totalItems + 2, totalAmount: gr.totalAmount + 1500 } : gr));
                      }}
                      className="flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold text-[var(--m3-on-primary)]"
                      style={{ background: "var(--m3-primary)" }}
                    >
                      <ShoppingCart className="h-3.5 w-3.5" /> Ajouter
                    </button>
                  )}
                </div>
              </M3Card>
            );
          })}

          {/* Join existing */}
          <M3Card tonal delay={0.1}>
            <p className="mb-4 text-center text-sm font-medium">Rejoindre un groupe existant</p>
            <div className="mb-3 flex items-center gap-2 rounded-2xl bg-white px-4 py-3">
              <Link2 className="h-4 w-4 text-[var(--m3-primary)]" />
              <input
                placeholder="Code ou lien d'invitation"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                className="flex-1 bg-transparent text-sm text-slate-800 outline-none"
              />
              {joinCode && <button onClick={() => setJoinCode("")}><X className="h-4 w-4 text-slate-300" /></button>}
            </div>
            <div className="flex gap-2.5">
              <button
                onClick={handleScanQr}
                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-white py-3.5 text-sm font-semibold text-slate-700 shadow-sm"
              >
                <Camera className="h-4 w-4 text-[var(--m3-primary)]" /> Scanner QR
              </button>
              <div className="flex-1"><M3Button icon={Check} onClick={handleJoinByCode}>Rejoindre</M3Button></div>
            </div>
          </M3Card>
        </div>
      )}

      {/* --- GROUP DETAIL --- */}
      {tab === "join" && selectedGroup && (
        <div className="mx-auto max-w-md space-y-4">
          <button onClick={() => setSelectedGroup(null)} className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-[var(--m3-primary)]">
            <ChevronLeft className="h-4 w-4" /> Retour aux groupes
          </button>

          <M3Card>
            <div className="mb-4 flex items-center justify-between gap-2">
              <h3 className="font-bold" style={{ color: "#1a1a2e" }}>{selectedGroup.name}</h3>
              <span className={`rounded-full px-2.5 py-1 text-[10px] ${statusConfig[selectedGroup.status].color}`}>
                {statusConfig[selectedGroup.status].label}
              </span>
            </div>
            <div className="mb-4 flex items-center gap-1.5 text-xs text-slate-400">
              <MapPin className="h-3.5 w-3.5" /> {selectedGroup.deliveryPoint}
            </div>
            <div className="mb-4 text-[11px] text-slate-400">Cree: {selectedGroup.createdAt}</div>

            <SectionHeader title={`Membres (${selectedGroup.members.length})`} icon={Users} />
            <div className="mb-4 space-y-2">
              {selectedGroup.members.map((m) => (
                <div key={m.id} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
                  <div className="grid h-9 w-9 place-items-center rounded-xl text-[var(--m3-on-primary)]" style={{ background: "var(--m3-primary)" }}>
                    <span className="text-xs font-semibold">{m.name.charAt(0)}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-700">{m.name}</p>
                    <p className="text-[11px] text-slate-400">{m.items} articles</p>
                  </div>
                  <span className="text-sm font-semibold text-[var(--m3-primary)]" style={{ fontFamily: "'Space Grotesk', monospace" }}>{m.amount.toLocaleString()} F</span>
                </div>
              ))}
            </div>

            <div className="space-y-2 rounded-2xl p-4" style={{ background: "var(--m3-container)", color: "var(--m3-on-container)" }}>
              <div className="flex justify-between text-sm">
                <span className="opacity-70">Total articles</span>
                <span>{selectedGroup.totalItems}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="opacity-70">Frais livraison groupe</span>
                <span style={{ fontFamily: "'Space Grotesk', monospace" }}>500 F</span>
              </div>
              <div className="flex justify-between border-t border-black/10 pt-2">
                <span className="font-semibold">Total</span>
                <span className="text-lg font-bold text-[var(--m3-primary)]" style={{ fontFamily: "'Space Grotesk', monospace" }}>{(selectedGroup.totalAmount + 500).toLocaleString()} FCFA</span>
              </div>
            </div>
          </M3Card>

          <div className="flex gap-2.5">
            <div className="flex-1">
              <M3Button variant="tonal" icon={Copy} onClick={() => { navigator.clipboard?.writeText(inviteLink); toast.success("Lien copie !", { description: inviteLink }); }}>Inviter</M3Button>
            </div>
            <div className="flex-1">
              <M3Button variant="tonal" icon={QrCode} onClick={() => setShowGroupQr(true)}>QR Code</M3Button>
            </div>
          </div>

          {showGroupQr && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-5" onClick={() => setShowGroupQr(false)}>
              <div className="w-full max-w-xs rounded-3xl bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
                <p className="mb-4 text-center font-semibold text-slate-800">QR Code du groupe</p>
                <div className="mb-4 flex justify-center">
                  <QRCodeSVG value={inviteLink} size={200} bgColor="#ffffff" fgColor="#1e293b" level="M" />
                </div>
                <p className="mb-3 text-center text-[11px] text-slate-400">{inviteLink}</p>
                <M3Button onClick={() => { navigator.clipboard?.writeText(inviteLink); toast.success("Lien copié !"); setShowGroupQr(false); }}>Copier le lien</M3Button>
              </div>
            </div>
          )}

          {selectedGroup.status !== "delivered" && (
            <button
              onClick={() => handleDeleteGroup(selectedGroup.id)}
              className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-red-100 bg-red-50 py-3.5 text-sm font-semibold text-red-500 active:scale-[0.98]"
            >
              <Trash2 className="h-4 w-4" /> Quitter le groupe
            </button>
          )}
        </div>
      )}

      {/* --- CREER UN GROUPE --- */}
      {tab === "create" && (
        <div className="mx-auto max-w-md space-y-4">
          <M3Card>
            <SectionHeader title="Informations du groupe" />
            <div className="space-y-3">
              <div className="rounded-2xl bg-slate-50 px-4 py-3.5 transition focus-within:ring-2 focus-within:ring-[var(--m3-primary)]/30">
                <input placeholder="Nom du groupe (ex: Commande campus)" value={groupName} onChange={(e) => setGroupName(e.target.value)} className="w-full bg-transparent text-sm outline-none" />
              </div>
              <div className="flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3.5 transition focus-within:ring-2 focus-within:ring-[var(--m3-primary)]/30">
                <MapPin className="h-4 w-4 text-[var(--m3-primary)]" />
                <input placeholder="Point de livraison unique" value={deliveryPoint} onChange={(e) => setDeliveryPoint(e.target.value)} className="flex-1 bg-transparent text-sm outline-none" />
              </div>
            </div>
          </M3Card>

          <M3Card delay={0.05}>
            <SectionHeader title="Inviter des membres" icon={Link2} />
            <div className="mb-3 flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3">
              <Link2 className="h-4 w-4 text-slate-400" />
              <span className="flex-1 truncate text-xs text-slate-400">{inviteLink}</span>
              <button
                onClick={() => { navigator.clipboard?.writeText(inviteLink); toast.success("Lien copie !"); }}
                className="rounded-lg px-2.5 py-1 text-xs font-semibold"
                style={{ background: "var(--m3-container)", color: "var(--m3-primary)" }}
              >
                Copier
              </button>
            </div>
            <div className="mb-3 flex gap-2.5">
              <div className="flex-1">
                <M3Button variant="tonal" icon={QrCode} onClick={() => toast.success("QR code genere", { description: "Partagez ce QR avec vos amis" })}>QR Preview</M3Button>
              </div>
              <div className="flex-1">
                <M3Button variant="tonal" icon={Copy} onClick={async () => {
                  if (navigator.share) { try { await navigator.share({ title: groupName || "Groupe IPPOO", url: inviteLink }); } catch (_) {} }
                  else { navigator.clipboard?.writeText(inviteLink); toast.success("Lien copie !"); }
                }}>Partager lien</M3Button>
              </div>
            </div>
            <div className="flex justify-center rounded-2xl p-4" style={{ background: "var(--m3-container)" }}>
              <QRCodeSVG value={inviteLink} size={140} bgColor="transparent" fgColor="#1a1a2e" level="M" />
            </div>
          </M3Card>

          <M3Button icon={Plus} onClick={handleCreateGroup}>Creer le groupe</M3Button>
        </div>
      )}
    </M3Page>
  );
}

export default GroupOrdersPage;
