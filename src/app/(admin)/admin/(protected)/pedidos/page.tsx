import { ClipboardList, Wallet, Clock } from "lucide-react";
import { createServiceClient } from "@/lib/supabase/service";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { formatCOP } from "@/lib/format";
import { resolveDateRange } from "./date-range";
import { fetchFilteredOrders, fetchOrderItemsByOrderIds } from "./queries";
import { OrderFilters } from "./order-filters";
import { OrderRow } from "./order-row";

const PENDING_STATUSES = ["pending_whatsapp", "pending_wompi"];
const PAID_STATUSES = ["paid", "alistando", "shipped"];

export default async function PedidosPage({
  searchParams,
}: {
  searchParams: Promise<{ rango?: string; desde?: string; hasta?: string; canal?: string; estado?: string; cliente?: string }>;
}) {
  const params = await searchParams;
  const supabase = createServiceClient();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const { desde, hasta } = resolveDateRange(params.rango, params.desde, params.hasta);

  const [orders, { data: todayOrders }, { count: pendingCount }] = await Promise.all([
    fetchFilteredOrders(supabase, {
      desde,
      hasta,
      canal: params.canal || null,
      estado: params.estado || null,
      cliente: params.cliente || null,
    }),
    supabase.from("orders").select("total_cop, status").gte("created_at", startOfToday.toISOString()),
    supabase.from("orders").select("id", { count: "exact", head: true }).in("status", PENDING_STATUSES),
  ]);

  const itemsByOrderId = await fetchOrderItemsByOrderIds(
    supabase,
    orders.map((o) => o.id)
  );

  const ordersToday = todayOrders?.length ?? 0;
  const revenueToday = (todayOrders ?? [])
    .filter((o) => PAID_STATUSES.includes(o.status))
    .reduce((sum, o) => sum + o.total_cop, 0);

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
              <p className="font-heading text-2xl font-extrabold text-foreground">{pendingCount ?? 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="mt-6">
        <OrderFilters initial={params} />
      </div>
      <Card className="mt-4 overflow-x-auto py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>N° Pedido</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Canal</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableHead colSpan={7} className="py-6 text-center font-normal text-muted-foreground">
                  Ningún pedido coincide con estos filtros.
                </TableHead>
              </TableRow>
            ) : (
              orders.map((o) => <OrderRow key={o.id} order={o} items={itemsByOrderId[o.id] ?? []} />)
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
