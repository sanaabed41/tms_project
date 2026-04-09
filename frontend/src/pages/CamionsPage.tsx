import { useState, useEffect, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import {
  Truck, Package, MapPin, Plus, X, AlertCircle,
  CheckCircle, User, GripVertical, Scale,
} from 'lucide-react';

const API = 'http://localhost:3000';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Camion {
  id: number;
  matricule: string;
  marque: string;
  modele: string;
  annee: number;
  type: string;
  status: string;
  capaciteTonnage: number;
  couleur?: string;
  isActive: boolean;
  driver?: { id: number; firstName: string; lastName: string };
  driverId?: number;
}

interface BL {
  id: number;
  reference: string;
  status: string;
  poidsTotal: number;
  adresseLivraison: string;
  missionId: number | null;
  client?: { id: number; firstName?: string; lastName?: string };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  AVAILABLE: 'Disponible',
  IN_MISSION: 'En mission',
  MAINTENANCE: 'Maintenance',
  OUT_OF_SERVICE: 'Hors service',
};

const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: 'bg-emerald-100 text-emerald-700',
  IN_MISSION: 'bg-blue-100 text-blue-700',
  MAINTENANCE: 'bg-amber-100 text-amber-700',
  OUT_OF_SERVICE: 'bg-red-100 text-red-700',
};

const TYPE_LABELS: Record<string, string> = {
  FLATBED: 'Plateau',
  REFRIGERATED: 'Frigorifique',
  TANKER: 'Citerne',
  CONTAINER: 'Conteneur',
  CURTAINSIDER: 'Bâché',
  TIPPER: 'Benne',
};

function authHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  };
}

// ─── BL Card (shared display) ─────────────────────────────────────────────────

function BLCardContent({ bl }: { bl: BL }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm select-none">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-bold text-slate-700">{bl.reference}</span>
        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
          CONFIRMÉ
        </span>
      </div>
      <div className="flex items-center gap-3 text-xs text-slate-500">
        <span className="flex items-center gap-1 font-semibold text-slate-700">
          <Scale className="w-3 h-3 text-blue-500" />
          {Number(bl.poidsTotal).toFixed(1)} t
        </span>
        <span className="flex items-center gap-1 truncate">
          <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
          <span className="truncate">{bl.adresseLivraison}</span>
        </span>
      </div>
      {bl.client && (bl.client.firstName || bl.client.lastName) && (
        <p className="mt-1.5 text-xs text-slate-400 flex items-center gap-1">
          <User className="w-3 h-3" />
          {bl.client.firstName} {bl.client.lastName}
        </p>
      )}
    </div>
  );
}

// ─── Draggable BL Card ────────────────────────────────────────────────────────

function DraggableBLCard({ bl }: { bl: BL }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: bl.id,
  });

  const style = { transform: CSS.Translate.toString(transform) };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative cursor-grab active:cursor-grabbing touch-none transition-opacity ${
        isDragging ? 'opacity-0' : ''
      }`}
      {...listeners}
      {...attributes}
    >
      <div className="absolute top-3 right-3 text-slate-300 pointer-events-none">
        <GripVertical className="w-3.5 h-3.5" />
      </div>
      <BLCardContent bl={bl} />
    </div>
  );
}

// ─── Camion Drop Zone ─────────────────────────────────────────────────────────

function CamionDropZone({
  camion, load, bls,
}: {
  camion: Camion;
  load: number;
  bls: BL[];
}) {
  const canDrop = camion.status === 'AVAILABLE' || camion.status === 'IN_MISSION';
  const { isOver, setNodeRef } = useDroppable({ id: camion.id, disabled: !canDrop });

  const cap = Number(camion.capaciteTonnage);
  const pct = cap > 0 ? Math.min((load / cap) * 100, 100) : 0;
  const barColor =
    pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-blue-500';
  const textColor = pct >= 90 ? 'text-red-600' : 'text-slate-700';

  return (
    <div
      ref={setNodeRef}
      className={`rounded-2xl border-2 p-4 transition-all duration-150 ${
        isOver && canDrop
          ? 'border-blue-400 bg-blue-50 shadow-lg shadow-blue-100'
          : canDrop
          ? 'border-slate-200 bg-white hover:border-blue-200'
          : 'border-slate-100 bg-slate-50 opacity-60'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
            <Truck className="w-4 h-4 text-slate-600" />
          </div>
          <div>
            <p className="font-bold text-slate-800 text-sm leading-tight">{camion.matricule}</p>
            <p className="text-xs text-slate-500">
              {camion.marque} {camion.modele} · {TYPE_LABELS[camion.type] ?? camion.type}
            </p>
          </div>
        </div>
        <span
          className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${
            STATUS_COLORS[camion.status] ?? 'bg-slate-100 text-slate-600'
          }`}
        >
          {STATUS_LABELS[camion.status] ?? camion.status}
        </span>
      </div>

      {/* Driver */}
      {camion.driver && (
        <p className="text-xs text-slate-400 flex items-center gap-1 mb-2">
          <User className="w-3 h-3" />
          {camion.driver.firstName} {camion.driver.lastName}
        </p>
      )}

      {/* Weight bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-slate-500">Capacité</span>
          <span>
            <span className={`font-bold ${textColor}`}>{load.toFixed(1)} t</span>
            <span className="text-slate-400"> / {cap.toFixed(1)} t</span>
          </span>
        </div>
        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className={`text-right text-xs mt-0.5 font-medium ${textColor}`}>{pct.toFixed(0)}%</p>
      </div>

      {/* BLs already assigned */}
      {bls.length > 0 && (
        <div className="space-y-1 mb-3">
          {bls.map((bl) => (
            <div
              key={bl.id}
              className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-lg px-3 py-1.5"
            >
              <span className="text-xs font-medium text-slate-700">{bl.reference}</span>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Scale className="w-3 h-3" />
                {Number(bl.poidsTotal).toFixed(1)} t
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Drop zone hint */}
      {canDrop ? (
        <div
          className={`border-2 border-dashed rounded-xl px-3 py-2.5 text-center text-xs font-medium transition-all ${
            isOver
              ? 'border-blue-400 bg-blue-50 text-blue-600'
              : 'border-slate-200 text-slate-400 hover:border-slate-300'
          }`}
        >
          {isOver ? '⬇ Relâcher pour affecter' : '📦 Glisser un BL ici'}
        </div>
      ) : (
        <p className="text-xs text-center text-slate-400 italic py-1">Non disponible pour chargement</p>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const INITIAL_FORM = {
  matricule: '',
  marque: '',
  modele: '',
  annee: new Date().getFullYear(),
  type: 'FLATBED',
  capaciteTonnage: '',
  couleur: '',
};

export default function CamionsPage() {
  const [camions, setCamions] = useState<Camion[]>([]);
  const [availableBLs, setAvailableBLs] = useState<BL[]>([]);
  const [camionLoads, setCamionLoads] = useState<Record<number, number>>({});
  const [camionBLs, setCamionBLs] = useState<Record<number, BL[]>>({});
  const [activeDrag, setActiveDrag] = useState<BL | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [stats, setStats] = useState({ total: 0, available: 0, inMission: 0, maintenance: 0 });
  const [form, setForm] = useState(INITIAL_FORM);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  function showToast(msg: string, type: 'success' | 'error') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4500);
  }

  const loadData = useCallback(async () => {
    try {
      const [camionsRes, blsRes, missionsRes] = await Promise.all([
        fetch(`${API}/camions`, { headers: authHeaders() }),
        fetch(`${API}/bons-livraison`, { headers: authHeaders() }),
        fetch(`${API}/missions`, { headers: authHeaders() }),
      ]);

      const cData = await camionsRes.json();
      const bData = await blsRes.json();
      const mData = await missionsRes.json();

      const safeCamions: Camion[] = Array.isArray(cData) ? cData : (cData?.camions ?? []);
      const safeBLs: BL[] = Array.isArray(bData) ? bData : (bData?.bonsLivraison ?? []);
      const safeMissions: any[] = Array.isArray(mData) ? mData : (mData?.missions ?? []);

      setCamions(safeCamions);
      setStats({
        total: safeCamions.length,
        available: safeCamions.filter((c) => c.status === 'AVAILABLE').length,
        inMission: safeCamions.filter((c) => c.status === 'IN_MISSION').length,
        maintenance: safeCamions.filter(
          (c) => c.status === 'MAINTENANCE' || c.status === 'OUT_OF_SERVICE',
        ).length,
      });

      // BLs available = CONFIRMED + no mission yet
      setAvailableBLs(safeBLs.filter((bl) => bl.status === 'CONFIRMED' && !bl.missionId));

      // Compute loads from active missions (PENDING / IN_MISSION)
      const loads: Record<number, number> = {};
      const blsByCamion: Record<number, BL[]> = {};

      for (const m of safeMissions) {
        if (m.camionId && ['PENDING', 'IN_MISSION'].includes(m.status)) {
          loads[m.camionId] = (loads[m.camionId] ?? 0) + (Number(m.poids) || 0);
          const mBLs = safeBLs.filter((bl) => bl.missionId === m.id);
          if (!blsByCamion[m.camionId]) blsByCamion[m.camionId] = [];
          blsByCamion[m.camionId].push(...mBLs);
        }
      }

      setCamionLoads(loads);
      setCamionBLs(blsByCamion);
    } catch (err) {
      console.error('loadData error:', err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── DnD handlers ──────────────────────────────────────────────────────────

  function handleDragStart(event: DragStartEvent) {
    const bl = availableBLs.find((b) => b.id === event.active.id);
    setActiveDrag(bl ?? null);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveDrag(null);
    if (!over) return;

    const bl = availableBLs.find((b) => b.id === active.id);
    const camion = camions.find((c) => c.id === over.id);
    if (!bl || !camion) return;

    const currentLoad = camionLoads[camion.id] ?? 0;
    const blWeight = Number(bl.poidsTotal);
    const newLoad = currentLoad + blWeight;
    const cap = Number(camion.capaciteTonnage);

    if (newLoad > cap) {
      showToast(
        `Capacité dépassée ! ${camion.matricule} max ${cap}t ` +
          `(actuel ${currentLoad.toFixed(1)}t + ${blWeight.toFixed(1)}t = ${newLoad.toFixed(1)}t)`,
        'error',
      );
      return;
    }

    try {
      const today = new Date().toISOString();
      const tomorrow = new Date(Date.now() + 86_400_000).toISOString();

      const mRes = await fetch(`${API}/missions`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          camionId: camion.id,
          poids: blWeight,
          origine: 'À définir',
          destination: bl.adresseLivraison,
          dateDepart: today,
          dateArriveePrevu: tomorrow,
          description: `Mission créée depuis BL ${bl.reference}`,
          ...(camion.driverId ? { driverId: camion.driverId } : {}),
        }),
      });

      if (!mRes.ok) {
        const e = await mRes.json();
        throw new Error(e.message ?? 'Erreur création mission');
      }

      const mission = await mRes.json();

      const blRes = await fetch(`${API}/bons-livraison/${bl.id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ missionId: mission.id }),
      });

      if (!blRes.ok) throw new Error('Erreur lors de l\'assignation du BL');

      // Update local state
      setAvailableBLs((prev) => prev.filter((b) => b.id !== bl.id));
      setCamionLoads((prev) => ({ ...prev, [camion.id]: newLoad }));
      setCamionBLs((prev) => ({
        ...prev,
        [camion.id]: [...(prev[camion.id] ?? []), bl],
      }));

      showToast(`BL ${bl.reference} (${blWeight.toFixed(1)}t) affecté à ${camion.matricule}`, 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  }

  // ── Add camion ────────────────────────────────────────────────────────────

  async function handleAddCamion(e: React.SyntheticEvent) {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);
    try {
      const res = await fetch(`${API}/camions`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          ...form,
          annee: Number(form.annee),
          capaciteTonnage: Number(form.capaciteTonnage),
        }),
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(Array.isArray(e.message) ? e.message.join(', ') : (e.message ?? 'Erreur'));
      }
      setShowModal(false);
      setForm(INITIAL_FORM);
      await loadData();
      showToast('Camion ajouté avec succès', 'success');
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const activeCamions = camions.filter((c) => c.isActive);

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl text-sm font-medium animate-in slide-in-from-bottom-2 ${
            toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Gestion de la flotte</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Glissez les BLs sur les camions pour les affecter · Contrainte de poids respectée
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Ajouter un camion
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total camions', value: stats.total, dot: 'bg-slate-400' },
          { label: 'Disponibles', value: stats.available, dot: 'bg-emerald-500' },
          { label: 'En mission', value: stats.inMission, dot: 'bg-blue-500' },
          { label: 'Maintenance / HS', value: stats.maintenance, dot: 'bg-amber-500' },
        ].map(({ label, value, dot }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3">
            <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${dot}`} />
            <div>
              <p className="text-2xl font-bold text-slate-800 leading-none">{value}</p>
              <p className="text-xs text-slate-500 mt-1">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* DnD layout */}
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-5 items-start">
          {/* Left panel: draggable BLs */}
          <div className="w-68 shrink-0" style={{ width: '17rem' }}>
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sticky top-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-slate-700 text-sm flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-500" />
                  BLs à affecter
                </h2>
                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
                  {availableBLs.length}
                </span>
              </div>

              {availableBLs.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">Aucun BL confirmé<br />en attente d'affectation</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[calc(100vh-340px)] overflow-y-auto pr-1">
                  {availableBLs.map((bl) => (
                    <DraggableBLCard key={bl.id} bl={bl} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right panel: camion drop zones */}
          <div className="flex-1 min-w-0">
            {activeCamions.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                <Truck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">Aucun camion enregistré</p>
                <button
                  onClick={() => setShowModal(true)}
                  className="mt-3 text-blue-500 hover:text-blue-600 text-sm font-semibold"
                >
                  + Ajouter le premier camion
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {activeCamions.map((camion) => (
                  <CamionDropZone
                    key={camion.id}
                    camion={camion}
                    load={camionLoads[camion.id] ?? 0}
                    bls={camionBLs[camion.id] ?? []}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Floating drag overlay */}
        <DragOverlay dropAnimation={null}>
          {activeDrag ? (
            <div className="w-64 rotate-2 shadow-2xl cursor-grabbing scale-105">
              <BLCardContent bl={activeDrag} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Add Camion Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800 text-lg">Nouveau camion</h3>
              <button
                onClick={() => { setShowModal(false); setFormError(''); }}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCamion} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Matricule *</label>
                  <input
                    required
                    value={form.matricule}
                    onChange={(e) => setForm((f) => ({ ...f, matricule: e.target.value }))}
                    placeholder="12-TMS-34"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Marque *</label>
                  <input
                    required
                    value={form.marque}
                    onChange={(e) => setForm((f) => ({ ...f, marque: e.target.value }))}
                    placeholder="Mercedes, Volvo…"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Modèle *</label>
                  <input
                    required
                    value={form.modele}
                    onChange={(e) => setForm((f) => ({ ...f, modele: e.target.value }))}
                    placeholder="Actros, FH16…"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Année *</label>
                  <input
                    required
                    type="number"
                    min={2000}
                    max={2030}
                    value={form.annee}
                    onChange={(e) => setForm((f) => ({ ...f, annee: Number(e.target.value) }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Type *</label>
                  <select
                    required
                    value={form.type}
                    onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    {Object.entries(TYPE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Capacité (tonnes) *</label>
                  <input
                    required
                    type="number"
                    min={0.1}
                    step={0.1}
                    value={form.capaciteTonnage}
                    onChange={(e) => setForm((f) => ({ ...f, capaciteTonnage: e.target.value }))}
                    placeholder="10"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Couleur</label>
                  <input
                    value={form.couleur}
                    onChange={(e) => setForm((f) => ({ ...f, couleur: e.target.value }))}
                    placeholder="Blanc, Bleu, Gris…"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {formError}
                </div>
              )}

              <div className="flex gap-3 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setFormError(''); }}
                  className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all"
                >
                  {formLoading ? 'Enregistrement…' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
