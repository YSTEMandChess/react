import React from 'react';

interface Profile {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  zipcode: string | null;
  gender: string | null;
  gradeLevel: string | null;
  accountCreatedAt: string;
}

interface Stats {
  totalTimeHours: number;
  gameTimeHours: number;
  lessonTimeHours: number;
  puzzleTimeHours: number;
  mentorTimeHours: number;
  currentStreak: number;
  activitiesCompleted: number;
  badgesEarned: number;
}

interface Props {
  profile: Profile;
  stats: Stats;
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 text-center">
      <div className="text-xl font-bold text-gray-800">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}

const StudentDetailPanel: React.FC<Props> = ({ profile, stats }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
    {/* Profile */}
    <div>
      <h3 className="text-base font-semibold text-gray-800">
        {profile.firstName} {profile.lastName}
        <span className="ml-2 text-sm text-gray-400 font-normal">@{profile.username}</span>
      </h3>
      <p className="text-sm text-gray-500 mt-0.5">{profile.email}</p>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
        <span>Grade: {profile.gradeLevel ?? '—'}</span>
        <span>Gender: {profile.gender ?? '—'}</span>
        <span>Zip: {profile.zipcode ?? '—'}</span>
        <span>Joined: {new Date(profile.accountCreatedAt).toLocaleDateString()}</span>
      </div>
    </div>

    {/* Stats grid */}
    <div className="grid grid-cols-4 gap-2">
      <StatCard label="Total Hours" value={stats.totalTimeHours.toFixed(1)} />
      <StatCard label="Game Hours" value={stats.gameTimeHours.toFixed(1)} />
      <StatCard label="Lesson Hours" value={stats.lessonTimeHours.toFixed(1)} />
      <StatCard label="Puzzle Hours" value={stats.puzzleTimeHours.toFixed(1)} />
    </div>
    <div className="grid grid-cols-3 gap-2">
      <StatCard label="Day Streak" value={stats.currentStreak} />
      <StatCard label="Activities" value={stats.activitiesCompleted} />
      <StatCard label="Badges" value={stats.badgesEarned} />
    </div>
  </div>
);

export default StudentDetailPanel;
