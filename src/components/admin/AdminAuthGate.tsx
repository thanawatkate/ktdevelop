"use client";

import Script from "next/script";
import { FormEvent, ReactNode, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FormInput } from "../forms";

interface AdminAuthGateProps {
  initialAuthorized: boolean;
  children: ReactNode;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: Record<string, string | number | boolean>
          ) => void;
        };
      };
    };
  }
}

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

export function AdminAuthGate({ initialAuthorized, children }: AdminAuthGateProps) {
  const router = useRouter();
  const googleButtonRef = useRef<HTMLDivElement | null>(null);
  const googleInitializedRef = useRef(false);

  const [isAuthorized, setIsAuthorized] = useState(initialAuthorized);
  const [actor, setActor] = useState("admin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const googleEnabled = Boolean(GOOGLE_CLIENT_ID);

  async function loginWithGoogleCredential(credential: string) {
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/login/google", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ credential }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Google login failed.");
      }

      setIsAuthorized(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google login failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    if (!googleEnabled || isAuthorized || !window.google || !googleButtonRef.current || googleInitializedRef.current) {
      return;
    }

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response) => {
        const credential = response.credential?.trim();
        if (credential) {
          void loginWithGoogleCredential(credential);
        }
      },
    });

    googleButtonRef.current.innerHTML = "";
    window.google.accounts.id.renderButton(googleButtonRef.current, {
      theme: "outline",
      size: "large",
      shape: "pill",
      width: 320,
      text: "signin_with",
    });

    googleInitializedRef.current = true;
  }, [googleEnabled, isAuthorized]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ actor, username, password }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Login failed.");
      }

      setIsAuthorized(true);
      setPassword("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isAuthorized) {
    return <>{children}</>;
  }

  return (
    <>
      {googleEnabled ? (
        <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
      ) : null}

      <div className="pointer-events-none opacity-100">{children}</div>

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/45 p-4 backdrop-blur-[1px]">
        <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200">
          <div className="bg-gradient-to-r from-indigo-600 via-cyan-600 to-teal-500 px-6 py-5 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.22em]">KT Develop Admin</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">Sign in to continue</h2>
          </div>

          <div className="px-6 py-5">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <FormInput
                id="admin-username"
                type="text"
                label="Username or Email"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="username or admin@gmail.com"
                autoComplete="username"
              />

              <FormInput
                id="admin-password"
                type="password"
                label="Password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter password"
                autoComplete="current-password"
              />

              {error ? <p className="text-sm text-rose-600">{error}</p> : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {isSubmitting ? "Signing in..." : "Sign in with Username / Password"}
              </button>
            </form>

            {googleEnabled ? (
              <>
                <div className="my-4 flex items-center gap-3">
                  <div className="h-px flex-1 bg-slate-200" />
                  <span className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">or</span>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>
                <div className="flex justify-center">
                  <div ref={googleButtonRef} />
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}