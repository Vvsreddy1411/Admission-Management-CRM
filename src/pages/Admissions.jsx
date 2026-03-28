import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle,
  CreditCard,
  FileCheck,
  FileUp,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/hooks/useAuth";
import { useStore } from "@/hooks/useStore";
import {
  KEYS,
  allocateAdmission,
  canAllocateSeats,
  confirmAdmission,
  update,
} from "@/lib/store";
import { toast } from "sonner";

export default function Admissions() {
  const { items: applicants = [], refresh } = useStore(KEYS.applicants);
  const { items: programs = [] } = useStore(KEYS.programs);
  const { items: quotas = [], refresh: refreshQuotas } = useStore(KEYS.quotas);
  const { items: institutionCaps = [], refresh: refreshCaps } = useStore(
    KEYS.institutionCaps,
  );
  const { session } = useAuth();
  const [filterStage, setFilterStage] = useState("all");

  const canAct = session ? canAllocateSeats(session.role) : false;
  const stages = ["Applied", "Allocated", "Confirmed"];
  const filteredApplicants = useMemo(
    () =>
      applicants.filter(
        (applicant) =>
          filterStage === "all" || applicant.admissionStatus === filterStage,
      ),
    [applicants, filterStage],
  );

  const getQuotaAvailability = (programId, quotaType) => {
    const quota = quotas.find(
      (item) => item.programId === programId && item.type === quotaType,
    );

    if (!quota) {
      return { available: false, remaining: 0 };
    }

    const remaining = quota.totalSeats - quota.filledSeats;
    return { available: remaining > 0, remaining };
  };

  const getInstitutionCap = (capId) =>
    institutionCaps.find((item) => item.id === capId);

  const syncAdmissionData = async () => {
    await Promise.all([refresh(), refreshQuotas(), refreshCaps()]);
  };

  const handleAllocate = async (applicant) => {
    try {
      await allocateAdmission(applicant.id);
      await syncAdmissionData();
      toast.success("Seat allocated successfully");
    } catch (error) {
      toast.error(error?.message || "Allocation failed");
    }
  };

  const updateApplicant = async (applicantId, updates, successMessage) => {
    try {
      await update(KEYS.applicants, applicantId, updates);
      await refresh();
      toast.success(successMessage);
    } catch (error) {
      toast.error(error?.message || "Update failed");
    }
  };

  const handleConfirm = async (applicant) => {
    try {
      const result = await confirmAdmission(applicant.id);
      await syncAdmissionData();
      toast.success(`Admission confirmed: ${result.admissionNumber}`);
    } catch (error) {
      toast.error(error?.message || "Confirmation failed");
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Admissions"
        subtitle="Allocate seats, track documents and fees, and confirm admissions"
      />

      <div className="flex gap-3 mb-6 flex-wrap">
        {["all", ...stages].map((stage) => (
          <Button
            key={stage}
            variant={filterStage === stage ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStage(stage)}
          >
            {stage === "all" ? "All" : stage}
            <span className="ml-2 text-xs opacity-70">
              (
              {stage === "all"
                ? applicants.length
                : applicants.filter(
                    (applicant) => applicant.admissionStatus === stage,
                  ).length}
              )
            </span>
          </Button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredApplicants.map((applicant, index) => {
          const program = programs.find(
            (item) => item.id === applicant.programId,
          );
          const availability = getQuotaAvailability(
            applicant.programId,
            applicant.quotaType,
          );
          const institutionCap = applicant.institutionCapId
            ? getInstitutionCap(applicant.institutionCapId)
            : null;

          return (
            <motion.div
              key={applicant.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glass-card p-5"
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <h4 className="font-semibold text-foreground truncate">
                      {applicant.name}
                    </h4>
                    <AdmissionStatusBadge status={applicant.admissionStatus} />
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>{program?.name || "Unknown Program"}</span>
                    <span>Quota: {applicant.quotaType}</span>
                    <span>Mode: {applicant.admissionMode}</span>
                    {applicant.allotmentNumber && (
                      <span>Allotment: {applicant.allotmentNumber}</span>
                    )}
                    {institutionCap && <span>Cap: {institutionCap.name}</span>}
                    {applicant.admissionNumber && (
                      <span className="font-mono text-primary font-medium">
                        {applicant.admissionNumber}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    <DocStatusBadge status={applicant.documentStatus} />
                    <FeeStatusBadge status={applicant.feeStatus} />
                    <span className="text-xs text-muted-foreground">
                      {availability.remaining} {applicant.quotaType} seats left
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap lg:justify-end">
                  {applicant.admissionStatus === "Applied" && canAct && (
                    <Button
                      size="sm"
                      onClick={() => handleAllocate(applicant)}
                      disabled={!availability.available}
                    >
                      <Lock className="w-3.5 h-3.5 mr-1.5" />
                      Allocate Seat
                    </Button>
                  )}

                  {applicant.admissionStatus === "Allocated" && canAct && (
                    <>
                      {applicant.documentStatus === "Pending" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            updateApplicant(
                              applicant.id,
                              { documentStatus: "Submitted" },
                              "Documents marked as submitted",
                            )
                          }
                        >
                          <FileUp className="w-3.5 h-3.5 mr-1.5" />
                          Mark Submitted
                        </Button>
                      )}

                      {applicant.documentStatus !== "Verified" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            updateApplicant(
                              applicant.id,
                              { documentStatus: "Verified" },
                              "Documents verified",
                            )
                          }
                        >
                          <FileCheck className="w-3.5 h-3.5 mr-1.5" />
                          Verify Docs
                        </Button>
                      )}

                      {applicant.feeStatus !== "Paid" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            updateApplicant(
                              applicant.id,
                              { feeStatus: "Paid" },
                              "Fee marked as paid",
                            )
                          }
                        >
                          <CreditCard className="w-3.5 h-3.5 mr-1.5" />
                          Mark Paid
                        </Button>
                      )}

                      <Button
                        size="sm"
                        onClick={() => handleConfirm(applicant)}
                        disabled={
                          applicant.feeStatus !== "Paid" ||
                          applicant.documentStatus !== "Verified"
                        }
                      >
                        <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                        Confirm
                      </Button>
                    </>
                  )}

                  {applicant.admissionStatus === "Confirmed" && (
                    <span className="text-xs text-success font-medium flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      Admitted
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}

        {filteredApplicants.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No applicants in this stage.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function AdmissionStatusBadge({ status }) {
  const styles = {
    Applied: "bg-muted text-muted-foreground",
    Allocated: "bg-primary/10 text-primary",
    Confirmed: "bg-success/10 text-success",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}
    >
      {status}
    </span>
  );
}

function DocStatusBadge({ status }) {
  const styles = {
    Pending: "bg-warning/10 text-warning",
    Submitted: "bg-info/10 text-info",
    Verified: "bg-success/10 text-success",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${styles[status]}`}
    >
      Docs: {status}
    </span>
  );
}

function FeeStatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
        status === "Paid"
          ? "bg-success/10 text-success"
          : "bg-warning/10 text-warning"
      }`}
    >
      Fee: {status}
    </span>
  );
}
