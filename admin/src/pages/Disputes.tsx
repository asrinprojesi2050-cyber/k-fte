import { useEffect, useState } from 'react';
import api from '../api';
import { AlertOctagon, MessageCircle, Check, X, ShieldAlert } from 'lucide-react';

export default function Disputes() {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [selectedMessages, setSelectedMessages] = useState<any[] | null>(null);

  const fetchDisputes = () => {
    api.get('/admin/disputes').then((res) => setDisputes(res.data)).catch(console.error);
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  const handleResolve = async (id: string, resolution: 'COMPLETED' | 'CANCELLED') => {
    const text = resolution === 'COMPLETED' 
      ? 'Usta haklı bulunacak. İş TAMAMLANDI sayılacak ve para ustaya aktarılacak. Onaylıyor musunuz?' 
      : 'Müşteri haklı bulunacak. İş İPTAL edilecek ve para müşteriye iade edilecek. Onaylıyor musunuz?';
    
    if (!window.confirm(text)) return;
    try {
      await api.post(`/admin/jobs/${id}/resolve-dispute`, { resolution });
      fetchDisputes();
    } catch (err) {
      console.error(err);
      alert('İşlem başarısız');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2 bg-red-50">
        <ShieldAlert size={20} className="text-red-500" />
        <h2 className="text-lg font-semibold text-red-900">Şikayetler ve İhtilaflar</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İş / Müşteri</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usta</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Şikayet Sebebi</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sohbet</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Karar Ver</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {disputes.map((d) => (
              <tr key={d.id} className="hover:bg-red-50/50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-bold text-gray-900">KOFTE-{d.id.substring(0,6).toUpperCase()}</div>
                  <div className="text-sm text-gray-500">{d.request.customer.name}</div>
                  <div className="text-xs text-gray-400">{d.request.customer.phone}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{d.provider.name}</div>
                  <div className="text-xs text-gray-400">{d.provider.phone}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-red-600 font-medium whitespace-pre-wrap max-w-xs">{d.disputeReason}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button onClick={() => setSelectedMessages(d.request.messages)} className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100">
                    <MessageCircle size={14} /> Oku ({d.request.messages?.length || 0})
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2 flex items-center justify-end">
                  <button onClick={() => handleResolve(d.id, 'COMPLETED')} className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 rounded-md hover:bg-green-100" title="Ustaya Öde">
                    <Check size={14} /> Usta Haklı
                  </button>
                  <button onClick={() => handleResolve(d.id, 'CANCELLED')} className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 rounded-md hover:bg-red-100" title="Müşteriye İade">
                    <X size={14} /> Müşteri Haklı
                  </button>
                </td>
              </tr>
            ))}
            {disputes.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500 text-sm flex flex-col items-center justify-center">
                  <AlertOctagon size={48} className="text-gray-300 mb-2" />
                  Şu an bekleyen bir ihtilaf bulunmuyor.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedMessages && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[80vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-xl">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2"><MessageCircle size={18} /> Konuşma Geçmişi</h3>
              <button onClick={() => setSelectedMessages(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-4 bg-gray-50">
              {selectedMessages.length === 0 ? <p className="text-center text-gray-500 text-sm">Hiç mesaj yok.</p> : null}
              {selectedMessages.map(m => (
                <div key={m.id} className={`flex flex-col ${m.senderRole === 'customer' ? 'items-start' : 'items-end'}`}>
                  <span className="text-xs text-gray-500 mb-1">{m.senderRole === 'customer' ? 'Müşteri' : 'Usta'}</span>
                  <div className={`px-4 py-2 rounded-2xl max-w-[80%] ${m.senderRole === 'customer' ? 'bg-white border border-gray-200 text-gray-800 rounded-tl-none' : 'bg-primary-600 text-white rounded-tr-none'}`}>
                    {m.text}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
