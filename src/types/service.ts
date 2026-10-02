export interface GoGetViewsService {
  service: number;
  name: string;
  type: string;
  category: string;
  rate: string;
  min: string;
  max: string;
  refill?: boolean;
  cancel?: boolean;
}

export interface ServiceWithPricing extends GoGetViewsService {
  retailRate: number;
  platform: string;
  displayName: string;
  categoryLabel: string;
  sortOrder?: number;
  categorySortOrder?: number;
}

export interface PlatformGroup {
  id: string;
  name: string;
  serviceCount: number;
}

export type OrderStatus =
  | "pending_payment"
  | "processing"
  | "in_progress"
  | "completed"
  | "partial"
  | "cancelled"
  | "failed";

export interface StoredOrder {
  id: string;
  stripeSessionId?: string;
  gogetviewsOrderId?: number;
  serviceId: number;
  serviceName: string;
  platform: string;
  link: string;
  email?: string;
  userId?: string;
  quantity: number;
  comments?: string;
  amountCents: number;
  currency: string;
  status: OrderStatus;
  deliveryStatus?: string;
  startCount?: string;
  remains?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
}
