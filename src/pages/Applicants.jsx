import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/hooks/useStore";
import { KEYS, checkQuotaAvailability } from "@/lib/store";
import { Plus, Search, Filter, Eye } from "lucide-react";
import { toast } from "sonner";
export default function Applicants() {
    const { items: programs = [] } = useStore(KEYS.programs);
    const { items: applicants = [], refresh } = useStore(KEYS.applicants);
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [viewApplicant, setViewApplicant] = useState(null);
    const filtered = applicants.filter(a => {
        const name = (a?.name ?? "").toString().toLowerCase();
        const email = (a?.email ?? "").toString().toLowerCase();
        const matchesSearch = name.includes(search.toLowerCase()) ||
            email.includes(search.toLowerCase());
        const matchesStatus = filterStatus === "all" || a?.admissionStatus === filterStatus;
        return matchesSearch && matchesStatus;
    });
    return (<div className="animate-fade-in">
      <PageHeader title="Applicants" subtitle="Manage applicant records and documents" action={<AddApplicantDialog programs={programs} onAdd={refresh}/>}/>

      <div className="glass-card p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email..." className="pl-10"/>
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <Filter className="w-4 h-4 mr-2"/>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Applied">Applied</SelectItem>
              <SelectItem value="Allocated">Allocated</SelectItem>
              <SelectItem value="Confirmed">Confirmed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/30">
                {['Name', 'Category', 'Quota', 'Program', 'Docs', 'Fee', 'Status', ''].map(h => (<th key={h} className="text-left py-3 px-4 font-medium text-muted-foreground text-xs uppercase tracking-wider">{h}</th>))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filtered.map((a, i) => {
            const prog = programs.find(p => p.id === a.programId);
            return (<motion.tr key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.02 }} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-medium text-foreground">{a.name || '-'}</p>
                        <p className="text-xs text-muted-foreground">{a.email || '-'}</p>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{a.category}</td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="font-normal">{a.quotaType}</Badge>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{prog?.code || '-'}</td>
                      <td className="py-3 px-4">
                        <DocBadge status={a.documentStatus}/>
                      </td>
                      <td className="py-3 px-4">
                        <FeeBadge status={a.feeStatus}/>
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={a.admissionStatus}/>
                      </td>
                      <td className="py-3 px-4">
                        <button onClick={() => setViewApplicant(a)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                          <Eye className="w-4 h-4 text-muted-foreground"/>
                        </button>
                      </td>
                    </motion.tr>);
        })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (<div className="text-center py-12 text-muted-foreground">No applicants found.</div>)}
      </div>

      {/* View Dialog */}
      <Dialog open={!!viewApplicant} onOpenChange={() => setViewApplicant(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Applicant Details</DialogTitle>
            <DialogDescription>View complete profile, eligibility, and admission details for this applicant.</DialogDescription>
          </DialogHeader>
          {viewApplicant && (<div className="space-y-3 text-sm">
              {[
                ['Name', viewApplicant.name],
                ['Email', viewApplicant.email],
                ['Phone', viewApplicant.phone],
                ['DOB', viewApplicant.dateOfBirth],
                ['Gender', viewApplicant.gender],
                ['Category', viewApplicant.category],
                ['Entry Type', viewApplicant.entryType],
                ['Mode', viewApplicant.admissionMode],
                ['Quota', viewApplicant.quotaType],
                ['Qualifying Exam', viewApplicant.qualifyingExam],
                ['Marks', viewApplicant.marks],
                ['Allotment #', viewApplicant.allotmentNumber || '-'],
                ['Admission #', viewApplicant.admissionNumber || '-'],
            ].map(([label, value]) => (<div key={label} className="flex justify-between py-1.5 border-b border-border/50">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium text-foreground">{value}</span>
                </div>))}
            </div>)}
        </DialogContent>
      </Dialog>
    </div>);
}
function AddApplicantDialog({ programs, onAdd }) {
    const [open, setOpen] = useState(false);
    const { addItem } = useStore(KEYS.applicants);
    const { items: instCaps = [] } = useStore(KEYS.institutionCaps);
    const [form, setForm] = useState({
        name: '', email: '', phone: '', dateOfBirth: '', gender: 'Male',
        category: 'GM', address: '', qualifyingExam: '', marks: '',
        entryType: 'Regular', admissionMode: 'Government',
        quotaType: 'KCET', programId: '', allotmentNumber: '',
        institutionCapId: '',
    });
    const set = (key, value) => setForm(f => ({ ...f, [key]: value }));
    const handleSubmit = async () => {
        try {
            if (!form.name || !form.email || !form.programId) {
                toast.error("Name, email, and program are required");
                return;
            }
            const avail = await checkQuotaAvailability(form.programId, form.quotaType);
            if (!avail.available) {
                toast.error(`No seats available for ${form.quotaType} quota`);
                return;
            }
            await addItem({
                ...form,
                institutionCapId: form.institutionCapId === 'none' ? '' : form.institutionCapId,
                marks: parseInt(form.marks) || 0,
                documentStatus: 'Pending',
                feeStatus: 'Pending',
                admissionStatus: 'Applied',
                isSupernumerary: form.quotaType === 'Supernumerary',
                createdAt: new Date().toISOString(),
            });
            setOpen(false);
            if (onAdd) {
                await onAdd();
            }
            toast.success("Applicant created");
            setForm({ name: '', email: '', phone: '', dateOfBirth: '', gender: 'Male', category: 'GM', address: '', qualifyingExam: '', marks: '', entryType: 'Regular', admissionMode: 'Government', quotaType: 'KCET', programId: '', allotmentNumber: '', institutionCapId: '' });
        }
        catch (error) {
            toast.error(error?.message || "Failed to create applicant");
        }
    };
    return (<Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2"/> New Applicant</Button></DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Applicant</DialogTitle>
          <DialogDescription>Enter applicant details and assign a program and quota before creating the record.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <div><Label>Name *</Label><Input value={form.name} onChange={e => set('name', e.target.value)}/></div>
          <div><Label>Email *</Label><Input type="email" value={form.email} onChange={e => set('email', e.target.value)}/></div>
          <div><Label>Phone</Label><Input value={form.phone} onChange={e => set('phone', e.target.value)}/></div>
          <div><Label>Date of Birth</Label><Input type="date" value={form.dateOfBirth} onChange={e => set('dateOfBirth', e.target.value)}/></div>
          <div><Label>Gender</Label>
            <Select value={form.gender} onValueChange={v => set('gender', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Category</Label>
            <Select value={form.category} onValueChange={v => set('category', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {['GM', 'SC', 'ST', 'OBC', 'Other'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2"><Label>Address</Label><Input value={form.address} onChange={e => set('address', e.target.value)}/></div>
          <div><Label>Qualifying Exam</Label><Input value={form.qualifyingExam} onChange={e => set('qualifyingExam', e.target.value)}/></div>
          <div><Label>Marks</Label><Input type="number" value={form.marks} onChange={e => set('marks', e.target.value)}/></div>
          <div><Label>Entry Type</Label>
            <Select value={form.entryType} onValueChange={v => set('entryType', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Regular">Regular</SelectItem>
                <SelectItem value="Lateral">Lateral</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Admission Mode</Label>
            <Select value={form.admissionMode} onValueChange={v => set('admissionMode', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Government">Government</SelectItem>
                <SelectItem value="Management">Management</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Quota Type</Label>
            <Select value={form.quotaType} onValueChange={v => set('quotaType', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="KCET">KCET</SelectItem>
                <SelectItem value="COMEDK">COMEDK</SelectItem>
                <SelectItem value="Management">Management</SelectItem>
                <SelectItem value="Supernumerary">Supernumerary</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Program *</Label>
            <Select value={form.programId} onValueChange={v => set('programId', v)}>
              <SelectTrigger><SelectValue placeholder="Select program"/></SelectTrigger>
              <SelectContent>
                {programs.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.code})</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {form.admissionMode === 'Government' && (<div className="col-span-2"><Label>Allotment Number</Label><Input value={form.allotmentNumber} onChange={e => set('allotmentNumber', e.target.value)}/></div>)}
          {instCaps.length > 0 && (<div className="col-span-2"><Label>Institution Cap (optional)</Label>
              <Select value={form.institutionCapId} onValueChange={v => set('institutionCapId', v)}>
                <SelectTrigger><SelectValue placeholder="None"/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {instCaps.map(c => <SelectItem key={c.id} value={c.id}>{c.name} ({c.filledSeats}/{c.maxSeats})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>)}
        </div>
        <Button onClick={handleSubmit} className="w-full mt-4">Create Applicant</Button>
      </DialogContent>
    </Dialog>);
}
function DocBadge({ status }) {
    const styles = {
        Pending: 'bg-warning/10 text-warning',
        Submitted: 'bg-info/10 text-info',
        Verified: 'bg-success/10 text-success',
    };
    return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>{status}</span>;
}
function FeeBadge({ status }) {
    return (<span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${status === 'Paid' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>{status}</span>);
}
function StatusBadge({ status }) {
    const styles = {
        Applied: 'bg-muted text-muted-foreground',
        Allocated: 'bg-primary/10 text-primary',
        Confirmed: 'bg-success/10 text-success',
    };
    return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>{status}</span>;
}
