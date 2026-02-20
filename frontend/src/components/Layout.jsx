import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, ShoppingCart, User, Heart, Clock, ChevronDown, LogOut, Settings } from 'lucide-react';
import { useAuth, useCity, useCart } from '@/App';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const CITIES = ["Душанбе", "Худжанд", "Курган-Тюбе", "Куляб"];

export const Layout = ({ children, showNav = true }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { city, setCity } = useCity();
  const { cart } = useCart();

  const cartItemCount = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  const navItems = [
    { path: '/', icon: Home, label: 'Главная' },
    { path: '/restaurants', icon: Search, label: 'Рестораны' },
    { path: '/cart', icon: ShoppingCart, label: 'Корзина', badge: cartItemCount },
    { path: '/orders', icon: Clock, label: 'Заказы' },
    { path: '/profile', icon: User, label: 'Профиль' },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0]">
      {/* Desktop Header */}
      {showNav && (
        <header className="hidden md:block sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-black/5">
          <div className="container-app flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-[#FF5500] flex items-center justify-center">
                <span className="text-white font-bold text-lg">🍽️</span>
              </div>
              <span className="font-bold text-xl text-gray-900">Tajik Eats</span>
            </Link>

            {/* City Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 text-gray-700" data-testid="city-selector">
                  <span className="text-lg">📍</span>
                  <span>{city}</span>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-48">
                {CITIES.map((c) => (
                  <DropdownMenuItem
                    key={c}
                    onClick={() => setCity(c)}
                    className={city === c ? 'bg-[#FF5500]/10 text-[#FF5500]' : ''}
                    data-testid={`city-option-${c}`}
                  >
                    {c}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Navigation */}
            <nav className="flex items-center gap-6">
              <Link
                to="/restaurants"
                className={`font-medium transition-colors ${isActive('/restaurants') ? 'text-[#FF5500]' : 'text-gray-600 hover:text-gray-900'}`}
                data-testid="nav-restaurants"
              >
                Рестораны
              </Link>
              {user && (
                <>
                  <Link
                    to="/favorites"
                    className={`font-medium transition-colors ${isActive('/favorites') ? 'text-[#FF5500]' : 'text-gray-600 hover:text-gray-900'}`}
                    data-testid="nav-favorites"
                  >
                    Избранное
                  </Link>
                  <Link
                    to="/orders"
                    className={`font-medium transition-colors ${isActive('/orders') ? 'text-[#FF5500]' : 'text-gray-600 hover:text-gray-900'}`}
                    data-testid="nav-orders"
                  >
                    Заказы
                  </Link>
                </>
              )}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-4">
              {user && (
                <Link to="/cart" className="relative" data-testid="nav-cart">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                    <ShoppingCart className="w-5 h-5 text-gray-700" />
                  </div>
                  {cartItemCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#FF5500] text-white text-xs rounded-full flex items-center justify-center font-bold">
                      {cartItemCount}
                    </span>
                  )}
                </Link>
              )}

              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2" data-testid="user-menu">
                      <div className="w-10 h-10 rounded-full bg-[#FF5500] flex items-center justify-center">
                        <span className="text-white font-bold">{user.name.charAt(0).toUpperCase()}</span>
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-1.5">
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email || user.phone}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="flex items-center gap-2 cursor-pointer">
                        <User className="w-4 h-4" />
                        <span>Профиль</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/favorites" className="flex items-center gap-2 cursor-pointer">
                        <Heart className="w-4 h-4" />
                        <span>Избранное</span>
                      </Link>
                    </DropdownMenuItem>
                    {(user.is_admin || user.is_restaurant_owner) && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link to="/admin" className="flex items-center gap-2 cursor-pointer">
                            <Settings className="w-4 h-4" />
                            <span>Админ панель</span>
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} className="text-red-600 cursor-pointer" data-testid="logout-btn">
                      <LogOut className="w-4 h-4 mr-2" />
                      <span>Выйти</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link to="/auth">
                  <Button className="bg-[#FF5500] hover:bg-[#E64D00] text-white rounded-full px-6" data-testid="login-btn">
                    Войти
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className={showNav ? 'pb-safe md:pb-0' : ''}>
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      {showNav && (
        <nav className="mobile-nav" data-testid="mobile-nav">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`mobile-nav-item ${isActive(item.path) ? 'active' : ''}`}
              data-testid={`mobile-nav-${item.label}`}
            >
              <div className="relative">
                <item.icon className="w-6 h-6" />
                {item.badge > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-[#FF5500] text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
};

export default Layout;
