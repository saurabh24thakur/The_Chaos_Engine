import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import NavbarClient from "@/components/NavbarClient";

function AuthDesktop() {
  return (
    <div className="flex items-center gap-3">
      <Show when="signed-out">
        <div className="flex items-center gap-3">
          <SignInButton mode="modal">
            <button className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-zinc-100">
              Sign in
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-800">
              Sign up
            </button>
          </SignUpButton>
        </div>
      </Show>
      <Show when="signed-in">
        <UserButton afterSignOutUrl="/" />
      </Show>
    </div>
  );
}

function AuthMobile() {
  return (
    <div className="flex w-full flex-col gap-3">
      <Show when="signed-out">
        <div className="flex flex-col gap-2">
          <SignInButton mode="modal">
            <button className="w-full rounded-full border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-zinc-100">
              Sign in
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="w-full rounded-full bg-black px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800">
              Sign up
            </button>
          </SignUpButton>
        </div>
      </Show>
      <Show when="signed-in">
        <div className="flex items-center justify-between rounded-2xl border border-black/10 bg-black/5 p-3">
          <span className="text-xs font-medium">Signed in</span>
          <UserButton afterSignOutUrl="/" />
        </div>
      </Show>
    </div>
  );
}

export default function Navbar() {
  return <NavbarClient authDesktop={<AuthDesktop />} authMobile={<AuthMobile />} />;
}
