import { useEffect, useState } from 'react';
import api from '../api';
import { Users, UserCircle, CheckCircle, TrendingUp, Wallet, ShieldCheck, Percent, Target } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#64748b'];

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    api.get('/admin/stats').then((res) => setStats(res.data)).catch(console.error);
  }, []);

  if (!stats) return <div className="flex h-96 items-center justify-center text-gray-500">İstatistikler yükleniyor...</div>;

  const kpiCards = [
    { label: 'Net Kâr (Komisyon)', value: `€${stats.netProfitEur?.toLocaleString() || 0}`, icon: Wallet, color: 'text-green-600', bg: 'bg-green-100' },
    { label: 'Emanet Para (Havuz)', value: `€${stats.escrowBalanceEur?.toLocaleString() || 0}`, icon: ShieldCheck, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'İşe Dönüşüm Oranı', value: `%${stats.matchRate || 0}`, icon: Percent, color: 'text-purple-600', bg: 'bg-purple-100' },
    { label: 'Toplam Ciro (EUR)', value: `€${stats.volumeEur?.toLocaleString() || 0}`, icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-100' },
  ];

  const userCards = [
    { label: 'Müşteriler', value: stats.usersCount, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { label: 'Ustalar', value: stats.providersCount, icon: UserCircle, color: 'text-teal-600', bg: 'bg-teal-100' },
    { label: 'Açık Talepler', value: stats.activeRequestsCount, icon: Target, color: 'text-rose-600', bg: 'bg-rose-100' },
    { label: 'Tamamlanan İş', value: stats.completedJobsCount, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  ];

  return (
    <div className="space-y-6">
      
      {/* Financial KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((card, i) => {
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

      {/* User KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {userCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
              <div className={`p-4 rounded-lg ${card.bg}`}>
                <Icon className={card.color} size={20} />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">{card.label}</p>
                <p className="text-lg font-bold text-gray-900">{card.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Monthly Volume Line Chart */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold mb-6">Aylık Hacim (EUR)</h3>
          <div className="h-72">
            {stats.monthlyVolume && stats.monthlyVolume.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.monthlyVolume}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} tickFormatter={(val) => `€${val}`} />
                  <RechartsTooltip cursor={{stroke: '#e5e7eb', strokeWidth: 2}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  <Line type="monotone" dataKey="volume" stroke="#3b82f6" strokeWidth={3} dot={{r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6}} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">Yeterli veri yok</div>
            )}
          </div>
        </div>

        {/* Category Distribution Pie Chart */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold mb-6">Kategori Dağılımı</h3>
          <div className="h-72">
            {stats.categoryDistribution && stats.categoryDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.categoryDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stats.categoryDistribution.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">Yeterli veri yok</div>
            )}
          </div>
        </div>
      </div>

      {/* Top Providers Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mt-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">En Çok Kazandıran Ustalar (Top 5)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usta Adı</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kategori</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tamamlanan İş</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Puan</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stats.topProviders && stats.topProviders.map((provider: any, idx: number) => (
                <tr key={provider.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                        #{idx + 1}
                      </div>
                      <span className="text-sm font-medium text-gray-900">{provider.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {provider.category?.nameTr || 'Bilinmiyor'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    {provider.completedJobsCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-amber-500 font-medium flex items-center gap-1">
                    ★ {provider.ratingAvg.toFixed(1)}
                  </td>
                </tr>
              ))}
              {(!stats.topProviders || stats.topProviders.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">Henüz iş tamamlayan usta yok.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
