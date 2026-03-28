import { useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import {
  Users,
  GraduationCap,
  BarChart3,
  AlertCircle,
  IndianRupee,
  FileWarning,
} from "lucide-react";
import { KEYS } from "@/lib/store";
import { useStore } from "@/hooks/useStore";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const CHART_COLORS = [
  "hsl(200, 80%, 40%)",
  "hsl(160, 60%, 42%)",
  "hsl(38, 92%, 50%)",
  "hsl(280, 60%, 50%)",
  "hsl(350, 70%, 55%)",
];

export default function Dashboard() {
  const { items: applicantsRaw, loading: applicantsLoading } = useStore(
    KEYS.applicants
  );
  const { items: programsRaw, loading: programsLoading } = useStore(
    KEYS.programs
  );
  const { items: quotasRaw, loading: quotasLoading } = useStore(
    KEYS.quotas
  );

  const applicants = Array.isArray(applicantsRaw) ? applicantsRaw : [];
  const programs = Array.isArray(programsRaw) ? programsRaw : [];
  const quotas = Array.isArray(quotasRaw) ? quotasRaw : [];
  const loading = applicantsLoading || programsLoading || quotasLoading;

  const stats = useMemo(
    () => ({
      totalApplicants: applicants.length,
      totalAdmitted: applicants.filter(
        (a) => a?.admissionStatus === "Confirmed"
      ).length,
      pendingFees: applicants.filter(
        (a) =>
          a?.feeStatus === "Pending" &&
          a?.admissionStatus !== "Applied"
      ).length,
      pendingDocs: applicants.filter(
        (a) => a?.documentStatus !== "Verified"
      ).length,
    }),
    [applicants]
  );

  const quotaData = useMemo(() => {
    const quotaMap = {};

    quotas.forEach((q) => {
      if (!q) return;

      if (!quotaMap[q.type]) {
        quotaMap[q.type] = { filled: 0, total: 0 };
      }

      quotaMap[q.type].filled += q.filledSeats || 0;
      quotaMap[q.type].total += q.totalSeats || 0;
    });

    return Object.entries(quotaMap).map(([name, val]) => ({
      name,
      filled: val.filled,
      remaining: val.total - val.filled,
      total: val.total,
    }));
  }, [quotas]);

  const programData = useMemo(
    () =>
      programs.map((p) => {
        const pQuotas = quotas.filter(
          (q) => q?.programId === p?.id
        );

        const filled = pQuotas.reduce(
          (sum, q) => sum + (q?.filledSeats || 0),
          0
        );

        return {
          name: p?.code || "N/A",
          intake: p?.totalIntake || 0,
          filled,
          remaining: (p?.totalIntake || 0) - filled,
        };
      }),
    [programs, quotas]
  );

  const recentApplicants = useMemo(
    () => applicants.slice(-10).reverse(),
    [applicants]
  );

  const statCards = useMemo(() => {
    const admittedPct = stats.totalApplicants
      ? Math.round((stats.totalAdmitted / stats.totalApplicants) * 100)
      : 0;
    const pendingActions = stats.pendingFees + stats.pendingDocs;

    return [
      {
        title: "Total Applicants",
        value: stats.totalApplicants,
        icon: Users,
        note: "All applications received",
        tone: "text-primary bg-primary/10",
      },
      {
        title: "Admitted",
        value: stats.totalAdmitted,
        icon: GraduationCap,
        note: `${admittedPct}% conversion so far`,
        tone: "text-success bg-success/10",
      },
      {
        title: "Fee Pending",
        value: stats.pendingFees,
        icon: IndianRupee,
        note: "Allocated/confirmed with unpaid fee",
        tone: "text-warning bg-warning/10",
      },
      {
        title: "Docs Pending",
        value: stats.pendingDocs,
        icon: FileWarning,
        note: `${pendingActions} total actions pending`,
        tone: "text-destructive bg-destructive/10",
      },
    ];
  }, [stats]);

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Dashboard"
        subtitle="Admission overview and analytics"
      />

      {/* Stats */}
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
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.tone}`}>
                <card.icon className="w-5 h-5" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {card.note}
            </p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="glass-card p-6">
          <h3 className="font-semibold text-lg mb-4">
            Program-wise Seat Status
          </h3>

          {programData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={programData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />

                <Bar
                  dataKey="filled"
                  stackId="a"
                  name="Filled"
                  fill="hsl(202, 89%, 45%)"
                />
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

        {/* Pie Chart */}
        <div className="glass-card p-6">
          <h3 className="font-semibold text-lg mb-4">
            Quota Distribution
          </h3>

          {quotaData.length > 0 ? (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="50%" height={240}>
                <PieChart>
                  <Pie
                    data={quotaData}
                    dataKey="total"
                    nameKey="name"
                    outerRadius={90}
                    innerRadius={50}
                  >
                    {quotaData.map((_, i) => (
                      <Cell
                        key={i}
                        fill={CHART_COLORS[i % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>

              <div className="flex-1 space-y-2">
                {quotaData.map((q) => (
                  <div
                    key={q.name}
                    className="flex justify-between text-sm"
                  >
                    <span>{q.name}</span>
                    <span>
                      {q.filled}/{q.total}
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

      {/* Recent Applicants */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">
            Recent Applicants
          </h3>
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

/* ------------------ TABLE ------------------ */

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
            <th className="sticky top-0 z-10 bg-muted/95 backdrop-blur text-left font-medium text-xs uppercase tracking-wide text-muted-foreground px-4 py-3">
              Applicant
            </th>
            <th className="sticky top-0 z-10 bg-muted/95 backdrop-blur text-left font-medium text-xs uppercase tracking-wide text-muted-foreground px-4 py-3">
              Program
            </th>
            <th className="sticky top-0 z-10 bg-muted/95 backdrop-blur text-left font-medium text-xs uppercase tracking-wide text-muted-foreground px-4 py-3">
              Quota
            </th>
            <th className="sticky top-0 z-10 bg-muted/95 backdrop-blur text-left font-medium text-xs uppercase tracking-wide text-muted-foreground px-4 py-3">
              Status
            </th>
            <th className="sticky top-0 z-10 bg-muted/95 backdrop-blur text-left font-medium text-xs uppercase tracking-wide text-muted-foreground px-4 py-3">
              Docs
            </th>
            <th className="sticky top-0 z-10 bg-muted/95 backdrop-blur text-left font-medium text-xs uppercase tracking-wide text-muted-foreground px-4 py-3">
              Fee
            </th>
          </tr>
        </thead>

        <tbody>
          {applicants.map((a) => {
            const prog = programs.find((p) => p?.id === a?.programId);

            return (
              <tr
                key={a.id}
                className="border-b border-border/40 last:border-b-0 hover:bg-muted/20 transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center">
                      {a?.name?.slice(0, 2).toUpperCase() || "NA"}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {a?.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {a?.email || "-"}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {prog?.name || "-"}
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs">
                    {a?.quotaType || "-"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <StatusPill type="admission" value={a?.admissionStatus} />
                </td>
                <td className="px-4 py-3">
                  <StatusPill type="document" value={a?.documentStatus} />
                </td>
                <td className="px-4 py-3">
                  <StatusPill type="fee" value={a?.feeStatus} />
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
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {text}
    </span>
  );
}

/* ------------------ EMPTY STATE ------------------ */

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
