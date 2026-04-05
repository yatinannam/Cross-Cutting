"use client";

import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <SignUp routing="path" path="/sign-up" afterSignUpUrl="/" signInUrl="/sign-in" />
    </div>
  );
}
