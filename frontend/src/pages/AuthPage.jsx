import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useCity } from '@/App';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, Mail, Phone, User, Lock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CITIES = ["Душанбе", "Худжанд", "Курган-Тюбе", "Куляб"];

const AuthPage = () => {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const { city } = useCity();
  
  const [activeTab, setActiveTab] = useState('login');
  const [loading, setLoading] = useState(false);
  
  const [loginData, setLoginData] = useState({
    email_or_phone: '',
    password: ''
  });
  
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    city: city
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await login(loginData.email_or_phone, loginData.password);
      toast.success('Добро пожаловать!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (!registerData.email && !registerData.phone) {
      toast.error('Укажите email или телефон');
      return;
    }
    
    if (registerData.password.length < 6) {
      toast.error('Пароль должен быть не менее 6 символов');
      return;
    }
    
    setLoading(true);
    
    try {
      await register(registerData);
      toast.success('Регистрация успешна!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0] flex flex-col">
      {/* Header */}
      <div className="p-4">
        <button
          onClick={() => navigate('/')}
          className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:bg-gray-100 transition-colors"
          data-testid="back-home"
        >
          <ChevronLeft className="w-6 h-6 text-gray-700" />
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 pb-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-[#FF5500] flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-3xl">🍽️</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Tajik Eats</h1>
            <p className="text-gray-500 mt-1">Доставка еды по всему Таджикистану</p>
          </div>

          {/* Auth Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-2 mb-6">
                <TabsTrigger value="login" data-testid="login-tab">Вход</TabsTrigger>
                <TabsTrigger value="register" data-testid="register-tab">Регистрация</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="email_or_phone" className="text-gray-700">Email или телефон</Label>
                    <div className="relative mt-1.5">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="email_or_phone"
                        type="text"
                        placeholder="email@example.com или +992..."
                        value={loginData.email_or_phone}
                        onChange={(e) => setLoginData({ ...loginData, email_or_phone: e.target.value })}
                        className="pl-10 h-12 rounded-xl"
                        required
                        data-testid="login-email-input"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="login_password" className="text-gray-700">Пароль</Label>
                    <div className="relative mt-1.5">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="login_password"
                        type="password"
                        placeholder="••••••••"
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        className="pl-10 h-12 rounded-xl"
                        required
                        data-testid="login-password-input"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#FF5500] hover:bg-[#E64D00] text-white rounded-full py-6 font-bold"
                    data-testid="login-submit-btn"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Вход...
                      </>
                    ) : (
                      'Войти'
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-gray-700">Имя *</Label>
                    <div className="relative mt-1.5">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="name"
                        type="text"
                        placeholder="Ваше имя"
                        value={registerData.name}
                        onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                        className="pl-10 h-12 rounded-xl"
                        required
                        data-testid="register-name-input"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="reg_email" className="text-gray-700">Email</Label>
                    <div className="relative mt-1.5">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="reg_email"
                        type="email"
                        placeholder="email@example.com"
                        value={registerData.email}
                        onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                        className="pl-10 h-12 rounded-xl"
                        data-testid="register-email-input"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="reg_phone" className="text-gray-700">Телефон</Label>
                    <div className="relative mt-1.5">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="reg_phone"
                        type="tel"
                        placeholder="+992 XXX XXX XXX"
                        value={registerData.phone}
                        onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                        className="pl-10 h-12 rounded-xl"
                        data-testid="register-phone-input"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="city" className="text-gray-700">Город</Label>
                    <Select
                      value={registerData.city}
                      onValueChange={(value) => setRegisterData({ ...registerData, city: value })}
                    >
                      <SelectTrigger className="mt-1.5 h-12 rounded-xl" data-testid="register-city-select">
                        <SelectValue placeholder="Выберите город" />
                      </SelectTrigger>
                      <SelectContent>
                        {CITIES.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="reg_password" className="text-gray-700">Пароль *</Label>
                    <div className="relative mt-1.5">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="reg_password"
                        type="password"
                        placeholder="Минимум 6 символов"
                        value={registerData.password}
                        onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                        className="pl-10 h-12 rounded-xl"
                        required
                        data-testid="register-password-input"
                      />
                    </div>
                  </div>

                  <p className="text-xs text-gray-500">
                    Укажите email или телефон для входа в систему
                  </p>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#FF5500] hover:bg-[#E64D00] text-white rounded-full py-6 font-bold"
                    data-testid="register-submit-btn"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Регистрация...
                      </>
                    ) : (
                      'Зарегистрироваться'
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
