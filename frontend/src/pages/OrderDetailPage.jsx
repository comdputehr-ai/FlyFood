import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { API } from '@/App';
import { Button } from "@/components/ui/button";
import { ChevronLeft, MapPin, Phone, MessageSquare, CheckCircle2, Clock, Truck, ChefHat, Package, XCircle, Loader2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const OrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkingPayment, setCheckingPayment] = useState(false);

  const fetchOrder = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/orders/${id}`);
      setOrder(response.data);
    } catch (error) {
      console.error('Failed to fetch order:', error);
      toast.error('Не удалось загрузить заказ');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  // Poll payment status if session_id is present
  useEffect(() => {
    if (sessionId && order && order.payment_status !== 'paid') {
      let attempts = 0;
      const maxAttempts = 10;
      const pollInterval = 2000;

      const pollPaymentStatus = async () => {
        if (attempts >= maxAttempts) {
          setCheckingPayment(false);
          return;
        }

        setCheckingPayment(true);
        try {
          const response = await axios.get(`${API}/payments/status/${sessionId}`);
          if (response.data.payment_status === 'paid') {
            toast.success('Оплата прошла успешно!');
            fetchOrder();
            setCheckingPayment(false);
            return;
          }
        } catch (error) {
          console.error('Failed to check payment status:', error);
        }

        attempts++;
        setTimeout(pollPaymentStatus, pollInterval);
      };

      pollPaymentStatus();
    }
  }, [sessionId, order, fetchOrder]);

  const getStatusIcon = (status) => {
    const icons = {
      pending: <Clock className="w-5 h-5" />,
      confirmed: <CheckCircle2 className="w-5 h-5" />,
      preparing: <ChefHat className="w-5 h-5" />,
      delivering: <Truck className="w-5 h-5" />,
      delivered: <Package className="w-5 h-5" />,
      cancelled: <XCircle className="w-5 h-5" />
    };
    return icons[status] || <Clock className="w-5 h-5" />;
  };

  const getStatusText = (status) => {
    const statusMap = {
      pending: 'Ожидает подтверждения',
      confirmed: 'Подтвержден',
      preparing: 'Готовится',
      delivering: 'Курьер в пути',
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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const statusSteps = ['pending', 'confirmed', 'preparing', 'delivering', 'delivered'];
  const currentStepIndex = statusSteps.indexOf(order?.status);

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-[#FF5500] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  if (!order) {
    return (
      <Layout>
        <div className="container-app py-16 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Заказ не найден</h2>
          <Button onClick={() => navigate('/orders')} className="btn-primary">
            К заказам
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-app py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/orders')}
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
            data-testid="back-to-orders"
          >
            <ChevronLeft className="w-6 h-6 text-gray-700" />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900" data-testid="order-detail-title">
              Заказ #{order.id.slice(-6)}
            </h1>
            <p className="text-gray-500 text-sm">{formatDate(order.created_at)}</p>
          </div>
        </div>

        {/* Payment checking indicator */}
        {checkingPayment && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            <p className="text-blue-700">Проверяем статус оплаты...</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Card */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getStatusClass(order.status)}`}>
                    {getStatusIcon(order.status)}
                  </div>
                  <div>
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${getStatusClass(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </div>
                </div>
                {order.payment_status === 'paid' && (
                  <span className="px-3 py-1 rounded-full text-sm font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    Оплачен
                  </span>
                )}
              </div>

              {/* Progress Bar */}
              {order.status !== 'cancelled' && (
                <div className="relative">
                  <div className="flex justify-between mb-2">
                    {statusSteps.map((step, index) => (
                      <div
                        key={step}
                        className={`flex flex-col items-center ${
                          index <= currentStepIndex ? 'text-[#FF5500]' : 'text-gray-300'
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                            index <= currentStepIndex
                              ? 'border-[#FF5500] bg-[#FF5500] text-white'
                              : 'border-gray-300 bg-white'
                          }`}
                        >
                          {index < currentStepIndex ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            <span className="text-xs font-bold">{index + 1}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="absolute top-4 left-4 right-4 h-0.5 bg-gray-200 -z-10">
                    <div
                      className="h-full bg-[#FF5500] transition-all duration-500"
                      style={{ width: `${(currentStepIndex / (statusSteps.length - 1)) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {/* Delivery Info */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Информация о доставке</h2>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Адрес</p>
                    <p className="font-medium text-gray-900">{order.delivery_address}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Телефон</p>
                    <p className="font-medium text-gray-900">{order.phone}</p>
                  </div>
                </div>
                
                {order.comment && (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm">Комментарий</p>
                      <p className="font-medium text-gray-900">{order.comment}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Состав заказа</h2>
              
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.menu_item_id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-500">{item.quantity} × {item.price.toFixed(2)} сом.</p>
                    </div>
                    <span className="font-bold text-gray-900">{(item.quantity * item.price).toFixed(2)} сом.</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 border border-gray-100 sticky top-24">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Итого</h2>
              
              {/* Restaurant */}
              <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-[#FF5500]/10 flex items-center justify-center">
                  <span className="text-lg">🍽️</span>
                </div>
                <span className="font-medium text-gray-900">{order.restaurant_name}</span>
              </div>
              
              {/* Totals */}
              <div className="py-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Товары</span>
                  <span className="font-medium">{order.subtotal.toFixed(2)} сом.</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Доставка</span>
                  <span className="font-medium">{order.delivery_fee.toFixed(2)} сом.</span>
                </div>
              </div>
              
              <div className="flex justify-between text-lg pt-4 border-t border-gray-100">
                <span className="font-bold text-gray-900">Итого</span>
                <span className="font-bold text-[#FF5500]">{order.total.toFixed(2)} сом.</span>
              </div>

              {/* Payment Method */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-500 mb-1">Способ оплаты</p>
                <p className="font-medium text-gray-900">
                  {order.payment_method === 'card' ? '💳 Банковская карта' : '💵 Наличными'}
                </p>
              </div>

              {/* Reorder button */}
              {order.status === 'delivered' && (
                <Button
                  onClick={() => navigate(`/restaurants/${order.restaurant_id}`)}
                  className="w-full bg-[#FF5500] hover:bg-[#E64D00] text-white rounded-full py-4 mt-6 font-bold"
                  data-testid="reorder-btn"
                >
                  Повторить заказ
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default OrderDetailPage;
