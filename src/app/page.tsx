"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";

export default function Home() {
  const router = useRouter();
  const { user, isLoading, login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoading && user) router.replace(user.role === "OWNER" ? "/dashboard" : "/dashboard/jobs");
  }, [isLoading, router, user]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!login(username.trim().toLowerCase(), password)) {
      setError("The username or password is incorrect.");
    }
  }

  if (isLoading || user) {
    return <main className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">Loading POMS...</main>;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
        <div className="flex flex-col items-center text-center">
          <Image src="/favicon/apple-touch-icon.png" alt="POMS logo" width={88} height={88} className="rounded-2xl" priority />
          <h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-900">Welcome to POMS</h1>
          <p className="mt-1 text-sm text-slate-500">Printers Operations Management System</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-slate-700">Username</label>
            <input id="username" value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" required className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100" />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">Password</label>
            <div className="relative mt-1.5">
              <input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required className="w-full rounded-lg border border-slate-300 px-3 py-2.5 pr-20 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100" />
              <button type="button" onClick={() => setShowPassword((visible) => !visible)} className="absolute inset-y-0 right-0 px-3 text-xs font-medium text-slate-500 hover:text-teal-700">{showPassword ? "Hide" : "Show"}</button>
            </div>
          </div>
          {error ? <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
          <button type="submit" className="w-full rounded-lg bg-teal-700 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800">Sign in</button>
        </form>

        <div className="mt-5 text-center"><a href="mailto:support@poms.local?subject=Password%20reset" className="text-sm font-medium text-teal-700 hover:underline">Forgot password?</a></div>
        <p className="mt-7 text-center text-xs text-slate-400">Demo access: owner / owner123 or staff / staff123</p>
      </section>
    </main>
  );
}
