import { redirect } from "next/navigation";
import { isLoggedIn } from "@/lib/auth";
import ContractApp from "@/components/ContractApp";

export default async function EditorPage() {
  if (!(await isLoggedIn())) redirect("/login");
  return <ContractApp />;
}
