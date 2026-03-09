export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background/80 mt-12">
      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-neon-cyan to-neon-purple opacity-50" />
      <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Branding */}
        <div className="flex items-center gap-2.5">
          <img
            src="/assets/generated/ind-esports-logo-trident-gun-transparent.dim_400x400.png"
            alt="IND eSports"
            className="w-6 h-6 object-contain opacity-70"
          />
          <div>
            <span className="font-display font-black text-sm tracking-wider uppercase text-foreground/70">
              IND <span className="text-primary">eSports</span>
            </span>
          </div>
        </div>

        {/* Attribution */}
        <p className="text-[10px] text-muted-foreground/60 text-center font-mono">
          © {year} IND eSports. built with ♥️ by Sagar.
        </p>

        <div className="text-[10px] text-muted-foreground/40 font-mono uppercase tracking-widest">
          BGMI &amp; Free Fire MAX Tournament Platform
        </div>
      </div>
    </footer>
  );
}
