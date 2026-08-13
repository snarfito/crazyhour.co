import { ClipboardList, Wallet, Clock } from "lucide-react";
import { createServiceClient } from "@/lib/supabase/service";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCOP } from "@/lib/format";
import { markOrderPaid } from "./actions";

const STATUS_LABEL: Record<string, string> = {
  pending_whatsapp: "Por confirmar (WhatsApp)",
  pending_wompi: "Por confirmar (Wompi)",
  paid: "Pagado",
  shipped: "Enviado",
};

export default async function PedidosPage() {
  const supabase = createServiceClient();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [{ data: orders }, { data: todayOrders }] = await Promise.all([
    supabase.from("orders").select("*").order("created_at", { ascending: false }),
    supabase.from("orders").select("total_cop, status").gte("created_at", startOfToday.toISOString()),
  ]);

  const ordersToday = todayOrders?.length ?? 0;
  const revenueToday = (todayOrders ?? [])
    .filter((o) => o.status === "paid")
    .reduce((sum, o) => sum + o.total_cop, 0);
  const pendingCount = (orders ?? []).filter((o) => o.status === "pending_whatsapp" || o.status === "pending_wompi").length;

  return (
    <div>
      <h1 className="font-heading text-2xl font-extrabold text-foreground">Pedidos</h1>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <ClipboardList className="size-4.5" />
            </span>
            <div>
              <p className="text-sm text-muted-foreground">Pedidos hoy</p>
              <p className="font-heading text-2xl font-extrabold text-foreground">{ordersToday}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-green/10 text-brand-green">
              <Wallet className="size-4.5" />
            </span>
            <div>
              <p className="text-sm text-muted-foreground">Ingresos hoy</p>
              <p className="font-heading text-2xl font-extrabold text-foreground">{formatCOP(revenueToday)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-orange/10 text-brand-orange">
              <Clock className="size-4.5" />
            </span>
            <div>
              <p className="text-sm text-muted-foreground">Por confirmar</p>
              <p className="font-heading text-2xl font-extrabold text-foreground">{pendingCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>
      <Card className="mt-6 overflow-x-auto py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Canal</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(orders ?? []).map((o) => (
              <TableRow key={o.id}>
                <TableCell className="text-muted-foreground">
                  {new Date(o.created_at).toLocaleString("es-CO")}
                </TableCell>
                <TableCell className="font-medium text-foreground">
                  {o.customer_name} · {o.customer_phone}
                </TableCell>
                <TableCell className="capitalize">{o.channel}</TableCell>
                <TableCell>{formatCOP(o.total_cop)}</TableCell>
                <TableCell>{STATUS_LABEL[o.status] ?? o.status}</TableCell>
                <TableCell>
                  {o.status === "pending_whatsapp" && (
                    <form action={markOrderPaid.bind(null, o.id)}>
                      <Button type="submit" variant="outline" size="sm">
                        Marcar como pagado
                      </Button>
                    </form>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
