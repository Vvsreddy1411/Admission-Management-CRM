import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useStore } from "@/hooks/useStore";
import { KEYS } from "@/lib/store";
import { Plus, Trash2, Shield, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
export default function InstitutionCaps() {
    const { items: institutions } = useStore(KEYS.institutions);
    const { items: caps, addItem, removeItem } = useStore(KEYS.institutionCaps);
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [maxSeats, setMaxSeats] = useState("");
    const [instId, setInstId] = useState("");
    const handleAdd = async () => {
        if (!name || !maxSeats || !instId) {
            toast.error("Fill all fields");
            return;
        }
        await addItem({ institutionId: instId, name, maxSeats: parseInt(maxSeats), filledSeats: 0 });
        setName("");
        setMaxSeats("");
        setInstId("");
        setOpen(false);
        toast.success("Institution cap created");
    };
    return (<div className="animate-fade-in">
      <PageHeader title="Institution-Level Caps" subtitle="Set cross-program seat limits (e.g., J&K quota, NRI quota)" action={<Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="w-4 h-4 mr-2"/> Add Cap</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New Institution Cap</DialogTitle>
                <DialogDescription>Set a shared seat limit that applies across programs within an institution.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div><Label>Institution</Label>
                  <Select value={instId} onValueChange={setInstId}>
                    <SelectTrigger><SelectValue placeholder="Select institution"/></SelectTrigger>
                    <SelectContent>{institutions.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Cap Name</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., J&K Quota"/></div>
                <div><Label>Max Seats (across all programs)</Label><Input type="number" value={maxSeats} onChange={e => setMaxSeats(e.target.value)} placeholder="10"/></div>
                <Button onClick={handleAdd} className="w-full">Create Cap</Button>
              </div>
            </DialogContent>
          </Dialog>}/>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <AnimatePresence>
          {caps.map((cap, i) => {
            const inst = institutions.find(ins => ins.id === cap.institutionId);
            const pct = cap.maxSeats > 0 ? (cap.filledSeats / cap.maxSeats) * 100 : 0;
            const remaining = cap.maxSeats - cap.filledSeats;
            const isFull = remaining <= 0;
            return (<motion.div key={cap.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: i * 0.05 }} className="glass-card p-5 space-y-4 group">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isFull ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                      <Shield className="w-5 h-5"/>
                    </div>
                    <div>
                      <h3 className="font-display font-semibold text-foreground">{cap.name}</h3>
                      <p className="text-xs text-muted-foreground">{inst?.name || 'Unknown'}</p>
                    </div>
                  </div>
                  <button onClick={async () => { await removeItem(cap.id); toast.success("Cap removed"); }} className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-destructive/10 text-destructive">
                    <Trash2 className="w-4 h-4"/>
                  </button>
                </div>

                {isFull && (<div className="flex items-center gap-2 text-xs bg-destructive/10 text-destructive p-2 rounded-lg">
                    <AlertTriangle className="w-3.5 h-3.5"/>
                    <span>Cap reached — no more seats</span>
                  </div>)}

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Usage</span>
                    <span className="font-semibold text-foreground">{cap.filledSeats}/{cap.maxSeats}</span>
                  </div>
                  <Progress value={pct} className="h-2.5"/>
                  <p className="text-xs text-muted-foreground mt-1">{remaining} seats remaining</p>
                </div>
              </motion.div>);
        })}
        </AnimatePresence>
      </div>

      {caps.length === 0 && (<div className="text-center py-16 text-muted-foreground">
          <Shield className="w-12 h-12 mx-auto mb-3 opacity-30"/>
          <p>No institution-level caps configured yet.</p>
          <p className="text-sm mt-1">Add caps to enforce cross-program seat limits.</p>
        </div>)}
    </div>);
}
