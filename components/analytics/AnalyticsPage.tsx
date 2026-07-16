"use client"

import { useMemo, useState } from "react"
import {
  useApp, formatCurrency, calculateProductCost, getTotalStock
} from "@/lib/store"
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts"
import { TrendingUp, DollarSign, ShoppingCart, Package, AlertTriangle, Calendar } from "lucide-react"

const COLORS = [
  "oklch(0.72 0.19 52)",
  "oklch(0.70 0.18 140)",
  "oklch(0.68 0.17 200)",
  "oklch(0.75 0.16 300)",
  "oklch(0.65 0.22 27)"
]

const PERIOD_LABELS = {
  "7d": "Últimos 7 días",
  "30d": "Últimos 30 días",
  "90d": "Últimos 90 días",
}

const mockWeeklyData = [
  { label: "Lun", ventas: 850000, costo: 280000, pedidos: 32 },
  { label: "Mar", ventas: 920000, costo: 310000, pedidos: 38 },
  { label: "Mié", ventas: 780000, costo: 250000, pedidos: 29 },
  { label: "Jue", ventas: 1100000, costo: 380000, pedidos: 45 },
  { label: "Vie", ventas: 1350000, costo: 430000, pedidos: 58 },
  { label: "Sáb", ventas: 1800000, costo: 580000, pedidos: 72 },
  { label: "Dom", ventas: 1200000, costo: 390000, pedidos: 51 },
]

const mock30DayData = Array.from({ length: 30 }, (_, i) => {
  const base = 900000 + Math.random() * 600000
  return {
    label: `${i + 1}`,
    ventas: Math.round(base),
    costo: Math.round(base * 0.32),
    pedidos: Math.round(30 + Math.random() * 50),
  }
})

const mock90DayData = Array.from({ length: 12 }, (_, i) => {
  const labels = ["Sem 1", "Sem 2", "Sem 3", "Sem 4", "Sem 5", "Sem 6",
    "Sem 7", "Sem 8", "Sem 9", "Sem 10", "Sem 11", "Sem 12"]
  const base = 5500000 + Math.random() * 3000000
  return {
    label: labels[i],
    ventas: Math.round(base),
    costo: Math.round(base * 0.32),
    pedidos: Math.round(200 + Math.random() * 200),
  }
})

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass rounded-xl p-3 border border-white/10 text-xs space-y-1">
      <p className="text-muted-foreground font-medium mb-2">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {typeof p.value === "number" && p.name !== "Pedidos"
            ? formatCurrency(p.value)
            : p.value}
        </p>
      ))}
    </div>
  )
}

export function AnalyticsPage() {
  const { state } = useApp()
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("7d")

  const chartData = period === "7d" ? mockWeeklyData : period === "30d" ? mock30DayData : mock90DayData

  const totals = useMemo(() => {
    const ventas = chartData.reduce((s, d) => s + d.ventas, 0)
    const costo = chartData.reduce((s, d) => s + d.costo, 0)
    const pedidos = chartData.reduce((s, d) => s + d.pedidos, 0)
    const utilidad = ventas - costo
    const margen = ventas > 0 ? Math.round((utilidad / ventas) * 100) : 0
    const gastos = state.operationalExpenses.reduce((s, e) => s + e.amount, 0)
    const utilidadNeta = utilidad - gastos
    return { ventas, costo, pedidos, utilidad, margen, gastos, utilidadNeta }
  }, [chartData, state.operationalExpenses])

  // Product performance
  const productPerformance = useMemo(() => {
    const perfMap: Record<string, { name: string; qty: number; revenue: number }> = {}
    state.orders.forEach(o => {
      o.items.forEach(item => {
        if (!perfMap[item.productId]) {
          perfMap[item.productId] = { name: item.productName, qty: 0, revenue: 0 }
        }
        perfMap[item.productId].qty += item.quantity
        perfMap[item.productId].revenue += item.subtotal
      })
    })
    return Object.values(perfMap).sort((a, b) => b.revenue - a.revenue).slice(0, 8)
  }, [state.orders])

  // Order type breakdown
  const orderTypeData = useMemo(() => {
    const types: Record<string, number> = {}
    state.orders.forEach(o => {
      const label = { mesa: "Mesa", "para-llevar": "Para llevar", domicilio: "Domicilio" }[o.type]
      types[label] = (types[label] || 0) + 1
    })
    return Object.entries(types).map(([name, value]) => ({ name, value }))
  }, [state.orders])

  // Margin analysis per product
  const marginData = useMemo(() => {
    return state.products.map(p => {
      const cost = calculateProductCost(p, state.ingredients)
      const margin = p.price > 0 ? Math.round(((p.price - cost) / p.price) * 100) : 0
      return {
        name: p.name.length > 14 ? p.name.slice(0, 14) + "…" : p.name,
        margen: margin,
        costo: Math.round(cost),
        precio: p.price,
      }
    }).sort((a, b) => b.margen - a.margen)
  }, [state.products, state.ingredients])

  // Waste trend
  const wasteCostTotal = state.wasteRecords.reduce((s, w) => s + w.cost, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Analíticas y Reportes</h2>
          <p className="text-sm text-muted-foreground">Vista financiera del restaurante</p>
        </div>
        <div className="flex gap-2">
          {(["7d", "30d", "90d"] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                period === p
                  ? "gradient-brand text-white border-transparent"
                  : "glass border-white/10 text-muted-foreground hover:text-foreground"
              }`}>
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Ventas Brutas", value: formatCurrency(totals.ventas), icon: TrendingUp, color: "oklch(0.72 0.19 52)", trend: 12 },
          { label: "Utilidad Bruta", value: formatCurrency(totals.utilidad), icon: DollarSign, color: "oklch(0.70 0.18 140)", sub: `Margen: ${totals.margen}%` },
          { label: "Utilidad Neta", value: formatCurrency(totals.utilidadNeta), icon: DollarSign, color: "oklch(0.68 0.17 200)", sub: `Gastos: ${formatCurrency(totals.gastos)}` },
          { label: "Total Pedidos", value: String(totals.pedidos), icon: ShoppingCart, color: "oklch(0.75 0.16 300)", sub: `Ticket prom: ${formatCurrency(totals.pedidos > 0 ? Math.round(totals.ventas / totals.pedidos) : 0)}` },
        ].map(kpi => (
          <div key={kpi.label} className="stat-card rounded-2xl p-5 card-hover">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
              style={{ background: `${kpi.color.replace(")", " / 0.15)")}` }}>
              <kpi.icon className="w-4 h-4" style={{ color: kpi.color }} />
            </div>
            <div className="text-2xl font-black text-foreground mb-1">{kpi.value}</div>
            <div className="text-xs text-muted-foreground">{kpi.label}</div>
            {kpi.sub && <div className="text-xs text-primary mt-1">{kpi.sub}</div>}
          </div>
        ))}
      </div>

      {/* Main charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales & profit area chart */}
        <div className="lg:col-span-2 stat-card rounded-2xl p-5">
          <h3 className="text-sm font-bold text-foreground mb-4">Ventas vs Costos — {PERIOD_LABELS[period]}</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="aVentas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="oklch(0.72 0.19 52)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="oklch(0.72 0.19 52)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="aCosto" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="oklch(0.65 0.22 27)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="oklch(0.65 0.22 27)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 5%)" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "oklch(0.60 0.01 240)" }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11, fill: "oklch(0.60 0.01 240)" }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="ventas" name="Ventas" stroke="oklch(0.72 0.19 52)" fill="url(#aVentas)" strokeWidth={2} />
              <Area type="monotone" dataKey="costo" name="Costo Producción" stroke="oklch(0.65 0.22 27)" fill="url(#aCosto)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Order type pie */}
        <div className="stat-card rounded-2xl p-5">
          <h3 className="text-sm font-bold text-foreground mb-4">Pedidos por Tipo</h3>
          {orderTypeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={orderTypeData} cx="50%" cy="45%" outerRadius={75} innerRadius={40} dataKey="value"
                  paddingAngle={3}>
                  {orderTypeData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Legend formatter={(v) => <span style={{ color: "oklch(0.80 0.01 240)", fontSize: 12 }}>{v}</span>} />
                <Tooltip formatter={(v: number) => [`${v} pedidos`]} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">Sin datos</div>
          )}
        </div>
      </div>

      {/* Orders volume bar chart */}
      <div className="stat-card rounded-2xl p-5">
        <h3 className="text-sm font-bold text-foreground mb-4">Volumen de Pedidos — {PERIOD_LABELS[period]}</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData} barSize={period === "30d" ? 8 : 24}>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 5%)" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "oklch(0.60 0.01 240)" }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 11, fill: "oklch(0.60 0.01 240)" }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="pedidos" name="Pedidos" fill="oklch(0.72 0.19 52)" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Product performance + margin */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top products by revenue */}
        <div className="stat-card rounded-2xl p-5">
          <h3 className="text-sm font-bold text-foreground mb-4">Rendimiento por Producto</h3>
          {productPerformance.length > 0 ? (
            <div className="space-y-3">
              {productPerformance.map((p, i) => (
                <div key={p.name} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{ background: COLORS[Math.min(i, COLORS.length - 1)] }}>
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-foreground font-medium">{p.name}</span>
                      <span className="text-primary font-semibold">{formatCurrency(p.revenue)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full rounded-full"
                        style={{
                          width: `${(p.revenue / (productPerformance[0]?.revenue || 1)) * 100}%`,
                          background: COLORS[Math.min(i, COLORS.length - 1)],
                          transition: "width 1s ease"
                        }} />
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground w-10 text-right">{p.qty} uds</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-muted-foreground text-sm text-center py-8">Sin datos de ventas</div>
          )}
        </div>

        {/* Margin analysis */}
        <div className="stat-card rounded-2xl p-5">
          <h3 className="text-sm font-bold text-foreground mb-4">Margen de Utilidad por Producto</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={marginData} layout="vertical" barSize={10}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 5%)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: "oklch(0.60 0.01 240)" }} tickFormatter={v => `${v}%`} domain={[0, 100]} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "oklch(0.60 0.01 240)" }} width={95} />
              <Tooltip formatter={(v: number) => `${v}%`}
                contentStyle={{ background: "oklch(0.14 0.008 240)", border: "1px solid oklch(1 0 0 / 8%)", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="margen" name="Margen %" radius={[0, 4, 4, 0]}>
                {marginData.map((entry, i) => (
                  <Cell key={i} fill={
                    entry.margen > 60 ? "oklch(0.70 0.18 140)" :
                    entry.margen > 40 ? "oklch(0.72 0.19 52)" :
                    "oklch(0.65 0.22 27)"
                  } />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Financial summary */}
      <div className="stat-card rounded-2xl p-5">
        <h3 className="text-sm font-bold text-foreground mb-4">Resumen Financiero</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Ventas brutas", value: formatCurrency(totals.ventas), color: "text-primary" },
            { label: "Costo de producción", value: `-${formatCurrency(totals.costo)}`, color: "text-red-400" },
            { label: "Gastos operativos", value: `-${formatCurrency(totals.gastos)}`, color: "text-red-400" },
            { label: "Costo desperdicios", value: `-${formatCurrency(wasteCostTotal)}`, color: "text-orange-400" },
          ].map(item => (
            <div key={item.label} className="p-3 rounded-xl glass border border-white/5">
              <div className="text-xs text-muted-foreground mb-1">{item.label}</div>
              <div className={`text-lg font-black ${item.color}`}>{item.value}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 p-4 rounded-xl border border-primary/20"
          style={{ background: "oklch(0.72 0.19 52 / 0.08)" }}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">Utilidad Neta Estimada</span>
            <span className={`text-2xl font-black ${totals.utilidadNeta >= 0 ? "text-primary" : "text-red-400"}`}>
              {formatCurrency(totals.utilidadNeta - wasteCostTotal)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
