import { useState } from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useStore } from "@/hooks/useStore";
import { KEYS } from "@/lib/store";
import { Plus, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
export default function SeatMatrix() {
    const { items: programs } = useStore(KEYS.programs);
    const { items: quotas, addItem, refresh } = useStore(KEYS.quotas);
    const { items: instCaps } = useStore(KEYS.institutionCaps);
    return (<div className="animate-fade-in">
      <PageHeader title="Seat Matrix & Quota" subtitle="Configure and monitor quota allocation per program"/>

      <div className="space-y-6">
        {programs.map((prog, pi) => {
            const pQuotas = quotas.filter(q => q.programId === prog.id);
            const regularQuotas = pQuotas.filter(q => q.type !== 'Supernumerary');
            const superQuota = pQuotas.find(q => q.type === 'Supernumerary');
            const totalAllocated = regularQuotas.reduce((s, q) => s + q.totalSeats, 0);
            const totalFilled = pQuotas.reduce((s, q) => s + q.filledSeats, 0);
            const allocationValid = totalAllocated === prog.totalIntake;
            return (<motion.div key={prog.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: pi * 0.1 }} className="glass-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display font-semibold text-lg text-foreground">{prog.name}</h3>
                  <p className="text-sm text-muted-foreground">{prog.courseType} • Intake: {prog.totalIntake}{superQuota ? ` + ${superQuota.totalSeats} supernumerary` : ''}</p>
                </div>
                <AddQuotaDialog programId={prog.id} onAdd={() => refresh()}/>
              </div>

              {!allocationValid && pQuotas.length > 0 && (<div className="flex items-center gap-2 text-sm bg-warning/10 text-warning p-3 rounded-lg">
                  <AlertTriangle className="w-4 h-4"/>
                  <span>Quota total ({totalAllocated}) ≠ Intake ({prog.totalIntake})</span>
                </div>)}

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {pQuotas.map(q => {
                    const pct = q.totalSeats > 0 ? (q.filledSeats / q.totalSeats) * 100 : 0;
                    const isSuper = q.type === 'Supernumerary';
                    return (<div key={q.id} className={`rounded-xl p-4 space-y-3 ${isSuper ? 'bg-accent/5 border border-accent/20' : 'bg-muted/30'}`}>
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm text-foreground">{q.type}</span>
                        <span className="text-xs font-semibold text-muted-foreground">
                          {q.filledSeats}/{q.totalSeats}
                        </span>
                      </div>
                      <Progress value={pct} className="h-2"/>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Filled: {q.filledSeats}</span>
                        <span>Remaining: {q.totalSeats - q.filledSeats}</span>
                      </div>
                    </div>);
                })}
              </div>

              {pQuotas.length === 0 && (<p className="text-sm text-muted-foreground text-center py-4">No quotas configured for this program.</p>)}

              <div className="flex items-center gap-4 pt-2 border-t border-border">
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Overall Fill Rate</span>
                    <span className="font-semibold text-foreground">{totalFilled}/{prog.totalIntake}</span>
                  </div>
                  <Progress value={prog.totalIntake > 0 ? (totalFilled / prog.totalIntake) * 100 : 0} className="h-2.5"/>
                </div>
              </div>
            </motion.div>);
        })}

        {programs.length === 0 && (<div className="text-center py-16 text-muted-foreground">
            <p className="text-lg">No programs configured.</p>
            <p className="text-sm mt-1">Go to Master Setup to create programs first.</p>
          </div>)}

        {/* Institution Caps Summary */}
        {instCaps.length > 0 && (<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6 space-y-4">
            <h3 className="font-display font-semibold text-lg text-foreground">Institution-Level Caps</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {instCaps.map(cap => {
                const pct = cap.maxSeats > 0 ? (cap.filledSeats / cap.maxSeats) * 100 : 0;
                return (<div key={cap.id} className="bg-muted/30 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm text-foreground">{cap.name}</span>
                      <span className="text-xs font-semibold text-muted-foreground">{cap.filledSeats}/{cap.maxSeats}</span>
                    </div>
                    <Progress value={pct} className="h-2"/>
                    <p className="text-xs text-muted-foreground">{cap.maxSeats - cap.filledSeats} remaining</p>
                  </div>);
            })}
            </div>
          </motion.div>)}
      </div>
    </div>);
}
function AddQuotaDialog({ programId, onAdd }) {
    const [open, setOpen] = useState(false);
    const [type, setType] = useState('KCET');
    const [seats, setSeats] = useState("");
    const { addItem } = useStore(KEYS.quotas);
    const handleAdd = async () => {
        if (!seats || parseInt(seats) <= 0) {
            toast.error("Enter valid seats");
            return;
        }
        await addItem({ programId, type, totalSeats: parseInt(seats), filledSeats: 0 });
        setSeats("");
        setOpen(false);
        if (onAdd) {
            await onAdd();
        }
        toast.success("Quota added");
    };
    return (<Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" variant="outline"><Plus className="w-4 h-4 mr-2"/> Add Quota</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Quota</DialogTitle>
          <DialogDescription>Add quota seats for this program to track allocation and utilization.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div><Label>Quota Type</Label>
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
          <div><Label>Total Seats</Label><Input type="number" value={seats} onChange={e => setSeats(e.target.value)} placeholder="60"/></div>
          <Button onClick={handleAdd} className="w-full">Add Quota</Button>
        </div>
      </DialogContent>
    </Dialog>);
}
