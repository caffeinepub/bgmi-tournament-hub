import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Phone, User, Wallet } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetUserProfile, useSaveUserProfile } from "../hooks/useQueries";

export function AccountSetupModal() {
  const { identity } = useInternetIdentity();
  const { data: userProfile, isLoading } = useGetUserProfile();
  const saveProfile = useSaveUserProfile();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [upiId, setUpiId] = useState("");

  // Show modal only when logged in + profile is null (first time)
  const isOpen = !!identity && !isLoading && userProfile === null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (!/^[6-9]\d{9}$/.test(phone.replace(/\s+/g, ""))) {
      toast.error("Please enter a valid 10-digit Indian phone number");
      return;
    }
    if (!upiId.trim()) {
      toast.error("Please enter your UPI ID");
      return;
    }
    try {
      await saveProfile.mutateAsync({
        name: name.trim(),
        phone: phone.trim(),
        upiId: upiId.trim(),
      });
      toast.success("Account created successfully! Welcome to IND eSports!");
    } catch {
      toast.error("Failed to create account. Please try again.");
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent
        className="bg-card border-border max-w-md"
        data-ocid="account_setup.dialog"
        // Prevent closing - user must complete setup
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* Top neon accent */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/70 to-transparent rounded-t-lg" />
        <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-primary/60" />
        <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-primary/60" />

        <DialogHeader className="mb-2">
          <div className="flex items-center gap-3 mb-1">
            <div
              className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center"
              style={{ boxShadow: "0 0 15px oklch(0.86 0.22 198 / 0.2)" }}
            >
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="font-display font-black text-lg uppercase tracking-wider">
                Create Your Account
              </DialogTitle>
            </div>
          </div>
          <DialogDescription className="text-muted-foreground text-xs leading-relaxed">
            Welcome to{" "}
            <span className="text-primary font-bold">IND eSports</span>! Set up
            your permanent account to join tournaments, track payments, and
            receive winnings.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Name */}
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
              Full Name *
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60" />
              <Input
                placeholder="Your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                data-ocid="account_setup.name_input"
                required
                className="bg-muted/20 border-border focus:border-primary/60 pl-9"
              />
            </div>
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
              Phone Number *
            </Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60" />
              <Input
                type="tel"
                placeholder="10-digit mobile number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                data-ocid="account_setup.phone_input"
                required
                className="bg-muted/20 border-border focus:border-primary/60 pl-9"
              />
            </div>
            <p className="text-[10px] text-muted-foreground/60">
              Must be a valid 10-digit Indian number
            </p>
          </div>

          {/* UPI ID */}
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
              UPI ID *
            </Label>
            <div className="relative">
              <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60" />
              <Input
                placeholder="yourname@upi or phone@paytm"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                data-ocid="account_setup.upi_input"
                required
                className="bg-muted/20 border-border focus:border-primary/60 pl-9"
              />
            </div>
            <p className="text-[10px] text-muted-foreground/60">
              Used to receive prize winnings directly to your wallet
            </p>
          </div>

          {/* Wallet info note */}
          <div
            className="p-3 rounded-lg"
            style={{
              background: "oklch(0.86 0.22 198 / 0.06)",
              border: "1px solid oklch(0.86 0.22 198 / 0.2)",
            }}
          >
            <div className="flex items-start gap-2">
              <Wallet className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                A wallet will be created automatically. Admin can credit prize
                money directly to your wallet after tournament results.
              </p>
            </div>
          </div>

          <Button
            type="submit"
            className="neon-btn w-full"
            disabled={saveProfile.isPending}
            data-ocid="account_setup.submit_button"
          >
            {saveProfile.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Creating Account…
              </>
            ) : (
              "Create My Account →"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
