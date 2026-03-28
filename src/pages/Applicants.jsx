import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, Filter, Plus, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/PageHeader";
import { useStore } from "@/hooks/useStore";
import {
  KEYS,
  checkInstitutionCapAvailability,
  checkQuotaAvailability,
} from "@/lib/store";
import { toast } from "sonner";

const DEFAULT_FORM = {
  name: "",
  email: "",
  phone: "",
  dateOfBirth: "",
  gender: "Male",
  category: "GM",
  address: "",
  qualifyingExam: "",
  marks: "",
  entryType: "Regular",
  admissionMode: "Government",
  quotaType: "KCET",
  programId: "",
  allotmentNumber: "",
  institutionCapId: "none",
};

export default function Applicants() {
  const { items: programs = [] } = useStore(KEYS.programs);
  const { items: applicants = [], refresh } = useStore(KEYS.applicants);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [viewApplicant, setViewApplicant] = useState(null);

  const filteredApplicants = useMemo(
    () =>
      applicants.filter((applicant) => {
        const query = search.toLowerCase();
        const matchesSearch =
          applicant.name?.toLowerCase().includes(query) ||
          applicant.email?.toLowerCase().includes(query);
        const matchesStatus =
          filterStatus === "all" || applicant.admissionStatus === filterStatus;

        return matchesSearch && matchesStatus;
      }),
    [applicants, filterStatus, search],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Applicants"
        subtitle="Create and manage applicant records, documents, and fee status"
        action={<AddApplicantDialog programs={programs} onAdd={refresh} />}
      />

      <div className="glass-card p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name or email..."
              className="pl-10"
            />
          </div>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-44">
              <Filter className="w-4 h-4 mr-2" />
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
                {["Name", "Category", "Quota", "Program", "Docs", "Fee", "Status", ""].map(
                  (header) => (
                    <th
                      key={header}
                      className="text-left py-3 px-4 font-medium text-muted-foreground text-xs uppercase tracking-wider"
                    >
                      {header}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filteredApplicants.map((applicant, index) => {
                  const program = programs.find(
                    (item) => item.id === applicant.programId,
                  );

                  return (
                    <motion.tr
                      key={applicant.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <p className="font-medium text-foreground">
                          {applicant.name || "-"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {applicant.email || "-"}
                        </p>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {applicant.category}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="font-normal">
                          {applicant.quotaType}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {program?.code || "-"}
                      </td>
                      <td className="py-3 px-4">
                        <DocBadge status={applicant.documentStatus} />
                      </td>
                      <td className="py-3 px-4">
                        <FeeBadge status={applicant.feeStatus} />
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={applicant.admissionStatus} />
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => setViewApplicant(applicant)}
                          className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                        >
                          <Eye className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {filteredApplicants.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No applicants found.
          </div>
        )}
      </div>

      <Dialog open={!!viewApplicant} onOpenChange={() => setViewApplicant(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Applicant Details</DialogTitle>
            <DialogDescription>
              View the full profile, admission data, and workflow status.
            </DialogDescription>
          </DialogHeader>

          {viewApplicant && (
            <div className="space-y-3 text-sm">
              {[
                ["Name", viewApplicant.name],
                ["Email", viewApplicant.email],
                ["Phone", viewApplicant.phone],
                ["DOB", viewApplicant.dateOfBirth],
                ["Gender", viewApplicant.gender],
                ["Category", viewApplicant.category],
                ["Entry Type", viewApplicant.entryType],
                ["Admission Mode", viewApplicant.admissionMode],
                ["Quota", viewApplicant.quotaType],
                ["Qualifying Exam", viewApplicant.qualifyingExam],
                ["Marks", viewApplicant.marks],
                ["Allotment Number", viewApplicant.allotmentNumber || "-"],
                ["Admission Number", viewApplicant.admissionNumber || "-"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex justify-between py-1.5 border-b border-border/50"
                >
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium text-foreground">{value}</span>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AddApplicantDialog({ programs, onAdd }) {
  const { addItem } = useStore(KEYS.applicants);
  const { items: entryTypes = [] } = useStore(KEYS.entryTypes);
  const { items: admissionModes = [] } = useStore(KEYS.admissionModes);
  const { items: institutionCaps = [] } = useStore(KEYS.institutionCaps);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);

  const availableEntryTypes = entryTypes.length
    ? entryTypes
    : [{ id: "default-regular", name: "Regular", code: "Regular" }];
  const availableAdmissionModes = admissionModes.length
    ? admissionModes
    : [
        { id: "default-government", name: "Government", code: "Government" },
        { id: "default-management", name: "Management", code: "Management" },
      ];

  const setField = (key, value) => {
    setForm((current) => {
      const next = { ...current, [key]: value };

      if (key === "admissionMode" && value === "Management") {
        next.quotaType = "Management";
        next.allotmentNumber = "";
      }

      if (key === "admissionMode" && value === "Government" && current.quotaType === "Management") {
        next.quotaType = "KCET";
      }

      return next;
    });
  };

  const handleSubmit = async () => {
    try {
      if (!form.name.trim() || !form.email.trim() || !form.programId) {
        toast.error("Name, email, and program are required");
        return;
      }

      if (form.admissionMode === "Government" && !form.allotmentNumber.trim()) {
        toast.error("Allotment number is required for government admissions");
        return;
      }

      const availability = await checkQuotaAvailability(
        form.programId,
        form.quotaType,
      );

      if (!availability.available) {
        toast.error(`No seats available under ${form.quotaType} quota`);
        return;
      }

      if (form.institutionCapId && form.institutionCapId !== "none") {
        const capAvailability = await checkInstitutionCapAvailability(
          form.institutionCapId,
        );

        if (!capAvailability.available) {
          toast.error("Selected institution cap is already full");
          return;
        }
      }

      await addItem({
        ...form,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        qualifyingExam: form.qualifyingExam.trim(),
        allotmentNumber:
          form.admissionMode === "Government"
            ? form.allotmentNumber.trim()
            : "",
        institutionCapId:
          form.institutionCapId === "none" ? "" : form.institutionCapId,
        marks: Number.parseInt(form.marks || "0", 10),
        documentStatus: "Pending",
        feeStatus: "Pending",
        admissionStatus: "Applied",
        createdAt: new Date().toISOString(),
      });

      setForm(DEFAULT_FORM);
      setOpen(false);

      if (onAdd) {
        await onAdd();
      }

      toast.success("Applicant created");
    } catch (error) {
      toast.error(error?.message || "Failed to create applicant");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          New Applicant
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Applicant</DialogTitle>
          <DialogDescription>
            Capture the minimal application data and assign the quota flow.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Name *</Label>
            <Input
              value={form.name}
              onChange={(event) => setField("name", event.target.value)}
            />
          </div>
          <div>
            <Label>Email *</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(event) => setField("email", event.target.value)}
            />
          </div>
          <div>
            <Label>Phone</Label>
            <Input
              value={form.phone}
              onChange={(event) => setField("phone", event.target.value)}
            />
          </div>
          <div>
            <Label>Date of Birth</Label>
            <Input
              type="date"
              value={form.dateOfBirth}
              onChange={(event) => setField("dateOfBirth", event.target.value)}
            />
          </div>
          <div>
            <Label>Gender</Label>
            <Select value={form.gender} onValueChange={(value) => setField("gender", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Category</Label>
            <Select
              value={form.category}
              onValueChange={(value) => setField("category", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["GM", "SC", "ST", "OBC", "Other"].map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <Label>Address</Label>
            <Input
              value={form.address}
              onChange={(event) => setField("address", event.target.value)}
            />
          </div>
          <div>
            <Label>Qualifying Exam</Label>
            <Input
              value={form.qualifyingExam}
              onChange={(event) =>
                setField("qualifyingExam", event.target.value)
              }
            />
          </div>
          <div>
            <Label>Marks</Label>
            <Input
              type="number"
              value={form.marks}
              onChange={(event) => setField("marks", event.target.value)}
            />
          </div>
          <div>
            <Label>Entry Type</Label>
            <Select
              value={form.entryType}
              onValueChange={(value) => setField("entryType", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableEntryTypes.map((item) => (
                  <SelectItem key={item.id} value={item.code}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Admission Mode</Label>
            <Select
              value={form.admissionMode}
              onValueChange={(value) => setField("admissionMode", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableAdmissionModes.map((item) => (
                  <SelectItem key={item.id} value={item.code}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Quota Type</Label>
            <Select
              value={form.quotaType}
              onValueChange={(value) => setField("quotaType", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {form.admissionMode === "Management" ? (
                  <SelectItem value="Management">Management</SelectItem>
                ) : (
                  <>
                    <SelectItem value="KCET">KCET</SelectItem>
                    <SelectItem value="COMEDK">COMEDK</SelectItem>
                    <SelectItem value="Supernumerary">Supernumerary</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Program *</Label>
            <Select
              value={form.programId}
              onValueChange={(value) => setField("programId", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select program" />
              </SelectTrigger>
              <SelectContent>
                {programs.map((program) => (
                  <SelectItem key={program.id} value={program.id}>
                    {program.name} ({program.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {form.admissionMode === "Government" && (
            <div className="col-span-2">
              <Label>Allotment Number *</Label>
              <Input
                value={form.allotmentNumber}
                onChange={(event) =>
                  setField("allotmentNumber", event.target.value)
                }
              />
            </div>
          )}
          {institutionCaps.length > 0 && (
            <div className="col-span-2">
              <Label>Institution Cap (optional)</Label>
              <Select
                value={form.institutionCapId}
                onValueChange={(value) => setField("institutionCapId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {institutionCaps.map((cap) => (
                    <SelectItem key={cap.id} value={cap.id}>
                      {cap.name} ({cap.filledSeats}/{cap.maxSeats})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <Button onClick={handleSubmit} className="w-full mt-4">
          Create Applicant
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function DocBadge({ status }) {
  const styles = {
    Pending: "bg-warning/10 text-warning",
    Submitted: "bg-info/10 text-info",
    Verified: "bg-success/10 text-success",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}
    >
      {status}
    </span>
  );
}

function FeeBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
        status === "Paid"
          ? "bg-success/10 text-success"
          : "bg-warning/10 text-warning"
      }`}
    >
      {status}
    </span>
  );
}

function StatusBadge({ status }) {
  const styles = {
    Applied: "bg-muted text-muted-foreground",
    Allocated: "bg-primary/10 text-primary",
    Confirmed: "bg-success/10 text-success",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}
    >
      {status}
    </span>
  );
}
