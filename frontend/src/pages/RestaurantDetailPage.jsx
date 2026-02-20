import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { useAuth, useCart, API } from '@/App';
import { Button } from "@/components/ui/button";
import { Star, Clock, MapPin, Heart, Plus, Minus, ChevronLeft, Leaf, Flame, ShoppingCart } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const RestaurantDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { addToCart, cart } = useCart();
  
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [quantities, setQuantities] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [restaurantRes, menuRes, categoriesRes] = await Promise.all([
          axios.get(`${API}/restaurants/${id}`),
          axios.get(`${API}/restaurants/${id}/menu`),
          axios.get(`${API}/menu-categories/${id}`)
        ]);
        
        setRestaurant(restaurantRes.data);
        setMenuItems(menuRes.data);
        setCategories(['all', ...categoriesRes.data]);

        // Check favorite status
        if (user && token) {
          try {
            const favRes = await axios.get(`${API}/favorites/check/${id}`);
            setIsFavorite(favRes.data.is_favorite);
          } catch (e) {
            // Ignore
          }
        }
      } catch (error) {
        console.error('Failed to fetch restaurant:', error);
        toast.error('Не удалось загрузить данные ресторана');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, user, token]);

  const handleToggleFavorite = async () => {
    if (!user) {
      toast.error('Войдите, чтобы добавить в избранное');
      navigate('/auth');
      return;
    }

    try {
      if (isFavorite) {
        await axios.delete(`${API}/favorites/${id}`);
        setIsFavorite(false);
        toast.success('Удалено из избранного');
      } else {
        await axios.post(`${API}/favorites/${id}`);
        setIsFavorite(true);
        toast.success('Добавлено в избранное');
      }
    } catch (error) {
      toast.error('Ошибка при обновлении избранного');
    }
  };

  const handleAddToCart = async (item) => {
    if (!user) {
      toast.error('Войдите, чтобы добавить в корзину');
      navigate('/auth');
      return;
    }

    const quantity = quantities[item.id] || 1;
    try {
      await addToCart(item.id, quantity);
      toast.success(`${item.name} добавлен в корзину`);
      setQuantities({ ...quantities, [item.id]: 1 });
    } catch (error) {
      if (error.response?.status === 400) {
        toast.info('Корзина очищена. Добавлен товар из нового ресторана.');
        await addToCart(item.id, quantity);
      } else {
        toast.error('Ошибка при добавлении в корзину');
      }
    }
  };

  const updateQuantity = (itemId, delta) => {
    setQuantities(prev => ({
      ...prev,
      [itemId]: Math.max(1, (prev[itemId] || 1) + delta)
    }));
  };

  const filteredItems = selectedCategory === 'all' 
    ? menuItems 
    : menuItems.filter(item => item.category === selectedCategory);

  const cartItemCount = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-[#FF5500] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  if (!restaurant) {
    return (
      <Layout>
        <div className="container-app py-16 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Ресторан не найден</h2>
          <Button onClick={() => navigate('/restaurants')} className="btn-primary">
            К ресторанам
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Hero */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        <img 
          src={restaurant.image_url} 
          alt={restaurant.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/20"></div>
        
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors"
          data-testid="back-button"
        >
          <ChevronLeft className="w-6 h-6 text-gray-700" />
        </button>

        {/* Favorite button */}
        <button
          onClick={handleToggleFavorite}
          className={`absolute top-4 right-4 w-10 h-10 rounded-full backdrop-blur-sm flex items-center justify-center transition-colors ${
            isFavorite ? 'bg-[#FF5500] text-white' : 'bg-white/90 text-gray-700 hover:bg-white'
          }`}
          data-testid="favorite-button"
        >
          <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
        </button>

        {/* Restaurant info */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="container-app">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2" data-testid="restaurant-name">
              {restaurant.name}
            </h1>
            <p className="text-white/80 mb-3">{restaurant.description}</p>
            <div className="flex flex-wrap items-center gap-3">
              <span className="badge-rating bg-white/90">
                <Star className="w-3 h-3 fill-current" />
                {restaurant.rating}
              </span>
              <span className="badge-delivery bg-white/90 text-gray-700">
                <Clock className="w-3 h-3 mr-1" />
                {restaurant.delivery_time}
              </span>
              <span className="text-white/80 text-sm flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {restaurant.address}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Info bar */}
      <div className="bg-white border-b border-gray-100 py-4">
        <div className="container-app flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Мин. заказ:</span>
            <span className="font-bold text-gray-900">{restaurant.min_order} сом.</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Доставка:</span>
            <span className="font-bold text-gray-900">{restaurant.delivery_fee} сом.</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Кухня:</span>
            <span className="font-bold text-gray-900">{restaurant.cuisine_type}</span>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="bg-white border-b border-gray-100 sticky top-0 md:top-16 z-30">
        <div className="container-app py-3">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`category-pill ${selectedCategory === category ? 'active' : ''}`}
                data-testid={`category-${category}`}
              >
                {category === 'all' ? 'Все' : category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="container-app py-6 pb-32 md:pb-6">
        {filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item, index) => (
              <div
                key={item.id}
                className="card-food animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
                data-testid={`menu-item-${item.id}`}
              >
                <div className="flex gap-4">
                  <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0">
                    <img 
                      src={item.image_url} 
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-gray-900">{item.name}</h3>
                      <div className="flex gap-1">
                        {item.is_vegetarian && (
                          <span className="badge-vegetarian" title="Вегетарианское">
                            <Leaf className="w-3 h-3" />
                          </span>
                        )}
                        {item.is_spicy && (
                          <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded text-xs" title="Острое">
                            <Flame className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-gray-500 text-sm line-clamp-2 mt-1">{item.description}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="price-tag">{item.price} сом.</span>
                      {item.is_available ? (
                        <div className="flex items-center gap-2">
                          <div className="quantity-control">
                            <button
                              onClick={() => updateQuantity(item.id, -1)}
                              className="quantity-btn"
                              data-testid={`decrease-${item.id}`}
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-6 text-center font-medium">
                              {quantities[item.id] || 1}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, 1)}
                              className="quantity-btn"
                              data-testid={`increase-${item.id}`}
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                          <Button
                            onClick={() => handleAddToCart(item)}
                            className="bg-[#FF5500] hover:bg-[#E64D00] text-white rounded-full w-10 h-10 p-0"
                            data-testid={`add-to-cart-${item.id}`}
                          >
                            <Plus className="w-5 h-5" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">Нет в наличии</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">Нет блюд в этой категории</p>
          </div>
        )}
      </div>

      {/* Floating Cart Button (Mobile) */}
      {cartItemCount > 0 && (
        <div className="fixed bottom-20 left-4 right-4 md:hidden z-40">
          <Button
            onClick={() => navigate('/cart')}
            className="w-full bg-[#FF5500] hover:bg-[#E64D00] text-white rounded-2xl py-4 shadow-xl flex items-center justify-between px-6"
            data-testid="floating-cart-btn"
          >
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              <span className="font-bold">{cartItemCount} товаров</span>
            </div>
            <span className="font-bold">{cart?.total?.toFixed(2)} сом.</span>
          </Button>
        </div>
      )}
    </Layout>
  );
};

export default RestaurantDetailPage;
