import { redirect } from "next/navigation";

export default function Home() {
  // El proxy manda a /login si no hay sesión; a /panel si la hay.
  redirect("/panel");
}
