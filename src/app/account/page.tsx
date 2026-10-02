import { redirect } from "next/navigation";
import { AccountDashboard } from "@/app/account/AccountDashboard";
import { getCurrentAccount } from "@/lib/account-auth";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const account = await getCurrentAccount();
  if (!account) redirect("/login");

  return (
    <AccountDashboard email={account.email} freeViewsClaimed={account.freeViewsClaimed} />
  );
}
