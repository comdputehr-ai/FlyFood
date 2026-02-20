import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { useAuth, useCity } from '@/App';
import { Button } from "@/components/ui/button";
import { User, Mail, Phone, MapPin, Heart, Clock, Settings, LogOut, ChevronRight } from 'lucide-react';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { city } = useCity();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const menuItems = [
    { icon: Clock, label: 'История заказов', path: '/orders' },
    { icon: Heart, label: 'Избранное', path: '/favorites' },
    { icon: MapPin, label: `Город: ${city}`, path: '/' },
  ];

  return (
    <Layout>
      <div className="container-app py-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6" data-testid="profile-title">
          Профиль
        </h1>

        {/* User Info Card */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#FF5500] flex items-center justify-center">
              <span className="text-white text-2xl font-bold">{user?.name?.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{user?.name}</h2>
              <div className="flex flex-col gap-1 mt-1">
                {user?.email && (
                  <p className="text-gray-500 text-sm flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {user.email}
                  </p>
                )}
                {user?.phone && (
                  <p className="text-gray-500 text-sm flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {user.phone}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {menuItems.map((item, index) => (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors ${
                index !== menuItems.length - 1 ? 'border-b border-gray-100' : ''
              }`}
              data-testid={`menu-${item.label}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-gray-600" />
                </div>
                <span className="font-medium text-gray-900">{item.label}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          ))}
        </div>

        {/* Admin Panel Link */}
        {(user?.is_admin || user?.is_restaurant_owner) && (
          <button
            onClick={() => navigate('/admin')}
            className="w-full mt-4 bg-white rounded-2xl p-4 border border-gray-100 flex items-center justify-between hover:bg-gray-50 transition-colors"
            data-testid="admin-panel-link"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FF5500]/10 flex items-center justify-center">
                <Settings className="w-5 h-5 text-[#FF5500]" />
              </div>
              <span className="font-medium text-gray-900">Панель управления</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        )}

        {/* Logout Button */}
        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full mt-6 rounded-full py-6 text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
          data-testid="logout-btn"
        >
          <LogOut className="w-5 h-5 mr-2" />
          Выйти из аккаунта
        </Button>
      </div>
    </Layout>
  );
};

export default ProfilePage;
