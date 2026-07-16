"use client";

import { useState, useMemo, useEffect } from "react";
import {
  obtenerIngredientes,
  crearIngrediente,
  actualizarIngrediente,
  eliminarIngrediente,
} from "@/lib/ingredientes";
import {
  useApp,
  Ingredient,
  IngredientBatch,
  getTotalStock,
  formatCurrency,
} from "@/lib/store";
import {
  Plus,
  Package,
  AlertTriangle,
  Clock,
  Trash2,
  Edit,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

function AddIngredientModal({
  ingredient,
  onClose,
}: {
  ingredient?: Ingredient;
  onClose: () => void;
}) {
  const { dispatch } = useApp();
  const [name, setName] = useState(ingredient?.name || "");

  const [unit, setUnit] = useState<Ingredient["unit"]>(
    ingredient?.unit || "unidad",
  );

  const [minStock, setMinStock] = useState(String(ingredient?.minStock || 10));

  const [expirationDays, setExpirationDays] = useState(
    String(ingredient?.expirationAlertDays || 3),
  );

  const handleSave = async () => {
    if (!name) return;

    const ingrediente = {
      name,
      unit,
      minStock: Number(minStock),
      expirationAlertDays: Number(expirationDays),
      batches: ingredient?.batches || [],
    };

    try {
      if (ingredient) {
        await actualizarIngrediente(ingredient.id, ingrediente);
      } else {
        await crearIngrediente(ingrediente);
      }

      const ingredientes = await obtenerIngredientes();

      dispatch({
        type: "CARGAR_INGREDIENTES",

        payload: ingredientes,
      });

      onClose();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-md rounded-2xl border border-white/10 p-6 shadow-2xl"
        style={{ background: "oklch(0.13 0.008 240)" }}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-foreground">
            Nuevo Ingrediente
          </h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">
              Nombre
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Pan de hamburguesa"
              className="w-full px-4 py-3 rounded-xl glass border border-white/10 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">
              Unidad de medida
            </label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value as any)}
              className="w-full px-4 py-3 rounded-xl glass border border-white/10 text-foreground text-sm bg-transparent focus:outline-none focus:border-primary/50"
            >
              <option value="unidad">Unidad</option>
              <option value="gramo">Gramo</option>
              <option value="kilogramo">Kilogramo</option>
              <option value="litro">Litro</option>
              <option value="mililitro">Mililitro</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">
                Stock mínimo
              </label>
              <input
                type="number"
                value={minStock}
                onChange={(e) => setMinStock(e.target.value)}
                className="w-full px-4 py-3 rounded-xl glass border border-white/10 text-foreground text-sm focus:outline-none focus:border-primary/50"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">
                Alerta vencimiento (días)
              </label>
              <input
                type="number"
                value={expirationDays}
                onChange={(e) => setExpirationDays(e.target.value)}
                className="w-full px-4 py-3 rounded-xl glass border border-white/10 text-foreground text-sm focus:outline-none focus:border-primary/50"
              />
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl glass border border-white/10 text-sm text-muted-foreground"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!name}
            className="flex-1 py-2.5 rounded-xl gradient-brand text-white text-sm font-bold disabled:opacity-40"
          >
            Guardar Ingrediente
          </button>
        </div>
      </div>
    </div>
  );
}

function IngredientRow({ ingredient }: { ingredient: Ingredient }) {
  const { dispatch, state } = useApp();
  const [expanded, setExpanded] = useState(false);
  const totalStock = getTotalStock(ingredient);
  const isLowStock = totalStock < ingredient.minStock;

  const nearExpiry = ingredient.batches.some((b) => {
    if (!b.expirationDate) return false;
    const days =
      (new Date(b.expirationDate).getTime() - Date.now()) /
      (1000 * 60 * 60 * 24);
    return days <= state.settings.expirationAlertDays && days >= 0;
  });

  const expired = ingredient.batches.some((b) => {
    if (!b.expirationDate) return false;
    return new Date(b.expirationDate) < new Date();
  });

  return (
    <div
      className={`stat-card rounded-xl overflow-hidden border transition-all ${
        expired
          ? "border-red-500/40"
          : nearExpiry
            ? "border-orange-500/40"
            : isLowStock
              ? "border-yellow-500/40"
              : "border-white/8"
      }`}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-2 h-2 rounded-full ${
              expired
                ? "bg-red-400"
                : nearExpiry
                  ? "bg-orange-400"
                  : isLowStock
                    ? "bg-yellow-400"
                    : "bg-emerald-400"
            }`}
          />
          <div>
            <div className="text-sm font-semibold text-foreground">
              {ingredient.name}
            </div>
            <div className="text-xs text-muted-foreground">
              {ingredient.unit}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div
              className={`text-base font-bold ${isLowStock ? "text-yellow-400" : "text-foreground"}`}
            >
              {totalStock.toLocaleString("es-CO")}
            </div>
            <div className="text-xs text-muted-foreground">
              Min: {ingredient.minStock}
            </div>
          </div>
          <div className="flex gap-1">
            {expired && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                Vencido
              </span>
            )}
            {!expired && nearExpiry && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                Próx. a vencer
              </span>
            )}
            {isLowStock && !expired && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                Stock bajo
              </span>
            )}
          </div>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-white/5 pt-3">
          <div className="text-xs text-muted-foreground uppercase tracking-widest mb-3">
            Lotes FIFO/PEPS (más antiguo primero)
          </div>
          <div className="space-y-2">
            {ingredient.batches
              .sort(
                (a, b) =>
                  new Date(a.purchaseDate).getTime() -
                  new Date(b.purchaseDate).getTime(),
              )
              .map((batch, i) => {
                const daysToExpiry = batch.expirationDate
                  ? Math.ceil(
                      (new Date(batch.expirationDate).getTime() - Date.now()) /
                        (1000 * 60 * 60 * 24),
                    )
                  : null;
                return (
                  <div
                    key={batch.id}
                    className={`rounded-lg p-3 border text-xs ${
                      i === 0
                        ? "border-primary/30 bg-primary/5"
                        : "border-white/5 bg-white/2"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-foreground">
                        Lote #{i + 1}{" "}
                        {i === 0 && (
                          <span className="text-primary">(Próximo a usar)</span>
                        )}
                      </span>
                      <span className="text-muted-foreground">
                        {batch.purchaseOrderId}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                      <span>
                        Compra:{" "}
                        {new Date(batch.purchaseDate).toLocaleDateString(
                          "es-CO",
                        )}
                      </span>
                      <span>
                        Costo/unidad: {formatCurrency(batch.unitCost)}
                      </span>
                      <span>
                        Restante:{" "}
                        {batch.remainingQuantity.toLocaleString("es-CO")}
                      </span>
                      {batch.expirationDate && (
                        <span
                          className={
                            daysToExpiry !== null && daysToExpiry <= 3
                              ? "text-orange-400 font-semibold"
                              : ""
                          }
                        >
                          Vence:{" "}
                          {new Date(batch.expirationDate).toLocaleDateString(
                            "es-CO",
                          )}
                          {daysToExpiry !== null &&
                            ` (${daysToExpiry > 0 ? `${daysToExpiry} días` : "VENCIDO"})`}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={async () => {
                if (!confirm("¿Desea eliminar este ingrediente?")) {
                  return;
                }

                try {
                  await eliminarIngrediente(ingredient.id);

                  const ingredientes = await obtenerIngredientes();

                  dispatch({
                    type: "CARGAR_INGREDIENTES",

                    payload: ingredientes,
                  });
                } catch (error) {
                  console.error(error);
                }
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs hover:bg-red-500/20 transition-all"
            >
              <Trash2 className="w-3 h-3" />
              Eliminar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function InventoryPage() {
  const { state, dispatch } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function cargarIngredientes() {
      try {
        const ingredientes = await obtenerIngredientes();

        dispatch({
          type: "CARGAR_INGREDIENTES",
          payload: ingredientes,
        });
      } catch (error) {
        console.error(error);
      }
    }

    cargarIngredientes();
  }, [dispatch]);

  const filtered = useMemo(
    () =>
      state.ingredients.filter((i) =>
        i.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [state.ingredients, search],
  );

  const stats = useMemo(() => {
    const lowStock = state.ingredients.filter(
      (i) => getTotalStock(i) < i.minStock,
    ).length;
    const nearExpiry = state.ingredients.filter((i) =>
      i.batches.some((b) => {
        if (!b.expirationDate) return false;
        const days =
          (new Date(b.expirationDate).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24);
        return days <= state.settings.expirationAlertDays && days >= 0;
      }),
    ).length;
    const totalValue = state.ingredients.reduce((sum, i) => {
      return (
        sum +
        i.batches.reduce((s, b) => s + b.remainingQuantity * b.unitCost, 0)
      );
    }, 0);
    return { lowStock, nearExpiry, totalValue };
  }, [state.ingredients, state.settings.expirationAlertDays]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            Control de Inventario
          </h2>
          <p className="text-sm text-muted-foreground">
            Sistema FIFO/PEPS • {state.ingredients.length} ingredientes
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-brand text-white text-sm font-semibold hover:opacity-90"
        >
          <Plus className="w-4 h-4" />
          Nuevo Ingrediente
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="stat-card rounded-xl p-4">
          <Package className="w-5 h-5 text-primary mb-2" />
          <div className="text-xl font-black text-foreground">
            {state.ingredients.length}
          </div>
          <div className="text-xs text-muted-foreground">
            Total ingredientes
          </div>
        </div>
        <div
          className={`rounded-xl p-4 border ${stats.lowStock > 0 ? "bg-yellow-500/10 border-yellow-500/30" : "stat-card"}`}
        >
          <AlertTriangle className="w-5 h-5 text-yellow-400 mb-2" />
          <div className="text-xl font-black text-foreground">
            {stats.lowStock}
          </div>
          <div className="text-xs text-muted-foreground">Con stock bajo</div>
        </div>
        <div
          className={`rounded-xl p-4 border col-span-2 lg:col-span-1 ${stats.nearExpiry > 0 ? "bg-orange-500/10 border-orange-500/30" : "stat-card"}`}
        >
          <Clock className="w-5 h-5 text-orange-400 mb-2" />
          <div className="text-xl font-black text-foreground">
            {stats.nearExpiry}
          </div>
          <div className="text-xs text-muted-foreground">Próximos a vencer</div>
        </div>
      </div>

      {/* Inventory value */}
      <div className="glass rounded-xl p-4 border border-primary/20">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">
              Valor del inventario (FIFO)
            </div>
            <div className="text-2xl font-black gradient-text">
              {formatCurrency(stats.totalValue)}
            </div>
          </div>
          <div className="text-xs text-muted-foreground text-right">
            Basado en costos
            <br />
            de lotes activos
          </div>
        </div>
      </div>

      {/* Search */}
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar ingrediente..."
        className="w-full px-4 py-2.5 rounded-xl glass border border-white/10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
      />

      {/* Ingredients list */}
      <div className="space-y-3">
        {filtered.map((ingredient) => (
          <IngredientRow key={ingredient.id} ingredient={ingredient} />
        ))}
      </div>

      {showAdd && <AddIngredientModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}
