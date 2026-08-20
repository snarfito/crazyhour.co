"use client";

import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatCOP } from "@/lib/format";
import { markOrderPaid } from "./actions";
import type { OrderLineItem } from "./queries";

const STATUS_LABEL: Record<string, string> = {
  pending_whatsapp: "Por confirmar (WhatsApp)",
  pending_wompi: "Por confirmar (Wompi)",
  paid: "Pagado",
  shipped: "Enviado",
};

export function OrderRow({
  order,
  items,
}: {
  order: {
    id: string;
    created_at: string;
    customer_name: string;
    customer_phone: string;
    channel: string;
    total_cop: number;
    status: string;
  };
  items: OrderLineItem[];
}) {
  return (
    <Dialog>
      <DialogTrigger
        nativeButton={false}
        render={
          <TableRow className="cursor-pointer">
            <TableCell className="text-muted-foreground">
              {new Date(order.created_at).toLocaleString("es-CO")}
            </TableCell>
            <TableCell className="font-medium text-foreground">
              {order.customer_name} · {order.customer_phone}
            </TableCell>
            <TableCell className="capitalize">{order.channel}</TableCell>
            <TableCell>{formatCOP(order.total_cop)}</TableCell>
            <TableCell>{STATUS_LABEL[order.status] ?? order.status}</TableCell>
            <TableCell onClick={(e) => e.stopPropagation()}>
              {order.status === "pending_whatsapp" && (
                <form action={markOrderPaid.bind(null, order.id)}>
                  <Button type="submit" variant="outline" size="sm">
                    Marcar como pagado
                  </Button>
                </form>
              )}
            </TableCell>
          </TableRow>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pedido de {order.customer_name}</DialogTitle>
        </DialogHeader>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <dt className="text-muted-foreground">Fecha</dt>
          <dd className="text-foreground">{new Date(order.created_at).toLocaleString("es-CO")}</dd>
          <dt className="text-muted-foreground">Teléfono</dt>
          <dd className="text-foreground">{order.customer_phone}</dd>
          <dt className="text-muted-foreground">Canal</dt>
          <dd className="text-foreground capitalize">{order.channel}</dd>
          <dt className="text-muted-foreground">Estado</dt>
          <dd className="text-foreground">{STATUS_LABEL[order.status] ?? order.status}</dd>
        </dl>
        <div>
          <p className="mb-2 text-sm font-medium text-foreground">Productos</p>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin productos registrados.</p>
          ) : (
            <ul className="divide-y divide-border text-sm">
              {items.map((item, i) => (
                <li key={i} className="flex items-center justify-between py-1.5">
                  <span className="text-foreground">
                    {item.quantity}× {item.name}
                  </span>
                  <span className="text-muted-foreground">{formatCOP(item.unitPriceCop * item.quantity)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex items-center justify-between border-t border-border pt-3 text-sm font-medium">
          <span className="text-foreground">Total</span>
          <span className="text-foreground">{formatCOP(order.total_cop)}</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
