"use client";

import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-linear-to-br from-slate-950 via-blue-950 to-cyan-950 p-4 sm:p-6">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-20 h-72 w-72 rounded-full bg-cyan-400/25 blur-3xl" />
        <div className="absolute top-1/4 -right-24 h-80 w-80 rounded-full bg-blue-500/25 blur-3xl" />
        <div className="absolute -bottom-24 left-1/4 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-md items-center justify-center">
        <SignIn
          routing="path"
          path="/sign-in"
          forceRedirectUrl="/"
          signUpUrl="/sign-up"
          appearance={{
            variables: {
              colorPrimary: "#2563EB",
              colorBackground: "#FFFFFF",
              colorText: "#0F172A",
              colorTextSecondary: "#475569",
              borderRadius: "0.8rem",
            },
            elements: {
              rootBox: "w-full",
              cardBox:
                "w-full border border-slate-200/70 bg-white/95 shadow-2xl shadow-slate-900/15",
              headerTitle: "text-slate-900 text-2xl",
              headerSubtitle: "text-slate-500",
              formFieldInput:
                "min-h-11 border-slate-300 bg-white focus:border-blue-500 focus:ring-blue-500/20",
              formButtonPrimary:
                "min-h-11 bg-blue-600 text-white hover:bg-blue-700",
              socialButtonsBlockButton:
                "min-h-11 border-slate-300 bg-white hover:bg-slate-50",
              dividerLine: "bg-slate-200",
              dividerText: "text-slate-400",
              footerActionLink: "text-blue-600 hover:text-blue-700",
            },
          }}
        />
      </div>
    </div>
  );
}
