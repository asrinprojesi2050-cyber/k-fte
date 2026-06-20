import { Navigate, Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, LogOut, Briefcase, CreditCard, ShieldAlert, Tags, Bell } from 'lucide-react';

export default function Layout() {
  const token = localStorage.getItem('adminToken');
  const location = useLocation();
  const navigate = useNavigate();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/login');
  };

  const menu = [
    { name: 'Gösterge Paneli', path: '/', icon: LayoutDashboard },
    { name: 'Bildirimler', path: '/notifications', icon: Bell },
    { name: 'Kategoriler', path: '/categories', icon: Tags },
    { name: 'Şikayetler (İhtilaf)', path: '/disputes', icon: ShieldAlert },
    { name: 'Ödemeler (Havuz)', path: '/payments', icon: CreditCard },
    { name: 'Ustalar', path: '/providers', icon: Briefcase },
    { name: 'Müşteriler', path: '/users', icon: Users },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="w-64 bg-white border-r border-gray-200">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <span className="text-xl font-bold text-primary-600">Köfte Admin</span>
        </div>
        <nav className="p-4 space-y-1">
          {menu.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium ${active ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                <Icon size={18} />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-0 w-64 p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            <LogOut size={18} />
            Çıkış Yap
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-8">
          <h1 className="text-lg font-semibold text-gray-900">
            {menu.find((m) => m.path === location.pathname)?.name || 'Admin Paneli'}
          </h1>
        </header>
        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
