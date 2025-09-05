"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { getBeers, getSubscriptionPlans } from "@/services/public";
import useFetchAndLoad from "@/hooks/useFetchAndLoad";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Search,
  Filter,
  SlidersHorizontal,
  Grid3X3,
  List,
  Star,
  Package,
  CreditCard,
  Beer,
  CheckCircle,
  ArrowRight,
  ShoppingCart,
} from "lucide-react";

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  type: string;
  category: "beer" | "subscription" | "other";
  image?: string;
  stock?: number;
  features?: string[];
  duration?: string;
  isPopular?: boolean;
  discount?: number;
}

interface Filters {
  search: string;
  category: string;
  priceMin: string;
  priceMax: string;
  sortBy: string;
  inStock: boolean;
}

function ProductsPageContentInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { loading, callEndpoint } = useFetchAndLoad();

  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filters, setFilters] = useState<Filters>({
    search: searchParams.get("search") || "",
    category: searchParams.get("category") || "all",
    priceMin: searchParams.get("priceMin") || "",
    priceMax: searchParams.get("priceMax") || "",
    sortBy: searchParams.get("sortBy") || "name",
    inStock: searchParams.get("inStock") === "true",
  });

  // Load products
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const [beersResponse, subscriptionsResponse] = await Promise.all([
          callEndpoint(getBeers()),
          callEndpoint(getSubscriptionPlans()),
        ]);

        const allProducts: Product[] = [];
        console.log(beersResponse, subscriptionsResponse);
        // Add beers
        if (beersResponse?.data?.beers) {
          const beers = beersResponse.data.beers.map((beer: any) => ({
            ...beer,
            category: "beer" as const,
          }));
          allProducts.push(...beers);
        }

        // Add subscriptions
        if (subscriptionsResponse?.data?.subscriptions) {
          const subscriptions = subscriptionsResponse.data.subscriptions.map(
            (sub: any) => ({
              ...sub,
              category: "subscription" as const,
              type: "Plan de Suscripción",
            })
          );
          allProducts.push(...subscriptions);
        }

        setProducts(allProducts);
      } catch (error) {
        console.error("Error loading products:", error);
      }
    };

    loadProducts();
  }, [callEndpoint]);

  // Apply filters
  useEffect(() => {
    let filtered = [...products];

    // Search filter
    if (filters.search) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(filters.search.toLowerCase()) ||
          product.description
            .toLowerCase()
            .includes(filters.search.toLowerCase()) ||
          product.type.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    // Category filter
    if (filters.category && filters.category !== "all") {
      filtered = filtered.filter(
        (product) => product.category === filters.category
      );
    }

    // Price range filter
    if (filters.priceMin) {
      filtered = filtered.filter(
        (product) => product.price >= parseInt(filters.priceMin)
      );
    }
    if (filters.priceMax) {
      filtered = filtered.filter(
        (product) => product.price <= parseInt(filters.priceMax)
      );
    }

    // In stock filter
    if (filters.inStock) {
      filtered = filtered.filter(
        (product) =>
          product.category === "subscription" ||
          (product.stock && product.stock > 0)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case "price-low":
          return a.price - b.price;
        case "price-high":
          return b.price - a.price;
        case "popular":
          return (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0);
        case "name":
        default:
          return a.name.localeCompare(b.name);
      }
    });

    setFilteredProducts(filtered);
  }, [products, filters]);

  // Update URL params
  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== "all" && value !== false) {
        params.set(key, value.toString());
      }
    });

    const newUrl = params.toString() ? `?${params.toString()}` : "";
    router.replace(`/productos${newUrl}`, { scroll: false });
  }, [filters, router]);

  const updateFilter = (key: keyof Filters, value: string | boolean) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      category: "all",
      priceMin: "",
      priceMax: "",
      sortBy: "name",
      inStock: false,
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "beer":
        return <Beer className="h-4 w-4" />;
      case "subscription":
        return <CreditCard className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "beer":
        return "bg-amber-100 text-amber-800";
      case "subscription":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const categories = [
    { value: "all", label: "Todos los productos" },
    { value: "beer", label: "Cervezas" },
    { value: "subscription", label: "Suscripciones" },
  ];

  const sortOptions = [
    { value: "name", label: "Nombre A-Z" },
    { value: "price-low", label: "Precio: Menor a Mayor" },
    { value: "price-high", label: "Precio: Mayor a Menor" },
    { value: "popular", label: "Más Populares" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-amber-200">
        <div className="container py-6">
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Todos nuestros productos
              </h1>
              <p className="text-gray-600">
                Descubre nuestra colección completa de cervezas artesanales y
                planes de suscripción
              </p>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar productos..."
                  value={filters.search}
                  onChange={(e) => updateFilter("search", e.target.value)}
                  className="pl-10 border-amber-300 focus:border-amber-500 focus:ring-amber-500"
                />
              </div>

              {/* Quick Filters */}
              <div className="flex gap-2 flex-wrap">
                <Select
                  value={filters.category}
                  onValueChange={(value) => updateFilter("category", value)}
                >
                  <SelectTrigger className="w-48 border-amber-300">
                    <SelectValue placeholder="Categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={filters.sortBy}
                  onValueChange={(value) => updateFilter("sortBy", value)}
                >
                  <SelectTrigger className="w-48 border-amber-300">
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Advanced Filters */}
                <Sheet>
                  <SheetTrigger asChild>
                    <Button
                      variant="outline"
                      className="border-amber-300 hover:bg-amber-50"
                    >
                      <SlidersHorizontal className="h-4 w-4 mr-2" />
                      Filtros
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>Filtros avanzados</SheetTitle>
                      <SheetDescription>
                        Refina tu búsqueda con estos filtros adicionales
                      </SheetDescription>
                    </SheetHeader>
                    <div className="space-y-6 mt-6">
                      {/* Price Range */}
                      <div className="space-y-3">
                        <Label className="text-base font-medium">
                          Rango de precios
                        </Label>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label htmlFor="priceMin" className="text-sm">
                              Mínimo
                            </Label>
                            <Input
                              id="priceMin"
                              type="number"
                              placeholder="0"
                              value={filters.priceMin}
                              onChange={(e) =>
                                updateFilter("priceMin", e.target.value)
                              }
                            />
                          </div>
                          <div>
                            <Label htmlFor="priceMax" className="text-sm">
                              Máximo
                            </Label>
                            <Input
                              id="priceMax"
                              type="number"
                              placeholder="50000"
                              value={filters.priceMax}
                              onChange={(e) =>
                                updateFilter("priceMax", e.target.value)
                              }
                            />
                          </div>
                        </div>
                      </div>

                      {/* Stock Filter */}
                      <div className="space-y-3">
                        <Label className="text-base font-medium">
                          Disponibilidad
                        </Label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={filters.inStock}
                            onChange={(e) =>
                              updateFilter("inStock", e.target.checked)
                            }
                            className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                          />
                          <span className="text-sm">
                            Solo productos en stock
                          </span>
                        </label>
                      </div>

                      {/* Actions */}
                      <div className="space-y-2 pt-4 border-t">
                        <Button
                          onClick={clearFilters}
                          variant="outline"
                          className="w-full"
                        >
                          Limpiar filtros
                        </Button>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>

                {/* View Mode Toggle */}
                <div className="flex border border-amber-300 rounded-md">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className={
                      viewMode === "grid"
                        ? "bg-amber-600 hover:bg-amber-700"
                        : "hover:bg-amber-50"
                    }
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className={
                      viewMode === "list"
                        ? "bg-amber-600 hover:bg-amber-700"
                        : "hover:bg-amber-50"
                    }
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container py-8">
        {/* Results Info */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-600">
            {loading
              ? "Cargando..."
              : `${filteredProducts.length} productos encontrados`}
          </p>

          {/* Active Filters */}
          {(filters.search ||
            filters.category !== "all" ||
            filters.priceMin ||
            filters.priceMax ||
            filters.inStock) && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-500">Filtros activos:</span>
              {filters.search && (
                <Badge
                  variant="secondary"
                  className="bg-amber-100 text-amber-800"
                >
                  "{filters.search}"
                </Badge>
              )}
              {filters.category !== "all" && (
                <Badge
                  variant="secondary"
                  className="bg-amber-100 text-amber-800"
                >
                  {categories.find((c) => c.value === filters.category)?.label}
                </Badge>
              )}
              {(filters.priceMin || filters.priceMax) && (
                <Badge
                  variant="secondary"
                  className="bg-amber-100 text-amber-800"
                >
                  ${filters.priceMin || "0"} - ${filters.priceMax || "∞"}
                </Badge>
              )}
              {filters.inStock && (
                <Badge
                  variant="secondary"
                  className="bg-amber-100 text-amber-800"
                >
                  En stock
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕ Limpiar
              </Button>
            </div>
          )}
        </div>

        {/* Products */}
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner className="h-8 w-8" />
          </div>
        ) : filteredProducts.length > 0 ? (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                : "space-y-4"
            }
          >
            {filteredProducts.map((product) => (
              <Card
                key={product._id}
                className={`bg-white/70 backdrop-blur-sm border-amber-200 hover:shadow-lg transition-all duration-300 relative ${
                  viewMode === "list" ? "flex flex-row" : ""
                } ${product.isPopular ? "ring-2 ring-amber-500" : ""}`}
              >
                {product.isPopular && (
                  <div className="absolute top-2 right-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2 py-1 text-xs font-medium rounded-full z-10">
                    <Star className="h-3 w-3 inline mr-1" />
                    Popular
                  </div>
                )}

                {/* Product Image */}
                <div
                  className={`relative overflow-hidden ${
                    viewMode === "list"
                      ? "w-32 h-32 flex-shrink-0 rounded-l-lg"
                      : "w-full h-48 rounded-t-lg"
                  }`}
                >
                  <Image
                    src={product.image || "/placeholder.jpg"}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-300 hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>

                <div className={viewMode === "list" ? "flex-1" : ""}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge
                            className={`text-xs ${getCategoryColor(
                              product.category
                            )}`}
                          >
                            {getCategoryIcon(product.category)}
                            <span className="ml-1">
                              {product.category === "beer"
                                ? "Cerveza"
                                : product.category === "subscription"
                                ? "Suscripción"
                                : "Producto"}
                            </span>
                          </Badge>
                          {product.discount && (
                            <Badge className="bg-red-500 text-white text-xs">
                              -{product.discount}% OFF
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-lg mb-1">
                          {product.name}
                        </CardTitle>
                        <CardDescription className="text-sm text-amber-600 mb-2">
                          {product.type}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-gray-900">
                          {formatPrice(product.price)}
                        </div>
                        {product.duration && (
                          <div className="text-xs text-gray-500">
                            /{product.duration}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {product.description}
                    </p>

                    {/* Features for subscriptions */}
                    {product.category === "subscription" &&
                      product.features && (
                        <div className="space-y-1">
                          {product.features
                            .slice(0, 2)
                            .map((feature, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-2 text-xs text-gray-600"
                              >
                                <CheckCircle className="h-3 w-3 text-green-600" />
                                {feature}
                              </div>
                            ))}
                        </div>
                      )}

                    {/* Stock for beers */}
                    {product.category === "beer" &&
                      product.stock !== undefined && (
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              product.stock > 0
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {product.stock > 0
                              ? `${product.stock} disponibles`
                              : "Agotado"}
                          </span>
                        </div>
                      )}

                    {/* Action Button */}
                    <Button
                      className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white"
                      disabled={
                        product.category === "beer" && product.stock === 0
                      }
                    >
                      {product.category === "subscription" ? (
                        <>
                          <CreditCard className="h-4 w-4 mr-2" />
                          Suscribirse
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          {product.stock === 0
                            ? "Agotado"
                            : "Agregar al carrito"}
                        </>
                      )}
                    </Button>
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No se encontraron productos
              </h3>
              <p className="text-gray-600 mb-6">
                Intenta ajustar tus filtros o buscar con términos diferentes
              </p>
              <Button
                onClick={clearFilters}
                className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white"
              >
                Limpiar filtros
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function ProductsPageContent() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-screen">
          <LoadingSpinner />
        </div>
      }
    >
      <ProductsPageContentInner />
    </Suspense>
  );
}
