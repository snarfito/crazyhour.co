import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BulkPhotoUpload } from "./bulk-photo-upload";

const mockUploadProductImage = vi.fn();
vi.mock("./upload-product-image", () => ({
  uploadProductImage: (...args: unknown[]) => mockUploadProductImage(...args),
}));

const mockLinkOptionImage = vi.fn().mockResolvedValue(undefined);
vi.mock("./attributes-actions", () => ({
  linkOptionImage: (...args: unknown[]) => mockLinkOptionImage(...args),
}));

const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

const OPTIONS = [
  { id: "opt-gold", displayName: "Chrome Gold" },
  { id: "opt-silver", displayName: "Chrome Silver" },
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe("BulkPhotoUpload", () => {
  it("renders nothing when there are no options to match against", () => {
    const { container } = render(<BulkPhotoUpload productId="p1" options={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("uploads each file, links matches by filename, and reports unmatched ones", async () => {
    mockUploadProductImage
      .mockResolvedValueOnce({ id: "img-1", url: "https://example.com/1.jpg" })
      .mockResolvedValueOnce({ id: "img-2", url: "https://example.com/2.jpg" });

    render(<BulkPhotoUpload productId="p1" options={OPTIONS} />);
    const input = screen.getByLabelText(/elegir fotos/i);
    const files = [
      new File(["a"], "chrome-gold.jpg", { type: "image/jpeg" }),
      new File(["b"], "random-photo.jpg", { type: "image/jpeg" }),
    ];

    await userEvent.upload(input, files);

    expect(mockUploadProductImage).toHaveBeenCalledTimes(2);
    expect(mockLinkOptionImage).toHaveBeenCalledTimes(1);
    expect(mockLinkOptionImage).toHaveBeenCalledWith("opt-gold", "p1", "img-1");
    expect(await screen.findByText(/emparejadas:/i)).toHaveTextContent("chrome-gold.jpg → Chrome Gold");
    expect(screen.getByText(/sin pareja/i)).toHaveTextContent("random-photo.jpg");
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("reports an upload failure as unmatched instead of throwing", async () => {
    mockUploadProductImage.mockRejectedValueOnce(new Error("Storage is down"));

    render(<BulkPhotoUpload productId="p1" options={OPTIONS} />);
    const input = screen.getByLabelText(/elegir fotos/i);

    await userEvent.upload(input, new File(["a"], "chrome-gold.jpg", { type: "image/jpeg" }));

    expect(await screen.findByText(/sin pareja/i)).toHaveTextContent("chrome-gold.jpg (error al subir)");
    expect(mockLinkOptionImage).not.toHaveBeenCalled();
  });
});
