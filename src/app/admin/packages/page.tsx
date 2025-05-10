'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Trash2, Edit, Plus, Clock, Users, CreditCard, Star, Check } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import Cookies from 'universal-cookie';

interface Room {
  id: number;
  name: string;
  capacity: number;
  max_people: number;
  is_active: boolean;
  available: boolean;
  notes: string | null;
  work_schedule: Record<string, any>;
}

interface Package {
  id: number;
  name: string;
  description: string;
  price: number;
  deposit_amount: number;
  duration: number;
  max_people: number;
  preferred_rooms: number[];
  is_active: boolean;
  is_best_seller: boolean;
}

interface PackageFormData {
  id?: number;
  name: string;
  description: string;
  price: number;
  deposit_amount: number;
  duration: number;
  max_people: number;
  preferred_rooms: number[];
  is_active: boolean;
  is_best_seller: boolean;
}

export default function PackagesPage() {
  const cookies = new Cookies();
  const [packages, setPackages] = useState<Package[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentPackage, setCurrentPackage] = useState<PackageFormData>({
    name: '',
    description: '',
    price: 0,
    deposit_amount: 0,
    duration: 0,
    max_people: 1,
    preferred_rooms: [],
    is_active: true,
    is_best_seller: false
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRoomsLoading, setIsRoomsLoading] = useState(true);
  const { toast } = useToast();

  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${cookies.get('access_token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Произошла ошибка');
    }
    
    // Для статуса 204 (No Content) возвращаем null
    if (response.status === 204) return null;
    
    return response.json();
  };

  const fetchPackages = async () => {
    try {
      setIsLoading(true);
      const data = await fetchWithAuth('http://localhost:89/api/packages');
      setPackages(data);
    } catch (error) {
      toast({
        title: "Ошибка загрузки",
        description: error instanceof Error ? error.message : "Не удалось загрузить пакеты",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRooms = async () => {
    try {
      setIsRoomsLoading(true);
      const data = await fetchWithAuth('http://localhost:89/api/rooms');
      setRooms(data);
    } catch (error) {
      toast({
        title: "Ошибка загрузки комнат",
        description: error instanceof Error ? error.message : "Не удалось загрузить список комнат",
        variant: "destructive",
      });
    } finally {
      setIsRoomsLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
    fetchRooms();
  }, []);

  const handleOpenDialog = (pkg?: Package) => {
    if (pkg) {
      setCurrentPackage({ 
        id: pkg.id,
        name: pkg.name,
        description: pkg.description,
        price: pkg.price,
        deposit_amount: pkg.deposit_amount,
        duration: pkg.duration,
        max_people: pkg.max_people,
        preferred_rooms: pkg.preferred_rooms,
        is_active: pkg.is_active,
        is_best_seller: pkg.is_best_seller || false
      });
      setIsEditing(true);
    } else {
      setCurrentPackage({
        name: '',
        description: '',
        price: 0,
        deposit_amount: 0,
        duration: 0,
        max_people: 1,
        preferred_rooms: [],
        is_active: true,
        is_best_seller: false
      });
      setIsEditing(false);
    }
    setIsDialogOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === 'number') {
      setCurrentPackage({
        ...currentPackage,
        [name]: parseFloat(value) || 0
      });
    } else {
      setCurrentPackage({
        ...currentPackage,
        [name]: value
      });
    }
  };

  const handleRoomToggle = (roomId: number) => {
    setCurrentPackage(prev => {
      const newPreferredRooms = prev.preferred_rooms.includes(roomId)
        ? prev.preferred_rooms.filter(id => id !== roomId)
        : [...prev.preferred_rooms, roomId];
      
      return {
        ...prev,
        preferred_rooms: newPreferredRooms
      };
    });
  };

  const handleSwitchChange = (name: 'is_active' | 'is_best_seller', checked: boolean) => {
    setCurrentPackage({
      ...currentPackage,
      [name]: checked
    });
  };

  const validateForm = () => {
    if (currentPackage.deposit_amount > currentPackage.price) {
      toast({
        title: "Ошибка валидации",
        description: "Депозит не может быть больше цены пакета",
        variant: "destructive"
      });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      if (isEditing && currentPackage.id) {
        const updatedPackage = await fetchWithAuth('http://localhost:89/api/packages', {
          method: 'PUT',
          body: JSON.stringify({
            id: currentPackage.id,
            name: currentPackage.name,
            description: currentPackage.description,
            price: currentPackage.price,
            deposit_amount: currentPackage.deposit_amount,
            duration: currentPackage.duration,
            max_people: currentPackage.max_people,
            preferred_rooms: currentPackage.preferred_rooms,
            is_active: currentPackage.is_active,
            is_best_seller: currentPackage.is_best_seller
          })
        });
        
        setPackages(packages.map(pkg => pkg.id === updatedPackage.id ? updatedPackage : pkg));
        toast({
          title: "Пакет обновлен",
          description: `Пакет "${currentPackage.name}" успешно обновлен.`
        });
      } else {
        const newPackage = await fetchWithAuth('http://localhost:89/api/packages', {
          method: 'POST',
          body: JSON.stringify({
            name: currentPackage.name,
            description: currentPackage.description,
            price: currentPackage.price,
            deposit_amount: currentPackage.deposit_amount,
            duration: currentPackage.duration,
            max_people: currentPackage.max_people,
            preferred_rooms: currentPackage.preferred_rooms,
            is_active: currentPackage.is_active,
            is_best_seller: currentPackage.is_best_seller
          })
        });
        
        setPackages([...packages, newPackage]);
        toast({
          title: "Пакет добавлен",
          description: `Пакет "${currentPackage.name}" успешно добавлен.`
        });
      }
      
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Произошла ошибка при сохранении",
        variant: "destructive",
      });
    }
  };

  const handleDeletePackage = async (id: number) => {
    if (confirm('Вы уверены, что хотите удалить этот пакет?')) {
      try {
        const response = await fetchWithAuth(`http://localhost:89/api/packages?id=${id}`, {
          method: 'DELETE'
        });
        
        // Обрабатываем как успешное удаление независимо от того, вернулся ли ответ с контентом
        setPackages(packages.filter(pkg => pkg.id !== id));
        toast({
          title: "Пакет удален",
          description: "Пакет был успешно удален.",
          variant: "default"
        });
      } catch (error) {
        toast({
          title: "Ошибка удаления",
          description: error instanceof Error ? error.message : "Не удалось удалить пакет",
          variant: "destructive",
        });
      }
    }
  };

  if (isLoading || isRoomsLoading) {
    return <div className="p-6">Загрузка данных...</div>;
  }

  const activeAvailableRooms = rooms.filter(room => room.is_active && room.available);

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Пакеты услуг</h2>
          <p className="text-muted-foreground">
            Управление пакетами услуг для бронирования
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Добавить пакет
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {packages.length > 0 ? (
          packages.map(pkg => (
            <Card 
              key={pkg.id} 
              className={`${!pkg.is_active ? "opacity-60" : ""} ${pkg.is_best_seller ? "border-2 border-primary relative shadow-lg" : ""}`}
            >
              {pkg.is_best_seller && (
                <div className="absolute -top-3 -right-3">
                  <Badge className="bg-primary text-primary-foreground font-bold">
                    <Star className="h-3 w-3 mr-1" />
                    BESTSELLER
                  </Badge>
                </div>
              )}
              <CardHeader className="bg-muted/30">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl text-primary">{pkg.name}</CardTitle>
                    <CardDescription>{pkg.description.substring(0, 50)}...</CardDescription>
                  </div>
                  <div className="flex space-x-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleOpenDialog(pkg)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeletePackage(pkg.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-4">
                  <p className="text-foreground">{pkg.description}</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center">
                      <CreditCard className="h-4 w-4 mr-2 text-primary" />
                      <span className="text-foreground font-medium">{pkg.price} PLN</span>
                    </div>
                    <div className="flex items-center">
                      <CreditCard className="h-4 w-4 mr-2 text-primary" />
                      <span className="text-foreground font-medium">Депозит: {pkg.deposit_amount} PLN</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-primary" />
                      <span className="text-foreground font-medium">{pkg.duration} мин</span>
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2 text-primary" />
                      <span className="text-foreground font-medium">до {pkg.max_people} чел.</span>
                    </div>
                  </div>
                  {pkg.preferred_rooms.length > 0 && (
                    <div className="text-sm text-muted-foreground">
                      Предпочтительные комнаты: {pkg.preferred_rooms
                        .map(id => rooms.find(r => r.id === id)?.name || id)
                        .join(', ')}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-2 text-center py-12">
            <p className="text-muted-foreground">Нет доступных пакетов услуг</p>
            <Button className="mt-4" onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Создать первый пакет
            </Button>
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Редактировать пакет' : 'Добавить пакет'}</DialogTitle>
            <DialogDescription>
              {isEditing 
                ? 'Внесите изменения в данные пакета' 
                : 'Заполните данные для нового пакета'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Название пакета *</Label>
              <Input
                id="name"
                name="name"
                value={currentPackage.name}
                onChange={handleInputChange}
                placeholder="Например: TRUDNY"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Описание *</Label>
              <Textarea
                id="description"
                name="description"
                value={currentPackage.description}
                onChange={handleInputChange}
                placeholder="Подробное описание пакета услуг"
                required
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Цена (PLN) *</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={currentPackage.price}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deposit_amount">Депозит (PLN) *</Label>
                <Input
                  id="deposit_amount"
                  name="deposit_amount"
                  type="number"
                  min="0"
                  step="0.01"
                  max={currentPackage.price}
                  value={currentPackage.deposit_amount}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Длительность (мин) *</Label>
                <Input
                  id="duration"
                  name="duration"
                  type="number"
                  min="1"
                  value={currentPackage.duration}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_people">Макс. человек *</Label>
                <Input
                  id="max_people"
                  name="max_people"
                  type="number"
                  min="1"
                  value={currentPackage.max_people}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Предпочтительные комнаты</Label>
              {activeAvailableRooms.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {activeAvailableRooms.map(room => (
                    <div key={room.id} className="flex items-center space-x-2">
                      <button
                        type="button"
                        className={`w-5 h-5 rounded border flex items-center justify-center ${
                          currentPackage.preferred_rooms.includes(room.id)
                            ? 'bg-primary border-primary text-primary-foreground'
                            : 'border-input'
                        }`}
                        onClick={() => handleRoomToggle(room.id)}
                      >
                        {currentPackage.preferred_rooms.includes(room.id) && (
                          <Check className="w-3 h-3" />
                        )}
                      </button>
                      <Label className="text-sm font-normal">
                        {room.name} (до {room.max_people} чел.)
                      </Label>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground p-2 bg-muted rounded">
                  Нет доступных комнат. Сначала создайте комнаты в разделе "Комнаты".
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={currentPackage.is_active}
                  onCheckedChange={(checked) => handleSwitchChange('is_active', checked)}
                />
                <Label htmlFor="is_active">Активен</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_best_seller"
                  checked={currentPackage.is_best_seller}
                  onCheckedChange={(checked) => handleSwitchChange('is_best_seller', checked)}
                />
                <Label htmlFor="is_best_seller">Бестселлер</Label>
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Отмена
              </Button>
              <Button type="submit">
                {isEditing ? 'Сохранить изменения' : 'Создать пакет'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}