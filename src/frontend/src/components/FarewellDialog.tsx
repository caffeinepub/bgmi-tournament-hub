import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Gamepad2 } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";

export function FarewellDialog() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Use beforeunload for browser close/navigation events (native dialog)
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue =
        "Thanks for visiting IND eSports! See you on the battleground! 🎮";
      return e.returnValue;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="bg-card border-border max-w-sm text-center gaming-card"
        data-ocid="farewell.dialog"
      >
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="w-16 h-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center"
            >
              <Gamepad2 className="w-8 h-8 text-primary glow-text-cyan" />
            </motion.div>
          </div>
          <DialogTitle className="font-display font-black text-xl text-center uppercase tracking-wider">
            See You on the Battleground!
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm text-center mt-2 leading-relaxed">
            Thanks for visiting{" "}
            <span className="text-primary font-bold">IND eSports</span>! 🎮
            <br />
            Stay sharp. Stay ready. Next tournament is waiting for you!
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-3 mt-2">
          <Button
            variant="ghost"
            className="flex-1 border border-border hover:border-destructive/40 hover:text-destructive text-xs uppercase tracking-wider"
            onClick={() => setOpen(false)}
            data-ocid="farewell.leave_button"
          >
            Leave
          </Button>
          <Button
            className="flex-1 neon-btn text-xs uppercase tracking-wider"
            onClick={() => setOpen(false)}
            data-ocid="farewell.stay_button"
          >
            Stay &amp; Play
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
