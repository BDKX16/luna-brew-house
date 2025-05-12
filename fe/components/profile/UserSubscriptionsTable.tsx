import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, ChevronRight } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface UserSubscriptionsTableProps {
  subscriptions: any[] | any;
}

export default function UserSubscriptionsTable({
  subscriptions,
}: UserSubscriptionsTableProps) {
  // Ensure subscriptions is always an array
  const subscriptionsArray = Array.isArray(subscriptions)
    ? subscriptions
    : subscriptions
    ? [subscriptions]
    : [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
            Activa
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200">
            Pendiente
          </Badge>
        );
      case "paused":
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
            Pausada
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-200">
            Cancelada
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "d MMM yyyy", { locale: es });
    } catch (error) {
      return "Fecha no disponible";
    }
  };

  const getNextDeliveryDate = (subscription: any) => {
    if (subscription.status !== "active") return "No programado";
    if (!subscription.nextDeliveryDate) return "Pendiente";
    return formatDate(subscription.nextDeliveryDate);
  };

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Plan</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Tipo de cerveza</TableHead>
            <TableHead>Próxima entrega</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {subscriptionsArray.map((subscription) => (
            <TableRow key={subscription.id}>
              <TableCell className="font-medium">
                {subscription.planName || "Plan de suscripción"}
              </TableCell>
              <TableCell>{getStatusBadge(subscription.status)}</TableCell>
              <TableCell>
                {subscription.beerName || "No especificado"}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <CalendarDays className="h-4 w-4 text-gray-500" />
                  <span>{getNextDeliveryDate(subscription)}</span>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <Link href={`/perfil/suscripciones/${subscription.id}`}>
                  <Button size="sm" variant="ghost">
                    Ver detalles
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
