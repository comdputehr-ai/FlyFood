import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { useCity } from '@/App';
import { Button } from "@/components/ui/button";
import { ChevronRight, MapPin, Star, Clock } from 'lucide-react';
import axios from 'axios';
import { API } from '@/App';

const CITIES = ["Душанбе", "Худжанд", "Курган-Тюбе", "Куляб"];

const HomePage = () => {
  const { city, setCity } = useCity();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const response = await axios.get(`${API}/restaurants`, {
          params: { city }
        });
        setRestaurants(response.data.slice(0, 6));
      } catch (error) {
        console.error('Failed to fetch restaurants:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRestaurants();
  }, [city]);

  const cuisineTypes = [
    { name: 'Таджикская', emoji: '🍲', image: 'https://images.unsplash.com/photo-1603076218042-64efad4281b5?w=400&q=80' },
    { name: 'Фаст-фуд', emoji: '🍔', image: 'https://images.unsplash.com/photo-1541592391523-5ae8c2c88d10?w=400&q=80' },
    { name: 'Японская', emoji: '🍣', image: 'https://images.unsplash.com/photo-1513615147033-3ed2afaaae8f?w=400&q=80' },
    { name: 'Итальянская', emoji: '🍕', image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&q=80' },
    { name: 'Кавказская', emoji: '🥩', image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&q=80' },
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#FF5500] to-[#FF8800] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-40 h-40 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 left-10 w-60 h-60 bg-white rounded-full blur-3xl"></div>
        </div>
        <div className="container-app py-16 md:py-24 relative">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight mb-6" data-testid="hero-title">
              Доставка еды<br />по всему Таджикистану
            </h1>
            <p className="text-lg md:text-xl opacity-90 mb-8">
              Все лучшие рестораны в одном приложении. Быстрая доставка прямо к вашей двери.
            </p>
            
            {/* City Selection */}
            <div className="flex flex-wrap gap-3 mb-8">
              {CITIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCity(c)}
                  className={`px-5 py-2.5 rounded-full font-medium transition-all ${
                    city === c
                      ? 'bg-white text-[#FF5500]'
                      : 'bg-white/20 hover:bg-white/30 text-white'
                  }`}
                  data-testid={`hero-city-${c}`}
                >
                  {c}
                </button>
              ))}
            </div>

            <Link to="/restaurants">
              <Button 
                className="bg-white text-[#FF5500] hover:bg-white/90 rounded-full px-8 py-6 text-lg font-bold shadow-xl"
                data-testid="explore-restaurants-btn"
              >
                Выбрать ресторан
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="container-app py-12 md:py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Категории</h2>
          <Link 
            to="/restaurants" 
            className="text-[#FF5500] font-medium flex items-center gap-1 hover:underline"
            data-testid="see-all-categories"
          >
            Все <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {cuisineTypes.map((cuisine) => (
            <Link
              key={cuisine.name}
              to={`/restaurants?cuisine=${cuisine.name}`}
              className="group relative aspect-square rounded-2xl overflow-hidden hover-lift"
              data-testid={`category-${cuisine.name}`}
            >
              <img 
                src={cuisine.image} 
                alt={cuisine.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/10"></div>
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <span className="text-2xl mb-1 block">{cuisine.emoji}</span>
                <h3 className="text-white font-bold text-lg">{cuisine.name}</h3>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Popular Restaurants */}
      <section className="bg-white py-12 md:py-16">
        <div className="container-app">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Популярные рестораны</h2>
              <p className="text-gray-500 mt-1 flex items-center gap-1">
                <MapPin className="w-4 h-4" /> {city}
              </p>
            </div>
            <Link 
              to="/restaurants" 
              className="text-[#FF5500] font-medium flex items-center gap-1 hover:underline"
              data-testid="see-all-restaurants"
            >
              Все <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-2xl overflow-hidden bg-gray-100 animate-pulse">
                  <div className="aspect-[4/3] bg-gray-200"></div>
                  <div className="p-4 space-y-3">
                    <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : restaurants.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {restaurants.map((restaurant) => (
                <Link
                  key={restaurant.id}
                  to={`/restaurants/${restaurant.id}`}
                  className="card-restaurant hover-lift"
                  data-testid={`restaurant-card-${restaurant.id}`}
                >
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
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">В городе {city} пока нет ресторанов</p>
              <p className="text-gray-400 mt-2">Попробуйте выбрать другой город</p>
            </div>
          )}
        </div>
      </section>

      {/* How it Works */}
      <section className="container-app py-12 md:py-16">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-12">Как это работает</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { step: '1', title: 'Выберите ресторан', desc: 'Просмотрите меню любимых ресторанов', icon: '🍽️' },
            { step: '2', title: 'Оформите заказ', desc: 'Добавьте блюда в корзину и оплатите', icon: '📝' },
            { step: '3', title: 'Получите доставку', desc: 'Мы доставим заказ прямо к вашей двери', icon: '🛵' },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="w-20 h-20 rounded-2xl bg-[#FF5500]/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">{item.icon}</span>
              </div>
              <div className="text-[#FF5500] font-bold text-sm mb-2">Шаг {item.step}</div>
              <h3 className="font-bold text-xl text-gray-900 mb-2">{item.title}</h3>
              <p className="text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="bg-gray-900 text-white py-16">
        <div className="container-app text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Готовы заказать?</h2>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">
            Присоединяйтесь к тысячам пользователей, которые уже наслаждаются быстрой доставкой еды
          </p>
          <Link to="/restaurants">
            <Button 
              className="bg-[#FF5500] hover:bg-[#E64D00] text-white rounded-full px-8 py-6 text-lg font-bold"
              data-testid="footer-cta-btn"
            >
              Начать заказ
            </Button>
          </Link>
        </div>
      </section>
    </Layout>
  );
};

export default HomePage;
