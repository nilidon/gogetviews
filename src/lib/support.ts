import { createServiceClient } from "@/lib/supabase";

export interface SupportMessage {
  id: string;
  userId: string;
  email: string;
  message: string;
  createdAt: string;
}

interface SupportRow {
  id: string;
  user_id: string;
  email: string;
  message: string;
  created_at: string;
}

function toMessage(row: SupportRow): SupportMessage {
  return {
    id: row.id,
    userId: row.user_id,
    email: row.email,
    message: row.message,
    createdAt: row.created_at,
  };
}

export async function listSupportMessages(): Promise<SupportMessage[]> {
  const { data, error } = await createServiceClient()
    .from("support_messages")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as SupportRow[]).map(toMessage);
}

export async function createSupportMessage(
  userId: string,
  email: string,
  message: string,
): Promise<SupportMessage> {
  const { data, error } = await createServiceClient()
    .from("support_messages")
    .insert({ user_id: userId, email, message })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return toMessage(data as SupportRow);
}
