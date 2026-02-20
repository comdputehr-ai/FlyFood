import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { API } from '@/App';
import { Star, Clock, Heart } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const FavoritesPage = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const response = await axios.get(`${API}/favorites`);
        setFavorites(response.data);
      } catch (error) {
        console.error('Failed to fetch favorites:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchFavorites();
  }, []);

  const handleRemoveFavorite = async (restaurantId, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      await axios.delete(`${API}/favorites/${restaurantId}`);
      setFavorites(favorites.filter(r => r.id !== restaurantId));
      toast.success('Удалено из избранного');
    } catch (error) {
      toast.error('Ошибка при удалении');
    }
  };

  return (
    <Layout>
      <div className="container-app py-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6" data-testid="favorites-title">
          Избранное
        </h1>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl overflow-hidden bg-white animate-pulse">
                <div className="aspect-[4/3] bg-gray-200"></div>
                <div className="p-4 space-y-3">
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : favorites.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((restaurant, index) => (
              <Link
                key={restaurant.id}
                to={`/restaurants/${restaurant.id}`}
                className="card-restaurant hover-lift animate-fade-in relative"
                style={{ animationDelay: `${index * 50}ms` }}
                data-testid={`favorite-card-${restaurant.id}`}
              >
                <button
                  onClick={(e) => handleRemoveFavorite(restaurant.id, e)}
                  className="absolute top-3 right-3 z-10 w-10 h-10 rounded-full bg-[#FF5500] text-white flex items-center justify-center hover:bg-[#E64D00] transition-colors"
                  data-testid={`remove-favorite-${restaurant.id}`}
                >
                  <Heart className="w-5 h-5 fill-current" />
                </button>
                
                <div className="aspect-[4/3] relative overflow-hidden">
                  <img 
                    src={restaurant.image_url} 
                    alt={restaurant.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 badge-rating">
                    <Star className="w-3 h-3 fill-current" />
                    {restaurant.rating}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg text-gray-900 mb-1">{restaurant.name}</h3>
                  <p className="text-gray-500 text-sm mb-3 line-clamp-1">{restaurant.description}</p>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="badge-delivery flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {restaurant.delivery_time}
                    </span>
                    <span className="text-gray-500">
                      От {restaurant.min_order} сом.
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-24 h-24 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-6">
              <Heart className="w-12 h-12 text-gray-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Избранных ресторанов нет</h2>
            <p className="text-gray-500 mb-6">Добавьте рестораны в избранное, чтобы быстро их находить</p>
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

export default FavoritesPage;
