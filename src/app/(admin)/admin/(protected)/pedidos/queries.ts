import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export type OrderFilters = {
  desde: string | null;
  hasta: string | null;
  canal: string | null;
  estado: string | null;
  cliente: string | null;
};

export type OrderLineItem = {
  name: string;
  quantity: number;
  unitPriceCop: number;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- this project has no generated Supabase types
export async function fetchFilteredOrders(supabase: SupabaseClient<any>, filters: OrderFilters) {
  let query = supabase.from("orders").select("*").order("created_at", { ascending: false });
  if (filters.desde) query = query.gte("created_at", filters.desde);
  if (filters.hasta) query = query.lte("created_at", filters.hasta);
  if (filters.canal) query = query.eq("channel", filters.canal);
  if (filters.estado) query = query.eq("status", filters.estado);
  if (filters.cliente) {
    // Escape ilike wildcards in user input so "_"/"%" in a name/phone don't match extra rows.
    const term = `%${filters.cliente.replace(/([\\%_])/g, "\\$1")}%`;
    const orConditions = [`customer_name.ilike.${term}`, `customer_phone.ilike.${term}`];
    // Cap at Postgres's int4 max so a numeric-looking search (e.g. a 10-digit
    // phone number) can't overflow the order_number column's integer type.
    const trimmed = filters.cliente.trim();
    if (/^\d+$/.test(trimmed) && Number(trimmed) <= 2147483647) {
      orConditions.push(`order_number.eq.${trimmed}`);
    }
    query = query.or(orConditions.join(","));
  }
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function fetchOrderItemsByOrderIds(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  orderIds: string[]
): Promise<Record<string, OrderLineItem[]>> {
  if (orderIds.length === 0) return {};

  const { data, error } = await supabase
    .from("order_items")
    .select("order_id, quantity, unit_price_cop, products(name)")
    .in("order_id", orderIds);
  if (error) throw error;

  const grouped: Record<string, OrderLineItem[]> = {};
  for (const row of data ?? []) {
    // Without generated DB types, supabase-js can't tell this embedded
    // relation is many-to-one — it types `products` as an array.
    const product = (Array.isArray(row.products) ? row.products[0] : row.products) as { name: string } | null;
    const list = (grouped[row.order_id] ??= []);
    list.push({
      name: product?.name ?? "Producto eliminado",
      quantity: row.quantity,
      unitPriceCop: row.unit_price_cop,
    });
  }
  return grouped;
}
