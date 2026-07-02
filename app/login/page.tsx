import { redirect } from "next/navigation";
import { isLoggedIn } from "@/lib/auth";
import LoginForm from "@/components/LoginForm";

export default async function LoginPage() {
  if (await isLoggedIn()) redirect("/editor");
  return <LoginForm />;
}
