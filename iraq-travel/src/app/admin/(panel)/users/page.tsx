import { requireRole } from "@/lib/auth";
import { repo } from "@/lib/store";
import { ROLES } from "@/data/types";
import { updateUserAction } from "@/app/admin/actions";
import { CreateUserForm } from "@/components/admin/create-user-form";

const ROLE_HELP: Record<string, string> = {
  super_admin: "Everything, including users and audit log",
  editor: "Governorates, sites, hotels, restaurants, transport, sources, reviews, images, translations",
  price_manager: "Fair Price records, menus and route prices",
  safety_editor: "Safety alerts and emergency contacts",
  verification_officer: "Provider verification documents and complaints",
  traveler: "No admin access",
};

export default async function UsersPage() {
  const me = await requireRole("super_admin");
  // Never pass password hashes to the client: map to safe fields only.
  const users = (await repo().list("users")).map(({ id, email, displayName, role, disabled, isDemo }) => ({ id, email, displayName, role, disabled, isDemo })).sort((a, b) => a.email.localeCompare(b.email));
  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl font-bold text-river-900">Users & roles</h1>
      <section className="card overflow-x-auto p-6">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="text-xs uppercase text-charcoal-600"><tr><th className="py-2 text-start">User</th><th className="text-start">Role</th><th className="text-start">Disabled</th><th /></tr></thead>
          <tbody className="divide-y divide-sand-200">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="py-2">{u.isDemo && <span className="me-1 rounded bg-fuchsia-600 px-1 text-[9px] font-bold text-white">DEMO</span>}{u.displayName}<span className="block font-mono text-xs text-charcoal-600">{u.email}</span></td>
                <td colSpan={3}>
                  <form action={updateUserAction.bind(null, u.id)} className="flex flex-wrap items-center gap-3">
                    <select name="role" defaultValue={u.role} className="input w-52" disabled={u.id === me.id}>{ROLES.map((r) => <option key={r} value={r}>{r}</option>)}</select>
                    {u.id === me.id && <input type="hidden" name="role" value={u.role} />}
                    <label className="flex items-center gap-1 text-xs"><input type="checkbox" name="disabled" defaultChecked={u.disabled} disabled={u.id === me.id} /> disabled</label>
                    <button className="btn-outline px-3 py-1 text-xs" disabled={u.id === me.id}>Update</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="card p-6">
        <h2 className="font-semibold text-river-900">Add staff user</h2>
        <CreateUserForm />
      </section>
      <section className="card p-6">
        <h2 className="font-semibold text-river-900">Role permissions</h2>
        <ul className="mt-3 space-y-1 text-sm">{Object.entries(ROLE_HELP).map(([r, h]) => <li key={r}><span className="font-mono text-xs">{r}</span> — {h}</li>)}</ul>
        <p className="mt-3 text-xs text-charcoal-600">Permissions are enforced on the server for every page and action (src/lib/permissions.ts), and by Row Level Security in PostgreSQL.</p>
      </section>
    </div>
  );
}
