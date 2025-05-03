'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar } from '@/components/booking/Calendar';
import { TimeSlotSelector } from '@/components/booking/TimeSlotSelector';
import { BookingForm } from '@/components/booking/BookingForm';
import { CrossSellItems } from '@/components/booking/CrossSellItems';
import { Package, TimeSlot, BookingFormData } from '@/types/booking';

// Моковые данные пакетов
const MOCK_PACKAGES: Package[] = [
  {
    id: 'standard',
    name: 'Standard',
    description: 'Standardowy pakiet dla 2-4 osób, 20 przedmiotów do rozbicia',
    price: 199,
    depositAmount: 50,
    duration: 60,
    maxPeople: 4,
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'Premium pakiet dla 2-6 osób, 30 przedmiotów do rozbicia, dodatkowy czas',
    price: 299,
    depositAmount: 75,
    duration: 90,
    maxPeople: 6,
  },
  {
    id: 'vip',
    name: 'VIP',
    description: 'Pakiet VIP dla 2-8 osób, nielimitowana ilość przedmiotów, pełne doświadczenie',
    price: 399,
    depositAmount: 100,
    duration: 120,
    maxPeople: 8,
  },
];

// Моковые кросс-селлы
const MOCK_CROSS_SELLS = [
  {
    id: 'extra-items',
    name: 'Dodatkowe przedmioty',
    description: '+10 przedmiotów do rozbicia',
    price: 49,
  },
  {
    id: 'photo-package',
    name: 'Pakiet zdjęciowy',
    description: 'Profesjonalne zdjęcia z Twojej sesji',
    price: 79,
  },
  {
    id: 'vip-service',
    name: 'Obsługa VIP',
    description: 'Dedykowany opiekun, napoje, przekąski',
    price: 99,
  },
];

// Этапы бронирования
type BookingStep = 'package' | 'date-time' | 'form' | 'cross-sell' | 'payment' | 'confirmation';

export default function BookingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<BookingStep>('package');
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [formData, setFormData] = useState<Partial<BookingFormData>>({});
  const [selectedCrossSells, setSelectedCrossSells] = useState<string[]>([]);
  
  // Обработчик выбора пакета
  const handlePackageSelect = (packageId: string) => {
    const selectedPackage = MOCK_PACKAGES.find(p => p.id === packageId) || null;
    setSelectedPackage(selectedPackage);
    setCurrentStep('date-time');
  };
  
  // Обработчик выбора даты
  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    // Здесь должен быть запрос к API для получения доступных слотов времени
    // Для примера используем моковые данные
    const mockTimeSlots: TimeSlot[] = [
      { id: '1', startTime: '10:00', endTime: '11:00', available: true },
      { id: '2', startTime: '11:30', endTime: '12:30', available: true },
      { id: '3', startTime: '13:00', endTime: '14:00', available: false },
      { id: '4', startTime: '14:30', endTime: '15:30', available: true },
      { id: '5', startTime: '16:00', endTime: '17:00', available: true },
      { id: '6', startTime: '17:30', endTime: '18:30', available: false },
      { id: '7', startTime: '19:00', endTime: '20:00', available: true },
    ];
    
    // В реальном приложении здесь будет состояние для хранения доступных слотов
  };
  
  // Обработчик выбора времени
  const handleTimeSlotSelect = (timeSlot: TimeSlot) => {
    setSelectedTimeSlot(timeSlot);
    setCurrentStep('form');
  };
  
  // Обработчик отправки формы
  const handleFormSubmit = (data: Partial<BookingFormData>) => {
    setFormData(data);
    setCurrentStep('cross-sell');
  };
  
  // Обработчик выбора кросс-селлов
  const handleCrossSellSelect = (selectedItems: string[]) => {
    setSelectedCrossSells(selectedItems);
    setCurrentStep('payment');
    
    // Создаем объект с данными бронирования
    const bookingData: BookingFormData = {
      packageId: selectedPackage?.id || '',
      date: selectedDate || '',
      timeSlotId: selectedTimeSlot?.id || '',
      name: formData.name || '',
      email: formData.email || '',
      phone: formData.phone || '',
      comment: formData.comment,
      promoCode: formData.promoCode,
      crossSellItems: selectedItems,
    };
    
    // Отправляем запрос к API для создания бронирования
    fetch('/api/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bookingData),
    })
      .then(response => response.json())
      .then(data => {
        // Перенаправляем на страницу оплаты
        if (data.paymentUrl) {
          window.location.href = data.paymentUrl;
        } else {
          // Если нет URL для оплаты, перенаправляем на страницу подтверждения
          router.push(`/rezerwacja/potwierdzenie/${data.booking.id}`);
        }
      })
      .catch(error => {
        console.error('Error creating booking:', error);
        // Обработка ошибки
      });
  };
  
  // Рендеринг содержимого в зависимости от текущего шага
  const renderStepContent = () => {
    switch (currentStep) {
      case 'package':
        return (
          <div className="bg-[#1a1718] rounded-lg p-6 shadow-lg">
            <h2 className="text-2xl font-bold text-white mb-6">Wybierz pakiet</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {MOCK_PACKAGES.map(pkg => (
                <div 
                  key={pkg.id}
                  className="bg-[#231f20] border border-white/10 rounded-lg p-4 hover:border-[#f36e21] transition-all cursor-pointer"
                  onClick={() => handlePackageSelect(pkg.id)}
                >
                  <h3 className="text-xl font-bold text-white mb-2">{pkg.name}</h3>
                  <p className="text-white/70 mb-4">{pkg.description}</p>
                  <div className="text-2xl font-bold text-[#f36e21]">{pkg.price} zł</div>
                  <div className="mt-2 text-sm text-white/50">Czas trwania: {pkg.duration} min</div>
                  <div className="text-sm text-white/50">Max osób: {pkg.maxPeople}</div>
                </div>
              ))}
            </div>
          </div>
        );
        
      case 'date-time':
        return (
          <div className="bg-[#1a1718] rounded-lg p-6 shadow-lg">
            <h2 className="text-2xl font-bold text-white mb-6">Wybierz datę i godzinę</h2>
            
            <div className="mb-6">
              <h3 className="text-lg font-bold text-white mb-3">Wybrany pakiet:</h3>
              <div className="bg-[#231f20] border border-white/10 rounded-lg p-4">
                <h4 className="text-xl font-bold text-white">{selectedPackage?.name}</h4>
                <p className="text-white/70">{selectedPackage?.description}</p>
                <div className="text-xl font-bold text-[#f36e21] mt-2">{selectedPackage?.price} zł</div>
              </div>
              <button 
                className="mt-2 text-[#f36e21] hover:underline"
                onClick={() => setCurrentStep('package')}
              >
                Zmień pakiet
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-bold text-white mb-3">Wybierz datę:</h3>
                <Calendar onDateSelect={handleDateSelect} />
              </div>
              
              {selectedDate && (
                <div>
                  <h3 className="text-lg font-bold text-white mb-3">Dostępne godziny:</h3>
                  <TimeSlotSelector 
                    date={selectedDate}
                    packageDuration={selectedPackage?.duration || 60}
                    onTimeSlotSelect={handleTimeSlotSelect}
                  />
                </div>
              )}
            </div>
          </div>
        );
        
      case 'form':
        return (
          <div className="bg-[#1a1718] rounded-lg p-6 shadow-lg">
            <h2 className="text-2xl font-bold text-white mb-6">Dane rezerwacji</h2>
            
            <div className="mb-6">
              <h3 className="text-lg font-bold text-white mb-3">Podsumowanie:</h3>
              <div className="bg-[#231f20] border border-white/10 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white/70">Pakiet:</span>
                  <span className="text-white font-bold">{selectedPackage?.name}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white/70">Data:</span>
                  <span className="text-white font-bold">{selectedDate}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white/70">Godzina:</span>
                  <span className="text-white font-bold">{selectedTimeSlot?.startTime} - {selectedTimeSlot?.endTime}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/70">Cena:</span>
                  <span className="text-[#f36e21] font-bold">{selectedPackage?.price} zł</span>
                </div>
              </div>
              <button 
                className="mt-2 text-[#f36e21] hover:underline"
                onClick={() => setCurrentStep('date-time')}
              >
                Zmień termin
              </button>
            </div>
            
            <BookingForm onSubmit={handleFormSubmit} />
          </div>
        );
        
      case 'cross-sell':
        return (
          <div className="bg-[#1a1718] rounded-lg p-6 shadow-lg">
            <h2 className="text-2xl font-bold text-white mb-6">Dodatkowe opcje</h2>
            
            <div className="mb-6">
              <h3 className="text-lg font-bold text-white mb-3">Podsumowanie rezerwacji:</h3>
              <div className="bg-[#231f20] border border-white/10 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white/70">Pakiet:</span>
                  <span className="text-white font-bold">{selectedPackage?.name}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white/70">Data:</span>
                  <span className="text-white font-bold">{selectedDate}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white/70">Godzina:</span>
                  <span className="text-white font-bold">{selectedTimeSlot?.startTime} - {selectedTimeSlot?.endTime}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white/70">Imię i nazwisko:</span>
                  <span className="text-white font-bold">{formData.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/70">Cena podstawowa:</span>
                  <span className="text-[#f36e21] font-bold">{selectedPackage?.price} zł</span>
                </div>
              </div>
            </div>
            
            <CrossSellItems 
              items={MOCK_CROSS_SELLS}
              onContinue={handleCrossSellSelect}
            />
          </div>
        );
        
      case 'payment':
        return (
          <div className="bg-[#1a1718] rounded-lg p-6 shadow-lg text-center">
            <h2 className="text-2xl font-bold text-white mb-6">Przetwarzanie płatności...</h2>
            <p className="text-white/70 mb-4">Trwa przekierowanie do systemu płatności Przelewy24.</p>
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#f36e21] mx-auto"></div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-white mb-8">Rezerwacja</h1>
      
      {/* Индикатор прогресса */}
      <div className="flex items-center justify-between mb-8 px-4 py-3 bg-[#231f20] rounded-lg">
        {['package', 'date-time', 'form', 'cross-sell', 'payment'].map((step, index) => (
          <div key={step} className="flex items-center">
            <div 
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep === step 
                  ? 'bg-[#f36e21] text-white' 
                  : (index < ['package', 'date-time', 'form', 'cross-sell', 'payment'].indexOf(currentStep) 
                    ? 'bg-green-500 text-white' 
                    : 'bg-[#333] text-white/50')
              }`}
            >
              {index + 1}
            </div>
            {index < 4 && (
              <div 
                className={`h-1 w-12 mx-2 ${
                  index < ['package', 'date-time', 'form', 'cross-sell', 'payment'].indexOf(currentStep) 
                    ? 'bg-green-500' 
                    : 'bg-[#333]'
                }`}
              />
            )}
          </div>
        ))}
      </div>
      
      {renderStepContent()}
    </div>
  );
} 