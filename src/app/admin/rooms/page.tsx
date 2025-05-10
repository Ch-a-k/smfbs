'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Trash2, Edit, Plus, Users, Calendar } from 'lucide-react';
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

interface RoomFormData {
  id?: number;
  name: string;
  capacity: number;
  max_people: number;
  is_active: boolean;
  available: boolean;
  notes: string;
  work_schedule: Record<string, any>;
}

export default function RoomsPage() {
  const cookies = new Cookies();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<RoomFormData>({
    name: '',
    capacity: 2,
    max_people: 2,
    is_active: true,
    available: true,
    notes: '',
    work_schedule: {}
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
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
    if (response.status === 204) {
      return null;
    }
    
    // Для остальных успешных запросов пытаемся распарсить JSON
    return response.json();
  };

  const fetchRooms = async () => {
    try {
      setIsLoading(true);
      const data = await fetchWithAuth('http://localhost:89/api/rooms');
      setRooms(data);
    } catch (error) {
      toast({
        title: "Ошибка загрузки",
        description: error instanceof Error ? error.message : "Не удалось загрузить комнаты",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleOpenDialog = (room?: Room) => {
    if (room) {
      setCurrentRoom({ 
        id: room.id,
        name: room.name,
        capacity: room.capacity,
        max_people: room.max_people,
        is_active: room.is_active,
        available: room.available,
        notes: room.notes || '',
        work_schedule: room.work_schedule
      });
      setIsEditing(true);
    } else {
      setCurrentRoom({
        name: '',
        capacity: 2,
        max_people: 2,
        is_active: true,
        available: true,
        notes: '',
        work_schedule: {}
      });
      setIsEditing(false);
    }
    setIsDialogOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    
    setCurrentRoom(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value, 10) : value
    }));

    // Автоматически обновляем max_people если capacity уменьшили
    if (name === 'capacity' && parseInt(value, 10) < currentRoom.max_people) {
      setCurrentRoom(prev => ({
        ...prev,
        max_people: parseInt(value, 10)
      }));
    }
  };

  const handleSwitchChange = (checked: boolean, field: 'is_active' | 'available') => {
    setCurrentRoom(prev => ({
      ...prev,
      [field]: checked
    }));
  };

  const validateForm = () => {
    if (currentRoom.max_people > currentRoom.capacity) {
      toast({
        title: "Ошибка валидации",
        description: "Максимальное количество людей не может быть больше вместимости",
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
      if (isEditing && currentRoom.id) {
        const updatedRoom = await fetchWithAuth('http://localhost:89/api/rooms', {
          method: 'PUT',
          body: JSON.stringify({
            id: currentRoom.id,
            name: currentRoom.name,
            capacity: currentRoom.capacity,
            max_people: currentRoom.max_people,
            is_active: currentRoom.is_active,
            available: currentRoom.available,
            notes: currentRoom.notes,
            work_schedule: currentRoom.work_schedule
          })
        });
        
        setRooms(rooms.map(room => room.id === updatedRoom.id ? updatedRoom : room));
        toast({
          title: "Комната обновлена",
          description: `Комната "${currentRoom.name}" успешно обновлена.`
        });
      } else {
        const newRoom = await fetchWithAuth('http://localhost:89/api/rooms', {
          method: 'POST',
          body: JSON.stringify({
            name: currentRoom.name,
            capacity: currentRoom.capacity,
            max_people: currentRoom.max_people,
            is_active: currentRoom.is_active,
            available: currentRoom.available,
            notes: currentRoom.notes,
            work_schedule: currentRoom.work_schedule
          })
        });
        
        setRooms([...rooms, newRoom]);
        toast({
          title: "Комната добавлена",
          description: `Комната "${currentRoom.name}" успешно добавлена.`
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

  const handleDeleteRoom = async (id: number) => {
    if (confirm('Вы уверены, что хотите удалить эту комнату?')) {
      try {
        await fetchWithAuth(`http://localhost:89/api/rooms?id=${id}`, {
          method: 'DELETE'
        });
        
        setRooms(rooms.filter(room => room.id !== id));
        toast({
          title: "Комната удалена",
          description: "Комната была успешно удалена."
        });
      } catch (error) {
        toast({
          title: "Ошибка удаления",
          description: error instanceof Error ? error.message : "Не удалось удалить комнату",
          variant: "destructive",
        });
      }
    }
  };

  if (isLoading) {
    return <div className="p-6">Загрузка комнат...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Комнаты</h2>
          <p className="text-muted-foreground">
            Управление комнатами для бронирования
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Добавить комнату
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map(room => (
          <Card key={room.id} className={!room.is_active ? "bg-muted" : !room.available ? "bg-muted/50" : ""}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {room.name}
                  {!room.is_active && (
                    <Badge variant="secondary" className="bg-destructive/20 text-destructive-foreground">
                      Неактивна
                    </Badge>
                  )}
                  {room.is_active && !room.available && (
                    <Badge variant="secondary" className="bg-warning/20 text-warning-foreground">
                      Недоступна
                    </Badge>
                  )}
                </CardTitle>
                <div className="flex items-center mt-2 text-sm text-muted-foreground gap-4">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    <span>{room.capacity}/{room.max_people} чел.</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>График: {Object.keys(room.work_schedule).length} дн.</span>
                  </div>
                </div>
              </div>
              <div className="flex space-x-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => handleOpenDialog(room)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-destructive hover:bg-destructive/10"
                  onClick={() => handleDeleteRoom(room.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              {room.notes ? (
                <p className="text-sm text-foreground">{room.notes}</p>
              ) : (
                <p className="text-sm text-muted-foreground">Нет описания</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Редактировать комнату' : 'Добавить комнату'}</DialogTitle>
            <DialogDescription>
              {isEditing 
                ? 'Внесите изменения в данные комнаты' 
                : 'Заполните данные для новой комнаты'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Название комнаты *</Label>
              <Input
                id="name"
                name="name"
                value={currentRoom.name}
                onChange={handleInputChange}
                placeholder="Например: Красная комната"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="capacity">Вместимость *</Label>
                <Input
                  id="capacity"
                  name="capacity"
                  type="number"
                  min="1"
                  value={currentRoom.capacity}
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
                  max={currentRoom.capacity}
                  value={currentRoom.max_people}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Примечания</Label>
              <Input
                id="notes"
                name="notes"
                value={currentRoom.notes}
                onChange={handleInputChange}
                placeholder="Дополнительная информация о комнате"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={currentRoom.is_active}
                    onCheckedChange={(checked) => handleSwitchChange(checked, 'is_active')}
                  />
                  <Label htmlFor="is_active">Активна</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="available"
                    checked={currentRoom.available}
                    onCheckedChange={(checked) => handleSwitchChange(checked, 'available')}
                  />
                  <Label htmlFor="available">Доступна</Label>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Отмена
              </Button>
              <Button type="submit">
                {isEditing ? 'Сохранить изменения' : 'Создать комнату'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}