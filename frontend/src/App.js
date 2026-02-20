import React, { createContext, useContext, useState, useEffect } from 'react';
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import { Toaster } from "@/components/ui/sonner";

// Pages
import HomePage from "@/pages/HomePage";
import RestaurantsPage from "@/pages/RestaurantsPage";
import RestaurantDetailPage from "@/pages/RestaurantDetailPage";
import CartPage from "@/pages/CartPage";
import CheckoutPage from "@/pages/CheckoutPage";
import OrdersPage from "@/pages/OrdersPage";
import OrderDetailPage from "@/pages/OrderDetailPage";
import ProfilePage from "@/pages/ProfilePage";
import FavoritesPage from "@/pages/FavoritesPage";
import AuthPage from "@/pages/AuthPage";
import AdminPage from "@/pages/AdminPage";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

// Auth Context
export const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// City Context
export const CityContext = createContext(null);

export const useCity = () => {
  const context = useContext(CityContext);
  if (!context) {
    throw new Error('useCity must be used within CityProvider');
  }
  return context;
};

// Cart Context
export const CartContext = createContext(null);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState(localStorage.getItem('city') || 'Душанбе');
  const [cart, setCart] = useState({ items: [], total: 0 });

  // Configure axios defaults
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Load user on mount
  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          const response = await axios.get(`${API}/auth/me`);
          setUser(response.data);
        } catch (error) {
          console.error('Failed to load user:', error);
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setLoading(false);
    };
    loadUser();
  }, [token]);

  // Load cart when user is authenticated
  useEffect(() => {
    const loadCart = async () => {
      if (user && token) {
        try {
          const response = await axios.get(`${API}/cart`);
          setCart(response.data);
        } catch (error) {
          console.error('Failed to load cart:', error);
        }
      }
    };
    loadCart();
  }, [user, token]);

  // Seed data on first load
  useEffect(() => {
    const seedData = async () => {
      try {
        await axios.post(`${API}/seed`);
      } catch (error) {
        // Ignore if already seeded
      }
    };
    seedData();
  }, []);

  const login = async (emailOrPhone, password) => {
    const response = await axios.post(`${API}/auth/login`, {
      email_or_phone: emailOrPhone,
      password
    });
    localStorage.setItem('token', response.data.token);
    setToken(response.data.token);
    setUser(response.data.user);
    return response.data;
  };

  const register = async (data) => {
    const response = await axios.post(`${API}/auth/register`, data);
    localStorage.setItem('token', response.data.token);
    setToken(response.data.token);
    setUser(response.data.user);
    return response.data;
  };

  const logout = async () => {
    try {
      await axios.post(`${API}/auth/logout`);
    } catch (error) {
      // Ignore
    }
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setCart({ items: [], total: 0 });
  };

  const updateCity = (newCity) => {
    setCity(newCity);
    localStorage.setItem('city', newCity);
  };

  const refreshCart = async () => {
    if (user && token) {
      try {
        const response = await axios.get(`${API}/cart`);
        setCart(response.data);
      } catch (error) {
        console.error('Failed to refresh cart:', error);
      }
    }
  };

  const addToCart = async (menuItemId, quantity = 1) => {
    const response = await axios.post(`${API}/cart/add`, {
      menu_item_id: menuItemId,
      quantity
    });
    setCart(response.data);
    return response.data;
  };

  const updateCartItem = async (menuItemId, quantity) => {
    const response = await axios.post(`${API}/cart/update`, {
      menu_item_id: menuItemId,
      quantity
    });
    setCart(response.data);
    return response.data;
  };

  const clearCart = async () => {
    const response = await axios.delete(`${API}/cart/clear`);
    setCart(response.data);
    return response.data;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F0]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#FF5500] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
      <CityContext.Provider value={{ city, setCity: updateCity }}>
        <CartContext.Provider value={{ cart, addToCart, updateCartItem, clearCart, refreshCart }}>
          <div className="App">
            <Toaster position="top-center" richColors />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/restaurants" element={<RestaurantsPage />} />
                <Route path="/restaurants/:id" element={<RestaurantDetailPage />} />
                <Route path="/cart" element={user ? <CartPage /> : <Navigate to="/auth" />} />
                <Route path="/checkout" element={user ? <CheckoutPage /> : <Navigate to="/auth" />} />
                <Route path="/orders" element={user ? <OrdersPage /> : <Navigate to="/auth" />} />
                <Route path="/orders/:id" element={user ? <OrderDetailPage /> : <Navigate to="/auth" />} />
                <Route path="/profile" element={user ? <ProfilePage /> : <Navigate to="/auth" />} />
                <Route path="/favorites" element={user ? <FavoritesPage /> : <Navigate to="/auth" />} />
                <Route path="/auth" element={user ? <Navigate to="/" /> : <AuthPage />} />
                <Route path="/admin/*" element={user?.is_admin || user?.is_restaurant_owner ? <AdminPage /> : <Navigate to="/" />} />
              </Routes>
            </BrowserRouter>
          </div>
        </CartContext.Provider>
      </CityContext.Provider>
    </AuthContext.Provider>
  );
}

export default App;
