/**
 * Order-related types for the JadeNode marketplace.
 */

/** Payment method used for an Order or Invoice. */
export type PaymentMethod = "wallet" | "gateway";

/** Order as placed by a Customer. */
export interface Order {
  id: string;
  publicId: string;
  customerId: string;
  status: string;
  items: OrderItem[];
  totalAmount: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

/** A line item inside an Order. */
export interface OrderItem {
  id: string;
  orderId: string;
  productListingId: string;
  productName: string;
  resourceType: string;
  specs: Record<string, unknown>;
  billingCycle: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  currency: string;
}

/** Invoice for billing an Order. */
export interface Invoice {
  id: string;
  publicId: string;
  orderId: string;
  amount: number;
  currency: string;
  status: string;
  dueDate: string;
  paidAt?: string;
  pdfUrl?: string;
  createdAt: string;
  updatedAt: string;
}

/** Payment record linked to an Invoice. */
export interface Payment {
  id: string;
  publicId: string;
  invoiceId: string;
  method: PaymentMethod;
  gateway?: string;
  amount: number;
  currency: string;
  status: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}
