import { useEffect, useState } from 'react';
import api from '../api';
import { CreditCard, CheckCircle, Clock, Banknote, Download } from 'lucide-react';

export default function Payments() {
  const [payments, setPayments] = useState<any[]>([]);

  const fetchPayments = () => {
    api.get('/admin/payments').then((res) => setPayments(res.data)).catch(console.error);
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleConfirm = async (id: string) => {
    if (!window.confirm('Müşterinin ödemesini banka hesabında onaylıyor musunuz?')) return;
    try {
      await api.post(`/admin/payments/${id}/confirm`);
      fetchPayments();
    } catch (err) {
      console.error(err);
      alert('İşlem başarısız');
    }
  };

  const handlePayout = async (id: string) => {
    if (!window.confirm('Bu tutarı ustanın hesabına gönderdiğinizi onaylıyor musunuz?')) return;
    try {
      await api.post(`/admin/payments/${id}/payout`);
      fetchPayments();
    } catch (err) {
      console.error(err);
      alert('İşlem başarısız');
    }
  };

  const getStatusBadge = (p: any) => {
    if (p.paidOutAt) return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">Ustaya Ödendi</span>;
    if (p.status === 'CONFIRMED') return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Havuzda (Onaylı)</span>;
    return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">Müşteri Ödemesi Bekleniyor</span>;
  };

  const downloadExcel = () => {
    if (payments.length === 0) return alert('İndirilecek veri yok');
    
    // CSV Header
    let csv = 'Is ID,Musteri,Usta,Toplam Tutar,Komisyon,Ustaya Odenen,Durum,Tarih\n';
    
    payments.forEach(p => {
      const jobId = `KOFTE-${p.job.id.substring(0,6).toUpperCase()}`;
      const customer = `"${p.job.request.customer.name}"`;
      const provider = `"${p.job.provider.name}"`;
      const amount = p.amount;
      const commission = p.commissionAmount;
      const payout = amount - commission;
      const status = p.paidOutAt ? 'USTAYA ODENDI' : (p.status === 'CONFIRMED' ? 'HAVUZDA' : 'BEKLIYOR');
      const date = new Date(p.createdAt).toLocaleDateString('tr-TR');
      
      csv += `${jobId},${customer},${provider},${amount},${commission},${payout},${status},${date}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Odeme_Havuzu_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CreditCard size={20} className="text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900">Ödemeler (Havuz)</h2>
        </div>
        <button onClick={downloadExcel} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors">
          <Download size={16} /> Excel İndir
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İş / Müşteri</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usta</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tutar / Komisyon</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {payments.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-bold text-gray-900">KOFTE-{p.job.id.substring(0,6).toUpperCase()}</div>
                  <div className="text-sm text-gray-500">{p.job.request.customer.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{p.job.provider.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{p.amount} {p.currency} (Toplam)</div>
                  <div className="text-sm text-green-600">+{p.commissionAmount} {p.currency} Kar</div>
                  <div className="text-sm text-red-500">-{p.amount - p.commissionAmount} {p.currency} Ustaya</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col gap-1">
                    {getStatusBadge(p)}
                    <span className="text-xs text-gray-500">İş Durumu: {p.job.status}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  {p.status === 'PENDING' && (
                    <button onClick={() => handleConfirm(p.id)} className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 rounded-md hover:bg-green-100">
                      <CheckCircle size={14} /> Gelen Parayı Onayla
                    </button>
                  )}
                  {p.status === 'CONFIRMED' && p.job.status === 'COMPLETED' && !p.paidOutAt && (
                    <button onClick={() => handlePayout(p.id)} className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-md hover:bg-purple-100">
                      <Banknote size={14} /> Ustaya Öde
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {payments.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500 text-sm">Henüz ödeme kaydı bulunmuyor.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
