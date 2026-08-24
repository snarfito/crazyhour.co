"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { SELECT_CLASSES } from "@/lib/admin-ui";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const RANGO_OPTIONS = [
  { value: "todos", label: "Todas las fechas" },
  { value: "hoy", label: "Hoy" },
  { value: "semana", label: "Esta semana" },
  { value: "mes", label: "Mes actual" },
  { value: "personalizado", label: "Personalizado" },
];

const CANAL_OPTIONS = [
  { value: "", label: "Todos los canales" },
  { value: "wompi", label: "Wompi" },
  { value: "whatsapp", label: "WhatsApp" },
];

const ESTADO_OPTIONS = [
  { value: "", label: "Todos los estados" },
  { value: "pending_whatsapp", label: "Por confirmar (WhatsApp)" },
  { value: "pending_wompi", label: "Por confirmar (Wompi)" },
  { value: "paid", label: "Pagado" },
  { value: "alistando", label: "Alistando" },
  { value: "shipped", label: "Enviado" },
];

export function OrderFilters({
  initial,
}: {
  initial: { rango?: string; desde?: string; hasta?: string; canal?: string; estado?: string; cliente?: string };
}) {
  const router = useRouter();
  const [rango, setRango] = useState(initial.rango ?? "todos");
  const [desde, setDesde] = useState(initial.desde ?? "");
  const [hasta, setHasta] = useState(initial.hasta ?? "");
  const [canal, setCanal] = useState(initial.canal ?? "");
  const [estado, setEstado] = useState(initial.estado ?? "");
  const [cliente, setCliente] = useState(initial.cliente ?? "");

  const applyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (rango !== "todos") params.set("rango", rango);
    if (rango === "personalizado") {
      if (desde) params.set("desde", desde);
      if (hasta) params.set("hasta", hasta);
    }
    if (canal) params.set("canal", canal);
    if (estado) params.set("estado", estado);
    if (cliente) params.set("cliente", cliente);
    const query = params.toString();
    router.push(query ? `/admin/pedidos?${query}` : "/admin/pedidos");
  };

  return (
    <form onSubmit={applyFilters} className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 lg:items-end">
      <label className="flex flex-col gap-1 text-sm text-muted-foreground">
        Rango
        <select value={rango} onChange={(e) => setRango(e.target.value)} className={SELECT_CLASSES}>
          {RANGO_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      {rango === "personalizado" && (
        <>
          <label className="flex flex-col gap-1 text-sm text-muted-foreground">
            Desde
            <Input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1 text-sm text-muted-foreground">
            Hasta
            <Input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
          </label>
        </>
      )}
      <label className="flex flex-col gap-1 text-sm text-muted-foreground">
        Canal
        <select value={canal} onChange={(e) => setCanal(e.target.value)} className={SELECT_CLASSES}>
          {CANAL_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm text-muted-foreground">
        Estado
        <select value={estado} onChange={(e) => setEstado(e.target.value)} className={SELECT_CLASSES}>
          {ESTADO_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm text-muted-foreground">
        Cliente
        <Input
          type="text"
          placeholder="Nombre o teléfono"
          value={cliente}
          onChange={(e) => setCliente(e.target.value)}
        />
      </label>
      <div className="flex gap-2">
        <Button type="submit" size="sm">
          Filtrar
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => router.push("/admin/pedidos")}>
          Limpiar
        </Button>
      </div>
    </form>
  );
}
