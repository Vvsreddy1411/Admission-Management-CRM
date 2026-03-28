import { useMemo } from "react";
import {
  AlertCircle,
  BarChart3,
  FileWarning,
  GraduationCap,
  IndianRupee,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader } from "@/components/PageHeader";
import { KEYS } from "@/lib/store";
import { useStore } from "@/hooks/useStore";

const CHART_COLORS = [
  "hsl(200, 80%, 40%)",
  "hsl(160, 60%, 42%)",
  "hsl(38, 92%, 50%)",
  "hsl(350, 70%, 55%)",
];

export default function Dashboard() {
  const { items: applicants = [], loading: applicantsLoading } = useStore(
    KEYS.applicants,
  );
  const { items: programs = [], loading: programsLoading } = useStore(
    KEYS.programs,
  );
  const { items: quotas = [], loading: quotasLoading } = useStore(KEYS.quotas);

  const loading = applicantsLoading || programsLoading || quotasLoading;

  const stats = useMemo(() => {
    const totalIntake = programs.reduce(
      (sum, program) => sum + (program.totalIntake || 0),
      0,
    );
    const totalAdmitted = applicants.filter(
      (applicant) => applicant.admissionStatus === "Confirmed",
    ).length;
    const pendingFees = applicants.filter(
      (applicant) =>
        applicant.feeStatus === "Pending" &&
        applicant.admissionStatus !== "Applied",
    );
    const pendingDocs = applicants.filter(
      (applicant) => applicant.documentStatus !== "Verified",
    );

    return {
      totalApplicants: applicants.length,
      totalIntake,
      totalAdmitted,
      pendingFees,
      pendingDocs,
    };
  }, [applicants, programs]);

  const quotaData = useMemo(() => {
    const quotaMap = {};

    quotas.forEach((quota) => {
      if (!quotaMap[quota.type]) {
        quotaMap[quota.type] = { filled: 0, total: 0 };
      }

      quotaMap[quota.type].filled += quota.filledSeats || 0;
      quotaMap[quota.type].total += quota.totalSeats || 0;
    });

    return Object.entries(quotaMap).map(([name, value]) => ({
      name,
      filled: value.filled,
      total: value.total,
      remaining: value.total - value.filled,
    }));
  }, [quotas]);

  const programData = useMemo(
    () =>
      programs.map((program) => {
        const programQuotas = quotas.filter(
          (quota) => quota.programId === program.id,
        );
        const filled = programQuotas.reduce(
          (sum, quota) => sum + (quota.filledSeats || 0),
          0,
        );

        return {
          name: program.code,
          intake: program.totalIntake || 0,
          filled,
          remaining: (program.totalIntake || 0) - filled,
        };
      }),
    [programs, quotas],
  );

  const recentApplicants = useMemo(
    () => applicants.slice(-10).reverse(),
    [applicants],
  );

  const statCards = [
    {
      title: "Total Applicants",
      value: stats.totalApplicants,
      note: "All applications captured",
      icon: Users,
      tone: "text-primary bg-primary/10",
    },
    {
      title: "Intake vs Admitted",
      value: `${stats.totalAdmitted}/${stats.totalIntake}`,
      note: "Confirmed admissions against total intake",
      icon: GraduationCap,
      tone: "text-success bg-success/10",
    },
    {
      title: "Fee Pending",
      value: stats.pendingFees.length,
      note: "Allocated or confirmed with unpaid fee",
      icon: IndianRupee,
      tone: "text-warning bg-warning/10",
    },
    {
      title: "Docs Pending",
      value: stats.pendingDocs.length,
      note: "Applicants awaiting submission or verification",
      icon: FileWarning,
      tone: "text-destructive bg-destructive/10",
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Dashboard"
        subtitle="Admission overview, quota tracking, and pending action lists"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {statCards.map((card) => (
          <div
            key={card.title}
            className="glass-card p-5 border border-border/60 rounded-2xl"
          >
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {card.title}
                </p>
                <p className="text-3xl font-bold leading-tight mt-2 text-foreground">
                  {card.value}
                </p>
              </div>
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.tone}`}
              >
                <card.icon className="w-5 h-5" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{card.note}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="font-semibold text-lg mb-4">Program-wise Seat Status</h3>

          {programData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={programData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="filled" stackId="a" name="Filled" fill="hsl(202, 89%, 45%)" />
                <Bar
                  dataKey="remaining"
                  stackId="a"
                  name="Remaining"
                  fill="hsl(165, 72%, 36%)"
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState icon={BarChart3} text="No programs configured yet" />
          )}
        </div>

        <div className="glass-card p-6">
          <h3 className="font-semibold text-lg mb-4">Quota-wise Filled Seats</h3>

          {quotaData.length > 0 ? (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="50%" height={240}>
                <PieChart>
                  <Pie
                    data={quotaData}
                    dataKey="filled"
                    nameKey="name"
                    outerRadius={90}
                    innerRadius={50}
                  >
                    {quotaData.map((item, index) => (
                      <Cell
                        key={item.name}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>

              <div className="flex-1 space-y-2">
                {quotaData.map((quota) => (
                  <div key={quota.name} className="flex justify-between text-sm">
                    <span>{quota.name}</span>
                    <span>
                      {quota.filled}/{quota.total} filled
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState icon={AlertCircle} text="No quotas configured yet" />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <PendingActionCard
          title="Applicants With Pending Documents"
          applicants={stats.pendingDocs}
          programs={programs}
          field="documentStatus"
          emptyText="No applicants are waiting on documents."
        />
        <PendingActionCard
          title="Fee Pending List"
          applicants={stats.pendingFees}
          programs={programs}
          field="feeStatus"
          emptyText="No allocated applicants have pending fees."
        />
      </div>

      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">Recent Applicants</h3>
          <span className="text-xs text-muted-foreground">
            Last {Math.min(recentApplicants.length, 10)} records
          </span>
        </div>

        <RecentApplicantsTable
          applicants={recentApplicants}
          programs={programs}
          loading={loading}
        />
      </div>
    </div>
  );
}

function PendingActionCard({ title, applicants, programs, field, emptyText }) {
  return (
    <div className="glass-card p-6">
      <h3 className="font-semibold text-lg mb-4">{title}</h3>

      {applicants.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <div className="space-y-3">
          {applicants.slice(0, 8).map((applicant) => {
            const program = programs.find((item) => item.id === applicant.programId);

            return (
              <div
                key={applicant.id}
                className="flex items-center justify-between rounded-xl border border-border/60 p-3"
              >
                <div>
                  <p className="font-medium text-foreground">{applicant.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {program?.name || "Unknown Program"} • {applicant.quotaType}
                  </p>
                </div>
                <span className="text-xs rounded-full bg-muted px-2.5 py-1">
                  {applicant[field]}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function RecentApplicantsTable({ applicants, programs, loading }) {
  if (loading && applicants.length === 0) {
    return (
      <p className="text-sm text-center py-10 text-muted-foreground">
        Loading applicants...
      </p>
    );
  }

  if (applicants.length === 0) {
    return (
      <p className="text-sm text-center py-10 text-muted-foreground">
        No applicants yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto overflow-y-auto max-h-[18rem] rounded-xl border border-border/60">
      <table className="w-full text-sm">
        <thead className="bg-muted/40">
          <tr className="border-b border-border/60">
            {["Applicant", "Program", "Quota", "Status", "Docs", "Fee"].map(
              (header) => (
                <th
                  key={header}
                  className="sticky top-0 z-10 bg-muted/95 backdrop-blur text-left font-medium text-xs uppercase tracking-wide text-muted-foreground px-4 py-3"
                >
                  {header}
                </th>
              ),
            )}
          </tr>
        </thead>

        <tbody>
          {applicants.map((applicant) => {
            const program = programs.find(
              (item) => item.id === applicant.programId,
            );

            return (
              <tr
                key={applicant.id}
                className="border-b border-border/40 last:border-b-0 hover:bg-muted/20 transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center">
                      {applicant.name?.slice(0, 2).toUpperCase() || "NA"}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {applicant.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {applicant.email || "-"}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {program?.name || "-"}
                </td>
                <td className="px-4 py-3">
                  <StatusPill value={applicant.quotaType} />
                </td>
                <td className="px-4 py-3">
                  <StatusPill type="admission" value={applicant.admissionStatus} />
                </td>
                <td className="px-4 py-3">
                  <StatusPill type="document" value={applicant.documentStatus} />
                </td>
                <td className="px-4 py-3">
                  <StatusPill type="fee" value={applicant.feeStatus} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function StatusPill({ type, value }) {
  const text = value || "-";
  let cls = "bg-muted text-muted-foreground";

  if (type === "admission") {
    if (text === "Confirmed") cls = "bg-success/10 text-success";
    if (text === "Allocated") cls = "bg-primary/10 text-primary";
    if (text === "Applied") cls = "bg-warning/10 text-warning";
  }

  if (type === "document") {
    if (text === "Verified") cls = "bg-success/10 text-success";
    if (text === "Submitted") cls = "bg-info/10 text-info";
    if (text === "Pending") cls = "bg-warning/10 text-warning";
  }

  if (type === "fee") {
    if (text === "Paid") cls = "bg-success/10 text-success";
    if (text === "Pending") cls = "bg-warning/10 text-warning";
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}
    >
      {text}
    </span>
  );
}

function EmptyState({ icon: Icon, text }) {
  return (
    <div className="flex justify-center items-center h-64">
      <div className="text-center">
        <Icon className="w-10 h-10 mx-auto opacity-30 mb-2" />
        <p>{text}</p>
      </div>
    </div>
  );
}
