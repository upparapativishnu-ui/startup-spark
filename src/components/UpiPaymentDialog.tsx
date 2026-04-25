import { useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Check, Smartphone, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const UPI_ID = "9133820788@axl";
const PAYEE_NAME = "SwapAgent";

interface UpiPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planName: string;
  amount: number; // in INR
}

const buildUpiUrl = (amount: number, planName: string) => {
  const params = new URLSearchParams({
    pa: UPI_ID,
    pn: PAYEE_NAME,
    am: amount.toString(),
    cu: "INR",
    tn: `${planName} plan`,
  });
  return `upi://pay?${params.toString()}`;
};

export const UpiPaymentDialog = ({
  open,
  onOpenChange,
  planName,
  amount,
}: UpiPaymentDialogProps) => {
  const [copied, setCopied] = useState(false);
  const upiUrl = useMemo(() => buildUpiUrl(amount, planName), [amount, planName]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(UPI_ID);
      setCopied(true);
      toast.success("UPI ID copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy — long-press to select");
    }
  };

  const handleOpenApp = () => {
    window.location.href = upiUrl;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong border-primary/30 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            Pay <span className="text-gold">₹{amount}</span> for {planName}
          </DialogTitle>
          <DialogDescription>
            Scan the QR with any UPI app, or tap the button on mobile.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-5 py-2">
          <div className="rounded-2xl bg-white p-4 shadow-[var(--shadow-elev)]">
            <QRCodeSVG
              value={upiUrl}
              size={200}
              level="M"
              marginSize={0}
            />
          </div>

          <div className="w-full glass rounded-xl p-3 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                UPI ID
              </p>
              <p className="font-mono text-sm truncate">{UPI_ID}</p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCopy}
              className="shrink-0"
            >
              {copied ? (
                <Check className="h-4 w-4 text-primary" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>

          <Button
            onClick={handleOpenApp}
            className="w-full h-12 bg-gradient-gold text-primary-foreground btn-gold-glow border-0 font-semibold"
          >
            <Smartphone className="h-4 w-4" />
            Open UPI app
            <ExternalLink className="h-3.5 w-3.5 opacity-70" />
          </Button>

          <p className="text-xs text-muted-foreground text-center leading-relaxed">
            Works with GPay, PhonePe, Paytm, BHIM & all UPI apps.
            <br />
            After payment, your access is activated within a few minutes.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
