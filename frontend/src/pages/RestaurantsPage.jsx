import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { useCity } from '@/App';
import { Input } from "@/components/ui/input";
import { Search, Star, Clock, MapPin, Filter } from 'lucide-react';
import axios from 'axios';
import { API } from '@/App';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const RestaurantsPage = () => {
  const { city } = useCity();
  const [searchParams, setSearchParams] = useSearchParams();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState(searchParams.get('cuisine') || 'all');

  const cuisines = [
    { value: 'all', label: 'Все кухни' },
    { value: 'Таджикская', label: 'Таджикская' },
    { value: 'Фаст-фуд', label: 'Фаст-фуд' },
    { value: 'Японская', label: 'Японская' },
    { value: 'Итальянская', label: 'Итальянская' },
    { value: 'Кавказская', label: 'Кавказская' },
  ];

  useEffect(() => {
    const fetchRestaurants = async () => {
      setLoading(true);
      try {
        const params = { city };
        if (selectedCuisine && selectedCuisine !== 'all') {
          params.cuisine = selectedCuisine;
        }
        if (searchQuery) {
          params.search = searchQuery;
        }
        const response = await axios.get(`${API}/restaurants`, { params });
        setRestaurants(response.data);
      } catch (error) {
        console.error('Failed to fetch restaurants:', error);
      } finally {
        setLoading(false);
      }
    };
    
    const debounce = setTimeout(fetchRestaurants, 300);
    return () => clearTimeout(debounce);
  }, [city, selectedCuisine, searchQuery]);

  const handleCuisineChange = (value) => {
    setSelectedCuisine(value);
    if (value === 'all') {
      searchParams.delete('cuisine');
    } else {
      searchParams.set('cuisine', value);
    }
    setSearchParams(searchParams);
  };

  return (
    <Layout>
      <div className="bg-white border-b border-gray-100 sticky top-0 md:top-16 z-40">
        <div className="container-app py-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900" data-testid="restaurants-title">Рестораны</h1>
              <p className="text-gray-500 flex items-center gap-1 mt-1">
                <MapPin className="w-4 h-4" /> {city}
              </p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Поиск ресторанов..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 rounded-xl border-gray-200"
                data-testid="search-input"
              />
            </div>
            <Select value={selectedCuisine} onValueChange={handleCuisineChange}>
              <SelectTrigger className="w-full sm:w-48 h-12 rounded-xl" data-testid="cuisine-filter">
                <Filter className="w-4 h-4 mr-2 text-gray-400" />
                <SelectValue placeholder="Тип кухни" />
              </SelectTrigger>
              <SelectContent>
                {cuisines.map((cuisine) => (
                  <SelectItem key={cuisine.value} value={cuisine.value} data-testid={`cuisine-${cuisine.value}`}>
                    {cuisine.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="container-app py-6">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="rounded-2xl overflow-hidden bg-white animate-pulse">
                <div className="aspect-[4/3] bg-gray-200"></div>
                <div className="p-4 space-y-3">
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : restaurants.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {restaurants.map((restaurant, index) => (
              <Link
                key={restaurant.id}
                to={`/restaurants/${restaurant.id}`}
                className="card-restaurant hover-lift animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
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
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-medium text-gray-700">
                    {restaurant.cuisine_type}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg text-gray-900 mb-1">{restaurant.name}</h3>
                  <p className="text-gray-500 text-sm mb-3 line-clamp-2">{restaurant.description}</p>
                  <div className="flex items-center gap-3 text-sm flex-wrap">
                    <span className="badge-delivery flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {restaurant.delivery_time}
                    </span>
                    <span className="text-gray-500">
                      Мин. {restaurant.min_order} сом.
                    </span>
                    <span className="text-gray-500">
                      Доставка {restaurant.delivery_fee} сом.
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Search className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Ничего не найдено</h3>
            <p className="text-gray-500">
              {searchQuery 
                ? `По запросу "${searchQuery}" ресторанов не найдено`
                : `В городе ${city} пока нет ресторанов с выбранным типом кухни`
              }
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default RestaurantsPage;
