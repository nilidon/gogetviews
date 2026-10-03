import { ContactForm } from "@/app/contact/ContactForm";
import { getCurrentAccount } from "@/lib/account-auth";

export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const account = await getCurrentAccount();
  return <ContactForm email={account?.email ?? ""} />;
}
