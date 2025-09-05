"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import {
  Users,
  Search,
  Filter,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
  ShoppingCart,
  CreditCard,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Package,
  TrendingUp,
  UserCheck,
  UserX,
  Bell,
  Loader2,
  MoreHorizontal,
  Edit,
  Ban,
  UserCog,
  Info,
  AlertCircle,
  Zap,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import useFetchAndLoad from "@/hooks/useFetchAndLoad";
import {
  getAllUsers,
  getUserOrders,
  getAdminUserSubscriptions,
  updateUserStatus,
  deleteUser,
} from "@/services/private";

interface User {
  _id: string;
  name: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  role: string;
  confirmed: boolean;
  createdAt: string;
  lastLogin?: string;
}

interface Order {
  _id: string;
  id: string;
  customer: {
    name: string;
    email: string;
    phone?: string;
    address: string;
    userId?: string;
  };
  date: string;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  total: number;
  items: Array<{
    id: string;
    name: string;
    type: string;
    price: number;
    quantity: number;
  }>;
  paymentMethod: string;
  paymentStatus: "pending" | "completed" | "failed" | "refunded";
  deliveryTime?: {
    date: string;
    timeRange: string;
  };
}

interface Subscription {
  _id: string;
  id: string;
  userId: string;
  name: string;
  beerType: "golden" | "red" | "ipa";
  beerName: string;
  liters: number;
  price: number;
  status: "active" | "paused" | "cancelled";
  startDate: string;
  nextDelivery: string;
  deliveries: Array<{
    date: string;
    status: "delivered" | "pending" | "processing";
    orderId?: string;
  }>;
}

interface UserStats {
  totalOrders: number;
  totalSpent: number;
  pendingOrders: number;
  activeSubscriptions: number;
  lastOrderDate?: string;
}

export default function UsersManagementPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { loading, callEndpoint } = useFetchAndLoad();

  // Estados principales
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  // Estados para modales
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userDetailsOpen, setUserDetailsOpen] = useState(false);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [userSubscriptions, setUserSubscriptions] = useState<Subscription[]>(
    []
  );
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Estados para modal de atención
  const [attentionModalOpen, setAttentionModalOpen] = useState(false);
  const [attentionUser, setAttentionUser] = useState<User | null>(null);
  const [attentionDetails, setAttentionDetails] = useState<{
    issues: string[];
    severity: "default" | "destructive";
    pendingOrders: Order[];
    upcomingDeliveries: Subscription[];
    overdueDeliveries: Subscription[];
    failedPayments: Order[];
  } | null>(null);

  // Estados para estadísticas generales
  const [totalUsers, setTotalUsers] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [usersWithPendingOrders, setUsersWithPendingOrders] = useState(0);
  const [usersWithSubscriptions, setUsersWithSubscriptions] = useState(0);

  // Cargar usuarios al montar el componente
  useEffect(() => {
    loadUsers();
  }, []);

  // Filtrar usuarios cuando cambian los filtros
  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, statusFilter, roleFilter]);

  const loadUsers = async () => {
    try {
      const result = await callEndpoint(getAllUsers());

      if (result?.data?.data) {
        // Los usuarios están en result.data.data según la estructura del backend
        const usersArray = Array.isArray(result.data.data)
          ? result.data.data
          : [];

        setUsers(usersArray);
        calculateGeneralStats(usersArray);
      } else {
        // Si no hay datos, inicializar con array vacío
        setUsers([]);
        calculateGeneralStats([]);
      }
    } catch (error) {
      console.error("Error loading users:", error);
      setUsers([]); // Asegurar que users sea un array vacío en caso de error
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios",
        variant: "destructive",
      });
    }
  };

  const calculateGeneralStats = async (usersData: User[]) => {
    // Asegurar que usersData es un array
    const usersArray = Array.isArray(usersData) ? usersData : [];

    setTotalUsers(usersArray.length);
    setActiveUsers(
      usersArray.filter((user) => user.confirmed && user.role !== "admin")
        .length
    );

    // Calcular estadísticas más detalladas
    try {
      let usersWithPendingOrdersCount = 0;
      let usersWithSubscriptionsCount = 0;

      // Para evitar muchas llamadas, podríamos implementar un endpoint específico para estadísticas
      // Por ahora, estas estadísticas se actualizarán cuando se abran los detalles de usuarios

      setUsersWithPendingOrders(usersWithPendingOrdersCount);
      setUsersWithSubscriptions(usersWithSubscriptionsCount);
    } catch (error) {
      console.error("Error calculating stats:", error);
    }
  };

  const filterUsers = () => {
    // Asegurar que users es un array
    const usersArray = Array.isArray(users) ? users : [];

    let filtered = usersArray;

    // Filtro por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (user.firstName &&
            user.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (user.lastName &&
            user.lastName.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filtro por estado
    if (statusFilter !== "all") {
      filtered = filtered.filter((user) => {
        if (statusFilter === "confirmed") return user.confirmed;
        if (statusFilter === "unconfirmed") return !user.confirmed;
        return true;
      });
    }

    // Filtro por rol
    if (roleFilter !== "all") {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    setFilteredUsers(filtered);
  };

  const loadUserDetails = async (user: User) => {
    setSelectedUser(user);
    setUserDetailsOpen(true);

    try {
      // Cargar pedidos del usuario
      const ordersResult = await callEndpoint(getUserOrders(user._id));
      if (ordersResult?.data?.data) {
        setUserOrders(ordersResult.data.data);
      }

      // Cargar suscripciones del usuario
      const subscriptionsResult = await callEndpoint(
        getAdminUserSubscriptions({ userId: user._id })
      );
      if (subscriptionsResult?.data?.data) {
        setUserSubscriptions(subscriptionsResult.data.data);
      }

      // Calcular estadísticas del usuario
      if (ordersResult?.data?.data) {
        const orders = ordersResult.data.data;
        const stats: UserStats = {
          totalOrders: orders.length,
          totalSpent: orders.reduce(
            (sum: number, order: Order) => sum + order.total,
            0
          ),
          pendingOrders: orders.filter(
            (order: Order) =>
              order.status === "pending" || order.status === "processing"
          ).length,
          activeSubscriptions:
            subscriptionsResult?.data?.data?.filter(
              (sub: Subscription) => sub.status === "active"
            ).length || 0,
          lastOrderDate: orders.length > 0 ? orders[0].date : undefined,
        };
        setUserStats(stats);

        // Mostrar notificaciones si requiere atención
        checkUserAttention(user, orders, subscriptionsResult?.data?.data || []);
      }
    } catch (error) {
      console.error("Error loading user details:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los detalles del usuario",
        variant: "destructive",
      });
    }
  };

  const checkUserAttention = (
    user: User,
    orders: Order[],
    subscriptions: Subscription[]
  ) => {
    const issues: string[] = [];
    let severity: "default" | "destructive" = "default";

    // Verificar pedidos pendientes de entrega
    const pendingOrders = orders.filter(
      (order) => order.status === "pending" || order.status === "processing"
    );
    if (pendingOrders.length > 0) {
      issues.push(`${pendingOrders.length} pedido(s) pendiente(s) de entrega`);
      if (pendingOrders.length > 2) severity = "destructive";
    }

    // Verificar suscripciones próximas a vencer
    const activeSubs = subscriptions.filter((sub) => sub.status === "active");
    const upcomingDeliveries = activeSubs.filter((sub) => {
      const nextDelivery = new Date(sub.nextDelivery);
      const today = new Date();
      const diffDays =
        (nextDelivery.getTime() - today.getTime()) / (1000 * 3600 * 24);
      return diffDays <= 3 && diffDays >= 0;
    });

    if (upcomingDeliveries.length > 0) {
      issues.push(
        `${upcomingDeliveries.length} entrega(s) de suscripción en los próximos 3 días`
      );
    }

    // Verificar pagos fallidos
    const failedPayments = orders.filter(
      (order) => order.paymentStatus === "failed"
    );
    if (failedPayments.length > 0) {
      issues.push(`${failedPayments.length} pago(s) fallido(s)`);
      severity = "destructive";
    }

    // Verificar suscripciones vencidas
    const overdueDeliveries = activeSubs.filter((sub) => {
      const nextDelivery = new Date(sub.nextDelivery);
      const today = new Date();
      return nextDelivery < today;
    });

    if (overdueDeliveries.length > 0) {
      issues.push(
        `${overdueDeliveries.length} entrega(s) de suscripción vencida(s)`
      );
      severity = "destructive";
    }

    // Mostrar toast si hay issues
    if (issues.length > 0) {
      const icon = severity === "destructive" ? "🚨" : "⚠️";
      toast({
        title: `${icon} ${user.name} requiere atención`,
        description: issues.join(" • "),
        variant: severity,
        duration: 8000, // Mostrar por más tiempo si es importante
      });
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      await callEndpoint(deleteUser(userToDelete._id));

      // Asegurar que users es un array antes de filtrar
      const usersArray = Array.isArray(users) ? users : [];
      setUsers(usersArray.filter((user) => user._id !== userToDelete._id));
      setDeleteDialogOpen(false);
      setUserToDelete(null);

      toast({
        title: "Usuario eliminado",
        description: `El usuario ${userToDelete.name} ha sido eliminado correctamente`,
      });
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el usuario",
        variant: "destructive",
      });
    }
  };

  const toggleUserStatus = async (user: User) => {
    try {
      const newStatus = !user.confirmed;
      await callEndpoint(updateUserStatus(user._id, { confirmed: newStatus }));

      // Asegurar que users es un array antes de mapear
      const usersArray = Array.isArray(users) ? users : [];
      setUsers(
        usersArray.map((u) =>
          u._id === user._id ? { ...u, confirmed: newStatus } : u
        )
      );

      toast({
        title: "Estado actualizado",
        description: `Usuario ${
          newStatus ? "activado" : "desactivado"
        } correctamente`,
      });
    } catch (error) {
      console.error("Error updating user status:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del usuario",
        variant: "destructive",
      });
    }
  };

  const getUserAttentionBadge = (user: User) => {
    // Para mostrar en la tabla necesitaríamos cargar datos del usuario
    // Por simplicidad, vamos a usar una versión básica
    if (!user.confirmed) {
      return (
        <Button
          variant="outline"
          size="sm"
          className="text-red-600 border-red-200 hover:bg-red-50"
          onClick={() => openAttentionModal(user)}
        >
          <AlertTriangle className="h-3 w-3 mr-1" />
          Cuenta
        </Button>
      );
    }

    // Para otros casos, podríamos verificar datos en cache o mostrar un indicador genérico
    return (
      <Button
        variant="ghost"
        size="sm"
        className="text-blue-600 hover:bg-blue-50"
        onClick={() => openAttentionModal(user)}
      >
        <Eye className="h-3 w-3 mr-1" />
        Ver
      </Button>
    );
  };

  const openAttentionModal = async (user: User) => {
    setAttentionUser(user);
    setAttentionModalOpen(true);

    try {
      // Cargar datos del usuario para verificar qué requiere atención
      const ordersResult = await callEndpoint(getUserOrders(user._id));
      const subscriptionsResult = await callEndpoint(
        getAdminUserSubscriptions({ userId: user._id })
      );

      const orders = ordersResult?.data?.data || [];
      const subscriptions = subscriptionsResult?.data?.data || [];

      // Analizar qué requiere atención
      const issues: string[] = [];
      let severity: "default" | "destructive" = "default";

      // Verificar pedidos pendientes
      const pendingOrders = orders.filter(
        (order: Order) =>
          order.status === "pending" || order.status === "processing"
      );

      // Verificar suscripciones próximas a vencer
      const activeSubs = subscriptions.filter(
        (sub: Subscription) => sub.status === "active"
      );
      const upcomingDeliveries = activeSubs.filter((sub: Subscription) => {
        const nextDelivery = new Date(sub.nextDelivery);
        const today = new Date();
        const diffDays =
          (nextDelivery.getTime() - today.getTime()) / (1000 * 3600 * 24);
        return diffDays <= 3 && diffDays >= 0;
      });

      // Verificar pagos fallidos
      const failedPayments = orders.filter(
        (order: Order) => order.paymentStatus === "failed"
      );

      // Verificar suscripciones vencidas
      const overdueDeliveries = activeSubs.filter((sub: Subscription) => {
        const nextDelivery = new Date(sub.nextDelivery);
        const today = new Date();
        return nextDelivery < today;
      });

      // Compilar issues
      if (pendingOrders.length > 0) {
        issues.push(
          `${pendingOrders.length} pedido(s) pendiente(s) de entrega`
        );
        if (pendingOrders.length > 2) severity = "destructive";
      }

      if (upcomingDeliveries.length > 0) {
        issues.push(
          `${upcomingDeliveries.length} entrega(s) de suscripción en los próximos 3 días`
        );
      }

      if (failedPayments.length > 0) {
        issues.push(`${failedPayments.length} pago(s) fallido(s)`);
        severity = "destructive";
      }

      if (overdueDeliveries.length > 0) {
        issues.push(
          `${overdueDeliveries.length} entrega(s) de suscripción vencida(s)`
        );
        severity = "destructive";
      }

      if (!user.confirmed) {
        issues.push("Cuenta no confirmada");
        severity = "destructive";
      }

      setAttentionDetails({
        issues,
        severity,
        pendingOrders,
        upcomingDeliveries,
        overdueDeliveries,
        failedPayments,
      });
    } catch (error) {
      console.error("Error loading attention details:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los detalles de atención",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (user: User) => {
    if (!user.confirmed) {
      return <Badge variant="destructive">No confirmado</Badge>;
    }
    return (
      <Badge variant="default" className="bg-green-500">
        Activo
      </Badge>
    );
  };

  const getRoleBadge = (role: string) => {
    const styles = {
      admin: "bg-purple-500",
      user: "bg-blue-500",
    };
    return (
      <Badge className={styles[role as keyof typeof styles] || "bg-gray-500"}>
        {role === "admin" ? "Administrador" : "Usuario"}
      </Badge>
    );
  };

  const getOrderStatusBadge = (status: string) => {
    const styles = {
      pending: "bg-yellow-500",
      processing: "bg-blue-500",
      shipped: "bg-purple-500",
      delivered: "bg-green-500",
      cancelled: "bg-red-500",
    };

    const labels = {
      pending: "Pendiente",
      processing: "Procesando",
      shipped: "Enviado",
      delivered: "Entregado",
      cancelled: "Cancelado",
    };

    return (
      <Badge className={styles[status as keyof typeof styles] || "bg-gray-500"}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const getSubscriptionStatusBadge = (status: string) => {
    const styles = {
      active: "bg-green-500",
      paused: "bg-yellow-500",
      cancelled: "bg-red-500",
    };

    const labels = {
      active: "Activa",
      paused: "Pausada",
      cancelled: "Cancelada",
    };

    return (
      <Badge className={styles[status as keyof typeof styles] || "bg-gray-500"}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-CL", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Gestión de Usuarios
          </h1>
          <p className="text-muted-foreground">
            Administra usuarios, pedidos y suscripciones
          </p>
        </div>
      </div>

      {/* Estadísticas generales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Usuarios
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              usuarios registrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Usuarios Activos
            </CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeUsers}</div>
            <p className="text-xs text-muted-foreground">cuentas confirmadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Con Pedidos Pendientes
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usersWithPendingOrders}</div>
            <p className="text-xs text-muted-foreground">requieren atención</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Con Suscripciones
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usersWithSubscriptions}</div>
            <p className="text-xs text-muted-foreground">
              suscripciones activas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros y Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Buscar usuario</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Buscar por nombre o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="w-full md:w-48">
              <Label>Estado</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="confirmed">Confirmados</SelectItem>
                  <SelectItem value="unconfirmed">No confirmados</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-full md:w-48">
              <Label>Rol</Label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="user">Usuario</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de usuarios */}
      <Card>
        <CardHeader>
          <CardTitle>
            Usuarios ({Array.isArray(filteredUsers) ? filteredUsers.length : 0})
          </CardTitle>
          <CardDescription>
            Lista de todos los usuarios registrados en la plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Atención</TableHead>
                  <TableHead>Registro</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(() => {
                  if (loading) {
                    return (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                          <p className="text-muted-foreground mt-2">
                            Cargando usuarios...
                          </p>
                        </TableCell>
                      </TableRow>
                    );
                  }

                  if (
                    !Array.isArray(filteredUsers) ||
                    filteredUsers.length === 0
                  ) {
                    return (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">
                            {!Array.isArray(filteredUsers)
                              ? "Error cargando usuarios"
                              : "No se encontraron usuarios"}
                          </p>
                        </TableCell>
                      </TableRow>
                    );
                  }

                  return filteredUsers.map((user) => {
                    return (
                      <TableRow key={user._id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div>
                              <div className="font-medium">{user.name}</div>
                              {(user.firstName || user.lastName) && (
                                <div className="text-sm text-muted-foreground">
                                  {user.firstName} {user.lastName}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            {user.email}
                          </div>
                        </TableCell>
                        <TableCell>{getRoleBadge(user.role)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(user)}
                            {!user.confirmed && (
                              <AlertTriangle
                                className="h-4 w-4 text-yellow-500"
                                title="Cuenta no confirmada"
                              />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getUserAttentionBadge(user)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {formatDate(user.createdAt)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => loadUserDetails(user)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                Ver detalles
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => toggleUserStatus(user)}
                              >
                                {user.confirmed ? (
                                  <>
                                    <UserX className="mr-2 h-4 w-4" />
                                    Desactivar
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="mr-2 h-4 w-4" />
                                    Activar
                                  </>
                                )}
                              </DropdownMenuItem>
                              {user.role !== "admin" && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setUserToDelete(user);
                                    setDeleteDialogOpen(true);
                                  }}
                                  className="text-red-600"
                                >
                                  <Ban className="mr-2 h-4 w-4" />
                                  Eliminar
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  });
                })()}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal de atención requerida */}
      <Dialog open={attentionModalOpen} onOpenChange={setAttentionModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Atención Requerida - {attentionUser?.name}
            </DialogTitle>
            <DialogDescription>
              Acciones pendientes y alertas para este usuario
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {attentionDetails && (
              <>
                {/* Resumen de issues */}
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Resumen de Alertas
                  </h3>
                  {attentionDetails.issues.length > 0 ? (
                    <div className="space-y-2">
                      {attentionDetails.issues.map((issue, index) => (
                        <Alert
                          key={index}
                          variant={
                            attentionDetails.severity === "destructive"
                              ? "destructive"
                              : "default"
                          }
                        >
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{issue}</AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  ) : (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        No hay alertas activas para este usuario
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* Pedidos pendientes */}
                {attentionDetails.pendingOrders.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Pedidos Pendientes (
                      {attentionDetails.pendingOrders.length})
                    </h3>
                    <div className="space-y-2">
                      {attentionDetails.pendingOrders.map((order) => (
                        <div key={order._id} className="p-3 border rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">
                                Pedido #{order._id.slice(-6)}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(order.date)} •{" "}
                                {formatCurrency(order.total)}
                              </p>
                            </div>
                            <Badge variant="outline" className="bg-yellow-50">
                              {order.status === "pending"
                                ? "Pendiente"
                                : "Procesando"}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Entregas próximas */}
                {attentionDetails.upcomingDeliveries.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Entregas Próximas (
                      {attentionDetails.upcomingDeliveries.length})
                    </h3>
                    <div className="space-y-2">
                      {attentionDetails.upcomingDeliveries.map(
                        (subscription) => (
                          <div
                            key={subscription._id}
                            className="p-3 border rounded-lg"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">
                                  Suscripción {subscription?.plan?.name}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Próxima entrega:{" "}
                                  {formatDate(subscription.nextDelivery)}
                                </p>
                              </div>
                              <Badge variant="outline" className="bg-blue-50">
                                En 3 días o menos
                              </Badge>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

                {/* Entregas vencidas */}
                {attentionDetails.overdueDeliveries.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold flex items-center gap-2 text-red-600">
                      <AlertTriangle className="h-4 w-4" />
                      Entregas Vencidas (
                      {attentionDetails.overdueDeliveries.length})
                    </h3>
                    <div className="space-y-2">
                      {attentionDetails.overdueDeliveries.map(
                        (subscription) => (
                          <div
                            key={subscription._id}
                            className="p-3 border border-red-200 rounded-lg bg-red-50"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">
                                  Suscripción {subscription.plan.name}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Vencida desde:{" "}
                                  {formatDate(subscription.nextDelivery)}
                                </p>
                              </div>
                              <Badge variant="destructive">Vencida</Badge>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

                {/* Pagos fallidos */}
                {attentionDetails.failedPayments.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold flex items-center gap-2 text-red-600">
                      <CreditCard className="h-4 w-4" />
                      Pagos Fallidos ({attentionDetails.failedPayments.length})
                    </h3>
                    <div className="space-y-2">
                      {attentionDetails.failedPayments.map((order) => (
                        <div
                          key={order._id}
                          className="p-3 border border-red-200 rounded-lg bg-red-50"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">
                                Pedido #{order._id.slice(-6)}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(order.date)} •{" "}
                                {formatCurrency(order.total)}
                              </p>
                            </div>
                            <Badge variant="destructive">Pago Fallido</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Acciones recomendadas */}
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Acciones Recomendadas
                  </h3>
                  <div className="space-y-2">
                    {!attentionUser?.confirmed && (
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => toggleUserStatus(attentionUser)}
                      >
                        <UserCheck className="mr-2 h-4 w-4" />
                        Activar cuenta del usuario
                      </Button>
                    )}

                    {attentionDetails.pendingOrders.length > 0 && (
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => {
                          setAttentionModalOpen(false);
                          loadUserDetails(attentionUser!);
                        }}
                      >
                        <Package className="mr-2 h-4 w-4" />
                        Ver detalles de pedidos
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => {
                        // Aquí se podría abrir un modal de contacto o redirigir a email
                        window.location.href = `mailto:${attentionUser?.email}?subject=Atención requerida en Luna Brew House`;
                      }}
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      Contactar al usuario
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end pt-4">
            <Button
              variant="outline"
              onClick={() => setAttentionModalOpen(false)}
            >
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de detalles del usuario */}
      <Dialog open={userDetailsOpen} onOpenChange={setUserDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5" />
              Detalles de {selectedUser?.name}
            </DialogTitle>
            <DialogDescription>
              Información completa del usuario, pedidos y suscripciones
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="info">Información</TabsTrigger>
                <TabsTrigger value="orders">Pedidos</TabsTrigger>
                <TabsTrigger value="subscriptions">Suscripciones</TabsTrigger>
                <TabsTrigger value="stats">Estadísticas</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Información Personal
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">
                          Nombre completo
                        </Label>
                        <p className="text-sm">{selectedUser.name}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Email</Label>
                        <p className="text-sm flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {selectedUser.email}
                        </p>
                      </div>
                      {selectedUser.phone && (
                        <div>
                          <Label className="text-sm font-medium">
                            Teléfono
                          </Label>
                          <p className="text-sm flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            {selectedUser.phone}
                          </p>
                        </div>
                      )}
                      {selectedUser.address && (
                        <div>
                          <Label className="text-sm font-medium">
                            Dirección
                          </Label>
                          <p className="text-sm flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            {selectedUser.address}
                          </p>
                        </div>
                      )}
                      <div>
                        <Label className="text-sm font-medium">Rol</Label>
                        <div className="mt-1">
                          {getRoleBadge(selectedUser.role)}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Estado</Label>
                        <div className="mt-1">
                          {getStatusBadge(selectedUser)}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">
                          Fecha de registro
                        </Label>
                        <p className="text-sm flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {formatDate(selectedUser.createdAt)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="orders" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5" />
                      Historial de Pedidos ({userOrders.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {userOrders.length === 0 ? (
                      <div className="text-center py-8">
                        <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">
                          No tiene pedidos registrados
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {userOrders.map((order) => (
                          <div
                            key={order._id}
                            className="border rounded-lg p-4"
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h4 className="font-medium">
                                  Pedido #{order.id}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  {formatDate(order.date)}
                                </p>
                              </div>
                              <div className="text-right">
                                <div className="mb-2">
                                  {getOrderStatusBadge(order.status)}
                                </div>
                                <p className="font-medium">
                                  {formatCurrency(order.total)}
                                </p>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <h5 className="text-sm font-medium">
                                Productos:
                              </h5>
                              {order.items.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="flex justify-between text-sm"
                                >
                                  <span>
                                    {item.name} x{item.quantity}
                                  </span>
                                  <span>
                                    {formatCurrency(item.price * item.quantity)}
                                  </span>
                                </div>
                              ))}
                            </div>

                            {order.deliveryTime && (
                              <div className="mt-3 p-2 bg-muted rounded">
                                <p className="text-sm">
                                  <strong>Entrega:</strong>{" "}
                                  {order.deliveryTime.date} -{" "}
                                  {order.deliveryTime.timeRange}
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="subscriptions" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Suscripciones ({userSubscriptions.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {userSubscriptions.length === 0 ? (
                      <div className="text-center py-8">
                        <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">
                          No tiene suscripciones activas
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {userSubscriptions.map((subscription) => (
                          <div
                            key={subscription._id}
                            className="border rounded-lg p-4"
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h4 className="font-medium">
                                  {subscription.name}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  {subscription.beerName} -{" "}
                                  {subscription.liters}L
                                </p>
                              </div>
                              <div className="text-right">
                                <div className="mb-2">
                                  {getSubscriptionStatusBadge(
                                    subscription.status
                                  )}
                                </div>
                                <p className="font-medium">
                                  {formatCurrency(subscription.price)}
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <Label>Inicio:</Label>
                                <p>{formatDate(subscription.startDate)}</p>
                              </div>
                              <div>
                                <Label>Próxima entrega:</Label>
                                <p>{formatDate(subscription.nextDelivery)}</p>
                              </div>
                            </div>

                            {subscription.deliveries.length > 0 && (
                              <div className="mt-3">
                                <Label className="text-sm font-medium">
                                  Últimas entregas:
                                </Label>
                                <div className="space-y-1 mt-2">
                                  {subscription.deliveries
                                    .slice(-3)
                                    .map((delivery, idx) => (
                                      <div
                                        key={idx}
                                        className="flex justify-between text-xs"
                                      >
                                        <span>{formatDate(delivery.date)}</span>
                                        <Badge
                                          variant="outline"
                                          className={
                                            delivery.status === "delivered"
                                              ? "text-green-600"
                                              : delivery.status === "pending"
                                              ? "text-yellow-600"
                                              : "text-blue-600"
                                          }
                                        >
                                          {delivery.status === "delivered"
                                            ? "Entregado"
                                            : delivery.status === "pending"
                                            ? "Pendiente"
                                            : "Procesando"}
                                        </Badge>
                                      </div>
                                    ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="stats" className="space-y-4">
                {userStats && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <TrendingUp className="h-5 w-5" />
                          Estadísticas de Compras
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label>Total de pedidos</Label>
                          <p className="text-2xl font-bold">
                            {userStats.totalOrders}
                          </p>
                        </div>
                        <div>
                          <Label>Total gastado</Label>
                          <p className="text-2xl font-bold">
                            {formatCurrency(userStats.totalSpent)}
                          </p>
                        </div>
                        <div>
                          <Label>Pedidos pendientes</Label>
                          <p className="text-2xl font-bold text-yellow-600">
                            {userStats.pendingOrders}
                          </p>
                        </div>
                        {userStats.lastOrderDate && (
                          <div>
                            <Label>Último pedido</Label>
                            <p className="text-lg">
                              {formatDate(userStats.lastOrderDate)}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Package className="h-5 w-5" />
                          Suscripciones
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label>Suscripciones activas</Label>
                          <p className="text-2xl font-bold text-green-600">
                            {userStats.activeSubscriptions}
                          </p>
                        </div>
                        <div>
                          <Label>Total suscripciones</Label>
                          <p className="text-2xl font-bold">
                            {userSubscriptions.length}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmación para eliminar */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              ¿Confirmar eliminación?
            </AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres eliminar al usuario{" "}
              <strong>{userToDelete?.name}</strong>? Esta acción no se puede
              deshacer y se eliminarán todos los datos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-red-500 hover:bg-red-600"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
