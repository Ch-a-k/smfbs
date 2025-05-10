"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Star, Search, Plus, Edit, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Cookies from "universal-cookie";

// Типы для клиентов
interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  notes: string;
  bookings_count: number;
  total_spent: number;
  last_visit: string;
  is_vip: boolean;
}

interface CustomerFormData {
  id?: number;
  name: string;
  email: string;
  phone: string;
  notes: string;
  is_vip: boolean;
  password?: string;
}

// Форматирование даты для отображения
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<CustomerFormData>({
    name: '',
    email: '',
    phone: '',
    notes: '',
    is_vip: false,
    password: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
const cookies = new Cookies();
const accessToken = cookies.get('access_token');

  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      // Попытка безопасно извлечь ошибку
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        throw new Error(`Ошибка: ${response.status}`);
      }
      throw new Error(errorData.detail || 'Произошла ошибка');
    }

    // Если статус 204, значит контента нет — возвращаем специальный флаг или null
    if (response.status === 204) {
      return null;
    }

    return response.json();
  };

  // Загрузка клиентов с сервера
  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      const data = await fetchWithAuth('http://localhost:89/api/customers');
      setCustomers(data);
    } catch (error) {
      toast({
        title: "Ошибка загрузки",
        description: error instanceof Error ? error.message : "Не удалось загрузить клиентов",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Обработчик изменения полей формы
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setCurrentCustomer(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleOpenDialog = (customer?: Customer) => {
    if (customer) {
      setCurrentCustomer({
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        notes: customer.notes,
        is_vip: customer.is_vip
      });
      setIsEditing(true);
    } else {
      setCurrentCustomer({
        name: '',
        email: '',
        phone: '',
        notes: '',
        is_vip: false,
        password: ''
      });
      setIsEditing(false);
    }
    setIsDialogOpen(true);
  };

  const handleDeleteCustomer = async (id: number) => {
    if (confirm('Вы уверены, что хотите удалить этого клиента?')) {
      try {
        console.log('Deleting customer with ID:', id);
        await fetchWithAuth(`http://localhost:89/api/customers/${id}`, {
          method: 'DELETE'
        });
        await fetchCustomers();
        toast({
          title: "Клиент удален",
          description: "Клиент был успешно удален из системы.",
          variant: "default",
        });
      } catch (error) {
        toast({
          title: "Ошибка удаления",
          description: error instanceof Error ? error.message : "Не удалось удалить клиента",
          variant: "destructive",
        });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (isEditing && currentCustomer.id) {
        // Обновляем существующего клиента
        await fetchWithAuth(`http://localhost:89/api/customers/${currentCustomer.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            full_name: currentCustomer.name,
            is_vip: currentCustomer.is_vip,
            notes: currentCustomer.notes,
            phone: currentCustomer.phone
          })
        });
        toast({
          title: "Клиент обновлен",
          description: `Данные клиента "${currentCustomer.name}" успешно обновлены.`,
          variant: "default",
        });
      } else {
        // Добавляем нового клиента
        await fetchWithAuth('http://localhost:89/api/customers', {
          method: 'POST',
          body: JSON.stringify({
            name: currentCustomer.name,
            email: currentCustomer.email,
            phone: currentCustomer.phone,
            notes: currentCustomer.notes,
            is_vip: currentCustomer.is_vip,
            password: currentCustomer.password || 'defaultPassword' // В реальном приложении нужно запрашивать пароль
          })
        });
        toast({
          title: "Клиент добавлен",
          description: `Клиент "${currentCustomer.name}" успешно добавлен.`,
          variant: "default",
        });
      }
      
      setIsDialogOpen(false);
      await fetchCustomers();
    } catch (error) {
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Произошла ошибка при сохранении",
        variant: "destructive",
      });
    }
  };

  // Фильтрация клиентов по поисковому запросу
  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm)
  );

  if (isLoading) {
    return <div className="p-6 text-[#e0e0e0]">Загрузка...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-[#ffffff]">Клиенты</h1>
        <Button onClick={() => handleOpenDialog()} variant="default">
          <Plus className="mr-2 h-4 w-4" />
          Добавить клиента
        </Button>
      </div>

      <Card className="bg-[#2a2627] border-[#3a3637]">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-[#e0e0e0]">База клиентов</CardTitle>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-[#a0a0a0] h-4 w-4" />
              <Input
                placeholder="Поиск клиентов..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-[#1a1718] border-[#3a3637] text-[#e0e0e0] pl-8 w-[250px]"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-[#3a3637]">
            <div className="grid grid-cols-7 bg-[#1a1718] text-[#a0a0a0] text-xs font-medium p-3 border-b border-[#3a3637]">
              <div>Клиент</div>
              <div>Контакты</div>
              <div>Бронирований</div>
              <div>Потрачено</div>
              <div>Последний визит</div>
              <div>VIP</div>
              <div className="text-right">Действия</div>
            </div>
            
            {filteredCustomers.length > 0 ? (
              <div className="divide-y divide-[#3a3637]">
                {filteredCustomers.map((customer) => (
                  <div key={customer.id} className="grid grid-cols-7 p-3 text-sm text-[#e0e0e0] items-center">
                    <div className="flex items-center gap-2">
                      {customer.is_vip && (
                        <Star className="h-4 w-4 text-[#f36e21]" />
                      )}
                      <span>{customer.name}</span>
                    </div>
                    <div className="text-[#a0a0a0]">
                      <div>{customer.email}</div>
                      <div>{customer.phone}</div>
                    </div>
                    <div>{customer.bookings_count}</div>
                    <div>{customer.total_spent} zł</div>
                    <div>{customer.last_visit ? formatDate(customer.last_visit) : 'Нет данных'}</div>
                    <div>{customer.is_vip ? 'Да' : 'Нет'}</div>
                    <div className="flex justify-end gap-2">
                      <Button
                        onClick={() => handleOpenDialog(customer)}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-[#a0a0a0] hover:text-[#f36e21] hover:bg-[#3a3637]"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => handleDeleteCustomer(customer.id)}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-[#a0a0a0] hover:text-red-500 hover:bg-[#3a3637]"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-[#a0a0a0]">
                {searchTerm ? 'Не найдено клиентов по вашему запросу' : 'Нет клиентов в базе данных'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-[#2a2627] text-[#e0e0e0] border-[#3a3637]">
          <DialogHeader>
            <DialogTitle className="text-[#f36e21]">{isEditing ? 'Редактировать клиента' : 'Добавить клиента'}</DialogTitle>
            <DialogDescription className="text-[#a0a0a0]">
              {isEditing 
                ? 'Внесите изменения в данные клиента и нажмите Сохранить.' 
                : 'Заполните данные для нового клиента и нажмите Добавить.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Имя клиента</Label>
                <Input 
                  id="name"
                  name="name"
                  value={currentCustomer.name}
                  onChange={handleInputChange}
                  placeholder="Введите имя клиента"
                  className="bg-[#1a1718] border-[#3a3637] text-[#e0e0e0]"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email"
                    name="email"
                    type="email"
                    value={currentCustomer.email}
                    onChange={handleInputChange}
                    placeholder="email@example.com"
                    className="bg-[#1a1718] border-[#3a3637] text-[#e0e0e0]"
                    required
                    disabled={isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Телефон</Label>
                  <Input 
                    id="phone"
                    name="phone"
                    value={currentCustomer.phone}
                    onChange={handleInputChange}
                    placeholder="+48XXXXXXXXX"
                    className="bg-[#1a1718] border-[#3a3637] text-[#e0e0e0]"
                    required
                  />
                </div>
              </div>
              {!isEditing && (
                <div className="space-y-2">
                  <Label htmlFor="password">Пароль</Label>
                  <Input 
                    id="password"
                    name="password"
                    type="password"
                    value={currentCustomer.password || ''}
                    onChange={handleInputChange}
                    placeholder="Введите пароль"
                    className="bg-[#1a1718] border-[#3a3637] text-[#e0e0e0]"
                    required={!isEditing}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="notes">Примечания</Label>
                <Input 
                  id="notes"
                  name="notes"
                  value={currentCustomer.notes}
                  onChange={handleInputChange}
                  placeholder="Дополнительная информация о клиенте"
                  className="bg-[#1a1718] border-[#3a3637] text-[#e0e0e0]"
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_vip"
                  name="is_vip"
                  checked={currentCustomer.is_vip}
                  onChange={handleInputChange}
                  className="h-4 w-4 rounded border-[#3a3637] text-[#f36e21]"
                />
                <Label htmlFor="is_vip" className="flex items-center">
                  <Star className="h-4 w-4 text-[#f36e21] mr-1" /> VIP клиент
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Отмена
              </Button>
              <Button type="submit">
                {isEditing ? 'Сохранить' : 'Добавить'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}