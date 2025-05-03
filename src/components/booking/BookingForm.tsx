'use client';

import { useState } from 'react';
import { BookingFormData } from '@/types/booking';

interface BookingFormProps {
  onSubmit: (data: Partial<BookingFormData>) => void;
}

export function BookingForm({ onSubmit }: BookingFormProps) {
  const [formData, setFormData] = useState<Partial<BookingFormData>>({
    name: '',
    email: '',
    phone: '',
    comment: '',
    promoCode: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Обработчик изменения полей формы
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Очищаем ошибку, если пользователь начал вводить данные
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  // Валидация формы
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name?.trim()) {
      newErrors.name = 'Pole wymagane';
    }
    
    if (!formData.email?.trim()) {
      newErrors.email = 'Pole wymagane';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Nieprawidłowy adres email';
    }
    
    if (!formData.phone?.trim()) {
      newErrors.phone = 'Pole wymagane';
    } else if (!/^(\+\d{1,3})?\s?\d{9}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Nieprawidłowy numer telefonu';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Обработчик отправки формы
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-white font-medium mb-1">
          Imię i nazwisko *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className={`w-full bg-[#333] text-white border ${
            errors.name ? 'border-red-500' : 'border-white/20'
          } rounded-md p-3 focus:outline-none focus:border-[#f36e21]`}
          placeholder="Jan Kowalski"
        />
        {errors.name && (
          <p className="text-red-500 text-sm mt-1">{errors.name}</p>
        )}
      </div>
      
      <div>
        <label htmlFor="email" className="block text-white font-medium mb-1">
          Email *
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className={`w-full bg-[#333] text-white border ${
            errors.email ? 'border-red-500' : 'border-white/20'
          } rounded-md p-3 focus:outline-none focus:border-[#f36e21]`}
          placeholder="jan@example.com"
        />
        {errors.email && (
          <p className="text-red-500 text-sm mt-1">{errors.email}</p>
        )}
      </div>
      
      <div>
        <label htmlFor="phone" className="block text-white font-medium mb-1">
          Telefon *
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          className={`w-full bg-[#333] text-white border ${
            errors.phone ? 'border-red-500' : 'border-white/20'
          } rounded-md p-3 focus:outline-none focus:border-[#f36e21]`}
          placeholder="+48 123 456 789"
        />
        {errors.phone && (
          <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
        )}
      </div>
      
      <div>
        <label htmlFor="comment" className="block text-white font-medium mb-1">
          Komentarz
        </label>
        <textarea
          id="comment"
          name="comment"
          value={formData.comment}
          onChange={handleChange}
          rows={3}
          className="w-full bg-[#333] text-white border border-white/20 rounded-md p-3 focus:outline-none focus:border-[#f36e21]"
          placeholder="Dodatkowe informacje..."
        />
      </div>
      
      <div>
        <label htmlFor="promoCode" className="block text-white font-medium mb-1">
          Kod promocyjny
        </label>
        <input
          type="text"
          id="promoCode"
          name="promoCode"
          value={formData.promoCode}
          onChange={handleChange}
          className="w-full bg-[#333] text-white border border-white/20 rounded-md p-3 focus:outline-none focus:border-[#f36e21]"
          placeholder="Wpisz kod promocyjny jeśli posiadasz"
        />
      </div>
      
      <div className="text-white/70 text-sm">
        <p>Pola oznaczone * są wymagane</p>
      </div>
      
      <div className="pt-4">
        <button
          type="submit"
          className="w-full bg-[#f36e21] text-white font-bold py-3 px-4 rounded-md hover:bg-[#ff7b2e] transition-colors"
        >
          Kontynuuj
        </button>
      </div>
    </form>
  );
} 