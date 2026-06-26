import { useEffect, useState } from 'react';
import api from '../api';
import { User, UserCircle } from 'lucide-react';

export default function Users() {
  const [users, setUsers] = useState<any[]>([]);

  const fetchUsers = () => {
    api.get('/admin/users').then((res) => setUsers(res.data)).catch(console.error);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleBan = async (id: string, currentStatus: boolean) => {
    const action = currentStatus ? "yasağını kaldırmak" : "yasaklamak";
    if (!window.confirm(`Bu kullanıcının ${action} istediğinize emin misiniz?`)) return;
    try {
      await api.post(`/admin/users/${id}/toggle-ban`);
      fetchUsers();
    } catch (err) {
      alert("İşlem başarısız.");
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
        <User size={20} className="text-gray-500" />
        <h2 className="text-lg font-semibold text-gray-900">Müşteriler</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İsim / Telefon</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">E-posta</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarih</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((u) => (
              <tr key={u.id} className={u.isBanned ? "bg-red-50" : "hover:bg-gray-50"}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <UserCircle className="h-6 w-6 text-gray-400" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                        {u.name}
                        {u.isBanned && <span className="bg-red-100 text-red-800 text-[10px] px-2 py-0.5 rounded-full font-bold">YASAKLI</span>}
                      </div>
                      <div className="text-sm text-gray-500">{u.phone}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.email || 'E-posta yok'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(u.createdAt).toLocaleDateString('tr-TR')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button 
                    onClick={() => toggleBan(u.id, u.isBanned)} 
                    className={`px-3 py-1.5 rounded-md text-xs font-bold ${u.isBanned ? "bg-gray-200 text-gray-800 hover:bg-gray-300" : "bg-red-50 text-red-700 hover:bg-red-100"}`}
                  >
                    {u.isBanned ? "Yasağı Kaldır" : "Yasakla"}
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500 text-sm">Henüz müşteri bulunmuyor.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
