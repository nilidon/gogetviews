export interface SupportMessage {
  id: string;
  userId?: string;
  name?: string;
  email: string;
  message: string;
  reply?: string;
  repliedAt?: string;
  createdAt: string;
}
