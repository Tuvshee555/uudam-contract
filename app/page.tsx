import { redirect } from "next/navigation";
import { isLoggedIn } from "@/lib/auth";

export default async function HomePage() {
  if (await isLoggedIn()) redirect("/editor");
  redirect("/login");
}
