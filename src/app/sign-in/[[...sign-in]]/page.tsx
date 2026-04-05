"use client";

import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <SignIn
        routing="path"
        path="/sign-in"
        afterSignInUrl="/"
        signUpUrl="/sign-up"
      />
    </div>
  );
}
