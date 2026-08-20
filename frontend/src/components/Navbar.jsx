"use client";

import { useAuth } from "@/context/AuthContext";
import NavbarClient from "@/components/NavbarClient";
import Link from "next/link";

function AuthDesktop() {
  const { user, logout } = useAuth();

  return (
    <div className="flex items-center gap-3">
      {!user ? (
        <div className="flex items-center gap-3">
          <Link href="/sign-in">
            <button className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-zinc-100">
              Sign in
            </button>
          </Link>
          <Link href="/sign-up">
            <button className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-800">
              Sign up
            </button>
          </Link>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">{user.username}</span>
          <button onClick={logout} className="text-sm text-zinc-500 hover:text-black">
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

function AuthMobile() {
  const { user, logout } = useAuth();

  return (
    <div className="flex w-full flex-col gap-3">
      {!user ? (
        <div className="flex flex-col gap-2">
          <Link href="/sign-in" className="w-full">
            <button className="w-full rounded-full border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-zinc-100">
              Sign in
            </button>
          </Link>
          <Link href="/sign-up" className="w-full">
            <button className="w-full rounded-full bg-black px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800">
              Sign up
            </button>
          </Link>
        </div>
      ) : (
        <div className="flex items-center justify-between rounded-2xl border border-black/10 bg-black/5 p-3">
          <span className="text-sm font-medium">{user.username}</span>
          <button onClick={logout} className="text-sm text-zinc-500 hover:text-black">
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  return <NavbarClient authDesktop={<AuthDesktop />} authMobile={<AuthMobile />} />;
}

