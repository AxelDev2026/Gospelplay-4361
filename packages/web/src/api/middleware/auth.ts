import { ORPCError } from "@orpc/server";
import { base } from "../__core/app";
import { auth } from "../auth";
export const authed = base.use(async ({ context, next }) => {
  const session = await auth.api.getSession({ headers: context.headers });
  if (!session)
    throw new ORPCError("UNAUTHORIZED", { message: "Entre na sua conta para continuar." });
  return next({ context: { user: session.user } });
});
export const admin = authed.use(async ({ context, next }) => {
  if (
    !process.env.ADMIN_EMAIL ||
    context.user.email.toLowerCase() !== process.env.ADMIN_EMAIL.toLowerCase()
  )
    throw new ORPCError("FORBIDDEN", {
      message: "Somente o administrador configurado pode publicar músicas.",
    });
  return next();
});
