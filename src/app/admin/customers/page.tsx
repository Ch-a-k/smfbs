"use client";

import { useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

// Типы для клиентов
interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  notes?: string;
  bookingsCount: number;
  totalSpent: number;
  firstBookingDate: Date;
  lastBookingDate: Date;
  isVip: boolean;
}

interface CustomerFormData {
  id?: string;
  name: string;
  email: string;
  phone: string;
  notes: string;
  isVip: boolean;
}

// Моковые данные клиентов для фронтенда
const initialCustomers: Customer[] = [
  {
    id: '1',
    name: 'Иван Петров',
    email: 'ivan@example.com',
    phone: '+48123456789',
    notes: 'Предпочитает сложные комнаты',
    bookingsCount: 5,
    totalSpent: 2500,
    firstBookingDate: new Date(2023, 1, 15),
    lastBookingDate: new Date(2024, 2, 20),
    isVip: true
  },
  {
    id: '2',
    name: 'Мария Сидорова',
    email: 'maria@example.com',
    phone: '+48987654321',
    notes: '',
    bookingsCount: 3,
    totalSpent: 1500,
    firstBookingDate: new Date(2023, 3, 10),
    lastBookingDate: new Date(2024, 1, 5),
    isVip: false
  },
  {
    id: '3',
    name: 'Алексей Иванов',
    email: 'alex@example.com',
    phone: '+48555666777',
    notes: 'Аллергия на пыль',
    bookingsCount: 1,
    totalSpent: 300,
    firstBookingDate: new Date(2024, 1, 25),
    lastBookingDate: new Date(2024, 1, 25),
    isVip: false
  },
  {
    id: '4',
    name: 'Екатерина Новикова',
    email: 'kate@example.com',
    phone: '+48111222333',
    notes: 'Предпочитает бронировать на утро',
    bookingsCount: 8,
    totalSpent: 4000,
    firstBookingDate: new Date(2022, 11, 5),
    lastBookingDate: new Date(2024, 2, 15),
    isVip: true
  },
  {
    id: '5',
    name: 'Дмитрий Смирнов',
    email: 'dmitry@example.com',
    phone: '+48444555666',
    notes: '',
    bookingsCount: 2,
    totalSpent: 900,
    firstBookingDate: new Date(2023, 9, 20),
    lastBookingDate: new Date(2024, 0, 10),
    isVip: false
  }
];

// Форматирование даты для отображения
const formatDate = (date: Date) => {
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<CustomerFormData>({
    name: '',
    email: '',
    phone: '',
    notes: '',
    isVip: false
  });
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

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
        notes: customer.notes || '',
        isVip: customer.isVip
      });
      setIsEditing(true);
    } else {
      setCurrentCustomer({
        name: '',
        email: '',
        phone: '',
        notes: '',
        isVip: false
      });
      setIsEditing(false);
    }
    setIsDialogOpen(true);
  };

  const handleDeleteCustomer = (id: string) => {
    if (confirm('Вы уверены, что хотите удалить этого клиента?')) {
      setCustomers(customers.filter(customer => customer.id !== id));
      toast({
        title: "Клиент удален",
        description: "Клиент был успешно удален из системы.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isEditing) {
      // Обновляем существующего клиента
      setCustomers(customers.map(customer => 
        customer.id === currentCustomer.id 
          ? {
              ...customer,
              name: currentCustomer.name,
              email: currentCustomer.email,
              phone: currentCustomer.phone,
              notes: currentCustomer.notes,
              isVip: currentCustomer.isVip
            } 
          : customer
      ));
      toast({
        title: "Клиент обновлен",
        description: `Данные клиента "${currentCustomer.name}" успешно обновлены.`,
        variant: "default",
      });
    } else {
      // Добавляем нового клиента
      const newCustomer: Customer = {
        id: Math.random().toString(36).substr(2, 9),
        name: currentCustomer.name,
        email: currentCustomer.email,
        phone: currentCustomer.phone,
        notes: currentCustomer.notes,
        isVip: currentCustomer.isVip,
        bookingsCount: 0,
        totalSpent: 0,
        firstBookingDate: new Date(),
        lastBookingDate: new Date()
      };
      setCustomers([...customers, newCustomer]);
      toast({
        title: "Клиент добавлен",
        description: `Клиент "${currentCustomer.name}" успешно добавлен.`,
        variant: "default",
      });
    }
    
    setIsDialogOpen(false);
  };

  // Фильтрация клиентов по поисковому запросу
  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm)
  );

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
              <div>Первый визит</div>
              <div>Последний визит</div>
              <div className="text-right">Действия</div>
            </div>
            
            {filteredCustomers.length > 0 ? (
              <div className="divide-y divide-[#3a3637]">
                {filteredCustomers.map((customer) => (
                  <div key={customer.id} className="grid grid-cols-7 p-3 text-sm text-[#e0e0e0] items-center">
                    <div className="flex items-center gap-2">
                      {customer.isVip && (
                        <Star className="h-4 w-4 text-[#f36e21]" />
                      )}
                      <span>{customer.name}</span>
                    </div>
                    <div className="text-[#a0a0a0]">
                      <div>{customer.email}</div>
                      <div>{customer.phone}</div>
                    </div>
                    <div>{customer.bookingsCount}</div>
                    <div>{customer.totalSpent} zł</div>
                    <div>{formatDate(customer.firstBookingDate)}</div>
                    <div>{formatDate(customer.lastBookingDate)}</div>
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
                  id="isVip"
                  name="isVip"
                  checked={currentCustomer.isVip}
                  onChange={handleInputChange}
                  className="h-4 w-4 rounded border-[#3a3637] text-[#f36e21]"
                />
                <Label htmlFor="isVip" className="flex items-center">
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
