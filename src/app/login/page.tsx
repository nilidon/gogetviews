import { redirect } from "next/navigation";
import { LoginForm } from "@/app/login/LoginForm";
import { getCurrentAccount } from "@/lib/account-auth";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const account = await getCurrentAccount();
  if (account) redirect("/account");
  return <LoginForm />;
}
