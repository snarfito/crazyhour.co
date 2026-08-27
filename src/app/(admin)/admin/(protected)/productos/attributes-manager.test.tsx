import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AttributesManager } from "./attributes-manager";

const mockCreateAttribute = vi.fn().mockResolvedValue(undefined);
const mockUpdateAttribute = vi.fn().mockResolvedValue(undefined);
const mockDeleteAttribute = vi.fn().mockResolvedValue(undefined);
const mockCreateOption = vi.fn().mockResolvedValue(undefined);
const mockCreateOptionsBatch = vi.fn().mockResolvedValue(undefined);
const mockUpdateOption = vi.fn().mockResolvedValue(undefined);
const mockToggleOptionActive = vi.fn().mockResolvedValue(undefined);
const mockDeleteOption = vi.fn().mockResolvedValue(undefined);
const mockLinkOptionImage = vi.fn().mockResolvedValue(undefined);

vi.mock("./attributes-actions", () => ({
  createAttribute: (...args: unknown[]) => mockCreateAttribute(...args),
  updateAttribute: (...args: unknown[]) => mockUpdateAttribute(...args),
  deleteAttribute: (...args: unknown[]) => mockDeleteAttribute(...args),
  createOption: (...args: unknown[]) => mockCreateOption(...args),
  createOptionsBatch: (...args: unknown[]) => mockCreateOptionsBatch(...args),
  updateOption: (...args: unknown[]) => mockUpdateOption(...args),
  toggleOptionActive: (...args: unknown[]) => mockToggleOptionActive(...args),
  deleteOption: (...args: unknown[]) => mockDeleteOption(...args),
  linkOptionImage: (...args: unknown[]) => mockLinkOptionImage(...args),
}));

vi.mock("./upload-product-image", () => ({
  uploadProductImage: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

const colorAttribute = {
  id: "attr-color",
  kind: "color",
  display_name: "Color",
  affects_price: false,
  has_photos: true,
  attribute_options: [
    {
      id: "opt-gold",
      display_name: "Chrome Gold",
      color_hex: "#D4AF37",
      unit_price_cop: null,
      pack1_price_cop: null,
      pack2_price_cop: null,
      is_active: true,
      product_image_id: null,
    },
  ],
};

const sizeAttribute = {
  id: "attr-size",
  kind: "size",
  display_name: "Talla",
  affects_price: true,
  has_photos: false,
  attribute_options: [
    {
      id: "opt-18",
      display_name: "18 pulgadas",
      color_hex: null,
      unit_price_cop: 3000,
      pack1_price_cop: 2000,
      pack2_price_cop: 2500,
      is_active: true,
      product_image_id: null,
    },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("AttributesManager", () => {
  it("renders each group with its options", () => {
    render(
      <AttributesManager
        productId="p1"
        attributes={[colorAttribute, sizeAttribute]}
        images={[]}
        productPack1Qty={null}
        productPack2Qty={null}
      />
    );

    expect(screen.getByDisplayValue("Color")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Talla")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Chrome Gold")).toBeInTheDocument();
    expect(screen.getByDisplayValue("18 pulgadas")).toBeInTheDocument();
  });

  it("disables the new-group price checkbox when a group already affects price", () => {
    render(
      <AttributesManager productId="p1" attributes={[sizeAttribute]} images={[]} productPack1Qty={null} productPack2Qty={null} />
    );

    expect(screen.getByLabelText(/este grupo define el precio/i)).toBeDisabled();
  });

  it("leaves the new-group price checkbox enabled when no group affects price yet", () => {
    render(
      <AttributesManager productId="p1" attributes={[colorAttribute]} images={[]} productPack1Qty={null} productPack2Qty={null} />
    );

    expect(screen.getByLabelText(/este grupo define el precio/i)).toBeEnabled();
  });

  it("submits a new attribute group with the product id bound in", async () => {
    render(<AttributesManager productId="p1" attributes={[]} images={[]} productPack1Qty={null} productPack2Qty={null} />);

    await userEvent.type(screen.getByLabelText(/nombre \(ej/i), "Material");
    await userEvent.click(screen.getByRole("button", { name: "Agregar grupo" }));

    expect(mockCreateAttribute).toHaveBeenCalledTimes(1);
    expect(mockCreateAttribute.mock.calls[0][0]).toBe("p1");
    expect(mockCreateAttribute.mock.calls[0][1].get("display_name")).toBe("Material");
  });

  it("toggles the batch color textarea only for color groups", async () => {
    render(
      <AttributesManager
        productId="p1"
        attributes={[colorAttribute, sizeAttribute]}
        images={[]}
        productPack1Qty={null}
        productPack2Qty={null}
      />
    );

    expect(screen.queryByPlaceholderText(/un color por línea/i)).not.toBeInTheDocument();

    await userEvent.click(screen.getByText("Agregar varios colores a la vez"));

    expect(screen.getByPlaceholderText(/un color por línea/i)).toBeInTheDocument();
  });

  it("submits the batch textarea content to createOptionsBatch", async () => {
    render(
      <AttributesManager productId="p1" attributes={[colorAttribute]} images={[]} productPack1Qty={null} productPack2Qty={null} />
    );

    await userEvent.click(screen.getByText("Agregar varios colores a la vez"));
    await userEvent.type(screen.getByPlaceholderText(/un color por línea/i), "Chrome Red\nChrome Blue");
    await userEvent.click(screen.getByRole("button", { name: "Agregar todos" }));

    expect(mockCreateOptionsBatch).toHaveBeenCalledTimes(1);
    expect(mockCreateOptionsBatch.mock.calls[0][0]).toBe("attr-color");
    expect(mockCreateOptionsBatch.mock.calls[0][1]).toBe("p1");
    expect((mockCreateOptionsBatch.mock.calls[0][2] as FormData).get("namesRaw")).toBe("Chrome Red\nChrome Blue");
  });

  it("deletes an option via its delete form after confirmation", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(
      <AttributesManager productId="p1" attributes={[colorAttribute]} images={[]} productPack1Qty={null} productPack2Qty={null} />
    );

    await userEvent.click(screen.getByRole("button", { name: /eliminar$/i }));

    expect(mockDeleteOption.mock.calls[0][0]).toBe("opt-gold");
    expect(mockDeleteOption.mock.calls[0][1]).toBe("p1");
    vi.restoreAllMocks();
  });

  describe("per-option tiered pricing (unidad / media paca / paca completa)", () => {
    it("shows pack price fields only for a price-driving group, labeled with the product's own quantities", () => {
      render(
        <AttributesManager
          productId="p1"
          attributes={[colorAttribute, sizeAttribute]}
          images={[]}
          productPack1Qty={10}
          productPack2Qty={5}
        />
      );

      // Color doesn't affect price: no price fields for its option at all.
      // Both the existing option's edit form and the blank "add option" form
      // render these fields, hence *AllBy* rather than a single match.
      expect(screen.queryByDisplayValue("3000")).toBeInTheDocument(); // sanity: size option's unit price rendered somewhere
      expect(screen.getAllByPlaceholderText(/precio media paca \(5 un\.\)/i).length).toBeGreaterThan(0);
      expect(screen.getAllByPlaceholderText(/precio paca completa \(10 un\.\)/i).length).toBeGreaterThan(0);
      expect(screen.getByDisplayValue("2000")).toBeInTheDocument(); // pack1_price_cop
      expect(screen.getByDisplayValue("2500")).toBeInTheDocument(); // pack2_price_cop
    });

    it("omits the pack price fields when the product has no pack1/pack2 quantity", () => {
      render(
        <AttributesManager
          productId="p1"
          attributes={[sizeAttribute]}
          images={[]}
          productPack1Qty={null}
          productPack2Qty={null}
        />
      );

      expect(screen.queryByPlaceholderText(/precio media paca/i)).not.toBeInTheDocument();
      expect(screen.queryByPlaceholderText(/precio paca completa/i)).not.toBeInTheDocument();
    });

    it("submits unit_price_cop/pack1_price_cop/pack2_price_cop when adding an option to a price-driving group", async () => {
      render(
        <AttributesManager
          productId="p1"
          attributes={[sizeAttribute]}
          images={[]}
          productPack1Qty={10}
          productPack2Qty={5}
        />
      );

      // "Precio por unidad" also appears in the existing "18 pulgadas" row's
      // edit form — the last one on the page is the blank "add option" form.
      const unitPriceInputs = screen.getAllByPlaceholderText("Precio por unidad");
      await userEvent.type(screen.getByPlaceholderText("Nombre de la opción"), "36 pulgadas");
      await userEvent.type(unitPriceInputs[unitPriceInputs.length - 1], "8000");
      await userEvent.click(screen.getByRole("button", { name: "Agregar opción" }));

      expect(mockCreateOption).toHaveBeenCalledTimes(1);
      const formData = mockCreateOption.mock.calls[0][2] as FormData;
      expect(formData.get("unit_price_cop")).toBe("8000");
    });
  });

  describe("color name → hex suggestion when adding an option", () => {
    it("suggests a hex from the typed name for a color group, editable before submit", async () => {
      render(
        <AttributesManager productId="p1" attributes={[colorAttribute]} images={[]} productPack1Qty={null} productPack2Qty={null} />
      );

      await userEvent.type(screen.getByPlaceholderText("Nombre de la opción"), "Amarillo");
      await userEvent.click(screen.getByRole("button", { name: "Agregar opción" }));

      const formData = mockCreateOption.mock.calls[0][2] as FormData;
      // Native <input type="color"> always normalizes to lowercase hex.
      expect(formData.get("color_hex")).toBe("#fdd835");
    });

    it("stops auto-suggesting once the admin picks a color manually", async () => {
      render(
        <AttributesManager productId="p1" attributes={[colorAttribute]} images={[]} productPack1Qty={null} productPack2Qty={null} />
      );

      // Manual pick BEFORE typing a name that would otherwise suggest a hex.
      const colorInputs = screen.getAllByDisplayValue("#cccccc") as HTMLInputElement[];
      fireEvent.change(colorInputs[colorInputs.length - 1], { target: { value: "#123456" } });

      await userEvent.type(screen.getByPlaceholderText("Nombre de la opción"), "Amarillo");
      await userEvent.click(screen.getByRole("button", { name: "Agregar opción" }));

      const formData = mockCreateOption.mock.calls[0][2] as FormData;
      expect(formData.get("color_hex")).toBe("#123456");
    });

    it("does not add a color_hex field at all for a non-color group", async () => {
      render(
        <AttributesManager productId="p1" attributes={[sizeAttribute]} images={[]} productPack1Qty={null} productPack2Qty={null} />
      );

      await userEvent.type(screen.getByPlaceholderText("Nombre de la opción"), "36 pulgadas");
      await userEvent.type(screen.getAllByPlaceholderText("Precio por unidad").slice(-1)[0], "8000");
      await userEvent.click(screen.getByRole("button", { name: "Agregar opción" }));

      const formData = mockCreateOption.mock.calls[0][2] as FormData;
      expect(formData.get("color_hex")).toBeNull();
    });
  });

  describe("photo picker on the add-option form", () => {
    const IMAGES = [{ id: "img-1", url: "https://example.com/1.jpg" }];

    it("submits the product_image_id chosen from the visual picker", async () => {
      render(
        <AttributesManager
          productId="p1"
          attributes={[colorAttribute]}
          images={IMAGES}
          productPack1Qty={null}
          productPack2Qty={null}
        />
      );

      // "Usar esta foto" also appears on the existing "Chrome Gold" option's
      // own picker — the add-option form's picker is the last one rendered.
      await userEvent.type(screen.getByPlaceholderText("Nombre de la opción"), "Chrome Bronze");
      const photoButtons = screen.getAllByTitle("Usar esta foto");
      await userEvent.click(photoButtons[photoButtons.length - 1]);
      await userEvent.click(screen.getByRole("button", { name: "Agregar opción" }));

      const formData = mockCreateOption.mock.calls[0][2] as FormData;
      expect(formData.get("product_image_id")).toBe("img-1");
    });
  });

  it("renders the bulk photo uploader once there is at least one option in the photo-carrying group", () => {
    render(
      <AttributesManager productId="p1" attributes={[colorAttribute]} images={[]} productPack1Qty={null} productPack2Qty={null} />
    );

    expect(screen.getByText(/subir varias fotos y emparejar por nombre/i)).toBeInTheDocument();
  });

  describe("photos restricted to a single group", () => {
    it("disables the new-group photo checkbox when a group already has photos", () => {
      render(
        <AttributesManager productId="p1" attributes={[colorAttribute]} images={[]} productPack1Qty={null} productPack2Qty={null} />
      );

      expect(screen.getByLabelText(/este grupo tiene fotos/i)).toBeDisabled();
    });

    it("leaves the new-group photo checkbox enabled when no group has photos yet", () => {
      render(
        <AttributesManager productId="p1" attributes={[sizeAttribute]} images={[]} productPack1Qty={null} productPack2Qty={null} />
      );

      expect(screen.getByLabelText(/este grupo tiene fotos/i)).toBeEnabled();
    });

    it("hides the photo picker entirely for a group that isn't the photo-carrying one, even with images available", () => {
      render(
        <AttributesManager
          productId="p1"
          attributes={[sizeAttribute]}
          images={[{ id: "img-1", url: "https://example.com/1.jpg" }]}
          productPack1Qty={null}
          productPack2Qty={null}
        />
      );

      expect(screen.queryByRole("group", { name: /foto de la opción/i })).not.toBeInTheDocument();
      expect(screen.queryByTitle("Usar esta foto")).not.toBeInTheDocument();
    });

    it("omits non-photo-group options from the bulk uploader's match candidates", () => {
      render(
        <AttributesManager
          productId="p1"
          attributes={[colorAttribute, sizeAttribute]}
          images={[]}
          productPack1Qty={null}
          productPack2Qty={null}
        />
      );

      // Rendered at all (Color has photos) — the point is it only lists
      // Color's option as a candidate, not Talla's "18 pulgadas".
      expect(screen.getByText(/subir varias fotos y emparejar por nombre/i)).toBeInTheDocument();
    });

    it("does not render the bulk uploader when no group has photos", () => {
      render(
        <AttributesManager productId="p1" attributes={[sizeAttribute]} images={[]} productPack1Qty={null} productPack2Qty={null} />
      );

      expect(screen.queryByText(/subir varias fotos y emparejar por nombre/i)).not.toBeInTheDocument();
    });

    it("submits product_image_id as empty (not the literal string 'null') when saving an option in a non-photo group", async () => {
      render(
        <AttributesManager
          productId="p1"
          attributes={[sizeAttribute]}
          images={[{ id: "img-1", url: "https://example.com/1.jpg" }]}
          productPack1Qty={null}
          productPack2Qty={null}
        />
      );

      // The attribute-level edit form has its own "Guardar" too — the
      // option row's is the last one rendered.
      const saveButtons = screen.getAllByRole("button", { name: "Guardar" });
      await userEvent.click(saveButtons[saveButtons.length - 1]);

      const formData = mockUpdateOption.mock.calls[0][2] as FormData;
      expect(formData.get("product_image_id")).toBe("");
    });
  });
});
