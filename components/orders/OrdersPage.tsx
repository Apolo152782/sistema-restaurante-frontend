"use client";

import { useState, useEffect, useMemo } from "react";
import {
  useApp,
  Order,
  OrderStatus,
  OrderType,
  OrderItem,
  OrderItemExtra,
  formatCurrency,
  getOrderElapsedMinutes,
  getOrderTimerStatus,
  isOrderDelayed,
} from "@/lib/store";
import {
  Plus,
  Trash2,
  Clock,
  CheckCircle,
  Truck,
  DollarSign,
  X,
  ChevronDown,
  Timer,
  AlertTriangle,
  ShoppingCart,
  MapPin,
  Users,
  Minus,
  Search,
  Filter,
} from "lucide-react";
import { CreateOrderModal } from "./CreateOrderModal";
import { OrderDetailModal } from "./OrderDetailModal";
import {
  obtenerPedidos,
  eliminarPedido,
  actualizarEstadoPedido,
  agregarTiempo,
} from "@/lib/pedidos";

function OrderCard({
  order,
  onView,
  onDelete,
}: {
  order: Order;
  onView: (o: Order) => void;
  onDelete: () => Promise<void>;
}) {
  const [elapsed, setElapsed] = useState(getOrderElapsedMinutes(order));
  const totalMinutes = order.estimatedMinutes + order.additionalMinutes;
  const timerStatus = getOrderTimerStatus(order);
  const delayed = isOrderDelayed(order);

  const [showCustomTime, setShowCustomTime] = useState(false);
  const [customMinutes, setCustomMinutes] = useState("");

  const handleUpdateStatus = async (status: string) => {
    try {
      await actualizarEstadoPedido(order.id, status);

      await onDelete();
    } catch (error) {
      console.error(error);

      alert("No fue posible actualizar el estado del pedido.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Deseas eliminar este pedido?")) return;

    try {
      await eliminarPedido(id);

      await onDelete();
    } catch (error) {
      console.error(error);

      alert("No fue posible eliminar el pedido.");
    }
  };

  useEffect(() => {
    const estado = order.status.toLowerCase();

    if (estado !== "pendiente" && estado !== "listo") return;
    const interval = setInterval(
      () => setElapsed(getOrderElapsedMinutes(order)),
      10000,
    );
    return () => clearInterval(interval);
  }, [order]);

  const statusConfig = {
    pendiente: {
      label: "Pendiente",
      color: "text-yellow-400",
      bg: "bg-yellow-400/10",
      border: "border-yellow-400/30",
    },
    listo: {
      label: "Listo",
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
      border: "border-emerald-400/30",
    },
    entregado: {
      label: "Entregado",
      color: "text-blue-400",
      bg: "bg-blue-400/10",
      border: "border-blue-400/30",
    },
    pagado: {
      label: "Pagado",
      color: "text-primary",
      bg: "bg-primary/10",
      border: "border-primary/30",
    },
  };
  const typeConfig = {
    mesa: { label: "Mesa", icon: Users, color: "text-purple-400" },
    "para-llevar": {
      label: "Para llevar",
      icon: ShoppingCart,
      color: "text-blue-400",
    },
    domicilio: { label: "Domicilio", icon: MapPin, color: "text-emerald-400" },
  };
  const sc =
    statusConfig[order.status.toLowerCase() as keyof typeof statusConfig];
  const tc = typeConfig[order.type];

  const handleAddTime = async (minutes: number) => {
    try {
      await agregarTiempo(order.id, minutes);

      await onDelete();
    } catch (error) {
      console.error(error);

      alert("No fue posible agregar tiempo.");
    }
  };

  return (
    <div
      className={`stat-card rounded-2xl p-5 card-hover border transition-all ${
        delayed &&
        (order.status.toLowerCase() === "pendiente" ||
          order.status.toLowerCase() === "listo")
          ? "border-red-500/40 bg-red-500/5"
          : "border-white/8"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-foreground">
              #{order.orderNumber}
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${sc.bg} ${sc.color} border ${sc.border}`}
            >
              {sc.label}
            </span>
            {delayed &&
              (order.status.toLowerCase() === "pendiente" ||
                order.status.toLowerCase() === "listo") && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Retrasado
                </span>
              )}
          </div>
          <div className={`flex items-center gap-1 mt-1 text-xs ${tc.color}`}>
            <tc.icon className="w-3 h-3" />
            {tc.label}
            {order.type === "mesa" && ` · Mesa ${order.tableNumber}`}
            {order.type !== "mesa" &&
              order.customerName &&
              ` · ${order.customerName}`}
          </div>
        </div>
        <div className="flex items-start gap-2">
          {(order.status.toLowerCase() === "pendiente" ||
            order.status.toLowerCase() === "listo") && (
            <div
              className={`text-right ${
                timerStatus === "rojo"
                  ? "timer-red"
                  : timerStatus === "amarillo"
                    ? "timer-yellow"
                    : "timer-green"
              }`}
            >
              <div className="text-lg font-black flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {elapsed}m
              </div>

              <div className="text-xs text-muted-foreground">
                / {totalMinutes}m
              </div>
            </div>
          )}

          <button
            onClick={() => handleDelete(order.id)}
            className="w-7 h-7 rounded-lg glass border border-red-500/20 flex items-center justify-center text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Items */}
      <div className="space-y-1 mb-3">
        {order.items.map((item) => (
          <div
            key={`${item.productId}-${item.quantity}`}
            className="text-xs text-muted-foreground flex justify-between"
          >
            <span>
              {item.quantity}x {item.productName}
            </span>
            <span>{formatCurrency(item.subtotal)}</span>
          </div>
        ))}
      </div>

      {/* Timer progress */}
      {(order.status.toLowerCase() === "pendiente" ||
        order.status.toLowerCase() === "listo") && (
        <div className="mb-3">
          <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(100, (elapsed / totalMinutes) * 100)}%`,
                background:
                  timerStatus === "rojo"
                    ? "oklch(0.65 0.22 27)"
                    : timerStatus === "amarillo"
                      ? "oklch(0.85 0.18 90)"
                      : "oklch(0.70 0.18 140)",
              }}
            />
          </div>
        </div>
      )}

      {/* Total */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-muted-foreground">Total</span>
        <span className="text-base font-black text-primary">
          {formatCurrency(order.total)}
        </span>
      </div>

      {/* Add time buttons (pending/ready only) */}
      {(order.status.toLowerCase() === "pendiente" ||
        order.status.toLowerCase() === "listo") && (
        <div className="flex gap-2 mb-3">
          {[5, 10].map((m) => (
            <button
              key={m}
              onClick={() => handleAddTime(m)}
              className="flex-1 py-1.5 rounded-lg glass border border-white/10 text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
            >
              +{m}m
            </button>
          ))}

          <button
            onClick={() => setShowCustomTime(!showCustomTime)}
            className="flex-1 py-1.5 rounded-lg glass border border-primary/20 text-xs text-primary hover:bg-primary/10 transition-all"
          >
            +Personalizado
          </button>
        </div>
      )}
      {showCustomTime && (
        <div className="flex gap-2 mb-3">
          <input
            type="number"
            value={customMinutes}
            onChange={(e) => setCustomMinutes(e.target.value)}
            placeholder="Minutos"
            className="flex-1 px-3 py-2 rounded-lg glass border border-white/10 text-sm text-foreground focus:outline-none focus:border-primary/50"
          />

          <button
            onClick={async () => {
              if (!customMinutes || Number(customMinutes) <= 0) return;

              await handleAddTime(Number(customMinutes));

              setCustomMinutes("");
              setShowCustomTime(false);
            }}
            className="px-4 py-2 rounded-lg gradient-brand text-white text-sm font-bold"
          >
            Agregar
          </button>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => onView(order)}
          className="flex-1 py-2 rounded-xl glass border border-white/10 text-xs font-semibold text-foreground hover:border-primary/30 transition-all"
        >
          Detalles
        </button>

        {order.status.toLowerCase() === "entregado" && (
          <button
            onClick={() => onView(order)}
            className="flex-1 py-2 rounded-xl bg-primary/20 border border-primary/30 text-xs font-semibold text-primary hover:bg-primary/30 transition-all"
          >
            Pagar
          </button>
        )}
      </div>
    </div>
  );
}

export function OrdersPage() {
  const { state, dispatch } = useApp();
  const [pedidos, setPedidos] = useState<any[]>([]);
  const isOwner = state.user?.role === "dueno";
  const [showCreate, setShowCreate] = useState(false);
  const [viewOrder, setViewOrder] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<OrderType | "all">("all");
  const [search, setSearch] = useState("");

  const cargarPedidos = async () => {
    try {
      const datos = await obtenerPedidos();

      setPedidos(datos);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    cargarPedidos();
  }, []);

  const filtered = useMemo(() => {
    return pedidos.filter((o: any) => {
      if (statusFilter !== "all" && o.status.toLowerCase() !== statusFilter)
        return false;

      if (typeFilter !== "all" && o.type !== typeFilter) return false;

      if (
        search &&
        !o.orderNumber.toLowerCase().includes(search.toLowerCase()) &&
        !(o.customerName ?? "").toLowerCase().includes(search.toLowerCase())
      )
        return false;

      return true;
    });
  }, [pedidos, statusFilter, typeFilter, search]);

  const counts = useMemo(
    () => ({
      pendiente: pedidos.filter((o: any) => o.status === "PENDIENTE").length,

      listo: pedidos.filter((o: any) => o.status === "LISTO").length,

      entregado: pedidos.filter((o: any) => o.status === "ENTREGADO").length,

      pagado: pedidos.filter((o: any) => o.status === "PAGADO").length,
    }),
    [pedidos],
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            Gestión de Pedidos
          </h2>
          <p className="text-sm text-muted-foreground">
            {pedidos.length} pedidos en total
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-brand text-white text-sm font-semibold hover:opacity-90 transition-all"
        >
          <Plus className="w-4 h-4" />
          Nuevo Pedido
        </button>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            key: "pendiente",
            label: "Pendientes",
            count: counts.pendiente,
            color: "text-yellow-400",
            bg: "bg-yellow-400/10",
          },
          {
            key: "listo",
            label: "Listos",
            count: counts.listo,
            color: "text-emerald-400",
            bg: "bg-emerald-400/10",
          },
          {
            key: "entregado",
            label: "Entregados",
            count: counts.entregado,
            color: "text-blue-400",
            bg: "bg-blue-400/10",
          },
          {
            key: "pagado",
            label: "Pagados",
            count: counts.pagado,
            color: "text-primary",
            bg: "bg-primary/10",
          },
        ].map((s) => (
          <button
            key={s.key}
            onClick={() =>
              setStatusFilter(
                s.key === statusFilter ? "all" : (s.key as OrderStatus),
              )
            }
            className={`rounded-xl p-4 text-left transition-all border ${
              statusFilter === s.key
                ? `${s.bg} border-current ${s.color}`
                : "stat-card border-white/8"
            }`}
          >
            <div
              className={`text-2xl font-black ${statusFilter === s.key ? s.color : "text-foreground"}`}
            >
              {s.count}
            </div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-40">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar pedido..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl glass border border-white/10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as any)}
          className="px-4 py-2.5 rounded-xl glass border border-white/10 text-sm text-foreground bg-transparent focus:outline-none focus:border-primary/50"
        >
          <option value="all">Todos los tipos</option>
          <option value="mesa">Mesa</option>
          <option value="para-llevar">Para llevar</option>
          <option value="domicilio">Domicilio</option>
        </select>
      </div>
      {/* Orders grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>No se encontraron pedidos</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered
            .sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime(),
            )
            .map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onView={setViewOrder}
                onDelete={cargarPedidos}
              />
            ))}
        </div>
      )}

      {showCreate && (
        <CreateOrderModal
          onClose={() => setShowCreate(false)}
          onCreated={cargarPedidos}
        />
      )}
      {viewOrder && (
        <OrderDetailModal
          order={viewOrder}
          onClose={() => setViewOrder(null)}
          onUpdated={cargarPedidos}
        />
      )}
    </div>
  );
}
