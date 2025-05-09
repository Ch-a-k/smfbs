'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Trash2, Edit, Plus, Users } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

// Моковые данные комнат
const mockRooms = [
  {
    id: '1',
    name: 'Комната 1',
    capacity: 6,
    isActive: true,
    description: 'Большая комната для групп'
  },
  {
    id: '2',
    name: 'Комната 2',
    capacity: 4,
    isActive: true,
    description: 'Средняя комната для небольших групп'
  },
  {
    id: '3',
    name: 'Комната 3',
    capacity: 2,
    isActive: false,
    description: 'Маленькая комната для пар'
  }
];

interface Room {
  id: string;
  name: string;
  capacity: number;
  isActive: boolean;
  description: string;
}

interface RoomFormData {
  id?: string;
  name: string;
  capacity: number;
  isActive: boolean;
  description: string;
}

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>(mockRooms);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<RoomFormData>({
    name: '',
    capacity: 2,
    isActive: true,
    description: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  const handleOpenDialog = (room?: Room) => {
    if (room) {
      setCurrentRoom({ ...room });
      setIsEditing(true);
    } else {
      setCurrentRoom({
        name: '',
        capacity: 2,
        isActive: true,
        description: ''
      });
      setIsEditing(false);
    }
    setIsDialogOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'number') {
      setCurrentRoom({
        ...currentRoom,
        [name]: parseInt(value, 10)
      });
    } else {
      setCurrentRoom({
        ...currentRoom,
        [name]: value
      });
    }
  };

  const handleSwitchChange = (checked: boolean) => {
    setCurrentRoom({
      ...currentRoom,
      isActive: checked
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isEditing) {
      // Обновляем существующую комнату
      setRooms(rooms.map(room => 
        room.id === currentRoom.id ? { ...currentRoom as Room } : room
      ));
      toast({
        title: "Комната обновлена",
        description: `Комната "${currentRoom.name}" успешно обновлена.`
      });
    } else {
      // Добавляем новую комнату
      const newRoom: Room = {
        ...currentRoom,
        id: Math.random().toString(36).substr(2, 9)
      };
      setRooms([...rooms, newRoom]);
      toast({
        title: "Комната добавлена",
        description: `Комната "${currentRoom.name}" успешно добавлена.`
      });
    }
    
    setIsDialogOpen(false);
  };

  const handleDeleteRoom = (id: string) => {
    setRooms(rooms.filter(room => room.id !== id));
    toast({
      title: "Комната удалена",
      description: "Комната была успешно удалена."
    });
  };

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
          <Card key={room.id} className={!room.isActive ? "opacity-60" : ""}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0 bg-muted/30">
              <div>
                <CardTitle className="flex items-center text-primary">
                  {room.name}
                  {!room.isActive && <Badge variant="secondary" className="ml-2">Неактивна</Badge>}
                </CardTitle>
                <div className="flex items-center mt-1 text-muted-foreground">
                  <Users className="h-4 w-4 mr-1 text-primary" />
                  <span>Вместимость: {room.capacity} чел.</span>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button variant="ghost" size="icon" className="hover:bg-muted" onClick={() => handleOpenDialog(room)}>
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
            <CardContent className="pt-4">
              <p className="text-foreground">{room.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Редактировать комнату' : 'Добавить комнату'}</DialogTitle>
            <DialogDescription>
              {isEditing 
                ? 'Внесите изменения в данные комнаты и нажмите Сохранить.' 
                : 'Заполните данные для новой комнаты и нажмите Добавить.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Название комнаты</Label>
                <Input 
                  id="name"
                  name="name"
                  value={currentRoom.name}
                  onChange={handleInputChange}
                  placeholder="Введите название комнаты"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity">Вместимость (человек)</Label>
                <Input 
                  id="capacity"
                  name="capacity"
                  type="number"
                  min="1"
                  max="20"
                  value={currentRoom.capacity}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Описание</Label>
                <Input 
                  id="description"
                  name="description"
                  value={currentRoom.description}
                  onChange={handleInputChange}
                  placeholder="Введите описание комнаты"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch 
                  id="isActive"
                  checked={currentRoom.isActive}
                  onCheckedChange={handleSwitchChange}
                />
                <Label htmlFor="isActive">Комната активна</Label>
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