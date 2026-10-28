"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, ChevronDown, ClipboardList, LayoutDashboard, LogOut, Menu, Stethoscope, X } from "lucide-react";
import type { ReactNode } from "react";
import type { AdminUser } from "@/types";
import { api, ApiError } from "@/lib/api";
import { LoadingState } from "@/components/common/LoadState";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/doctors", label: "Doctors", icon: Stethoscope },
  { href: "/patients", label: "Patients", icon: ClipboardList },
];

export function PortalShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const session = useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => api<{ user: AdminUser }>("/auth/me"),
    retry: false,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (session.isError && session.error instanceof ApiError && session.error.status === 401) router.replace("/login");
  }, [session.isError, session.error, router]);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  async function logout() {
    setLoggingOut(true);
    try { await api<{ message: string }>("/auth/logout", { method: "POST" }); } catch { /* Clear local state even if the server session has expired. */ }
    queryClient.clear();
    router.replace("/login");
  }

  if (session.isLoading || (session.isError && session.error instanceof ApiError && session.error.status === 401)) {
    return <main className="auth-check"><LoadingState label="Checking your secure session…" /></main>;
  }
  if (session.isError) {
    return <main className="auth-check"><div className="state-panel state-error"><Activity size={22} /><div><strong>Could not verify your session</strong><p>{session.error instanceof Error ? session.error.message : "Please check your API connection."}</p><button className="button button-primary" onClick={() => session.refetch()} type="button">Retry connection</button><button className="button button-quiet" onClick={() => router.replace("/login")} type="button">Return to sign in</button></div></div></main>;
  }

  const user = session.data?.user;
  const pageTitle = pathname.startsWith("/doctors/") ? "Doctor profile" : navItems.find((item) => pathname.startsWith(item.href))?.label || "Dashboard";
  return <div className="app-shell">
    {mobileOpen && <button className="mobile-overlay" aria-label="Close navigation" onClick={() => setMobileOpen(false)} type="button" />}
    <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
      <div className="brand"><div className="brand-mark"><Activity size={22} strokeWidth={2.5} /></div><div><strong>doctor<span>track</span></strong><small>CARE ADMINISTRATION</small></div><button className="sidebar-close icon-button" onClick={() => setMobileOpen(false)} aria-label="Close navigation" type="button"><X size={18} /></button></div>
      <div className="nav-caption">WORKSPACE</div>
      <nav className="main-nav" aria-label="Main navigation">{navItems.map((item) => {
        const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
        const Icon = item.icon;
        return <Link className={`nav-link ${active ? "nav-link-active" : ""}`} href={item.href} key={item.href} aria-current={active ? "page" : undefined}><Icon size={18} /><span>{item.label}</span>{active && <span className="nav-active-dot" />}</Link>;
      })}</nav>
      <div className="sidebar-bottom"><div className="sidebar-help"><div className="help-dot"><Activity size={15} /></div><div><strong>Everything in one place</strong><p>Keep your directory organized.</p></div></div><div className="sidebar-version">DOCTOR TRACKER <span>v1.0</span></div></div>
    </aside>
    <div className="main-column">
      <header className="topbar"><div className="topbar-left"><button className="mobile-menu icon-button" onClick={() => setMobileOpen(true)} aria-label="Open navigation" type="button"><Menu size={20} /></button><div><p className="breadcrumb">WORKSPACE <span>/</span> {pageTitle.toUpperCase()}</p><h1>{pageTitle}</h1></div></div><div className="topbar-user"><div className="online-status"><span /> System operational</div><div className="user-avatar">{user?.email?.slice(0, 1).toUpperCase() || "A"}</div><div className="user-info"><strong>Administrator</strong><span>{user?.email}</span></div><ChevronDown className="user-chevron" size={16} /><button className="button button-quiet logout-button" onClick={logout} disabled={loggingOut} type="button"><LogOut size={16} /><span>{loggingOut ? "Signing out…" : "Sign out"}</span></button></div></header>
      <main className="page-content">{children}</main>
      <footer className="app-footer"><span>Doctor Tracker <span className="footer-dot">·</span> Admin workspace</span><span>Fictional assessment data only</span></footer>
    </div>
  </div>;
}
