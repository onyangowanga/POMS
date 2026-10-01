const DEMO_STAFF = [
  { name: "Ann Njoroge", role: "OWNER", email: "ann@aluwood.co.ke" },
  { name: "Peter Mwangi", role: "PRODUCTION", email: "peter@aluwood.co.ke" },
  { name: "Lucy Wambui", role: "ACCOUNTANT", email: "lucy@aluwood.co.ke" },
];

export default function StaffPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Staff</h1>
        <p className="text-sm text-slate-500">Role-based access: Owner, Admin, Accountant, Production, Worker.</p>
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="hidden w-full text-left text-sm md:table">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Role</th>
              <th className="px-5 py-3">Email</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {DEMO_STAFF.map((staff) => (
              <tr key={staff.email} className="hover:bg-slate-50">
                <td className="px-5 py-3 font-medium text-slate-900">{staff.name}</td>
                <td className="px-5 py-3 text-slate-600">{staff.role}</td>
                <td className="px-5 py-3 text-slate-500">{staff.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="space-y-3 p-4 md:hidden">
          {DEMO_STAFF.map((staff) => (
            <article key={staff.email} className="rounded-lg border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-semibold text-slate-900">{staff.name}</h2>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">{staff.role}</span>
              </div>
              <p className="mt-2 break-all text-sm text-slate-500">{staff.email}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
