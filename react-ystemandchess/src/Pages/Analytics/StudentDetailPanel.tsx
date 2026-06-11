import { useAnalyticsApi, StudentDetail } from "../../core/hooks/useAnalyticsApi";
import LoadingSpinner from "./LoadingSpinner";
import ErrorBanner from "./ErrorBanner";
import StudentTimeChart from "./StudentTimeChart";
import ActivityFeed from "./ActivityFeed";

interface StudentDetailPanelProps {
  studentId: string;
  startDate: string;
  endDate: string;
}

interface StatCardProps {
  label: string;
  value: string | number;
}

const StatCard = ({ label, value }: StatCardProps) => (
  <div className="bg-light border border-borderLight rounded-lg p-3">
    <p className="text-2xl font-semibold text-dark">{value}</p>
    <p className="text-xs text-muted mt-1">{label}</p>
  </div>
);

interface ProfileFieldProps {
  label: string;
  value: string;
}

const ProfileField = ({ label, value }: ProfileFieldProps) => (
  <div>
    <dt className="text-xs text-muted">{label}</dt>
    <dd className="text-sm text-gray">{value}</dd>
  </div>
);

/**
 * Detail panel for a selected student: profile fields, stat summary cards
 * (total time, streak, badges, activities), a time-on-platform line chart,
 * and the paginated activity feed.
 */
const StudentDetailPanel = ({ studentId, startDate, endDate }: StudentDetailPanelProps) => {
  const { data, loading, error, refetch } = useAnalyticsApi<StudentDetail>({
    endpoint: `/analytics/individual/${studentId}`,
    params: { startDate, endDate },
    enabled: Boolean(studentId),
  });

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorBanner message={error.message} onRetry={refetch} />;
  if (!data) return <p className="text-muted text-sm">No data for this period.</p>;

  const { stats } = data;

  return (
    <div className="flex flex-col gap-6">
      {/* Profile header */}
      <div>
        <h2 className="text-xl font-semibold text-dark">{data.name}</h2>
        <p className="text-sm text-muted">@{data.username}</p>
        <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
          <ProfileField label="Email" value={data.email} />
          <ProfileField label="Role" value={data.role} />
          <ProfileField label="Zipcode" value={data.zipcode} />
          <ProfileField label="Joined" value={data.joinedDate} />
        </dl>
      </div>

      {/* Stat summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total time (hours)" value={stats.totalTimeHours} />
        <StatCard label="Current streak (days)" value={stats.currentStreakDays} />
        <StatCard label="Badges" value={stats.badges} />
        <StatCard label="Activities completed" value={stats.activitiesCompleted} />
      </div>

      {/* Time-on-platform chart */}
      <section>
        <h3 className="text-lg font-semibold text-dark mb-2">Time on platform</h3>
        <StudentTimeChart points={data.timeSeries} />
      </section>

      {/* Activity feed */}
      <section>
        <h3 className="text-lg font-semibold text-dark mb-2">Recent activity</h3>
        <ActivityFeed studentId={data.id} />
      </section>
    </div>
  );
};

export default StudentDetailPanel;
