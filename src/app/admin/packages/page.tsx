'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Trash2, Edit, Plus, Clock, Users, CreditCard, Star } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

// Моковые данные пакетов услуг
const mockPackages = [
  {
    id: '1',
    name: 'TRUDNY',
    title: 'DO ZDEMOLOWANIA',
    description: '35 szklanych przedmiotów, 5 meble, 8 sprzętów RTV i AGD, 10 mniejszych sprzętów RTV i AGD',
    tools: 'ubranie, kask, rękawice',
    capacity: '1-6 osób/do 180 min',
    price: 999,
    depositAmount: 300,
    duration: 180,
    maxPeople: 6,
    isActive: true,
    isBestseller: false
  },
  {
    id: '2',
    name: 'ŚREDNI',
    title: 'DO ZDEMOLOWANIA',
    description: '30 szklanych przedmiotów, 3 meble, 5 sprzętów RTV i AGD',
    tools: 'ubranie, kask, rękawice',
    capacity: '1-4 osoby/do 120 min',
    price: 499,
    depositAmount: 150,
    duration: 120,
    maxPeople: 4,
    isActive: true,
    isBestseller: true
  },
  {
    id: '3',
    name: 'ŁATWY',
    title: 'DO ZDEMOLOWANIA',
    description: '25 szklanych przedmiotów, 2 meble, 3 sprzęty RTV i AGD',
    tools: 'ubranie, kask, rękawice',
    capacity: '1-2 osoby/do 45 min',
    price: 299,
    depositAmount: 100,
    duration: 45,
    maxPeople: 2,
    isActive: true,
    isBestseller: false
  },
  {
    id: '4',
    name: 'BUŁKA Z MASŁEM',
    title: 'DO ZDEMOLOWANIA',
    description: '25 szklanych przedmiotów',
    tools: 'ubranie, kask, rękawice',
    capacity: '1-2 osoby/do 30 min',
    price: 199,
    depositAmount: 50,
    duration: 30,
    maxPeople: 2,
    isActive: true,
    isBestseller: false
  }
];

interface Package {
  id: string;
  name: string;
  title: string;
  description: string;
  tools: string;
  capacity: string;
  price: number;
  depositAmount: number;
  duration: number;
  maxPeople: number;
  isActive: boolean;
  isBestseller: boolean;
}

interface PackageFormData {
  id?: string;
  name: string;
  title: string;
  description: string;
  tools: string;
  capacity: string;
  price: number;
  depositAmount: number;
  duration: number;
  maxPeople: number;
  isActive: boolean;
  isBestseller: boolean;
}

export default function PackagesPage() {
  const [packages, setPackages] = useState<Package[]>(mockPackages);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentPackage, setCurrentPackage] = useState<PackageFormData>({
    name: '',
    title: '',
    description: '',
    tools: '',
    capacity: '',
    price: 0,
    depositAmount: 0,
    duration: 0,
    maxPeople: 1,
    isActive: true,
    isBestseller: false
  });
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  const handleOpenDialog = (pkg?: Package) => {
    if (pkg) {
      setCurrentPackage({ ...pkg });
      setIsEditing(true);
    } else {
      setCurrentPackage({
        name: '',
        title: '',
        description: '',
        tools: '',
        capacity: '',
        price: 0,
        depositAmount: 0,
        duration: 0,
        maxPeople: 1,
        isActive: true,
        isBestseller: false
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
        [name]: parseInt(value, 10) || 0
      });
    } else {
      setCurrentPackage({
        ...currentPackage,
        [name]: value
      });
    }
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setCurrentPackage({
      ...currentPackage,
      [name]: checked
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isEditing) {
      // Обновляем существующий пакет
      setPackages(packages.map(pkg => 
        pkg.id === currentPackage.id ? { ...currentPackage as Package } : pkg
      ));
      toast({
        title: "Пакет обновлен",
        description: `Пакет "${currentPackage.name}" успешно обновлен.`
      });
    } else {
      // Добавляем новый пакет
      const newPackage: Package = {
        ...currentPackage,
        id: Math.random().toString(36).substr(2, 9)
      };
      setPackages([...packages, newPackage]);
      toast({
        title: "Пакет добавлен",
        description: `Пакет "${currentPackage.name}" успешно добавлен.`
      });
    }
    
    setIsDialogOpen(false);
  };

  const handleDeletePackage = (id: string) => {
    setPackages(packages.filter(pkg => pkg.id !== id));
    toast({
      title: "Пакет удален",
      description: "Пакет был успешно удален."
    });
  };

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
        {packages.map(pkg => (
          <Card 
            key={pkg.id} 
            className={`${!pkg.isActive ? "opacity-60" : ""} ${pkg.isBestseller ? "border-2 border-primary relative shadow-lg" : ""}`}
          >
            {pkg.isBestseller && (
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
                  <CardDescription>{pkg.title}</CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Button variant="ghost" size="icon" className="hover:bg-muted">
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
                    <Clock className="h-4 w-4 mr-2 text-primary" />
                    <span className="text-foreground font-medium">{pkg.duration} мин</span>
                  </div>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2 text-primary" />
                    <span className="text-foreground font-medium">до {pkg.maxPeople} чел.</span>
                  </div>
                  <div className="flex items-center">
                    <CreditCard className="h-4 w-4 mr-2 text-primary" />
                    <span className="text-foreground font-medium">Депозит: {pkg.depositAmount} PLN</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Редактировать пакет' : 'Добавить пакет'}</DialogTitle>
            <DialogDescription>
              {isEditing 
                ? 'Внесите изменения в данные пакета и нажмите Сохранить.' 
                : 'Заполните данные для нового пакета и нажмите Добавить.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Название пакета</Label>
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
                  <Label htmlFor="title">Подзаголовок</Label>
                  <Input 
                    id="title"
                    name="title"
                    value={currentPackage.title}
                    onChange={handleInputChange}
                    placeholder="Например: DO ZDEMOLOWANIA"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Описание</Label>
                <Textarea 
                  id="description"
                  name="description"
                  value={currentPackage.description}
                  onChange={handleInputChange}
                  placeholder="Введите описание пакета"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tools">Инструменты</Label>
                <Input 
                  id="tools"
                  name="tools"
                  value={currentPackage.tools}
                  onChange={handleInputChange}
                  placeholder="Например: ubranie, kask, rękawice"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Цена (PLN)</Label>
                  <Input 
                    id="price"
                    name="price"
                    type="number"
                    min="0"
                    value={currentPackage.price}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="depositAmount">Депозит (PLN)</Label>
                  <Input 
                    id="depositAmount"
                    name="depositAmount"
                    type="number"
                    min="0"
                    value={currentPackage.depositAmount}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Длительность (мин)</Label>
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
                  <Label htmlFor="maxPeople">Максимум людей</Label>
                  <Input 
                    id="maxPeople"
                    name="maxPeople"
                    type="number"
                    min="1"
                    max="20"
                    value={currentPackage.maxPeople}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity">Вместимость (текст)</Label>
                <Input 
                  id="capacity"
                  name="capacity"
                  value={currentPackage.capacity}
                  onChange={handleInputChange}
                  placeholder="Например: 1-6 osób/do 180 min"
                  required
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="isActive"
                    checked={currentPackage.isActive}
                    onCheckedChange={(checked) => handleSwitchChange('isActive', checked)}
                  />
                  <Label htmlFor="isActive">Пакет активен</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="isBestseller"
                    checked={currentPackage.isBestseller}
                    onCheckedChange={(checked) => handleSwitchChange('isBestseller', checked)}
                  />
                  <Label htmlFor="isBestseller">Бестселлер</Label>
                </div>
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