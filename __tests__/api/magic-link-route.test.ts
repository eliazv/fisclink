import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const prisma = vi.hoisted(() => ({
  magicLink: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  customer: {
    create: vi.fn(),
    update: vi.fn(),
  },
  invoice: {
    update: vi.fn(),
  },
  auditLog: {
    create: vi.fn(),
  },
}));

const queue = vi.hoisted(() => ({
  enqueueInvoiceProcess: vi.fn(),
}));

vi.mock("@/lib/db", () => ({ prisma }));
vi.mock("@/lib/queue", () => queue);

function postRequest(body: unknown) {
  return new NextRequest("http://localhost/api/magic-link/token_123", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe("/api/magic-link/[token]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns completed state for an already completed link", async () => {
    const { GET } = await import("@/app/api/magic-link/[token]/route");

    prisma.magicLink.findUnique.mockResolvedValue({
      isCompleted: true,
      merchant: { name: "Merchant", logoUrl: null, brandColor: null },
    });

    const response = await GET(new NextRequest("http://localhost"), {
      params: Promise.resolve({ token: "token_123" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe("completed");
  });

  it("marks an expired link as expired on read", async () => {
    const { GET } = await import("@/app/api/magic-link/[token]/route");

    prisma.magicLink.findUnique.mockResolvedValue({
      id: "ml_123",
      isCompleted: false,
      isExpired: false,
      expiresAt: new Date(Date.now() - 1000),
      merchant: { name: "Merchant", logoUrl: null, brandColor: null },
    });
    prisma.magicLink.update.mockResolvedValue({});

    const response = await GET(new NextRequest("http://localhost"), {
      params: Promise.resolve({ token: "token_123" }),
    });

    expect(response.status).toBe(410);
    expect(prisma.magicLink.update).toHaveBeenCalledWith({
      where: { id: "ml_123" },
      data: { isExpired: true },
    });
  });

  it("accepts a foreign customer without Italian address fields", async () => {
    const { POST } = await import("@/app/api/magic-link/[token]/route");

    prisma.magicLink.findUnique.mockResolvedValue({
      id: "ml_123",
      token: "token_123",
      merchantId: "merchant_123",
      invoiceId: "invoice_123",
      customerId: "customer_123",
      isCompleted: false,
      isExpired: false,
      expiresAt: new Date(Date.now() + 86_400_000),
      invoice: {
        id: "invoice_123",
        sourceType: "STRIPE",
        sourceId: "in_123",
      },
    });
    prisma.customer.update.mockResolvedValue({});
    prisma.magicLink.update.mockResolvedValue({});
    prisma.auditLog.create.mockResolvedValue({});
    queue.enqueueInvoiceProcess.mockResolvedValue({});

    const response = await POST(
      postRequest({
        customerType: "FOREIGN",
        name: "Hans Mueller",
        country: "DE",
      }),
      { params: Promise.resolve({ token: "token_123" }) },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(prisma.customer.update).toHaveBeenCalledWith({
      where: { id: "customer_123" },
      data: expect.objectContaining({
        name: "Hans Mueller",
        country: "DE",
        address: null,
        province: null,
        zipCode: null,
      }),
    });
    expect(queue.enqueueInvoiceProcess).toHaveBeenCalledWith({
      invoiceId: "invoice_123",
      merchantId: "merchant_123",
      sourceType: "STRIPE",
      sourceId: "in_123",
    });
  });

  it("rejects an Italian customer without required address fields", async () => {
    const { POST } = await import("@/app/api/magic-link/[token]/route");

    prisma.magicLink.findUnique.mockResolvedValue({
      id: "ml_123",
      merchantId: "merchant_123",
      invoiceId: "invoice_123",
      customerId: "customer_123",
      isCompleted: false,
      isExpired: false,
      expiresAt: new Date(Date.now() + 86_400_000),
      invoice: {
        id: "invoice_123",
        sourceType: "STRIPE",
        sourceId: "in_123",
      },
    });

    const response = await POST(
      postRequest({
        customerType: "BUSINESS",
        name: "Acme SRL",
        country: "IT",
        vatNumber: "12345678903",
      }),
      { params: Promise.resolve({ token: "token_123" }) },
    );
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.details).toEqual(
      expect.arrayContaining([
        "address: Indirizzo obbligatorio per clienti italiani",
        "city: Citta obbligatoria per clienti italiani",
        "zipCode: CAP obbligatorio per clienti italiani",
        "province: Provincia obbligatoria per clienti italiani",
      ]),
    );
    expect(prisma.customer.update).not.toHaveBeenCalled();
  });
});
