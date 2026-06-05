import { users } from "@/lib/db/schema";
import { and, isNotNull, type SQL } from "drizzle-orm";

/** Contas criadas via cadastro com e-mail e senha (exclui usuários do seed). */
export function realUsersOnly(): SQL {
  return and(isNotNull(users.email), isNotNull(users.passwordHash))!;
}
