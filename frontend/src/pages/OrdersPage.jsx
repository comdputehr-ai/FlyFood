import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { API } from '@/App';
import { Clock, ChevronRight, Package } from 'lucide-react';
import axios from 'axios';

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.get(`${API}/orders`);
        setOrders(response.data);
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const getStatusText = (status) => {
    const statusMap = {
      pending: 'Ожидает подтверждения',
      confirmed: 'Подтвержден',
      preparing: 'Готовится',
      delivering: 'В пути',
      delivered: 'Доставлен',
      cancelled: 'Отменен'
    };
    return statusMap[status] || status;
  };

  const getStatusClass = (status) => {
    return `status-${status}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Layout>
      <div className="container-app py-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6" data-testid="orders-title">
          Мои заказы
        </h1>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map((order, index) => (
              <Link
                key={order.id}
                to={`/orders/${order.id}`}
                className="block bg-white rounded-2xl p-6 border border-gray-100 hover:border-[#FF5500]/20 hover:shadow-md transition-all animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
                data-testid={`order-card-${order.id}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusClass(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                      {order.payment_status === 'paid' && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                          Оплачен
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-lg text-gray-900">{order.restaurant_name}</h3>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {formatDate(order.created_at)}
                  </span>
                  <span>{order.items.length} товаров</span>
                  <span className="font-bold text-[#FF5500]">{order.total.toFixed(2)} сом.</span>
                </div>

                {/* Order items preview */}
                <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                  {order.items.slice(0, 4).map((item) => (
                    <div key={item.menu_item_id} className="flex-shrink-0">
                      <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                        {item.name} × {item.quantity}
                      </span>
                    </div>
                  ))}
                  {order.items.length > 4 && (
                    <span className="text-sm text-gray-400">+{order.items.length - 4} еще</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-24 h-24 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-6">
              <Package className="w-12 h-12 text-gray-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Заказов пока нет</h2>
            <p className="text-gray-500 mb-6">Самое время сделать первый заказ!</p>
            <Link to="/restaurants">
              <button className="btn-primary" data-testid="browse-restaurants-btn">
                Выбрать ресторан
              </button>
            </Link>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default OrdersPage;
