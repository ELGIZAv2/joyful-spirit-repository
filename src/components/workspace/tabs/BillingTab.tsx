import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { FileText, Download, Wallet, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import type { WorkspaceCtx } from "@/hooks/useWorkspaceContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function BillingTab() {
  const { ws, isAdmin, canBilling } = useOutletContext<{ ws: WorkspaceCtx; isAdmin: boolean; canBilling: boolean }>();
  const navigate = useNavigate();
  const [topups, setTopups] = useState<any[]>([]);
  const [defaultLimit, setDefaultLimit] = useState<string>(ws.default_member_monthly_limit?.toString() ?? "");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("workspace_credit_topups").select("*").eq("workspace_id", ws.id).order("created_at", { ascending: false });
      setTopups((data as any) ?? []);
    })();
  }, [ws.id]);

  const downloadInvoice = (t: any) => {
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Invoice ${t.invoice_number}</title>
      <style>body{font-family:Inter,Arial;padding:40px;max-width:600px}h1{margin:0}table{width:100%;border-collapse:collapse;margin-top:20px}td{padding:8px;border-bottom:1px solid #ddd}.r{text-align:right}</style>
      </head><body>
      <h1>Invoice</h1>
      <p>${t.invoice_number}</p>
      <p>Date: ${new Date(t.created_at).toLocaleDateString()}</p>
      <p>Workspace: ${ws.name}</p>
      <table>
        <tr><td>Credits top-up</td><td class="r">${t.amount_credits} MC</td></tr>
        <tr><td><strong>Total</strong></td><td class="r"><strong>$${Number(t.amount_usd).toFixed(2)}</strong></td></tr>
      </table>
      <p style="margin-top:40px;color:#888;font-size:12px">Thank you for your business.</p>
      </body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${t.invoice_number}.html`;
    a.click();
  };

  const updateDefault = async () => {
    const v = defaultLimit.trim() === "" ? null : Number(defaultLimit);
    await supabase.from("workspaces").update({ default_member_monthly_limit: v } as any).eq("id", ws.id);
    toast.success("Default limit saved");
  };

  return (
    <div className="space-y-6">
      <section className="p-4 rounded-xl border border-border/60 bg-card">
        <div className="flex items-center gap-2">
          <Wallet className="w-4 h-4 text-emerald-500" />
          <p className="text-sm font-semibold">Workspace balance</p>
        </div>
        <p className="text-3xl font-semibold mt-2">{Number(ws.credits).toFixed(0)} <span className="text-sm text-muted-foreground">MC</span></p>
      </section>

      {canBilling && (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold">More credits</h3>
          <div className="p-4 rounded-xl border border-border/60 bg-card flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium">Upgrade plan</p>
              <p className="text-xs text-muted-foreground mt-0.5">Higher plans add more monthly credits to this workspace.</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => navigate("/pricing")}>
              View plans <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </section>
      )}

      {isAdmin && (
        <section className="space-y-2">
          <h3 className="text-sm font-semibold">Default monthly limit per member</h3>
          <div className="flex gap-2">
              <Input type="number" placeholder="No limit" value={defaultLimit} onChange={(e) => setDefaultLimit(e.target.value)} />
              <Button onClick={updateDefault}>Save</Button>
          </div>
          <p className="text-xs text-muted-foreground">Applied to new members. Existing limits unchanged.</p>
        </section>
      )}

      <section className="space-y-2">
        <h3 className="text-sm font-semibold">Invoices</h3>
        {topups.length === 0 ? (
          <p className="text-xs text-muted-foreground">No invoices yet.</p>
        ) : topups.map(t => (
          <div key={t.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/40 bg-card">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{t.invoice_number || "—"}</p>
              <p className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleDateString()} · {t.amount_credits} MC · ${Number(t.amount_usd).toFixed(2)} · {t.status}</p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => downloadInvoice(t)}><Download className="w-4 h-4" /></Button>
          </div>
        ))}
      </section>
    </div>
  );
}
