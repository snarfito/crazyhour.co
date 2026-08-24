"use client";

import { useState } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DeleteForm } from "@/components/admin/delete-form";
import { SubmitButton } from "@/components/admin/submit-button";
import { SELECT_CLASSES } from "@/lib/admin-ui";
import { formatCOP } from "@/lib/format";
import { deleteOrder, markOrderPaid, markOrderPreparing, markOrderShipped, updateCustomerDetails } from "./actions";
import type { OrderLineItem } from "./queries";

const CARRIER_OPTIONS = ["Inter Rapidísimo", "Coordinadora", "Servientrega", "Envía", "TCC"];

const STATUS_LABEL: Record<string, string> = {
  pending_whatsapp: "Por confirmar (WhatsApp)",
  pending_wompi: "Por confirmar (Wompi)",
  paid: "Pagado",
  alistando: "Alistando",
  shipped: "Enviado",
};

export function OrderRow({
  order,
  items,
}: {
  order: {
    id: string;
    order_number: number;
    created_at: string;
    customer_name: string;
    customer_phone: string;
    customer_email: string | null;
    shipping_address: string | null;
    shipping_neighborhood: string | null;
    shipping_city: string | null;
    shipping_extra: string | null;
    shipping_carrier: string | null;
    tracking_number: string | null;
    channel: string;
    total_cop: number;
    status: string;
  };
  items: OrderLineItem[];
}) {
  const [carrier, setCarrier] = useState(CARRIER_OPTIONS[0]);

  return (
    <Dialog>
      <DialogTrigger
        nativeButton={false}
        render={
          <TableRow className="cursor-pointer">
            <TableCell className="font-medium text-foreground">#{order.order_number}</TableCell>
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
                  <SubmitButton variant="outline" size="sm">
                    Marcar como pagado
                  </SubmitButton>
                </form>
              )}
              {order.status === "paid" && (
                <form action={markOrderPreparing.bind(null, order.id)}>
                  <SubmitButton variant="outline" size="sm">
                    Marcar en alistamiento
                  </SubmitButton>
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
          <dt className="text-muted-foreground">N° de pedido</dt>
          <dd className="text-foreground">#{order.order_number}</dd>
          <dt className="text-muted-foreground">Fecha</dt>
          <dd className="text-foreground">{new Date(order.created_at).toLocaleString("es-CO")}</dd>
          <dt className="text-muted-foreground">Canal</dt>
          <dd className="text-foreground capitalize">{order.channel}</dd>
          <dt className="text-muted-foreground">Estado</dt>
          <dd className="text-foreground">{STATUS_LABEL[order.status] ?? order.status}</dd>
          {order.shipping_carrier && (
            <>
              <dt className="text-muted-foreground">Transportadora</dt>
              <dd className="text-foreground">{order.shipping_carrier}</dd>
              <dt className="text-muted-foreground">Guía</dt>
              <dd className="text-foreground">{order.tracking_number}</dd>
            </>
          )}
        </dl>
        <form action={updateCustomerDetails.bind(null, order.id)} className="grid grid-cols-2 gap-3 border-t border-border pt-3">
          <div>
            <Label htmlFor={`customer_name-${order.id}`}>Nombre</Label>
            <Input id={`customer_name-${order.id}`} name="customer_name" defaultValue={order.customer_name} required />
          </div>
          <div>
            <Label htmlFor={`customer_phone-${order.id}`}>Teléfono</Label>
            <Input id={`customer_phone-${order.id}`} name="customer_phone" defaultValue={order.customer_phone} required />
          </div>
          <div>
            <Label htmlFor={`customer_email-${order.id}`}>Correo</Label>
            <Input
              id={`customer_email-${order.id}`}
              name="customer_email"
              type="email"
              defaultValue={order.customer_email ?? ""}
              required
            />
          </div>
          <div>
            <Label htmlFor={`shipping_neighborhood-${order.id}`}>Barrio</Label>
            <Input
              id={`shipping_neighborhood-${order.id}`}
              name="shipping_neighborhood"
              defaultValue={order.shipping_neighborhood ?? ""}
              required
            />
          </div>
          <div>
            <Label htmlFor={`shipping_city-${order.id}`}>Ciudad</Label>
            <Input id={`shipping_city-${order.id}`} name="shipping_city" defaultValue={order.shipping_city ?? ""} required />
          </div>
          <div className="col-span-2">
            <Label htmlFor={`shipping_address-${order.id}`}>Dirección</Label>
            <Input
              id={`shipping_address-${order.id}`}
              name="shipping_address"
              defaultValue={order.shipping_address ?? ""}
              required
            />
          </div>
          <div className="col-span-2">
            <Label htmlFor={`shipping_extra-${order.id}`}>Información adicional (apto, casa, torre, etc.)</Label>
            <Input id={`shipping_extra-${order.id}`} name="shipping_extra" defaultValue={order.shipping_extra ?? ""} />
          </div>
          <div className="col-span-2">
            <SubmitButton variant="outline" size="sm">
              Guardar cambios
            </SubmitButton>
          </div>
        </form>
        {order.status === "alistando" && (
          <form
            action={markOrderShipped.bind(null, order.id)}
            className="grid grid-cols-2 gap-3 border-t border-border pt-3"
          >
            <div>
              <Label htmlFor={`shipping_carrier-${order.id}`}>Transportadora</Label>
              <select
                id={`shipping_carrier-${order.id}`}
                name="shipping_carrier"
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                className={SELECT_CLASSES}
              >
                {CARRIER_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
                <option value="otro">Otro</option>
              </select>
            </div>
            <div>
              <Label htmlFor={`tracking_number-${order.id}`}>Número de guía</Label>
              <Input id={`tracking_number-${order.id}`} name="tracking_number" required />
            </div>
            {carrier === "otro" && (
              <div className="col-span-2">
                <Label htmlFor={`shipping_carrier_other-${order.id}`}>Nombre de la transportadora</Label>
                <Input id={`shipping_carrier_other-${order.id}`} name="shipping_carrier_other" required />
              </div>
            )}
            <div className="col-span-2">
              <SubmitButton variant="outline" size="sm">
                Marcar como enviado
              </SubmitButton>
            </div>
          </form>
        )}
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
        <div className="flex justify-end border-t border-border pt-3">
          <DeleteForm
            action={deleteOrder.bind(null, order.id)}
            confirmMessage={`¿Eliminar el pedido #${order.order_number}? Esta acción no se puede deshacer y no afecta el catálogo de productos.`}
          >
            Eliminar pedido
          </DeleteForm>
        </div>
      </DialogContent>
    </Dialog>
  );
}
