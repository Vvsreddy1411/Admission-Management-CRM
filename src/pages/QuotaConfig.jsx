import { useState } from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useStore } from "@/hooks/useStore";
import { KEYS } from "@/lib/store";
import { Plus, AlertTriangle, Settings } from "lucide-react";
import { toast } from "sonner";
export default function QuotaConfig() {
    const { items: programs } = useStore(KEYS.programs);
    const { items: quotas, addItem, removeItem, refresh } = useStore(KEYS.quotas);
    return (<div className="animate-fade-in">
      <PageHeader title="Quota Configuration" subtitle="Set up and manage admission quotas per program"/>

      <div className="space-y-6">
        {programs.map((prog, pi) => {
            const pQuotas = quotas.filter(q => q.programId === prog.id);
            const totalAllocated = pQuotas.reduce((s, q) => s + q.totalSeats, 0);
            const valid = totalAllocated === prog.totalIntake;
            return (<motion.div key={prog.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: pi * 0.08 }} className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-display font-semibold text-foreground">{prog.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {prog.courseType} • Intake: {prog.totalIntake} • Allocated: {totalAllocated}
                  </p>
                </div>
                <AddQuotaBtn programId={prog.id} onAdd={refresh}/>
              </div>

              {!valid && pQuotas.length > 0 && (<div className="flex items-center gap-2 text-sm bg-warning/10 text-warning p-3 rounded-lg mb-4">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0"/>
                  <span>Total quota seats ({totalAllocated}) must equal intake ({prog.totalIntake})</span>
                </div>)}

              {valid && pQuotas.length > 0 && (<div className="flex items-center gap-2 text-sm bg-success/10 text-success p-3 rounded-lg mb-4">
                  <Settings className="w-4 h-4"/>
                  <span>Quota configuration is valid ✓</span>
                </div>)}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {pQuotas.map(q => (<div key={q.id} className="bg-muted/30 rounded-xl p-4 flex items-center justify-between group">
                    <div>
                      <p className="font-medium text-sm text-foreground">{q.type}</p>
                      <p className="text-xs text-muted-foreground">{q.totalSeats} seats • {q.filledSeats} filled</p>
                    </div>
                    <button onClick={async () => { await removeItem(q.id); toast.success("Quota removed"); }} className="opacity-0 group-hover:opacity-100 text-xs text-destructive hover:underline transition-opacity">
                      Remove
                    </button>
                  </div>))}
              </div>

              {pQuotas.length === 0 && (<p className="text-sm text-muted-foreground text-center py-6">No quotas. Add one above.</p>)}
            </motion.div>);
        })}

        {programs.length === 0 && (<div className="text-center py-16 text-muted-foreground">
            <p>No programs configured. Go to Master Setup first.</p>
          </div>)}
      </div>
    </div>);
}
function AddQuotaBtn({ programId, onAdd }) {
    const [open, setOpen] = useState(false);
    const [type, setType] = useState('KCET');
    const [seats, setSeats] = useState("");
    const { addItem } = useStore(KEYS.quotas);
    const handleAdd = async () => {
        if (!seats || parseInt(seats) <= 0) {
            toast.error("Enter valid seats");
            return;
        }
        try {
            await addItem({ programId, type, totalSeats: parseInt(seats), filledSeats: 0 });
            setSeats("");
            setOpen(false);
            if (onAdd) {
                await onAdd();
            }
            toast.success("Quota added");
        }
        catch (error) {
            toast.error(error?.message || "Failed to add quota");
        }
    };
    return (<Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" variant="outline"><Plus className="w-4 h-4 mr-2"/> Add Quota</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Quota</DialogTitle>
          <DialogDescription>Create a quota bucket and define the seat count for this program.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div><Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="KCET">KCET</SelectItem>
                <SelectItem value="COMEDK">COMEDK</SelectItem>
                <SelectItem value="Management">Management</SelectItem>
                <SelectItem value="Supernumerary">Supernumerary</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Seats</Label><Input type="number" value={seats} onChange={e => setSeats(e.target.value)}/></div>
          <Button onClick={handleAdd} className="w-full">Add</Button>
        </div>
      </DialogContent>
    </Dialog>);
}
