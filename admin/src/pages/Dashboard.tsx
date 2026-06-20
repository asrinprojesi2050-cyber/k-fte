import { useEffect, useState } from 'react';
import api from '../api';
import { Users, UserCircle, Briefcase, TrendingUp } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    api.get('/admin/stats').then((res) => setStats(res.data)).catch(console.error);
  }, []);

  if (!stats) return <div>Yükleniyor...</div>;

  const cards = [
    { label: 'Toplam Müşteri', value: stats.usersCount, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Toplam Usta', value: stats.providersCount, icon: UserCircle, color: 'text-green-600', bg: 'bg-green-100' },
    { label: 'Aktif Talepler', value: stats.activeRequestsCount, icon: Briefcase, color: 'text-amber-600', bg: 'bg-amber-100' },
    { label: 'Tamamlanan İşler', value: stats.completedJobsCount, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-100' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
              <div className={`p-4 rounded-lg ${card.bg}`}>
                <Icon className={card.color} size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Hacim (EUR)</h3>
          <p className="text-3xl font-bold text-gray-900">€{stats.volumeEur.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Hacim (MKD)</h3>
          <p className="text-3xl font-bold text-gray-900">{stats.volumeMkd.toLocaleString()} ден</p>
        </div>
      </div>
    </div>
  );
}
