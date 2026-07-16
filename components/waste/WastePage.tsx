"use client"

import { useState, useMemo } from "react"
import { useApp, WasteRecord, formatCurrency } from "@/lib/store"
import { Plus, X, Trash2, AlertTriangle, Calendar, TrendingDown } from "lucide-react"

const REASONS = ["Vencimiento", "Cocción fallida", "Error de porción", "Contaminación", "Caída accidental", "Exceso de producción", "Otro"]

function WasteModal({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useApp()
  const [ingredientId, setIngredientId] = useState(state.ingredients[0]?.id || "")
  const [quantity, setQuantity] = useState("")
  const [reason, setReason] = useState(REASONS[0])
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])

  const selectedIngredient = state.ingredients.find(i => i.id === ingredientId)

  const cost = useMemo(() => {
    if (!selectedIngredient || !quantity) return 0
    const sorted = [...selectedIngredient.batches]
      .filter(b => b.remainingQuantity > 0)
      .sort((a, b) => new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime())
    if (!sorted.length) return 0
    return sorted[0].unitCost * Number(quantity)
  }, [selectedIngredient, quantity])

  const handleSave = () => {
    if (!ingredientId || !quantity || !selectedIngredient) return
    const record: WasteRecord = {
      id: `w-${Date.now()}`,
      ingredientId,
      ingredientName: selectedIngredient.name,
      quantity: Number(quantity),
      unit: selectedIngredient.unit,
      reason, cost, date,
    }
    dispatch({ type: "ADD_WASTE", payload: record })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 p-6 shadow-2xl"
        style={{ background: "oklch(0.13 0.008 240)" }}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-foreground">Registrar Desperdicio</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Ingrediente</label>
            <select value={ingredientId} onChange={e => setIngredientId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl glass border border-white/10 text-foreground text-sm bg-transparent focus:outline-none focus:border-primary/50">
              {state.ingredients.map(i => (
                <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">
                Cantidad ({selectedIngredient?.unit || "unidad"})
              </label>
              <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)}
                placeholder="0"
                className="w-full px-4 py-3 rounded-xl glass border border-white/10 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Fecha</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl glass border border-white/10 text-foreground text-sm focus:outline-none focus:border-primary/50" />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Motivo</label>
            <select value={reason} onChange={e => setReason(e.target.value)}
              className="w-full px-4 py-3 rounded-xl glass border border-white/10 text-foreground text-sm bg-transparent focus:outline-none focus:border-primary/50">
              {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {cost > 0 && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
              <div className="text-xs text-muted-foreground mb-1">Costo estimado del desperdicio (FIFO)</div>
              <div className="text-lg font-black text-red-400">{formatCurrency(cost)}</div>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl glass border border-white/10 text-sm text-muted-foreground">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={!quantity}
            className="flex-1 py-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-bold disabled:opacity-40 hover:bg-red-500/30 transition-all">
            Registrar Desperdicio
          </button>
        </div>
      </div>
    </div>
  )
}

export function WastePage() {
  const { state } = useApp()
  const [showModal, setShowModal] = useState(false)

  const stats = useMemo(() => {
    const totalCost = state.wasteRecords.reduce((sum, w) => sum + w.cost, 0)
    const byReason = state.wasteRecords.reduce((acc, w) => {
      acc[w.reason] = (acc[w.reason] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    const topReason = Object.entries(byReason).sort(([, a], [, b]) => b - a)[0]
    return { totalCost, topReason, count: state.wasteRecords.length }
  }, [state.wasteRecords])

  const sorted = useMemo(() =>
    [...state.wasteRecords].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [state.wasteRecords]
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Control de Desperdicios</h2>
          <p className="text-sm text-muted-foreground">{stats.count} registros</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-semibold hover:bg-red-500/30 transition-all">
          <Plus className="w-4 h-4" />
          Registrar Desperdicio
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl p-5 border border-red-500/20 bg-red-500/5">
          <TrendingDown className="w-5 h-5 text-red-400 mb-2" />
          <div className="text-2xl font-black text-foreground">{formatCurrency(stats.totalCost)}</div>
          <div className="text-xs text-muted-foreground">Costo total de desperdicios</div>
        </div>
        <div className="stat-card rounded-2xl p-5">
          <AlertTriangle className="w-5 h-5 text-yellow-400 mb-2" />
          <div className="text-2xl font-black text-foreground">{stats.count}</div>
          <div className="text-xs text-muted-foreground">Incidentes registrados</div>
        </div>
        <div className="stat-card rounded-2xl p-5">
          <AlertTriangle className="w-5 h-5 text-orange-400 mb-2" />
          <div className="text-xl font-black text-foreground">{stats.topReason?.[0] || "—"}</div>
          <div className="text-xs text-muted-foreground">
            Causa principal · {stats.topReason?.[1] || 0} veces
          </div>
        </div>
      </div>

      {/* Waste records */}
      <div className="space-y-3">
        {sorted.map(record => (
          <div key={record.id} className="stat-card rounded-xl p-4 border border-white/8 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-4 h-4 text-red-400" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-foreground">
                  {record.ingredientName}
                  <span className="text-muted-foreground font-normal"> · {record.quantity} {record.unit}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-muted-foreground border border-white/10">
                    {record.reason}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    {new Date(record.date).toLocaleDateString("es-CO")}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-base font-black text-red-400">
              -{formatCurrency(record.cost)}
            </div>
          </div>
        ))}
      </div>

      {sorted.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>No hay desperdicios registrados</p>
        </div>
      )}

      {showModal && <WasteModal onClose={() => setShowModal(false)} />}
    </div>
  )
}
