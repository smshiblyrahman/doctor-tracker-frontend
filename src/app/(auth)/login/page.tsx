"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Activity, ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, Stethoscope } from "lucide-react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { AdminUser } from "@/types";

export default function LoginPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");

  useEffect(() => {
    let active = true;
    api<{ user: AdminUser }>("/auth/me").then(() => { if (active) router.replace("/dashboard"); }).catch(() => undefined);
    return () => { active = false; };
  }, [router]);

  const login = useMutation({
    mutationFn: (values: { email: string; password: string }) => api<{ user: AdminUser }>("/auth/login", { method: "POST", body: JSON.stringify(values) }),
    onSuccess: (result) => {
      queryClient.setQueryData(["auth", "me"], result);
      router.replace("/dashboard");
    },
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidationMessage("");
    if (!email.trim() || !password) { setValidationMessage("Enter both your administrator email and password."); return; }
    login.mutate({ email: email.trim(), password });
  }

  return <main className="login-layout">
    <section className="login-showcase"><div className="showcase-brand"><div className="brand-mark"><Activity size={23} strokeWidth={2.5} /></div><div><strong>doctor<span>track</span></strong><small>CARE ADMINISTRATION</small></div></div><div className="showcase-copy"><span className="showcase-pill"><span /> CARE OPERATIONS, SIMPLIFIED</span><h1>Better visibility.<br /><em>More connected</em> care.</h1><p>A thoughtful workspace for managing your doctor directory, keeping patient records organized, and understanding your practice at a glance.</p><div className="showcase-points"><div><span className="showcase-point-icon"><Stethoscope size={18} /></span><div><strong>Doctor directory</strong><small>One clear view of your care team</small></div></div><div><span className="showcase-point-icon"><Activity size={18} /></span><div><strong>Useful insights</strong><small>Metrics that make activity visible</small></div></div></div></div><div className="showcase-footer"><span>DESIGNED FOR CLARITY</span><span>SECURE ADMIN ACCESS</span></div><div className="showcase-orb orb-one" /><div className="showcase-orb orb-two" /></section>
    <section className="login-panel"><div className="login-card"><div className="login-mobile-brand"><div className="brand-mark"><Activity size={21} /></div><strong>doctor<span>track</span></strong></div><div className="login-heading"><span className="login-icon"><LockKeyhole size={21} /></span><p className="eyebrow">WELCOME BACK</p><h2>Sign in to your workspace</h2><p>Enter your administrator credentials to continue.</p></div>
      <form className="login-form" onSubmit={submit} noValidate>
        <label className="field-label" htmlFor="email">Administrator email</label><div className="input-with-icon"><Mail size={17} /><input id="email" type="email" autoComplete="username" placeholder="admin@yourorganization.com" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
        <div className="field-label-row"><label className="field-label" htmlFor="password">Password</label></div><div className="input-with-icon"><LockKeyhole size={17} /><input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required /><button type="button" className="password-toggle" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>
        {(validationMessage || login.error) && <div className="form-alert" role="alert">{validationMessage || (login.error instanceof Error ? login.error.message : "Unable to sign in. Please try again.")}</div>}
        <button className="button button-primary login-submit" type="submit" disabled={login.isPending}>{login.isPending ? <><span className="button-spinner" /> Signing in…</> : <>Sign in securely <ArrowRight size={17} /></>}</button>
      </form>
      <div className="secure-note"><ShieldCheck size={17} /><span>Your session is protected with secure, HTTP-only authentication.</span></div><div className="login-footnote">Need access? Contact the system administrator.</div>
    </div><div className="login-copyright">© {new Date().getFullYear()} Doctor Tracker <span>·</span> Administrative portal</div></section>
  </main>;
}
