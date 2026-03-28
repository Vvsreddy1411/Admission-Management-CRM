import { useState } from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { useStore } from "@/hooks/useStore";
import { useAuth } from "@/hooks/useAuth";
import { KEYS, allocateSeat, generateAdmissionNumber, update, canAllocateSeats } from "@/lib/store";
import { CheckCircle, AlertCircle, Lock, CreditCard, FileCheck } from "lucide-react";
import { toast } from "sonner";
export default function Admissions() {
    const { items: applicants, refresh } = useStore(KEYS.applicants);
    const { items: programs } = useStore(KEYS.programs);
    const { items: institutions } = useStore(KEYS.institutions);
    const { items: quotas, refresh: refreshQuotas } = useStore(KEYS.quotas);
    const { items: years } = useStore(KEYS.academicYears);
    const { items: instCaps } = useStore(KEYS.institutionCaps);
    const { session } = useAuth();
    const [filterStage, setFilterStage] = useState("all");
    const canAct = session ? canAllocateSeats(session.role) : false;
    const stages = ['Applied', 'Allocated', 'Confirmed'];
    const filtered = applicants.filter(a => filterStage === 'all' || a.admissionStatus === filterStage);
    const getQuotaAvailability = (programId, quotaType) => {
        const quota = quotas.find(q => q.programId === programId && q.type === quotaType);
        if (!quota)
            return { available: false, remaining: 0 };
        const remaining = quota.totalSeats - quota.filledSeats;
        return { available: remaining > 0, remaining };
    };
    const handleAllocate = async (applicant) => {
        const avail = getQuotaAvailability(applicant.programId, applicant.quotaType);
        if (!avail.available) {
            toast.error(`No ${applicant.quotaType} seats available!`);
            return;
        }
        // Check institution cap if specified
        if (applicant.institutionCapId && applicant.institutionCapId !== 'none') {
            const cap = instCaps.find(c => c.id === applicant.institutionCapId);
            if (!cap || cap.filledSeats >= cap.maxSeats) {
                toast.error(`Institution cap "${cap?.name}" is full!`);
                return;
            }
        }
        const capId = applicant.institutionCapId && applicant.institutionCapId !== 'none' ? applicant.institutionCapId : undefined;
        const success = await allocateSeat(applicant.programId, applicant.quotaType, capId);
        if (!success) {
            toast.error("Allocation failed - quota full");
            return;
        }
        await update(KEYS.applicants, applicant.id, { admissionStatus: 'Allocated' });
        await refresh();
        await refreshQuotas();
        toast.success("Seat allocated successfully");
    };
    const handleDocVerify = async (applicant) => {
        await update(KEYS.applicants, applicant.id, { documentStatus: 'Verified' });
        await refresh();
        toast.success("Documents verified");
    };
    const handleFeePaid = async (applicant) => {
        await update(KEYS.applicants, applicant.id, { feeStatus: 'Paid' });
        await refresh();
        toast.success("Fee marked as paid");
    };
    const handleConfirm = async (applicant) => {
        if (applicant.feeStatus !== 'Paid') {
            toast.error("Fee must be paid before confirmation");
            return;
        }
        if (applicant.documentStatus !== 'Verified') {
            toast.error("Documents must be verified before confirmation");
            return;
        }
        const prog = programs.find(p => p.id === applicant.programId);
        const inst = institutions[0];
        const year = years.find(y => y.isCurrent)?.year || '2026';
        const admissionNumber = await generateAdmissionNumber(inst?.code || 'INST', year, prog?.courseType || 'UG', prog?.code || 'GEN', applicant.quotaType);
        await update(KEYS.applicants, applicant.id, {
            admissionStatus: 'Confirmed',
            admissionNumber,
        });
        await refresh();
        toast.success(`Admission confirmed: ${admissionNumber}`);
    };
    return (<div className="animate-fade-in">
      <PageHeader title="Admissions" subtitle="Allocate seats, verify documents, and confirm admissions"/>

      <div className="flex gap-3 mb-6 flex-wrap">
        {['all', ...stages].map(s => (<Button key={s} variant={filterStage === s ? 'default' : 'outline'} size="sm" onClick={() => setFilterStage(s)}>
            {s === 'all' ? 'All' : s}
            <span className="ml-2 text-xs opacity-70">
              ({s === 'all' ? applicants.length : applicants.filter(a => a.admissionStatus === s).length})
            </span>
          </Button>))}
      </div>

      <div className="space-y-4">
        {filtered.map((applicant, i) => {
            const prog = programs.find(p => p.id === applicant.programId);
            const avail = getQuotaAvailability(applicant.programId, applicant.quotaType);
            return (<motion.div key={applicant.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card p-5">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="font-semibold text-foreground truncate">{applicant.name}</h4>
                    <AdmissionStatusBadge status={applicant.admissionStatus}/>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>{prog?.name || 'Unknown Program'}</span>
                    <span>Quota: {applicant.quotaType}</span>
                    <span>Mode: {applicant.admissionMode}</span>
                    {applicant.allotmentNumber && <span>Allotment: {applicant.allotmentNumber}</span>}
                    {applicant.admissionNumber && (<span className="font-mono text-primary font-medium">{applicant.admissionNumber}</span>)}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <DocStatusBadge status={applicant.documentStatus}/>
                    <FeeStatusBadge status={applicant.feeStatus}/>
                    <span className="text-xs text-muted-foreground">
                      {avail.remaining} {applicant.quotaType} seats left
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {applicant.admissionStatus === 'Applied' && canAct && (<Button size="sm" onClick={() => handleAllocate(applicant)} disabled={!avail.available}>
                      <Lock className="w-3.5 h-3.5 mr-1.5"/>
                      Allocate Seat
                    </Button>)}
                  {applicant.admissionStatus === 'Allocated' && canAct && (<>
                      {applicant.documentStatus !== 'Verified' && (<Button size="sm" variant="outline" onClick={() => handleDocVerify(applicant)}>
                          <FileCheck className="w-3.5 h-3.5 mr-1.5"/> Verify Docs
                        </Button>)}
                      {applicant.feeStatus !== 'Paid' && (<Button size="sm" variant="outline" onClick={() => handleFeePaid(applicant)}>
                          <CreditCard className="w-3.5 h-3.5 mr-1.5"/> Mark Paid
                        </Button>)}
                      <Button size="sm" onClick={() => handleConfirm(applicant)} disabled={applicant.feeStatus !== 'Paid' || applicant.documentStatus !== 'Verified'}>
                        <CheckCircle className="w-3.5 h-3.5 mr-1.5"/> Confirm
                      </Button>
                    </>)}
                  {applicant.admissionStatus === 'Confirmed' && (<span className="text-xs text-success font-medium flex items-center gap-1">
                      <CheckCircle className="w-4 h-4"/> Admitted
                    </span>)}
                </div>
              </div>
            </motion.div>);
        })}

        {filtered.length === 0 && (<div className="text-center py-16 text-muted-foreground">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-30"/>
            <p>No applicants in this stage.</p>
          </div>)}
      </div>
    </div>);
}
function AdmissionStatusBadge({ status }) {
    const styles = {
        Applied: 'bg-muted text-muted-foreground',
        Allocated: 'bg-primary/10 text-primary',
        Confirmed: 'bg-success/10 text-success',
    };
    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>{status}</span>;
}
function DocStatusBadge({ status }) {
    const styles = {
        Pending: 'bg-warning/10 text-warning',
        Submitted: 'bg-info/10 text-info',
        Verified: 'bg-success/10 text-success',
    };
    return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${styles[status]}`}>Docs: {status}</span>;
}
function FeeStatusBadge({ status }) {
    return (<span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${status === 'Paid' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>Fee: {status}</span>);
}
