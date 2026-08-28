import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Table, TableBody } from "@/components/ui/table";
import { OrderRow } from "./order-row";

vi.mock("./actions", () => ({
  deleteOrder: vi.fn(),
  markOrderPaid: vi.fn(),
  markOrderPreparing: vi.fn(),
  markOrderShipped: vi.fn(),
  updateCustomerDetails: vi.fn(),
}));

const ORDER = {
  id: "order-1",
  order_number: 1,
  created_at: new Date().toISOString(),
  customer_name: "Ana",
  customer_phone: "3001234567",
  customer_email: "ana@example.com",
  shipping_address: "Calle 1",
  shipping_neighborhood: "Chapinero",
  shipping_city: "Bogotá",
  shipping_extra: null,
  shipping_carrier: null,
  tracking_number: null,
  channel: "whatsapp",
  total_cop: 45000,
  status: "pending_whatsapp",
};

function renderOrderRow() {
  render(
    <Table>
      <TableBody>
        <OrderRow order={ORDER} items={[]} />
      </TableBody>
    </Table>
  );
}

describe("OrderRow — phone validation", () => {
  it("disables saving customer details while the phone is malformed", async () => {
    renderOrderRow();
    fireEvent.click(screen.getByText("Ana · 3001234567"));

    const phoneInput = await screen.findByLabelText("Teléfono");
    fireEvent.change(phoneInput, { target: { value: "123" } });

    expect(screen.getByText(/celular colombiano válido/i)).toBeInTheDocument();
    expect(screen.getByText("Guardar cambios").closest("button")).toBeDisabled();

    fireEvent.change(phoneInput, { target: { value: "3009876543" } });

    expect(screen.queryByText(/celular colombiano válido/i)).not.toBeInTheDocument();
    expect(screen.getByText("Guardar cambios").closest("button")).not.toBeDisabled();
  });
});
