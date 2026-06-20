import { useState } from 'react';
import api from '../api';
import { Bell, Send } from 'lucide-react';

export default function Notifications() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!window.confirm('Bu bildirimi göndermek istediğinize emin misiniz?')) return;
    
    setLoading(true);
    setResult(null);
    try {
      const res = await api.post('/admin/notifications/broadcast', { title, message, audience });
      setResult(`Başarılı! Bildirim ${res.data.count} cihaza gönderildi.`);
      setTitle('');
      setMessage('');
    } catch (err: any) {
      setResult('Hata: ' + (err.response?.data?.error || 'Gönderilemedi'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden max-w-2xl mx-auto">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2 bg-indigo-50">
        <Bell size={20} className="text-indigo-600" />
        <h2 className="text-lg font-semibold text-indigo-900">Toplu Bildirim (Push) Gönder</h2>
      </div>
      
      <form onSubmit={handleSend} className="p-6 space-y-5">
        {result && (
          <div className={`p-4 rounded-lg text-sm font-medium ${result.startsWith('Başarılı') ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
            {result}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Hedef Kitle</label>
          <select 
            value={audience} 
            onChange={(e) => setAudience(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="ALL">Herkes (Müşteriler ve Ustalar)</option>
            <option value="CUSTOMERS">Sadece Müşteriler</option>
            <option value="PROVIDERS">Sadece Ustalar</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bildirim Başlığı</label>
          <input 
            required 
            type="text" 
            placeholder="Örn: Hafta Sonu İndirimi!"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bildirim Mesajı</label>
          <textarea 
            required 
            rows={4}
            placeholder="Örn: Bu hafta sonu tüm temizlik işlerinde %10 indirim sizleri bekliyor..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none resize-none" 
            value={message} 
            onChange={(e) => setMessage(e.target.value)} 
          />
        </div>

        <div className="pt-2">
          <button 
            type="submit" 
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {loading ? 'Gönderiliyor...' : <><Send size={18} /> Bildirimi Gönder</>}
          </button>
        </div>
      </form>
    </div>
  );
}
