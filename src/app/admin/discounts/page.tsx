'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Trash2, Edit, Plus, Calendar, Check, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import Cookies from 'universal-cookie';

interface Discount {
  id: number;
  code: string;
  description: string | null;
  fixed_amount: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
  max_uses: number | null;
  times_used: number;
}

interface DiscountFormData {
  id?: number;
  code: string;
  description: string;
  fixed_amount: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
  max_uses: number | null;
}

export default function DiscountsPage() {
  const cookies = new Cookies();
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentDiscount, setCurrentDiscount] = useState<DiscountFormData>({
    code: '',
    description: '',
    fixed_amount: 0,
    valid_from: new Date().toISOString(),
    valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    is_active: true,
    max_uses: null
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:89';
    const response = await fetch(`${apiUrl}${url}`, {
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
    
    if (response.status === 204) return null;
    return response.json();
  };

  const fetchDiscounts = async () => {
    try {
      setIsLoading(true);
      const data = await fetchWithAuth('/api/discounts/');
      setDiscounts(data);
    } catch (error) {
      toast({
        title: "Ошибка загрузки",
        description: error instanceof Error ? error.message : "Не удалось загрузить промокоды",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const handleOpenDialog = (discount?: Discount) => {
    if (discount) {
      setCurrentDiscount({
        id: discount.id,
        code: discount.code,
        description: discount.description || '',
        fixed_amount: discount.fixed_amount,
        valid_from: discount.valid_from,
        valid_until: discount.valid_until,
        is_active: discount.is_active,
        max_uses: discount.max_uses
      });
      setIsEditing(true);
    } else {
      setCurrentDiscount({
        code: '',
        description: '',
        fixed_amount: 0,
        valid_from: new Date().toISOString(),
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        is_active: true,
        max_uses: null
      });
      setIsEditing(false);
    }
    setIsDialogOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'number') {
      setCurrentDiscount({
        ...currentDiscount,
        [name]: name === 'max_uses' && value === '' ? null : parseFloat(value) || 0
      });
    } else {
      setCurrentDiscount({
        ...currentDiscount,
        [name]: value
      });
    }
  };

  const handleDateChange = (name: 'valid_from' | 'valid_until', value: string) => {
    setCurrentDiscount({
      ...currentDiscount,
      [name]: new Date(value).toISOString()
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (isEditing && currentDiscount.id) {
        const updatedDiscount = await fetchWithAuth(`/api/discounts/${currentDiscount.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            code: currentDiscount.code,
            description: currentDiscount.description || null,
            fixed_amount: currentDiscount.fixed_amount,
            valid_from: currentDiscount.valid_from,
            valid_until: currentDiscount.valid_until,
            is_active: currentDiscount.is_active,
            max_uses: currentDiscount.max_uses
          })
        });
        
        setDiscounts(discounts.map(d => d.id === updatedDiscount.id ? updatedDiscount : d));
        toast({
          title: "Промокод обновлен",
          description: `Промокод "${currentDiscount.code}" успешно обновлен.`
        });
      } else {
        const newDiscount = await fetchWithAuth('/api/discounts/', {
          method: 'POST',
          body: JSON.stringify({
            code: currentDiscount.code,
            description: currentDiscount.description || null,
            fixed_amount: currentDiscount.fixed_amount,
            valid_from: currentDiscount.valid_from,
            valid_until: currentDiscount.valid_until,
            is_active: currentDiscount.is_active,
            max_uses: currentDiscount.max_uses
          })
        });
        
        setDiscounts([...discounts, newDiscount]);
        toast({
          title: "Промокод создан",
          description: `Промокод "${currentDiscount.code}" успешно создан.`
        });
      }
      
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: "Ошибка сохранения",
        description: error instanceof Error ? error.message : "Не удалось сохранить промокод",
        variant: "destructive",
      });
    }
  };

  const handleDeleteDiscount = async (id: number) => {
    if (confirm('Вы уверены, что хотите удалить этот промокод?')) {
      try {
        await fetchWithAuth(`/api/discounts/${id}`, {
          method: 'DELETE'
        });
        
        setDiscounts(discounts.filter(d => d.id !== id));
        toast({
          title: "Промокод удален",
          description: "Промокод был успешно удален.",
        });
      } catch (error) {
        toast({
          title: "Ошибка удаления",
          description: error instanceof Error ? error.message : "Не удалось удалить промокод",
          variant: "destructive",
        });
      }
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd.MM.yyyy', { locale: ru });
    } catch (error) {
      return 'Некорректная дата';
    }
  };

  if (isLoading) {
    return <div className="p-6">Загрузка промокодов...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Промокоды</h2>
          <p className="text-muted-foreground">
            Управление промокодами и скидками
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Новый промокод
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Все промокоды</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Код</th>
                  <th className="text-left py-3 px-4">Сумма</th>
                  <th className="text-left py-3 px-4">Действует с</th>
                  <th className="text-left py-3 px-4">Действует до</th>
                  <th className="text-left py-3 px-4">Использований</th>
                  <th className="text-left py-3 px-4">Статус</th>
                  <th className="text-left py-3 px-4">Действия</th>
                </tr>
              </thead>
              <tbody>
                {discounts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-4 px-4 text-center text-muted-foreground">
                      Нет доступных промокодов
                    </td>
                  </tr>
                ) : (
                  discounts.map((discount) => (
                    <tr key={discount.id} className="border-b">
                      <td className="py-3 px-4 font-medium">{discount.code}</td>
                      <td className="py-3 px-4">{discount.fixed_amount} zł</td>
                      <td className="py-3 px-4">{formatDate(discount.valid_from)}</td>
                      <td className="py-3 px-4">{formatDate(discount.valid_until)}</td>
                      <td className="py-3 px-4">
                        {discount.times_used} / {discount.max_uses || '∞'}
                      </td>
                      <td className="py-3 px-4">
                        {discount.is_active ? (
                          <Badge className="bg-green-500">Активен</Badge>
                        ) : (
                          <Badge className="bg-gray-500">Неактивен</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleOpenDialog(discount)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDeleteDiscount(discount.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Редактирование промокода' : 'Создание промокода'}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? 'Измените информацию о промокоде и нажмите "Сохранить"'
                : 'Заполните форму для создания нового промокода'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="code" className="text-right">
                  Код:
                </label>
                <Input
                  id="code"
                  name="code"
                  value={currentDiscount.code}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="description" className="text-right">
                  Описание:
                </label>
                <Input
                  id="description"
                  name="description"
                  value={currentDiscount.description}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="fixed_amount" className="text-right">
                  Сумма скидки:
                </label>
                <Input
                  id="fixed_amount"
                  name="fixed_amount"
                  type="number"
                  value={currentDiscount.fixed_amount}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                  min="0"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="valid_from" className="text-right">
                  Действует с:
                </label>
                <Input
                  id="valid_from"
                  name="valid_from"
                  type="date"
                  value={new Date(currentDiscount.valid_from).toISOString().split('T')[0]}
                  onChange={(e) => handleDateChange('valid_from', e.target.value)}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="valid_until" className="text-right">
                  Действует до:
                </label>
                <Input
                  id="valid_until"
                  name="valid_until"
                  type="date"
                  value={new Date(currentDiscount.valid_until).toISOString().split('T')[0]}
                  onChange={(e) => handleDateChange('valid_until', e.target.value)}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="max_uses" className="text-right">
                  Макс. использований:
                </label>
                <Input
                  id="max_uses"
                  name="max_uses"
                  type="number"
                  value={currentDiscount.max_uses === null ? '' : currentDiscount.max_uses}
                  onChange={handleInputChange}
                  className="col-span-3"
                  placeholder="Без ограничений"
                  min="0"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="is_active" className="text-right">
                  Активен:
                </label>
                <div className="col-span-3 flex items-center">
                  <input
                    id="is_active"
                    name="is_active"
                    type="checkbox"
                    checked={currentDiscount.is_active}
                    onChange={(e) => setCurrentDiscount({...currentDiscount, is_active: e.target.checked})}
                    className="mr-2"
                  />
                  {currentDiscount.is_active ? 'Да' : 'Нет'}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Отмена
              </Button>
              <Button type="submit">{isEditing ? 'Сохранить' : 'Создать'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 