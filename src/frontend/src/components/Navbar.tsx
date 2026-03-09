import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { LogIn, LogOut, Menu, Shield, Smartphone, User, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useIsCallerAdmin } from "../hooks/useQueries";

function LaunchBGMIButton({ className = "" }: { className?: string }) {
  const handleLaunch = () => {
    window.location.href =
      "intent://com.pubg.imobile#Intent;scheme=bgmi;package=com.pubg.imobile;end";
  };

  return (
    <Button
      onClick={handleLaunch}
      data-ocid="nav.launch_bgmi_button"
      className={`neon-btn-gold text-xs px-3 py-1.5 flex items-center gap-1.5 ${className}`}
      size="sm"
    >
      <Smartphone className="w-3 h-3" />
      <span className="hidden sm:inline">Launch</span> BGMI
    </Button>
  );
}

function LaunchFFButton({ className = "" }: { className?: string }) {
  const handleLaunch = () => {
    window.location.href =
      "intent://com.dts.freefiremax#Intent;scheme=freefiremax;package=com.dts.freefiremax;end";
  };

  return (
    <Button
      onClick={handleLaunch}
      data-ocid="nav.launch_freefire_button"
      className={`neon-btn-ff text-xs px-3 py-1.5 flex items-center gap-1.5 ${className}`}
      size="sm"
    >
      <Smartphone className="w-3 h-3" />
      <span className="hidden sm:inline">Launch</span> FF
    </Button>
  );
}

export function Navbar() {
  const { login, clear, identity, isLoggingIn, isInitializing } =
    useInternetIdentity();
  const { data: isAdmin } = useIsCallerAdmin();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isLoggedIn = !!identity;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-xl">
      {/* Top accent line - cyan to orange gradient */}
      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-neon-cyan to-neon-ff opacity-70" />

      <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          to="/"
          data-ocid="nav.home_link"
          className="flex items-center gap-2.5 group shrink-0"
        >
          <div className="relative w-9 h-9 shrink-0">
            <img
              src="/assets/generated/ind-esports-logo-trident-gun-transparent.dim_400x400.png"
              alt="IND eSports Logo"
              className="w-full h-full object-contain drop-shadow-[0_0_8px_oklch(0.86_0.22_198/0.7)] group-hover:drop-shadow-[0_0_14px_oklch(0.86_0.22_198/0.9)] transition-all duration-300"
            />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-display font-black text-base tracking-[0.1em] uppercase text-foreground group-hover:text-primary transition-colors">
              IND <span className="text-primary glow-text-cyan">eSports</span>
            </span>
            <span className="text-[8px] font-mono text-muted-foreground/60 tracking-widest uppercase hidden sm:block">
              BGMI &amp; Free Fire MAX Hub
            </span>
          </div>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-6">
          <Link
            to="/"
            data-ocid="nav.home_link"
            className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-[0.1em]"
            activeProps={{ className: "text-primary glow-text-cyan" }}
          >
            Tournaments
          </Link>
          {isLoggedIn && (
            <Link
              to="/my-registrations"
              data-ocid="nav.registrations_link"
              className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-[0.1em]"
              activeProps={{ className: "text-primary glow-text-cyan" }}
            >
              My Slots
            </Link>
          )}
          {isAdmin && (
            <Link
              to="/admin"
              data-ocid="nav.admin_link"
              className="text-xs font-bold text-muted-foreground hover:text-neon-gold transition-colors uppercase tracking-[0.1em] flex items-center gap-1"
              activeProps={{ className: "text-neon-gold glow-text-gold" }}
            >
              <Shield className="w-3 h-3" />
              Admin
            </Link>
          )}
        </div>

        {/* Right side: Launch BGMI + Launch FF + auth */}
        <div className="hidden md:flex items-center gap-2">
          <LaunchBGMIButton />
          <LaunchFFButton />

          {isLoggedIn ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-border bg-muted/20">
                <User className="w-3 h-3 text-primary" />
                <span className="text-[10px] text-muted-foreground font-mono">
                  {identity?.getPrincipal().toString().slice(0, 8)}…
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clear}
                data-ocid="nav.logout_button"
                className="text-muted-foreground hover:text-destructive border border-transparent hover:border-destructive/40 transition-all uppercase tracking-[0.08em] text-[10px] h-8"
              >
                <LogOut className="w-3 h-3 mr-1" />
                Logout
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              onClick={login}
              disabled={isLoggingIn || isInitializing}
              data-ocid="nav.login_button"
              className="neon-btn px-4 py-1.5 text-[10px] h-8"
            >
              {isLoggingIn ? (
                <span className="animate-pulse">Connecting…</span>
              ) : (
                <>
                  <LogIn className="w-3 h-3 mr-1.5" />
                  Login
                </>
              )}
            </Button>
          )}
        </div>

        {/* Mobile: Launch buttons + menu toggle */}
        <div className="md:hidden flex items-center gap-1.5">
          <LaunchBGMIButton className="!px-2" />
          <LaunchFFButton className="!px-2" />
          <button
            type="button"
            className="p-2 text-muted-foreground hover:text-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-border bg-background/95 backdrop-blur-md"
          >
            <div className="container mx-auto px-4 py-4 flex flex-col gap-3">
              <Link
                to="/"
                data-ocid="nav.home_link"
                onClick={() => setMobileOpen(false)}
                className="text-sm font-bold text-muted-foreground hover:text-primary py-2 uppercase tracking-[0.1em]"
              >
                Tournaments
              </Link>
              {isLoggedIn && (
                <Link
                  to="/my-registrations"
                  data-ocid="nav.registrations_link"
                  onClick={() => setMobileOpen(false)}
                  className="text-sm font-bold text-muted-foreground hover:text-primary py-2 uppercase tracking-[0.1em]"
                >
                  My Slots
                </Link>
              )}
              {isAdmin && (
                <Link
                  to="/admin"
                  data-ocid="nav.admin_link"
                  onClick={() => setMobileOpen(false)}
                  className="text-sm font-bold text-muted-foreground hover:text-neon-gold py-2 uppercase tracking-[0.1em] flex items-center gap-1"
                >
                  <Shield className="w-3.5 h-3.5" />
                  Admin Panel
                </Link>
              )}
              <div className="pt-2 border-t border-border">
                {isLoggedIn ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      clear();
                      setMobileOpen(false);
                    }}
                    data-ocid="nav.logout_button"
                    className="text-destructive w-full justify-start uppercase tracking-[0.08em] text-xs"
                  >
                    <LogOut className="w-3 h-3 mr-2" />
                    Logout
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => {
                      login();
                      setMobileOpen(false);
                    }}
                    disabled={isLoggingIn || isInitializing}
                    data-ocid="nav.login_button"
                    className="neon-btn w-full text-xs"
                  >
                    <LogIn className="w-3 h-3 mr-2" />
                    Login to Play
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
