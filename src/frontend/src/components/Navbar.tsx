import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { LogIn, LogOut, Menu, Shield, Trophy, User, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useIsCallerAdmin } from "../hooks/useQueries";

export function Navbar() {
  const { login, clear, identity, isLoggingIn, isInitializing } =
    useInternetIdentity();
  const { data: isAdmin } = useIsCallerAdmin();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isLoggedIn = !!identity;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
      {/* Top accent line */}
      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-neon-cyan to-transparent opacity-60" />

      <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          to="/"
          data-ocid="nav.home_link"
          className="flex items-center gap-2 group"
        >
          <div className="w-8 h-8 rounded-sm flex items-center justify-center bg-primary/10 border border-primary/30 group-hover:border-primary/60 transition-all glow-border-cyan">
            <Trophy className="w-4 h-4 text-primary" />
          </div>
          <span className="font-display font-bold text-lg tracking-wider text-foreground group-hover:text-primary transition-colors">
            BGMI<span className="text-primary glow-text-cyan">HUB</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          <Link
            to="/"
            data-ocid="nav.home_link"
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors uppercase tracking-wider"
            activeProps={{ className: "text-primary glow-text-cyan" }}
          >
            Tournaments
          </Link>
          {isLoggedIn && (
            <Link
              to="/my-registrations"
              data-ocid="nav.my_registrations_link"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors uppercase tracking-wider"
              activeProps={{ className: "text-primary glow-text-cyan" }}
            >
              My Registrations
            </Link>
          )}
          {isAdmin && (
            <Link
              to="/admin"
              data-ocid="nav.admin_link"
              className="text-sm font-medium text-muted-foreground hover:text-accent transition-colors uppercase tracking-wider flex items-center gap-1"
              activeProps={{ className: "text-accent glow-text-green" }}
            >
              <Shield className="w-3 h-3" />
              Admin
            </Link>
          )}
        </div>

        {/* Auth buttons */}
        <div className="hidden md:flex items-center gap-3">
          {isLoggedIn ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1 rounded border border-border bg-muted/30">
                <User className="w-3 h-3 text-primary" />
                <span className="text-xs text-muted-foreground font-mono">
                  {identity?.getPrincipal().toString().slice(0, 8)}...
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clear}
                data-ocid="nav.logout_button"
                className="text-muted-foreground hover:text-destructive border border-transparent hover:border-destructive/40 transition-all uppercase tracking-wider text-xs"
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
              className="neon-btn px-4 py-1.5 text-xs"
            >
              {isLoggingIn ? (
                <span className="animate-pulse">Connecting...</span>
              ) : (
                <>
                  <LogIn className="w-3 h-3 mr-1.5" />
                  Login
                </>
              )}
            </Button>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          type="button"
          className="md:hidden p-2 text-muted-foreground hover:text-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>
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
                className="text-sm font-medium text-muted-foreground hover:text-primary py-2 uppercase tracking-wider"
              >
                Tournaments
              </Link>
              {isLoggedIn && (
                <Link
                  to="/my-registrations"
                  data-ocid="nav.my_registrations_link"
                  onClick={() => setMobileOpen(false)}
                  className="text-sm font-medium text-muted-foreground hover:text-primary py-2 uppercase tracking-wider"
                >
                  My Registrations
                </Link>
              )}
              {isAdmin && (
                <Link
                  to="/admin"
                  data-ocid="nav.admin_link"
                  onClick={() => setMobileOpen(false)}
                  className="text-sm font-medium text-muted-foreground hover:text-accent py-2 uppercase tracking-wider flex items-center gap-1"
                >
                  <Shield className="w-3 h-3" />
                  Admin
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
                    className="text-destructive w-full justify-start uppercase tracking-wider text-xs"
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
