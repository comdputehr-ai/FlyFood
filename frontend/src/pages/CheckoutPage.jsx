import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { useAuth, useCart, API } from '@/App';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CreditCard, Banknote, ChevronLeft, Loader2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cart, clearCart } = useCart();
  
  const [formData, setFormData] = useState({
    delivery_address: '',
    phone: user?.phone || '',
    comment: '',
    payment_method: 'cash'
  });
  const [loading, setLoading] = useState(false);
  const [restaurant, setRestaurant] = useState(null);

  useEffect(() => {
    if (cart?.restaurant_id) {
      axios.get(`${API}/restaurants/${cart.restaurant_id}`)
        .then(res => setRestaurant(res.data))
        .catch(err => console.error(err));
    }
  }, [cart?.restaurant_id]);

  const isEmpty = !cart?.items || cart.items.length === 0;
  const deliveryFee = restaurant?.delivery_fee || 15;
  const subtotal = cart?.total || 0;
  const total = subtotal + deliveryFee;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.delivery_address.trim()) {
      toast.error('Укажите адрес доставки');
      return;
    }
    
    if (!formData.phone.trim()) {
      toast.error('Укажите номер телефона');
      return;
    }

    setLoading(true);
    
    try {
      // Create order
      const orderRes = await axios.post(`${API}/orders`, {
        delivery_address: formData.delivery_address,
        phone: formData.phone,
        comment: formData.comment,
        payment_method: formData.payment_method
      });
      
      const order = orderRes.data;
      
      if (formData.payment_method === 'card') {
        // Create Stripe checkout session
        const checkoutRes = await axios.post(`${API}/payments/create-checkout`, {
          order_id: order.id,
          origin_url: window.location.origin
        });
        
        // Redirect to Stripe
        window.location.href = checkoutRes.data.url;
      } else {
        // Cash payment - go to order detail
        toast.success('Заказ успешно оформлен!');
        navigate(`/orders/${order.id}`);
      }
    } catch (error) {
      console.error('Order error:', error);
      toast.error(error.response?.data?.detail || 'Ошибка при оформлении заказа');
    } finally {
      setLoading(false);
    }
  };

  if (isEmpty) {
    navigate('/cart');
    return null;
  }

  return (
    <Layout>
      <div className="container-app py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/cart')}
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
            data-testid="back-to-cart"
          >
            <ChevronLeft className="w-6 h-6 text-gray-700" />
          </button>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900" data-testid="checkout-title">
            Оформление заказа
          </h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Checkout Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Delivery Info */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Доставка</h2>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="address" className="text-gray-700">Адрес доставки *</Label>
                    <Input
                      id="address"
                      type="text"
                      placeholder="Улица, дом, квартира"
                      value={formData.delivery_address}
                      onChange={(e) => setFormData({ ...formData, delivery_address: e.target.value })}
                      className="mt-1.5 h-12 rounded-xl"
                      required
                      data-testid="address-input"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="phone" className="text-gray-700">Номер телефона *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+992 XXX XXX XXX"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="mt-1.5 h-12 rounded-xl"
                      required
                      data-testid="phone-input"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="comment" className="text-gray-700">Комментарий к заказу</Label>
                    <Textarea
                      id="comment"
                      placeholder="Особые пожелания, этаж, код домофона..."
                      value={formData.comment}
                      onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                      className="mt-1.5 rounded-xl resize-none"
                      rows={3}
                      data-testid="comment-input"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Способ оплаты</h2>
                
                <RadioGroup
                  value={formData.payment_method}
                  onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
                  className="space-y-3"
                >
                  <label
                    htmlFor="cash"
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                      formData.payment_method === 'cash'
                        ? 'border-[#FF5500] bg-[#FF5500]/5'
                        : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <RadioGroupItem value="cash" id="cash" data-testid="payment-cash" />
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                      <Banknote className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Наличными при получении</p>
                      <p className="text-sm text-gray-500">Оплата курьеру</p>
                    </div>
                  </label>

                  <label
                    htmlFor="card"
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                      formData.payment_method === 'card'
                        ? 'border-[#FF5500] bg-[#FF5500]/5'
                        : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <RadioGroupItem value="card" id="card" data-testid="payment-card" />
                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Банковской картой</p>
                      <p className="text-sm text-gray-500">Visa, MasterCard, Мир</p>
                    </div>
                  </label>
                </RadioGroup>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl p-6 border border-gray-100 sticky top-24">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Ваш заказ</h2>
                
                {/* Restaurant */}
                <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                  <div className="w-10 h-10 rounded-xl bg-[#FF5500]/10 flex items-center justify-center">
                    <span className="text-lg">🍽️</span>
                  </div>
                  <span className="font-medium text-gray-900">{cart.restaurant_name}</span>
                </div>
                
                {/* Items */}
                <div className="py-4 border-b border-gray-100 space-y-2 max-h-48 overflow-y-auto">
                  {cart.items.map((item) => (
                    <div key={item.menu_item_id} className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {item.name} × {item.quantity}
                      </span>
                      <span className="font-medium">{(item.price * item.quantity).toFixed(2)} сом.</span>
                    </div>
                  ))}
                </div>
                
                {/* Totals */}
                <div className="py-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Товары</span>
                    <span className="font-medium">{subtotal.toFixed(2)} сом.</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Доставка</span>
                    <span className="font-medium">{deliveryFee.toFixed(2)} сом.</span>
                  </div>
                </div>
                
                <div className="flex justify-between text-lg pt-4 border-t border-gray-100">
                  <span className="font-bold text-gray-900">Итого</span>
                  <span className="font-bold text-[#FF5500]">{total.toFixed(2)} сом.</span>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#FF5500] hover:bg-[#E64D00] text-white rounded-full py-6 mt-6 font-bold text-lg disabled:opacity-50"
                  data-testid="submit-order-btn"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Обработка...
                    </>
                  ) : formData.payment_method === 'card' ? (
                    'Перейти к оплате'
                  ) : (
                    'Оформить заказ'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default CheckoutPage;
