"use client"

import { useMemo } from "react"
import { useApp, Alert, formatCurrency, getTotalStock, isOrderDelayed } from "@/lib/store"
import { Bell, Clock, Package, AlertTriangle, DollarSign, X, CheckCheck } from "lucide-react"

function AlertCard({ alert }: { alert: Alert }) {
  const { dispatch } = useApp()

  const config = {
    "pedido-retrasado": { icon: Clock, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", label: "Pedido Retrasado" },
    "pedido-sin-pagar": { icon: DollarSign, color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20", label: "Pago Pendiente" },
    "stock-bajo": { icon: Package, color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20", label: "Stock Bajo" },
    "proxima-vencimiento": { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", label: "Próximo a Vencer" },
  }

  const c = config[alert.type]

  return (
    <div className={`rounded-xl p-4 border ${c.bg} ${c.border} ${alert.read ? "opacity-50" : ""} transition-all`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${c.bg} border ${c.border}`}>
            <c.icon className={`w-4 h-4 ${c.color}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-foreground">{alert.title}</span>
              {!alert.read && (
                <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{alert.message}</p>
            <span className="text-xs text-muted-foreground mt-2 block">
              {new Date(alert.createdAt).toLocaleDateString("es-CO", {
                day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
              })}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {!alert.read && (
            <button
              onClick={() => dispatch({ type: "MARK_ALERT_READ", payload: alert.id })}
              className="px-2 py-1 rounded-lg glass border border-white/10 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <CheckCheck className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={() => dispatch({ type: "DISMISS_ALERT", payload: alert.id })}
            className="px-2 py-1 rounded-lg glass border border-white/10 text-xs text-muted-foreground hover:text-red-400 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

export function AlertsPage() {
  const { state, dispatch } = useApp()

  // Auto-generate live alerts from state
  const liveAlerts = useMemo(() => {
    const generated: Alert[] = []

    // Delayed orders
    state.orders.forEach(o => {
      if (isOrderDelayed(o) && (o.status === "pendiente" || o.status === "listo")) {
        const exists = state.alerts.some(a => a.relatedId === o.id && a.type === "pedido-retrasado")
        if (!exists) {
          generated.push({
            id: `auto-delay-${o.id}`,
            type: "pedido-retrasado",
            title: "Pedido retrasado",
            message: `Pedido #${o.orderNumber} lleva ${Math.floor((Date.now() - new Date(o.createdAt).getTime()) / 60000)} minutos activo (estimado: ${o.estimatedMinutes + o.additionalMinutes}m).`,
            createdAt: new Date().toISOString(),
            read: false,
            relatedId: o.id,
          })
        }
      }
    })

    // Low stock
    state.ingredients.forEach(i => {
      const stock = getTotalStock(i)
      if (stock < i.minStock) {
        const exists = state.alerts.some(a => a.relatedId === i.id && a.type === "stock-bajo")
        if (!exists) {
          generated.push({
            id: `auto-stock-${i.id}`,
            type: "stock-bajo",
            title: "Stock bajo",
            message: `${i.name} tiene ${stock} ${i.unit}(s) disponibles (mínimo: ${i.minStock}).`,
            createdAt: new Date().toISOString(),
            read: false,
            relatedId: i.id,
          })
        }
      }
    })

    // Expiry soon
    state.ingredients.forEach(i => {
      i.batches.forEach(b => {
        if (!b.expirationDate) return
        const days = (new Date(b.expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        if (days <= state.settings.expirationAlertDays && days >= 0) {
          const exists = state.alerts.some(a => a.relatedId === b.id && a.type === "proxima-vencimiento")
          if (!exists) {
            generated.push({
              id: `auto-exp-${b.id}`,
              type: "proxima-vencimiento",
              title: "Próximo a vencer",
              message: `${i.name} (Lote del ${new Date(b.purchaseDate).toLocaleDateString("es-CO")}) vence en ${Math.ceil(days)} día(s).`,
              createdAt: new Date().toISOString(),
              read: false,
              relatedId: b.id,
            })
          }
        }
      })
    })

    return generated
  }, [state.orders, state.ingredients, state.alerts, state.settings.expirationAlertDays])

  const allAlerts = [...liveAlerts, ...state.alerts]
  const unread = allAlerts.filter(a => !a.read).length

  const markAllRead = () => {
    state.alerts.forEach(a => {
      if (!a.read) dispatch({ type: "MARK_ALERT_READ", payload: a.id })
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Centro de Alertas</h2>
          <p className="text-sm text-muted-foreground">
            {unread} alertas sin leer · {allAlerts.length} en total
          </p>
        </div>
        {unread > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-2 px-4 py-2 rounded-xl glass border border-white/10 text-sm text-muted-foreground hover:text-foreground transition-all">
            <CheckCheck className="w-4 h-4" />
            Marcar todas como leídas
          </button>
        )}
      </div>

      {/* Summary counters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { type: "pedido-retrasado", label: "Retrasados", icon: Clock, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" },
          { type: "stock-bajo", label: "Stock bajo", icon: Package, color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20" },
          { type: "proxima-vencimiento", label: "Por vencer", icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
          { type: "pedido-sin-pagar", label: "Sin pagar", icon: DollarSign, color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
        ].map(cat => {
          const count = allAlerts.filter(a => a.type === cat.type).length
          return (
            <div key={cat.type} className={`rounded-xl p-4 border ${cat.bg} ${cat.border}`}>
              <cat.icon className={`w-5 h-5 ${cat.color} mb-2`} />
              <div className="text-2xl font-black text-foreground">{count}</div>
              <div className="text-xs text-muted-foreground">{cat.label}</div>
            </div>
          )
        })}
      </div>

      {/* Live alerts (auto-generated) */}
      {liveAlerts.length > 0 && (
        <div>
          <div className="text-xs text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Alertas en tiempo real
          </div>
          <div className="space-y-3">
            {liveAlerts.map(alert => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        </div>
      )}

      {/* Stored alerts */}
      {state.alerts.length > 0 && (
        <div>
          <div className="text-xs text-muted-foreground uppercase tracking-widest mb-3">
            Historial de alertas
          </div>
          <div className="space-y-3">
            {[...state.alerts]
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map(alert => (
                <AlertCard key={alert.id} alert={alert} />
              ))}
          </div>
        </div>
      )}

      {allAlerts.length === 0 && (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl glass border border-white/10 flex items-center justify-center mx-auto mb-4">
            <Bell className="w-8 h-8 text-muted-foreground opacity-50" />
          </div>
          <p className="text-muted-foreground">No hay alertas activas</p>
          <p className="text-xs text-muted-foreground mt-2">El sistema generará alertas automáticamente</p>
        </div>
      )}
    </div>
  )
}
