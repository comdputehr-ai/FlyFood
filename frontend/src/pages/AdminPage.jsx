import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth, API } from '@/App';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LayoutDashboard, UtensilsCrossed, ClipboardList, BarChart3, ChevronLeft, Plus, Edit, Trash2, Clock, CheckCircle2, ChefHat, Truck, Package, XCircle, Loader2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const AdminPage = () => {
  const location = useLocation();
  const { user } = useAuth();

  const navItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Обзор' },
    { path: '/admin/orders', icon: ClipboardList, label: 'Заказы' },
    { path: '/admin/menu', icon: UtensilsCrossed, label: 'Меню' },
    { path: '/admin/analytics', icon: BarChart3, label: 'Аналитика' },
  ];

  const isActive = (path) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0]">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-100 fixed inset-y-0 left-0">
        <div className="p-6 border-b border-gray-100">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-[#FF5500] flex items-center justify-center">
              <span className="text-white font-bold text-lg">🍽️</span>
            </div>
            <span className="font-bold text-xl text-gray-900">Tajik Eats</span>
          </Link>
        </div>
        
        <nav className="flex-1 p-4">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-2 transition-colors ${
                isActive(item.path)
                  ? 'bg-[#FF5500] text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <Link
            to="/"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="font-medium">Назад</span>
          </Link>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden bg-white border-b border-gray-100 p-4 flex items-center justify-between sticky top-0 z-50">
        <Link to="/" className="flex items-center gap-2">
          <ChevronLeft className="w-6 h-6 text-gray-700" />
        </Link>
        <span className="font-bold text-lg">Админ панель</span>
        <div className="w-6"></div>
      </header>

      {/* Mobile Nav */}
      <nav className="md:hidden flex gap-2 p-4 overflow-x-auto bg-white border-b border-gray-100">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
              isActive(item.path)
                ? 'bg-[#FF5500] text-white'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            <item.icon className="w-4 h-4" />
            <span className="text-sm font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Main Content */}
      <main className="md:ml-64 p-4 md:p-8">
        <Routes>
          <Route index element={<AdminDashboard />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="menu" element={<AdminMenu />} />
          <Route path="analytics" element={<AdminAnalytics />} />
        </Routes>
      </main>
    </div>
  );
};

// Dashboard Component
const AdminDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await axios.get(`${API}/admin/analytics`);
        setAnalytics(response.data);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-10 h-10 border-4 border-[#FF5500] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const stats = [
    { label: 'Всего заказов', value: analytics?.total_orders || 0, icon: ClipboardList, color: 'bg-blue-100 text-blue-700' },
    { label: 'Выполнено', value: analytics?.completed_orders || 0, icon: CheckCircle2, color: 'bg-emerald-100 text-emerald-700' },
    { label: 'В работе', value: analytics?.pending_orders || 0, icon: Clock, color: 'bg-yellow-100 text-yellow-700' },
    { label: 'Выручка', value: `${(analytics?.total_revenue || 0).toFixed(0)} сом.`, icon: BarChart3, color: 'bg-purple-100 text-purple-700' },
  ];

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6" data-testid="admin-dashboard-title">
        Панель управления
      </h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl p-6 border border-gray-100">
            <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center mb-4`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <p className="text-gray-500 text-sm">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link to="/admin/orders" className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-[#FF5500]/20 transition-colors">
          <h3 className="font-bold text-lg text-gray-900 mb-2">Управление заказами</h3>
          <p className="text-gray-500">Просмотр и обновление статусов заказов</p>
        </Link>
        <Link to="/admin/menu" className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-[#FF5500]/20 transition-colors">
          <h3 className="font-bold text-lg text-gray-900 mb-2">Управление меню</h3>
          <p className="text-gray-500">Добавление и редактирование блюд</p>
        </Link>
      </div>
    </div>
  );
};

// Orders Component
const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API}/admin/orders`);
      setOrders(response.data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      await axios.put(`${API}/orders/${orderId}/status?status=${status}`);
      toast.success('Статус обновлен');
      fetchOrders();
    } catch (error) {
      toast.error('Ошибка при обновлении статуса');
    }
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: <Clock className="w-4 h-4" />,
      confirmed: <CheckCircle2 className="w-4 h-4" />,
      preparing: <ChefHat className="w-4 h-4" />,
      delivering: <Truck className="w-4 h-4" />,
      delivered: <Package className="w-4 h-4" />,
      cancelled: <XCircle className="w-4 h-4" />
    };
    return icons[status] || <Clock className="w-4 h-4" />;
  };

  const getStatusText = (status) => {
    const statusMap = {
      pending: 'Ожидает',
      confirmed: 'Подтвержден',
      preparing: 'Готовится',
      delivering: 'Доставляется',
      delivered: 'Доставлен',
      cancelled: 'Отменен'
    };
    return statusMap[status] || status;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6" data-testid="admin-orders-title">
        Заказы
      </h1>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-10 h-10 border-4 border-[#FF5500] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-2xl p-6 border border-gray-100" data-testid={`admin-order-${order.id}`}>
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`status-${order.status} px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1`}>
                      {getStatusIcon(order.status)}
                      {getStatusText(order.status)}
                    </span>
                    {order.payment_status === 'paid' && (
                      <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold">
                        Оплачен
                      </span>
                    )}
                  </div>
                  <p className="font-bold text-gray-900">Заказ #{order.id.slice(-6)}</p>
                  <p className="text-sm text-gray-500">{formatDate(order.created_at)}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-[#FF5500]">{order.total.toFixed(2)} сом.</p>
                  <p className="text-sm text-gray-500">{order.items.length} товаров</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <p className="text-gray-500">Адрес</p>
                  <p className="font-medium">{order.delivery_address}</p>
                </div>
                <div>
                  <p className="text-gray-500">Телефон</p>
                  <p className="font-medium">{order.phone}</p>
                </div>
              </div>

              {/* Status Update */}
              {order.status !== 'delivered' && order.status !== 'cancelled' && (
                <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
                  {order.status === 'pending' && (
                    <>
                      <Button
                        onClick={() => updateOrderStatus(order.id, 'confirmed')}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full"
                        size="sm"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Подтвердить
                      </Button>
                      <Button
                        onClick={() => updateOrderStatus(order.id, 'cancelled')}
                        variant="outline"
                        className="text-red-500 border-red-200 rounded-full"
                        size="sm"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Отменить
                      </Button>
                    </>
                  )}
                  {order.status === 'confirmed' && (
                    <Button
                      onClick={() => updateOrderStatus(order.id, 'preparing')}
                      className="bg-purple-500 hover:bg-purple-600 text-white rounded-full"
                      size="sm"
                    >
                      <ChefHat className="w-4 h-4 mr-1" />
                      Начать готовить
                    </Button>
                  )}
                  {order.status === 'preparing' && (
                    <Button
                      onClick={() => updateOrderStatus(order.id, 'delivering')}
                      className="bg-orange-500 hover:bg-orange-600 text-white rounded-full"
                      size="sm"
                    >
                      <Truck className="w-4 h-4 mr-1" />
                      Отправить
                    </Button>
                  )}
                  {order.status === 'delivering' && (
                    <Button
                      onClick={() => updateOrderStatus(order.id, 'delivered')}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full"
                      size="sm"
                    >
                      <Package className="w-4 h-4 mr-1" />
                      Доставлен
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
          <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Заказов пока нет</p>
        </div>
      )}
    </div>
  );
};

// Menu Component
const AdminMenu = () => {
  const { user } = useAuth();
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    image_url: '',
    is_available: true,
    is_vegetarian: false,
    is_spicy: false
  });

  useEffect(() => {
    fetchMenu();
  }, [user?.restaurant_id]);

  const fetchMenu = async () => {
    if (!user?.restaurant_id) {
      setLoading(false);
      return;
    }
    try {
      const response = await axios.get(`${API}/restaurants/${user.restaurant_id}/menu`);
      setMenuItems(response.data);
    } catch (error) {
      console.error('Failed to fetch menu:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingItem) {
        await axios.put(`${API}/menu/${editingItem.id}`, {
          ...formData,
          price: parseFloat(formData.price)
        });
        toast.success('Блюдо обновлено');
      } else {
        await axios.post(`${API}/menu`, {
          ...formData,
          price: parseFloat(formData.price),
          restaurant_id: user.restaurant_id
        });
        toast.success('Блюдо добавлено');
      }
      
      setIsDialogOpen(false);
      setEditingItem(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        category: '',
        image_url: '',
        is_available: true,
        is_vegetarian: false,
        is_spicy: false
      });
      fetchMenu();
    } catch (error) {
      toast.error('Ошибка при сохранении');
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price.toString(),
      category: item.category,
      image_url: item.image_url,
      is_available: item.is_available,
      is_vegetarian: item.is_vegetarian,
      is_spicy: item.is_spicy
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm('Удалить это блюдо?')) return;
    
    try {
      await axios.delete(`${API}/menu/${itemId}`);
      toast.success('Блюдо удалено');
      fetchMenu();
    } catch (error) {
      toast.error('Ошибка при удалении');
    }
  };

  if (!user?.restaurant_id) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
        <UtensilsCrossed className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">У вас нет привязанного ресторана</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900" data-testid="admin-menu-title">
          Меню
        </h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-[#FF5500] hover:bg-[#E64D00] text-white rounded-full"
              onClick={() => {
                setEditingItem(null);
                setFormData({
                  name: '',
                  description: '',
                  price: '',
                  category: '',
                  image_url: '',
                  is_available: true,
                  is_vegetarian: false,
                  is_spicy: false
                });
              }}
              data-testid="add-menu-item-btn"
            >
              <Plus className="w-4 h-4 mr-2" />
              Добавить блюдо
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingItem ? 'Редактировать блюдо' : 'Новое блюдо'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Название *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="description">Описание *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Цена (сом.) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Категория *</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="image_url">URL изображения *</Label>
                <Input
                  id="image_url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  required
                  className="mt-1"
                />
              </div>
              <Button type="submit" className="w-full bg-[#FF5500] hover:bg-[#E64D00]">
                {editingItem ? 'Сохранить' : 'Добавить'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-10 h-10 border-4 border-[#FF5500] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : menuItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {menuItems.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl p-4 border border-gray-100 flex gap-4" data-testid={`admin-menu-item-${item.id}`}>
              <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0">
                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900">{item.name}</h3>
                    <p className="text-sm text-gray-500">{item.category}</p>
                  </div>
                  <span className="font-bold text-[#FF5500]">{item.price} сом.</span>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(item)}
                    className="rounded-full"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(item.id)}
                    className="rounded-full text-red-500 border-red-200"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
          <UtensilsCrossed className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">В меню пока нет блюд</p>
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="bg-[#FF5500] hover:bg-[#E64D00] text-white rounded-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Добавить первое блюдо
          </Button>
        </div>
      )}
    </div>
  );
};

// Analytics Component
const AdminAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await axios.get(`${API}/admin/analytics`);
        setAnalytics(response.data);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-10 h-10 border-4 border-[#FF5500] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const statusLabels = {
    pending: 'Ожидает',
    confirmed: 'Подтвержден',
    preparing: 'Готовится',
    delivering: 'Доставляется',
    delivered: 'Доставлен',
    cancelled: 'Отменен'
  };

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6" data-testid="admin-analytics-title">
        Аналитика
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Revenue Card */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">Выручка</h3>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-emerald-700" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{(analytics?.total_revenue || 0).toFixed(0)} сом.</p>
          <p className="text-sm text-gray-500 mt-1">Всего заработано</p>
        </div>

        {/* Orders Card */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">Заказы</h3>
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-blue-700" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{analytics?.total_orders || 0}</p>
          <p className="text-sm text-gray-500 mt-1">Всего заказов</p>
        </div>

        {/* Completion Rate */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">Выполнено</h3>
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-purple-700" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{analytics?.completed_orders || 0}</p>
          <p className="text-sm text-gray-500 mt-1">Доставленных заказов</p>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 mt-6">
        <h3 className="font-bold text-gray-900 mb-4">Заказы по статусам</h3>
        <div className="space-y-3">
          {Object.entries(analytics?.status_counts || {}).map(([status, count]) => (
            <div key={status} className="flex items-center justify-between">
              <span className={`status-${status} px-3 py-1 rounded-full text-sm font-medium`}>
                {statusLabels[status] || status}
              </span>
              <span className="font-bold text-gray-900">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
