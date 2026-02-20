import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { useCart } from '@/App';
import { Button } from "@/components/ui/button";
import { Plus, Minus, Trash2, ShoppingBag, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

const CartPage = () => {
  const navigate = useNavigate();
  const { cart, updateCartItem, clearCart } = useCart();

  const handleUpdateQuantity = async (itemId, newQuantity) => {
    try {
      await updateCartItem(itemId, newQuantity);
      if (newQuantity <= 0) {
        toast.success('Товар удален из корзины');
      }
    } catch (error) {
      toast.error('Ошибка при обновлении корзины');
    }
  };

  const handleClearCart = async () => {
    try {
      await clearCart();
      toast.success('Корзина очищена');
    } catch (error) {
      toast.error('Ошибка при очистке корзины');
    }
  };

  const isEmpty = !cart?.items || cart.items.length === 0;

  return (
    <Layout>
      <div className="container-app py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900" data-testid="cart-title">Корзина</h1>
          {!isEmpty && (
            <Button
              variant="ghost"
              onClick={handleClearCart}
              className="text-red-500 hover:text-red-600 hover:bg-red-50"
              data-testid="clear-cart-btn"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Очистить
            </Button>
          )}
        </div>

        {isEmpty ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="w-12 h-12 text-gray-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Корзина пуста</h2>
            <p className="text-gray-500 mb-6">Добавьте блюда из любимых ресторанов</p>
            <Link to="/restaurants">
              <Button className="btn-primary" data-testid="browse-restaurants-btn">
                Выбрать ресторан
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {/* Restaurant Info */}
              <div className="bg-white rounded-2xl p-4 border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#FF5500]/10 flex items-center justify-center">
                    <span className="text-2xl">🍽️</span>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Заказ из ресторана</p>
                    <Link 
                      to={`/restaurants/${cart.restaurant_id}`}
                      className="font-bold text-gray-900 hover:text-[#FF5500] transition-colors"
                    >
                      {cart.restaurant_name}
                    </Link>
                  </div>
                </div>
              </div>

              {/* Items */}
              {cart.items.map((item, index) => (
                <div
                  key={item.menu_item_id}
                  className="bg-white rounded-2xl p-4 border border-gray-100 animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                  data-testid={`cart-item-${item.menu_item_id}`}
                >
                  <div className="flex gap-4">
                    <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                      <img 
                        src={item.image_url} 
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900">{item.name}</h3>
                      <p className="price-tag mt-1">{item.price} сом.</p>
                      <div className="flex items-center justify-between mt-3">
                        <div className="quantity-control">
                          <button
                            onClick={() => handleUpdateQuantity(item.menu_item_id, item.quantity - 1)}
                            className="quantity-btn"
                            data-testid={`cart-decrease-${item.menu_item_id}`}
                          >
                            {item.quantity === 1 ? <Trash2 className="w-4 h-4 text-red-500" /> : <Minus className="w-4 h-4" />}
                          </button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <button
                            onClick={() => handleUpdateQuantity(item.menu_item_id, item.quantity + 1)}
                            className="quantity-btn"
                            data-testid={`cart-increase-${item.menu_item_id}`}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <span className="font-bold text-gray-900">
                          {(item.price * item.quantity).toFixed(2)} сом.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl p-6 border border-gray-100 sticky top-24">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Итого</h2>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Товары ({cart.items.reduce((sum, i) => sum + i.quantity, 0)} шт.)</span>
                    <span className="font-medium">{cart.total?.toFixed(2)} сом.</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Доставка</span>
                    <span className="font-medium">~ 15 сом.</span>
                  </div>
                  <div className="h-px bg-gray-100 my-3"></div>
                  <div className="flex justify-between text-lg">
                    <span className="font-bold text-gray-900">Итого</span>
                    <span className="font-bold text-[#FF5500]">~ {(cart.total + 15).toFixed(2)} сом.</span>
                  </div>
                </div>

                <Button
                  onClick={() => navigate('/checkout')}
                  className="w-full bg-[#FF5500] hover:bg-[#E64D00] text-white rounded-full py-6 mt-6 font-bold text-lg"
                  data-testid="checkout-btn"
                >
                  Оформить заказ
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>

                <p className="text-center text-gray-400 text-xs mt-4">
                  Окончательная сумма будет рассчитана при оформлении
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CartPage;
