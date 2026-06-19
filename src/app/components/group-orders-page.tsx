import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { ChevronLeft, ChevronRight, Plus, Users, ShoppingBag, ShoppingCart, Clock, Check, X, Search, Star, MapPin, Share2, Link2, Camera, Copy, QrCode, Trash2, Package } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { AfricanPattern } from "./icons";
import { toast } from "sonner";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { api } from "../api/client";

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

const initialGroups: Group[] = [
  {
    id: 1,
    name: "Commande campus",
    members: [
      { id: 1, name: "Dosso A.", items: 3, amount: 2500 },
      { id: 2, name: "Sessinou K.", items: 2, amount: 1800 },
      { id: 3, name: "Fifamè D.", items: 2, amount: 2200 },
      { id: 4, name: "Togbédji M.", items: 1, amount: 1000 },
    ],
    deliveryPoint: "Campus Abomey-Calavi, Portail principal",
    status: "active",
    totalItems: 8,
    totalAmount: 7500,
    createdAt: "Aujourd'hui 10:30",
  },
  {
    id: 2,
    name: "Achat marche Dantokpa",
    members: [
      { id: 1, name: "Aїdatou B.", items: 4, amount: 3500 },
      { id: 2, name: "Nafiou T.", items: 3, amount: 2800 },
      { id: 3, name: "Dosso A.", items: 2, amount: 1500 },
      { id: 4, name: "Akotègnon B.", items: 1, amount: 800 },
      { id: 5, name: "Houéfa K.", items: 1, amount: 1200 },
      { id: 6, name: "Gbètoho P.", items: 1, amount: 700 },
    ],
    deliveryPoint: "Quartier Zongo, Cotonou",
    status: "delivered",
    totalItems: 12,
    totalAmount: 10500,
    createdAt: "Hier 14:00",
  },
];

const statusConfig = {
  active: { label: "En cours", color: "bg-amber-50 text-amber-600", dot: "bg-amber-400" },
  delivered: { label: "Livree", color: "bg-emerald-50 text-emerald-600", dot: "bg-emerald-400" },
  pending: { label: "En attente", color: "bg-blue-50 text-blue-600", dot: "bg-blue-400" },
};

export function GroupOrdersPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"join" | "create">("join");
  const [groups, setGroups] = useState<Group[]>(initialGroups);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [showGroupQr, setShowGroupQr] = useState(false);

  // Create group state
  const [groupName, setGroupName] = useState("");
  const [deliveryPoint, setDeliveryPoint] = useState("");
  const [inviteLink] = useState("https://ippoo.app/group/" + Math.random().toString(36).slice(2, 8));
  const [joinCode, setJoinCode] = useState("");
  const qrScannerInputRef = useRef<HTMLInputElement>(null);
  const [parallaxY, setParallaxY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setParallaxY(window.scrollY * 0.4);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Charge les commandes groupées depuis le backend mock (repli sur les données locales)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await api.get<any[]>("/group-orders");
        if (cancelled || !list?.length) return;
        setGroups(list.map((g, i) => {
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
        /* repli silencieux */
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
      members: [{ id: 1, name: "Dosso A. (vous)", items: 0, amount: 0 }],
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
        { id: 2, name: "Dosso A. (vous)", items: 0, amount: 0 },
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
    // Utiliser l'appareil photo pour scanner un QR code (fichier image)
    qrScannerInputRef.current?.click();
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="relative overflow-hidden rounded-b-[2rem] shadow-lg">
        <ImageWithFallback src={GROUP_IMG} alt="" className="absolute inset-0 w-full h-[130%] object-cover will-change-transform" style={{ transform: `translateY(-${parallaxY}px) scale(${1 + parallaxY * 0.001})` }} />
        <div className="absolute inset-0 bg-gradient-to-b from-violet-600/85 via-violet-600/70 to-purple-800/80" />
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-[#E9C46A]/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-36 h-36 bg-violet-400/20 rounded-full -ml-16 -mb-10 blur-3xl" />
        <div className="relative z-10 px-5 pt-14 pb-8">
          <div className="flex items-center gap-3 mb-5">
            <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white/15 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/15">
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h2 className="text-white">Commandes groupees</h2>
              <p className="text-purple-200 text-xs">Achetez ensemble, economisez plus</p>
            </div>
          </div>
          <div className="flex gap-2 bg-white/10 p-1.5 rounded-2xl backdrop-blur-sm border border-white/10">
            <button
              onClick={() => { setTab("join"); setSelectedGroup(null); }}
              className={`flex-1 py-2.5 rounded-xl text-sm transition-all ${tab === "join" ? "bg-white text-violet-600 shadow-lg" : "text-white"}`}
            >
              Mes groupes
            </button>
            <button
              onClick={() => { setTab("create"); setSelectedGroup(null); }}
              className={`flex-1 py-2.5 rounded-xl text-sm transition-all ${tab === "create" ? "bg-white text-violet-600 shadow-lg" : "text-white"}`}
            >
              Creer un groupe
            </button>
          </div>
        </div>
      </div>

      <div className="px-5 py-5">
        {/* ═══ MES GROUPES ═══ */}
        {tab === "join" && !selectedGroup && (
          <div className="space-y-4">
            {/* Input caché pour scanner QR via camera */}
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
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-violet-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <Users className="w-7 h-7 text-violet-400" />
                </div>
                <p className="text-slate-500 text-sm mb-1">Aucun groupe</p>
                <p className="text-slate-400 text-xs">Creez ou rejoignez un groupe pour commencer</p>
              </div>
            )}

            {groups.map((g) => {
              const st = statusConfig[g.status];
              return (
                <div key={g.id} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-slate-800">{g.name}</h4>
                    <span className={`text-[10px] px-2.5 py-1 rounded-full flex items-center gap-1.5 ${st.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                      {st.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-400 mb-3">
                    <span className="flex items-center gap-1.5">
                      <div className="w-6 h-6 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <Users className="w-3 h-3 text-white" />
                      </div>
                      {g.members.length} membres
                    </span>
                    <span className="flex items-center gap-1.5">
                      <div className="w-6 h-6 bg-gradient-to-br from-orange-400 to-rose-500 rounded-lg flex items-center justify-center">
                        <Package className="w-3 h-3 text-white" />
                      </div>
                      {g.totalItems} articles
                    </span>
                    <span className="text-emerald-500 ml-auto" style={{ fontFamily: "'Space Grotesk', monospace" }}>
                      {g.totalAmount.toLocaleString()} F
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-3">
                    <MapPin className="w-3 h-3" /> {g.deliveryPoint}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedGroup(g)}
                      className="flex-1 text-violet-600 text-sm flex items-center justify-center gap-1 bg-violet-50 px-3 py-2.5 rounded-xl"
                    >
                      Voir details <ChevronRight className="w-3 h-3" />
                    </button>
                    {g.status === "active" && (
                      <button
                        onClick={() => {
                          toast.success("Articles ajoutes au groupe", { description: `+2 articles dans "${g.name}"` });
                          setGroups(prev => prev.map(gr => gr.id === g.id ? { ...gr, totalItems: gr.totalItems + 2, totalAmount: gr.totalAmount + 1500 } : gr));
                        }}
                        className="flex items-center gap-1.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg shadow-violet-500/20"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" /> Ajouter
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Join existing */}
            <div className="bg-violet-50/50 rounded-3xl p-5 border border-violet-100">
              <p className="text-sm text-center text-slate-600 mb-4">Rejoindre un groupe existant</p>
              <div className="flex items-center gap-2 bg-white rounded-2xl px-4 py-3 border border-slate-100 mb-3">
                <Link2 className="w-4 h-4 text-violet-500" />
                <input
                  placeholder="Code ou lien d'invitation"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-sm"
                />
                {joinCode && <button onClick={() => setJoinCode("")}><X className="w-4 h-4 text-slate-300" /></button>}
              </div>
              <div className="flex gap-2.5">
                <button
                  onClick={handleScanQr}
                  className="flex-1 flex items-center justify-center gap-2 bg-white py-3.5 rounded-2xl text-sm border border-slate-100 shadow-sm text-slate-700"
                >
                  <Camera className="w-4 h-4 text-violet-500" /> Scanner QR
                </button>
                <button
                  onClick={handleJoinByCode}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white py-3.5 rounded-2xl text-sm shadow-lg shadow-violet-500/20"
                >
                  <Check className="w-4 h-4" /> Rejoindre
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══ GROUP DETAIL ═══ */}
        {tab === "join" && selectedGroup && (
          <div className="space-y-4">
            <button onClick={() => setSelectedGroup(null)} className="flex items-center gap-1.5 text-sm text-violet-600 mb-2">
              <ChevronLeft className="w-4 h-4" /> Retour aux groupes
            </button>

            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-slate-800">{selectedGroup.name}</h3>
                <span className={`text-[10px] px-2.5 py-1 rounded-full ${statusConfig[selectedGroup.status].color}`}>
                  {statusConfig[selectedGroup.status].label}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-4">
                <MapPin className="w-3.5 h-3.5" /> {selectedGroup.deliveryPoint}
              </div>
              <div className="text-[10px] text-slate-400 mb-4">Cree: {selectedGroup.createdAt}</div>

              {/* Members list */}
              <p className="text-xs text-slate-500 mb-3 uppercase tracking-wider">Membres ({selectedGroup.members.length})</p>
              <div className="space-y-2 mb-4">
                {selectedGroup.members.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <span className="text-white text-xs">{m.name.charAt(0)}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-slate-700">{m.name}</p>
                      <p className="text-[10px] text-slate-400">{m.items} articles</p>
                    </div>
                    <span className="text-sm text-emerald-500" style={{ fontFamily: "'Space Grotesk', monospace" }}>{m.amount.toLocaleString()} F</span>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="bg-violet-50 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Total articles</span>
                  <span className="text-slate-800">{selectedGroup.totalItems}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Frais livraison groupe</span>
                  <span className="text-slate-800" style={{ fontFamily: "'Space Grotesk', monospace" }}>500 F</span>
                </div>
                <div className="flex justify-between border-t border-violet-200 pt-2">
                  <span className="text-slate-800">Total</span>
                  <span className="text-violet-600 text-lg" style={{ fontFamily: "'Space Grotesk', monospace" }}>{(selectedGroup.totalAmount + 500).toLocaleString()} FCFA</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2.5">
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(inviteLink);
                  toast.success("Lien copie !", { description: inviteLink });
                }}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-50 text-blue-600 py-3.5 rounded-2xl text-sm"
              >
                <Copy className="w-4 h-4" /> Inviter
              </button>
              <button
                onClick={() => setShowGroupQr(true)}
                className="flex-1 flex items-center justify-center gap-2 bg-violet-50 text-violet-600 py-3.5 rounded-2xl text-sm"
              >
                <QrCode className="w-4 h-4" /> QR Code
              </button>
            </div>

            {/* QR Code Modal */}
            {showGroupQr && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowGroupQr(false)}>
                <div className="bg-white rounded-3xl p-6 mx-5 shadow-2xl" onClick={e => e.stopPropagation()}>
                  <p className="text-center text-slate-800 mb-4">QR Code du groupe</p>
                  <div className="flex justify-center mb-4">
                    <QRCodeSVG
                      value={inviteLink}
                      size={200}
                      bgColor="#ffffff"
                      fgColor="#1e293b"
                      level="M"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 text-center mb-3">{inviteLink}</p>
                  <button
                    onClick={() => { navigator.clipboard?.writeText(inviteLink); toast.success("Lien copié !"); setShowGroupQr(false); }}
                    className="w-full bg-violet-500 text-white py-3 rounded-xl text-sm"
                  >
                    Copier le lien
                  </button>
                </div>
              </div>
            )}

            {selectedGroup.status !== "delivered" && (
              <button
                onClick={() => handleDeleteGroup(selectedGroup.id)}
                className="w-full flex items-center justify-center gap-2 text-red-500 py-3 rounded-2xl border-2 border-red-100 bg-red-50 text-sm"
              >
                <Trash2 className="w-4 h-4" /> Quitter le groupe
              </button>
            )}
          </div>
        )}

        {/* ═══ CREER UN GROUPE ═══ */}
        {tab === "create" && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-3">
              <label className="text-sm text-slate-500">Informations du groupe</label>
              <div className="bg-slate-50 rounded-2xl px-4 py-3.5 border border-slate-100 focus-within:border-violet-300 transition">
                <input placeholder="Nom du groupe (ex: Commande campus)" value={groupName} onChange={(e) => setGroupName(e.target.value)} className="w-full bg-transparent outline-none text-sm" />
              </div>
              <div className="flex items-center gap-2 bg-slate-50 rounded-2xl px-4 py-3.5 border border-slate-100 focus-within:border-violet-300 transition">
                <MapPin className="w-4 h-4 text-violet-500" />
                <input placeholder="Point de livraison unique" value={deliveryPoint} onChange={(e) => setDeliveryPoint(e.target.value)} className="flex-1 bg-transparent outline-none text-sm" />
              </div>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
              <p className="text-sm mb-4 text-slate-600">Inviter des membres</p>
              <div className="bg-slate-50 rounded-2xl px-4 py-3 border border-slate-100 mb-3 flex items-center gap-2">
                <Link2 className="w-4 h-4 text-slate-400" />
                <span className="text-xs text-slate-400 truncate flex-1">{inviteLink}</span>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(inviteLink);
                    toast.success("Lien copie !");
                  }}
                  className="text-violet-600 text-xs bg-violet-50 px-2.5 py-1 rounded-lg"
                >
                  Copier
                </button>
              </div>
              <div className="flex gap-2.5">
                <button
                  onClick={() => toast.success("QR code genere", { description: "Partagez ce QR avec vos amis" })}
                  className="flex-1 flex items-center justify-center gap-2 bg-violet-50 text-violet-600 py-3 rounded-2xl text-sm"
                >
                  <QrCode className="w-4 h-4" /> QR Preview
                </button>
                <button
                  onClick={async () => {
                    if (navigator.share) {
                      try { await navigator.share({ title: groupName || "Groupe IPPOO", url: inviteLink }); } catch (_) {}
                    } else {
                      navigator.clipboard?.writeText(inviteLink);
                      toast.success("Lien copie !");
                    }
                  }}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-50 text-blue-600 py-3 rounded-2xl text-sm"
                >
                  <Copy className="w-4 h-4" /> Partager lien
                </button>
              </div>
              {/* QR Code preview */}
              <div className="flex justify-center bg-white rounded-2xl p-4 border border-violet-100">
                <QRCodeSVG value={inviteLink} size={140} bgColor="#ffffff" fgColor="#7c3aed" level="M" />
              </div>
            </div>

            <button
              onClick={handleCreateGroup}
              className="w-full bg-gradient-to-r from-violet-500 to-purple-600 text-white py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-violet-500/25 active:scale-[0.98] transition-transform"
            >
              <Plus className="w-4 h-4" /> Creer le groupe
            </button>
          </div>
        )}
      </div>
    </div>
  );
}