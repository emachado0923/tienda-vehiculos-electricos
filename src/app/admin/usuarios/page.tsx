import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";
import { setUserRoleAction } from "@/actions/user.actions";
import { formatDate } from "@/lib/utils";
import { CreateUserForm, SetPasswordForm } from "./user-forms";

export const metadata: Metadata = { title: "Usuarios" };

type PageProps = { searchParams: Promise<{ q?: string; role?: string }> };

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const me = await requireAdmin();
  const { q, role } = await searchParams;

  const where: Prisma.UserWhereInput = {
    ...(q ? { OR: [{ email: { contains: q } }, { name: { contains: q } }] } : {}),
    ...(role === "ADMIN" || role === "CUSTOMER" ? { role } : {}),
  };

  const [users, adminCount] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
      select: { id: true, name: true, email: true, role: true, createdAt: true, _count: { select: { orders: true } } },
    }),
    prisma.user.count({ where: { role: "ADMIN" } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Usuarios</h1>
        <form className="flex gap-2">
          <input name="q" defaultValue={q} placeholder="Buscar nombre o correo" className="input" />
          <select name="role" defaultValue={role ?? ""} className="input w-auto">
            <option value="">Todos</option>
            <option value="ADMIN">Administradores</option>
            <option value="CUSTOMER">Clientes</option>
          </select>
          <button className="btn-secondary">Filtrar</button>
        </form>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3">Usuario</th>
              <th className="px-4 py-3">Registro</th>
              <th className="px-4 py-3">Pedidos</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">Nueva contraseña</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => {
              const isMe = u.id === me.id;
              // No se puede degradar al último admin ni a uno mismo
              const roleLocked = isMe || (u.role === "ADMIN" && adminCount <= 1);
              return (
                <tr key={u.id} className="align-top hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium">{u.name ?? "—"} {isMe && <span className="text-xs text-slate-400">(tú)</span>}</p>
                    <p className="text-xs text-slate-500">{u.email}</p>
                  </td>
                  <td className="px-4 py-3">{formatDate(u.createdAt)}</td>
                  <td className="px-4 py-3">
                    {u._count.orders > 0 ? (
                      <Link href={`/admin/pedidos?q=${encodeURIComponent(u.email)}`} className="text-brand-700 hover:underline">{u._count.orders}</Link>
                    ) : 0}
                  </td>
                  <td className="px-4 py-3">
                    <form action={setUserRoleAction} className="flex items-center gap-2">
                      <input type="hidden" name="userId" value={u.id} />
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${u.role === "ADMIN" ? "bg-brand-100 text-brand-700" : "bg-slate-100 text-slate-600"}`}>
                        {u.role === "ADMIN" ? "Admin" : "Cliente"}
                      </span>
                      {!roleLocked && (
                        <button name="role" value={u.role === "ADMIN" ? "CUSTOMER" : "ADMIN"} className="text-xs text-brand-700 hover:underline">
                          {u.role === "ADMIN" ? "Quitar admin" : "Hacer admin"}
                        </button>
                      )}
                    </form>
                  </td>
                  <td className="px-4 py-3">
                    {isMe ? (
                      <Link href="/cuenta/seguridad" className="text-xs text-brand-700 hover:underline">Cambiar la mía</Link>
                    ) : (
                      <SetPasswordForm userId={u.id} />
                    )}
                  </td>
                </tr>
              );
            })}
            {users.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-slate-500">Sin resultados.</td></tr>}
          </tbody>
        </table>
      </div>

      <section className="card p-6">
        <h2 className="mb-4 font-semibold">Crear usuario</h2>
        <CreateUserForm />
      </section>
    </div>
  );
}
