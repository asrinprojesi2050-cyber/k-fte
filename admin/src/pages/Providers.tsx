import { useEffect, useState } from 'react';
import api from '../api';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

export default function Providers() {
  const [providers, setProviders] = useState<any[]>([]);

  const fetchProviders = () => {
    api.get('/admin/providers').then((res) => setProviders(res.data)).catch(console.error);
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  const handleVerify = async (id: string, status: string) => {
    try {
      await api.patch(`/admin/providers/${id}/verify`, { status });
      fetchProviders();
    } catch (err) {
      console.error(err);
      alert('İşlem başarısız');
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'APPROVED') return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle size={12}/> Onaylı</span>;
    if (status === 'REJECTED') return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><XCircle size={12}/> Reddedildi</span>;
    return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800"><Clock size={12}/> Beklemede</span>;
  };

  const toggleBan = async (id: string, currentStatus: boolean) => {
    const action = currentStatus ? "yasağını kaldırmak" : "yasaklamak";
    if (!window.confirm(`Bu ustanın ${action} istediğinize emin misiniz?`)) return;
    try {
      await api.post(`/admin/providers/${id}/toggle-ban`);
      fetchProviders();
    } catch (err) {
      alert("İşlem başarısız.");
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Usta Yönetimi</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ad / Telefon</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kategori / Şehir</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {providers.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{p.name} {p.isBanned && <span className="bg-red-100 text-red-800 text-[10px] px-2 py-0.5 rounded-full font-bold">YASAKLI</span>}</div>
                  <div className="text-sm text-gray-500">{p.phone}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{p.category?.nameTr || '-'}</div>
                  <div className="text-sm text-gray-500">{p.city}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(p.verificationStatus)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  {p.verificationStatus !== 'APPROVED' && (
                    <button onClick={() => handleVerify(p.id, 'APPROVED')} className="text-green-600 hover:text-green-900">Onayla</button>
                  )}
                  {p.verificationStatus !== 'REJECTED' && (
                    <button onClick={() => handleVerify(p.id, 'REJECTED')} className="text-red-600 hover:text-red-900">Reddet</button>
                  )}
                  <button 
                    onClick={() => toggleBan(p.id, p.isBanned)} 
                    className={`ml-2 px-3 py-1.5 rounded-md text-xs font-bold ${p.isBanned ? "bg-gray-200 text-gray-800 hover:bg-gray-300" : "bg-red-50 text-red-700 hover:bg-red-100"}`}
                  >
                    {p.isBanned ? "Yasağı Kaldır" : "Yasakla"}
                  </button>
                </td>
              </tr>
            ))}
            {providers.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500 text-sm">Henüz usta bulunmuyor.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
