import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const prisma = vi.hoisted(() => ({
  invoice: {
    findFirst: vi.fn(),
  },
  magicLink: {
    create: vi.fn(),
    update: vi.fn(),
  },
  auditLog: {
    create: vi.fn(),
  },
}));

const queue = vi.hoisted(() => ({
  enqueueMagicLinkSend: vi.fn(),
}));

vi.mock("@/lib/db", () => ({ prisma }));
vi.mock("@/lib/queue", () => queue);
vi.mock("nanoid", () => ({ nanoid: () => "new_token_123" }));

function authedPost() {
  return new NextRequest(
    "http://localhost/api/invoices/invoice_123/magic-link/resend",
    {
      method: "POST",
      headers: { "x-merchant-id": "merchant_123" },
    },
  );
}

describe("/api/invoices/[invoiceId]/magic-link/resend", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requires authentication", async () => {
    const { POST } = await import(
      "@/app/api/invoices/[invoiceId]/magic-link/resend/route"
    );

    const response = await POST(
      new NextRequest("http://localhost", { method: "POST" }),
      { params: Promise.resolve({ invoiceId: "invoice_123" }) },
    );

    expect(response.status).toBe(401);
  });

  it("only resends links for invoices pending fiscal data", async () => {
    const { POST } = await import(
      "@/app/api/invoices/[invoiceId]/magic-link/resend/route"
    );

    prisma.invoice.findFirst.mockResolvedValue({
      id: "invoice_123",
      merchantId: "merchant_123",
      status: "READY",
      customer: { email: "customer@example.test" },
      magicLinks: [],
    });

    const response = await POST(authedPost(), {
      params: Promise.resolve({ invoiceId: "invoice_123" }),
    });

    expect(response.status).toBe(409);
    expect(queue.enqueueMagicLinkSend).not.toHaveBeenCalled();
  });

  it("renews an expired link and queues email sending", async () => {
    const { POST } = await import(
      "@/app/api/invoices/[invoiceId]/magic-link/resend/route"
    );

    prisma.invoice.findFirst.mockResolvedValue({
      id: "invoice_123",
      merchantId: "merchant_123",
      status: "PENDING_DATA",
      customerId: "customer_123",
      customer: { email: "customer@example.test" },
      sourceData: null,
      magicLinks: [
        {
          id: "ml_123",
          token: "old_token",
          isCompleted: false,
          isExpired: true,
          expiresAt: new Date(Date.now() - 1000),
        },
      ],
    });
    prisma.magicLink.update.mockResolvedValue({
      id: "ml_123",
      expiresAt: new Date(Date.now() + 86_400_000),
    });
    prisma.auditLog.create.mockResolvedValue({});
    queue.enqueueMagicLinkSend.mockResolvedValue({});

    const response = await POST(authedPost(), {
      params: Promise.resolve({ invoiceId: "invoice_123" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(prisma.magicLink.update).toHaveBeenCalledWith({
      where: { id: "ml_123" },
      data: expect.objectContaining({
        token: "new_token_123",
        isExpired: false,
      }),
    });
    expect(queue.enqueueMagicLinkSend).toHaveBeenCalledWith({
      magicLinkId: "ml_123",
      invoiceId: "invoice_123",
      merchantId: "merchant_123",
      customerEmail: "customer@example.test",
    });
    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        merchantId: "merchant_123",
        invoiceId: "invoice_123",
        action: "MAGIC_LINK_RESENT",
      }),
    });
  });

  it("creates a link when the invoice has no existing magic link", async () => {
    const { POST } = await import(
      "@/app/api/invoices/[invoiceId]/magic-link/resend/route"
    );

    prisma.invoice.findFirst.mockResolvedValue({
      id: "invoice_123",
      merchantId: "merchant_123",
      status: "PENDING_DATA",
      customerId: null,
      customer: null,
      sourceData: { customerEmail: "from-source@example.test" },
      magicLinks: [],
    });
    prisma.magicLink.create.mockResolvedValue({
      id: "ml_new",
      expiresAt: new Date(Date.now() + 86_400_000),
    });
    prisma.auditLog.create.mockResolvedValue({});
    queue.enqueueMagicLinkSend.mockResolvedValue({});

    const response = await POST(authedPost(), {
      params: Promise.resolve({ invoiceId: "invoice_123" }),
    });

    expect(response.status).toBe(200);
    expect(prisma.magicLink.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        token: "new_token_123",
        merchantId: "merchant_123",
        invoiceId: "invoice_123",
        customerId: null,
      }),
    });
    expect(queue.enqueueMagicLinkSend).toHaveBeenCalledWith(
      expect.objectContaining({
        customerEmail: "from-source@example.test",
      }),
    );
  });
});
