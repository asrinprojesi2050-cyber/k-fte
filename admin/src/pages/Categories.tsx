import { useEffect, useState } from 'react';
import api from '../api';
import { Tags, Plus, Edit, Trash2, X, Save } from 'lucide-react';

export default function Categories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ slug: '', nameTr: '', nameMk: '', nameSq: '' });

  const fetchCategories = () => {
    api.get('/categories').then((res) => setCategories(res.data)).catch(console.error);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openModal = (cat?: any) => {
    if (cat) {
      setEditingId(cat.id);
      setFormData({ slug: cat.slug, nameTr: cat.nameTr, nameMk: cat.nameMk || '', nameSq: cat.nameSq || '' });
    } else {
      setEditingId(null);
      setFormData({ slug: '', nameTr: '', nameMk: '', nameSq: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/admin/categories/${editingId}`, formData);
      } else {
        await api.post('/admin/categories', formData);
      }
      fetchCategories();
      closeModal();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Hata oluştu');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bu kategoriyi silmek istediğinize emin misiniz?')) return;
    try {
      await api.delete(`/admin/categories/${id}`);
      fetchCategories();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Kategori silinemedi (Kullanımda olabilir)');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-blue-50">
        <div className="flex items-center gap-2">
          <Tags size={20} className="text-blue-600" />
          <h2 className="text-lg font-semibold text-blue-900">Kategori Yönetimi</h2>
        </div>
        <button onClick={() => openModal()} className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} /> Yeni Ekle
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Slug (Anahtar)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Türkçe (TR)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Makedonca (MK)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Arnavutça (SQ)</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {categories.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{c.slug}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{c.nameTr}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{c.nameMk}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{c.nameSq}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2 flex justify-end">
                  <button onClick={() => openModal(c)} className="text-indigo-600 hover:text-indigo-900 p-1"><Edit size={18} /></button>
                  <button onClick={() => handleDelete(c.id)} className="text-red-600 hover:text-red-900 p-1"><Trash2 size={18} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-xl">
              <h3 className="font-semibold text-gray-900">{editingId ? 'Kategoriyi Düzenle' : 'Yeni Kategori'}</h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug (Örn: boyaci, temizlik)</label>
                <input required type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2" value={formData.slug} onChange={(e) => setFormData({...formData, slug: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Türkçe İsim</label>
                <input required type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2" value={formData.nameTr} onChange={(e) => setFormData({...formData, nameTr: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Makedonca İsim</label>
                <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2" value={formData.nameMk} onChange={(e) => setFormData({...formData, nameMk: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Arnavutça İsim</label>
                <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2" value={formData.nameSq} onChange={(e) => setFormData({...formData, nameSq: e.target.value})} />
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium">İptal</button>
                <button type="submit" className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium flex items-center gap-2"><Save size={16} /> {editingId ? 'Güncelle' : 'Kaydet'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
