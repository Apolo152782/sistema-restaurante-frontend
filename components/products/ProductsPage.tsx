"use client";

import { useState, useMemo, useEffect } from "react";
import {
  useApp,
  Product,
  RecipeIngredient,
  ProductExtra,
  formatCurrency,
  calculateProductCost,
  calculateAvailableQuantity,
} from "@/lib/store";
import {
  Plus,
  X,
  Trash2,
  ChevronDown,
  ChevronUp,
  Edit,
  Package,
  TrendingUp,
  ToggleLeft,
  ToggleRight,
  AlertTriangle,
} from "lucide-react";

import {
  obtenerProductos,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
} from "@/lib/productos";
const CATEGORIES = [
  "Hamburguesas",
  "Perros Calientes",
  "Acompañamientos",
  "Bebidas",
  "Postres",
  "Combos",
];

function ProductModal({
  product,
  onClose,
}: {
  product?: Product;
  onClose: () => void;
}) {
  const { state, dispatch } = useApp();

  const [name, setName] = useState(product?.name || "");
  const [price, setPrice] = useState(String(product?.price || ""));
  const [category, setCategory] = useState(product?.category || CATEGORIES[0]);
  const [recipe, setRecipe] = useState<RecipeIngredient[]>(
    product?.recipe || [],
  );
  const [extras, setExtras] = useState<ProductExtra[]>(product?.extras || []);
  const [active, setActive] = useState(product?.active ?? true);

  const [newExtraName, setNewExtraName] = useState("");
  const [newExtraPrice, setNewExtraPrice] = useState("");

  const addRecipeItem = () => {
    const unusedIngredient = state.ingredients.find(
      (i) => !recipe.some((r) => r.ingredientId === i.id),
    );
    if (unusedIngredient) {
      setRecipe([
        ...recipe,
        { ingredientId: unusedIngredient.id, quantity: 1 },
      ]);
    }
  };

  const addExtra = () => {
    if (!newExtraName) return;
    setExtras([
      ...extras,
      {
        id: `e-${Date.now()}`,
        name: newExtraName,
        price: Number(newExtraPrice) || 0,
      },
    ]);
    setNewExtraName("");
    setNewExtraPrice("");
  };
  const handleSave = async () => {
    if (!name || !price) return;

    const p = {
      name,
      price: Number(price),
      category,
      active,
    };

    try {
      if (product) {
        await actualizarProducto(product.id, p);
      } else {
        await crearProducto(p);
      }

      const productos = await obtenerProductos();

      dispatch({
        type: "CARGAR_PRODUCTOS",
        payload: productos,
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
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 shadow-2xl"
        style={{ background: "oklch(0.13 0.008 240)" }}
      >
        <div
          className="flex items-center justify-between px-6 py-5 border-b border-white/5 sticky top-0 z-10"
          style={{ background: "oklch(0.13 0.008 240)" }}
        >
          <h3 className="text-lg font-bold text-foreground">
            {product ? "Editar Producto" : "Nuevo Producto"}
          </h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs text-muted-foreground mb-1.5 block">
                Nombre del producto
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Hamburguesa Clásica"
                className="w-full px-4 py-3 rounded-xl glass border border-white/10 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">
                Precio de venta
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="15000"
                className="w-full px-4 py-3 rounded-xl glass border border-white/10 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">
                Categoría
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 rounded-xl glass border border-white/10 text-foreground text-sm bg-transparent focus:outline-none focus:border-primary/50"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl glass border border-white/10">
            <div>
              <div className="text-sm font-semibold text-foreground">
                Producto activo
              </div>
              <div className="text-xs text-muted-foreground">
                Visible en el sistema de pedidos
              </div>
            </div>
            <button
              onClick={() => setActive(!active)}
              className={`transition-colors ${active ? "text-primary" : "text-muted-foreground"}`}
            >
              {active ? (
                <ToggleRight className="w-8 h-8" />
              ) : (
                <ToggleLeft className="w-8 h-8" />
              )}
            </button>
          </div>

          {/* Recipe */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs text-muted-foreground uppercase tracking-widest">
                Receta (ingredientes)
              </label>
              <button
                onClick={addRecipeItem}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg gradient-brand text-white text-xs font-semibold"
              >
                <Plus className="w-3 h-3" />
                Agregar
              </button>
            </div>
            <div className="space-y-2">
              {recipe.map((ri, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-3 rounded-xl glass border border-white/10"
                >
                  <select
                    value={ri.ingredientId}
                    onChange={(e) =>
                      setRecipe(
                        recipe.map((r, i) =>
                          i === idx
                            ? { ...r, ingredientId: e.target.value }
                            : r,
                        ),
                      )
                    }
                    className="flex-1 bg-transparent text-foreground text-sm focus:outline-none"
                  >
                    {state.ingredients.map((ing) => (
                      <option key={ing.id} value={ing.id}>
                        {ing.name} ({ing.unit})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={ri.quantity}
                    onChange={(e) =>
                      setRecipe(
                        recipe.map((r, i) =>
                          i === idx
                            ? { ...r, quantity: Number(e.target.value) }
                            : r,
                        ),
                      )
                    }
                    className="w-20 text-right bg-transparent text-foreground text-sm focus:outline-none border-l border-white/10 pl-3"
                    min={0.01}
                    step={0.01}
                  />
                  <button
                    onClick={() =>
                      setRecipe(recipe.filter((_, i) => i !== idx))
                    }
                    className="text-muted-foreground hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {recipe.length === 0 && (
                <p className="text-xs text-muted-foreground py-2">
                  Sin ingredientes (producto sin receta)
                </p>
              )}
            </div>
          </div>

          {/* Extras */}
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-widest mb-3 block">
              Extras / Modificadores
            </label>
            <div className="space-y-2 mb-3">
              {extras.map((extra, idx) => (
                <div
                  key={extra.id}
                  className="flex items-center gap-3 p-3 rounded-xl glass border border-white/10 text-sm"
                >
                  <span className="flex-1 text-foreground">{extra.name}</span>
                  <span className="text-primary font-semibold">
                    {formatCurrency(extra.price)}
                  </span>
                  <button
                    onClick={() =>
                      setExtras(extras.filter((_, i) => i !== idx))
                    }
                    className="text-muted-foreground hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <input
                value={newExtraName}
                onChange={(e) => setNewExtraName(e.target.value)}
                placeholder="Nombre extra"
                className="flex-1 px-3 py-2 rounded-xl glass border border-white/10 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
              />
              <input
                type="number"
                value={newExtraPrice}
                onChange={(e) => setNewExtraPrice(e.target.value)}
                placeholder="Precio"
                className="w-28 px-3 py-2 rounded-xl glass border border-white/10 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
              />
              <button
                onClick={addExtra}
                className="px-4 py-2 rounded-xl gradient-brand text-white text-sm font-semibold"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Cost preview */}
          {recipe.length > 0 && (
            <div className="p-4 rounded-xl glass border border-primary/20">
              <div className="text-xs text-muted-foreground uppercase tracking-widest mb-3">
                Vista previa de costos
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground text-xs mb-1">
                    Costo producción
                  </div>
                  <div className="font-bold text-foreground">
                    {formatCurrency(
                      recipe.reduce((sum, ri) => {
                        const ing = state.ingredients.find(
                          (i) => i.id === ri.ingredientId,
                        );
                        if (!ing || !ing.batches.length) return sum;
                        const unitCost =
                          ing.batches
                            .filter((b) => b.remainingQuantity > 0)
                            .sort(
                              (a, b) =>
                                new Date(a.purchaseDate).getTime() -
                                new Date(b.purchaseDate).getTime(),
                            )[0]?.unitCost || 0;
                        return sum + unitCost * ri.quantity;
                      }, 0),
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs mb-1">
                    Precio venta
                  </div>
                  <div className="font-bold text-primary">
                    {formatCurrency(Number(price) || 0)}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs mb-1">
                    Margen
                  </div>
                  <div className="font-bold text-emerald-400">
                    {(() => {
                      const cost = recipe.reduce((sum, ri) => {
                        const ing = state.ingredients.find(
                          (i) => i.id === ri.ingredientId,
                        );
                        if (!ing || !ing.batches.length) return sum;
                        const unitCost =
                          ing.batches
                            .filter((b) => b.remainingQuantity > 0)
                            .sort(
                              (a, b) =>
                                new Date(a.purchaseDate).getTime() -
                                new Date(b.purchaseDate).getTime(),
                            )[0]?.unitCost || 0;
                        return sum + unitCost * ri.quantity;
                      }, 0);
                      const p = Number(price) || 0;
                      return p > 0
                        ? `${Math.round(((p - cost) / p) * 100)}%`
                        : "—";
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl glass border border-white/10 text-sm text-muted-foreground"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!name || !price}
            className="flex-1 py-3 rounded-xl gradient-brand text-white text-sm font-bold disabled:opacity-40"
          >
            {product ? "Guardar Cambios" : "Crear Producto"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ProductsPage() {
  const { state, dispatch } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | undefined>();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    async function cargarProductos() {
      try {
        const productos = await obtenerProductos();

        dispatch({
          type: "CARGAR_PRODUCTOS",
          payload: productos,
        });
      } catch (error) {
        console.error("Error cargando productos:", error);
      }
    }

    cargarProductos();
  }, [dispatch]);

  const categories = useMemo(() => {
    const cats = new Set(state.products.map((p) => p.category));
    return Array.from(cats);
  }, [state.products]);

  const filtered = useMemo(
    () =>
      state.products.filter((p) => {
        if (categoryFilter !== "all" && p.category !== categoryFilter)
          return false;
        if (search && !p.name.toLowerCase().includes(search.toLowerCase()))
          return false;
        return true;
      }),
    [state.products, categoryFilter, search],
  );

  const handleEdit = (p: Product) => {
    setEditProduct(p);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    const confirmar = confirm("¿Deseas eliminar este producto?");

    if (!confirmar) return;

    try {
      await eliminarProducto(id);

      const productos = await obtenerProductos();

      dispatch({
        type: "CARGAR_PRODUCTOS",
        payload: productos,
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            Catálogo de Productos
          </h2>
          <p className="text-sm text-muted-foreground">
            {state.products.length} productos registrados
          </p>
        </div>
        <button
          onClick={() => {
            setEditProduct(undefined);
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-brand text-white text-sm font-semibold hover:opacity-90"
        >
          <Plus className="w-4 h-4" />
          Nuevo Producto
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar producto..."
          className="flex-1 min-w-40 px-4 py-2.5 rounded-xl glass border border-white/10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
        />
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setCategoryFilter("all")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
              categoryFilter === "all"
                ? "gradient-brand text-white border-transparent"
                : "glass border-white/10 text-muted-foreground hover:text-foreground"
            }`}
          >
            Todos
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategoryFilter(c)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                categoryFilter === c
                  ? "gradient-brand text-white border-transparent"
                  : "glass border-white/10 text-muted-foreground hover:text-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Products grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((product) => {
          const cost = calculateProductCost(product, state.ingredients);
          const margin =
            product.price > 0
              ? Math.round(((product.price - cost) / product.price) * 100)
              : 0;
          const available = calculateAvailableQuantity(
            product,
            state.ingredients,
          );

          return (
            <div
              key={product.id}
              className={`stat-card rounded-2xl p-5 card-hover border transition-all ${
                !product.active ? "opacity-50 border-white/5" : "border-white/8"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-foreground truncate">
                    {product.name}
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {product.category}
                  </span>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  {!product.active && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-muted-foreground border border-white/10">
                      Inactivo
                    </span>
                  )}
                  <button
                    onClick={() => handleEdit(product)}
                    className="w-7 h-7 rounded-lg glass border border-white/10 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="w-7 h-7 rounded-lg glass border border-red-500/20 flex items-center justify-center text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Price & cost */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div
                  className="p-2 rounded-lg"
                  style={{ background: "oklch(0.18 0.01 240)" }}
                >
                  <div className="text-xs text-muted-foreground mb-0.5">
                    Precio
                  </div>
                  <div className="text-sm font-black text-primary">
                    {formatCurrency(product.price)}
                  </div>
                </div>
                <div
                  className="p-2 rounded-lg"
                  style={{ background: "oklch(0.18 0.01 240)" }}
                >
                  <div className="text-xs text-muted-foreground mb-0.5">
                    Costo
                  </div>
                  <div className="text-sm font-black text-foreground">
                    {formatCurrency(cost)}
                  </div>
                </div>
                <div
                  className="p-2 rounded-lg"
                  style={{ background: "oklch(0.18 0.01 240)" }}
                >
                  <div className="text-xs text-muted-foreground mb-0.5">
                    Margen
                  </div>
                  <div
                    className={`text-sm font-black ${margin > 50 ? "text-emerald-400" : margin > 30 ? "text-yellow-400" : "text-red-400"}`}
                  >
                    {margin}%
                  </div>
                </div>
              </div>

              {/* Stock availability */}
              <div
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs ${
                  available === 0
                    ? "bg-red-500/10 border border-red-500/20"
                    : available < 5
                      ? "bg-yellow-500/10 border border-yellow-500/20"
                      : "glass border border-white/5"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Package
                    className={`w-3.5 h-3.5 ${
                      available === 0
                        ? "text-red-400"
                        : available < 5
                          ? "text-yellow-400"
                          : "text-muted-foreground"
                    }`}
                  />
                  <span className="text-muted-foreground">Disponibles:</span>
                </div>
                <span
                  className={`font-bold ${
                    available === 0
                      ? "text-red-400"
                      : available < 5
                        ? "text-yellow-400"
                        : "text-foreground"
                  }`}
                >
                  {available === 0 ? "Sin stock" : `${available} uds`}
                </span>
              </div>

              {/* Extras count */}
              {product.extras.length > 0 && (
                <div className="mt-2 text-xs text-muted-foreground">
                  {product.extras.length} extras disponibles
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Package className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>No se encontraron productos</p>
        </div>
      )}

      {showModal && (
        <ProductModal
          product={editProduct}
          onClose={() => {
            setShowModal(false);
            setEditProduct(undefined);
          }}
        />
      )}
    </div>
  );
}
