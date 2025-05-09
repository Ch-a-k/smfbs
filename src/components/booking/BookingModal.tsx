import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO, addMinutes } from 'date-fns';
import { pl, enUS } from 'date-fns/locale';
import { 
  X, ChevronLeft, ChevronRight, CreditCard, 
  Calendar, User, Check, ShoppingCart, 
  Clock, CreditCard as PaymentIcon, AlertCircle,
  PackageIcon, PlusCircle, Sparkles, Gift, Users
} from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { Package as BasePackage, BookingFormData, PaymentStatus } from '@/types/booking';
import BookingCalendar from './BookingCalendar';
import TimeSelector from './TimeSelector';
import CrossSellItems, { CrossSellItem } from './CrossSellItems';
import { mockBookings, generateId, mockCrossSellItems } from '@/lib/frontend-mocks';

// Определение типов
type BookingStep = 'date' | 'time' | 'contact' | 'extras' | 'payment';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  packageData: BasePackage;
}

// Анимации
const modalAnimation = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: {
      duration: 0.3,
      ease: [0.16, 1, 0.3, 1]
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.95,
    transition: {
      duration: 0.2,
      ease: [0.16, 1, 0.3, 1]
    }
  }
};

const stepAnimation = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
  transition: { duration: 0.3 }
};

export default function BookingModal({ isOpen, onClose, packageData }: BookingModalProps) {
  const { t, locale } = useI18n();
  const [currentStep, setCurrentStep] = useState<BookingStep>('date');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Состояние для выбора даты и времени
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  
  // Состояние для управления кросс-селами
  const [selectedCrossSellItems, setSelectedCrossSellItems] = useState<string[]>([]);
  const [totalAdditionalPrice, setTotalAdditionalPrice] = useState(0);
  
  // Получаем цену из packageData с учетом возможных типов
  const getPackagePrice = (): number => {
    if (typeof packageData.price === 'number') {
      return packageData.price;
    } else if (typeof packageData.price === 'string') {
      // Явное приведение типа к string для избежания ошибки TypeScript
      const priceString = packageData.price as string;
      // Извлекаем числовое значение из строки, удаляя все нечисловые символы
      const numericValue = priceString.replace(/[^\d]/g, '');
      return numericValue ? parseInt(numericValue, 10) : 0;
    }
    return 0; // Если цена не указана или имеет неподдерживаемый тип
  };
  
  // Form data
  const [formData, setFormData] = useState<BookingFormData>({
    packageId: packageData.id,
    packageName: packageData.name,
    date: '',
    startTime: '',
    endTime: '',
    roomId: 0,
    name: '',
    email: '',
    phone: '',
    numberOfPeople: 1,
    promoCode: '',
    comment: '',
    crossSellItems: [],
    totalAmount: getPackagePrice(),
    depositAmount: 20, // 20 PLN for all packages
  });
  
  // Payment method
  const [paymentMethod, setPaymentMethod] = useState<PaymentStatus>('FULLY_PAID');
  
  // Блокировка скролла основной страницы при открытии модального окна
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    // Очистка при размонтировании
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);
  
  // Сброс формы при открытии модального окна
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('date');
      setSelectedDate(null);
      setSelectedTime(null);
      setSelectedCrossSellItems([]);
      setTotalAdditionalPrice(0);
      setFormData({
        ...formData,
        packageId: packageData.id,
        packageName: packageData.name,
        date: '',
        startTime: '',
        endTime: '',
        crossSellItems: [],
        totalAmount: getPackagePrice(),
      });
    }
  }, [isOpen, packageData]);
  
  // Обновление формы при выборе даты
  useEffect(() => {
    if (selectedDate) {
      setFormData(prev => ({
        ...prev,
        date: format(selectedDate, 'yyyy-MM-dd')
      }));
    }
  }, [selectedDate]);
  
  // Обновление формы при выборе времени
  useEffect(() => {
    if (selectedTime) {
      // Вычисляем время окончания, добавляя длительность пакета к времени начала
      const startDate = selectedDate && selectedTime 
        ? new Date(
            selectedDate.getFullYear(),
            selectedDate.getMonth(),
            selectedDate.getDate(),
            parseInt(selectedTime.split(':')[0]),
            parseInt(selectedTime.split(':')[1])
          )
        : null;
      
      if (startDate) {
        const endDate = addMinutes(startDate, packageData.duration);
        const endTime = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
        
        setFormData(prev => ({
          ...prev,
          startTime: selectedTime,
          endTime: endTime
        }));
      }
    }
  }, [selectedTime, selectedDate, packageData.duration]);
  
  // Обновление формы при выборе/отмене дополнительных товаров
  useEffect(() => {
    // Этот useEffect больше не нужен, так как теперь мы обновляем
    // totalAmount непосредственно в handleCrossSellItemToggle
    // console.log("Package price:", getPackagePrice());
    // console.log("Total additional price:", totalAdditionalPrice);
    // console.log("Selected items:", selectedCrossSellItems);
    
    // // Обновляем список выбранных товаров в форме
    // setFormData(prev => {
    //   const newTotal = getPackagePrice() + totalAdditionalPrice;
    //   console.log("New total amount:", newTotal);
    //   
    //   return {
    //     ...prev,
    //     crossSellItems: selectedCrossSellItems,
    //     // Обновляем итоговую сумму с учетом дополнительных товаров
    //     totalAmount: newTotal
    //   };
    // });
    
    // Обновляем только список выбранных товаров в форме
    setFormData(prev => ({
      ...prev,
      crossSellItems: selectedCrossSellItems
    }));
  }, [selectedCrossSellItems]);
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error message when user types
    if (errorMessage) setErrorMessage('');
  };
  
  // Handle date selection
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime(null); // Сбрасываем выбранное время при изменении даты
  };
  
  // Handle time selection
  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };
  
  // Handle payment method selection
  const handlePaymentMethodSelect = (method: PaymentStatus) => {
    setPaymentMethod(method);
  };
  
  // Обработчик выбора/отмены дополнительного товара
  const handleCrossSellItemToggle = (item: CrossSellItem) => {
    setSelectedCrossSellItems(prev => {
      const isSelected = prev.includes(item.id);
      
      // Если товар уже выбран, удаляем его
      if (isSelected) {
        // Уменьшаем общую стоимость
        const newTotalAdditionalPrice = totalAdditionalPrice - getItemPrice(item.id);
        setTotalAdditionalPrice(newTotalAdditionalPrice);
        
        // Обновляем общую сумму заказа сразу
        const newTotalAmount = getPackagePrice() + newTotalAdditionalPrice;
        setFormData(current => ({
          ...current,
          totalAmount: newTotalAmount
        }));
        
        // Возвращаем новый массив без этого товара
        return prev.filter(id => id !== item.id);
      } else {
        // Если товар не выбран, добавляем его
        // Увеличиваем общую стоимость
        const newTotalAdditionalPrice = totalAdditionalPrice + getItemPrice(item.id);
        setTotalAdditionalPrice(newTotalAdditionalPrice);
        
        // Обновляем общую сумму заказа сразу
        const newTotalAmount = getPackagePrice() + newTotalAdditionalPrice;
        setFormData(current => ({
          ...current,
          totalAmount: newTotalAmount
        }));
        
        // Возвращаем новый массив с этим товаром
        return [...prev, item.id];
      }
    });
  };
  
  // Validate date step
  const validateDateStep = (): boolean => {
    if (!selectedDate) {
      setErrorMessage(t('booking.validation.dateRequired'));
      return false;
    }
    
    return true;
  };
  
  // Validate time step
  const validateTimeStep = (): boolean => {
    if (!selectedTime) {
      setErrorMessage(t('booking.validation.timeRequired'));
      return false;
    }
    
    return true;
  };
  
  // Validate contact information step
  const validateContactStep = (): boolean => {
    if (!formData.name) {
      setErrorMessage(t('booking.validation.nameRequired'));
      return false;
    }
    
    if (!formData.email) {
      setErrorMessage(t('booking.validation.emailRequired'));
      return false;
    }
    
    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setErrorMessage(t('booking.validation.emailInvalid'));
      return false;
    }
    
    if (!formData.phone) {
      setErrorMessage(t('booking.validation.phoneRequired'));
      return false;
    }
    
    // Simple phone validation (at least 9 digits)
    const phoneDigits = formData.phone.replace(/\D/g, '');
    if (phoneDigits.length < 9) {
      setErrorMessage(t('booking.validation.phoneInvalid'));
      return false;
    }
    
    return true;
  };
  
  // Handle next step button click
  const handleNextStep = () => {
    setErrorMessage('');
    
    if (currentStep === 'date') {
      if (validateDateStep()) {
        setCurrentStep('time');
      }
    } else if (currentStep === 'time') {
      if (validateTimeStep()) {
        setCurrentStep('contact');
      }
    } else if (currentStep === 'contact') {
      if (validateContactStep()) {
        setCurrentStep('extras');
      }
    } else if (currentStep === 'extras') {
      setCurrentStep('payment');
    }
  };
  
  // Handle previous step button click
  const handlePrevStep = () => {
    setErrorMessage('');
    
    if (currentStep === 'time') {
      setCurrentStep('date');
    } else if (currentStep === 'contact') {
      setCurrentStep('time');
    } else if (currentStep === 'extras') {
      setCurrentStep('contact');
    } else if (currentStep === 'payment') {
      setCurrentStep('extras');
    }
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    setErrorMessage('');
    setIsSubmitting(true);
    
    try {
      // Simulate API call with a delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Process payment method
      const finalPaymentAmount = paymentMethod === 'FULLY_PAID' 
        ? formData.totalAmount 
        : formData.depositAmount;
      
      // Prepare booking data for submission
      const bookingData = {
        ...formData,
        paymentMethod,
        paymentAmount: finalPaymentAmount,
        status: 'PENDING',
      };
      
      // Добавляем новое бронирование в моковые данные
      const newBooking = {
        id: mockBookings.length + 1,
        packageId: typeof bookingData.packageId === 'string' ? parseInt(bookingData.packageId) : bookingData.packageId,
        packageName: bookingData.packageName || '',
        roomId: bookingData.roomId,
        roomName: 'Автоматически назначенный зал',
        customerName: bookingData.name,
        customerEmail: bookingData.email,
        customerPhone: bookingData.phone,
        date: bookingData.date,
        startTime: bookingData.startTime,
        endTime: bookingData.endTime,
        numPeople: bookingData.numberOfPeople,
        notes: bookingData.comment || '',
        comment: bookingData.comment || '',
        promoCode: bookingData.promoCode || '',
        totalPrice: bookingData.totalAmount || 0,
        totalAmount: bookingData.totalAmount || 0,
        paymentStatus: paymentMethod,
        paidAmount: finalPaymentAmount || 0,
        depositAmount: bookingData.depositAmount || 0,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        name: bookingData.name,
        email: bookingData.email,
        phone: bookingData.phone,
        numberOfPeople: bookingData.numberOfPeople
      };
      
      // Добавляем в массив бронирований
      mockBookings.push(newBooking);
      
      console.log('Booking submitted:', bookingData);
      console.log('New booking added to mock data:', newBooking);
      
      // Show success message and close modal
      alert(t('booking.success.message'));
      onClose();
      
    } catch (error) {
      console.error('Error submitting booking:', error);
      setErrorMessage(t('booking.error.message'));
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Format date for display
  const formatDate = (date: Date) => {
    return format(date, 'EEEE, d MMMM yyyy', { locale: locale === 'pl' ? pl : enUS });
  };
  
  // Функция для получения цены товара по ID
  const getItemPrice = (itemId: string): number => {
    const itemPrices: Record<string, number> = {
      'glass': 50,        // 10 стеклянных предметов - 50 PLN
      'keyboard': 20,     // Клавиатура - 20 PLN
      'tvMonitor': 100,   // ТВ/монитор - 100 PLN
      'furniture': 120,   // Мебель - 120 PLN
      'printer': 50,      // Принтер - 50 PLN
      'mouse': 10,        // Компьютерная мышь - 10 PLN
      'phone': 30,        // Телефон - 30 PLN
      'goProRecording': 50 // GoPro запись - 50 PLN
    };
    
    return itemPrices[itemId] || 0;
  };
  
  // If the modal is not open, don't render anything
  if (!isOpen) return null;
  
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4 sm:p-6 md:p-8">
          {/* Backdrop with blur */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Modal container */}
          <motion.div
            className="relative w-full max-w-lg max-h-[90vh] flex flex-col bg-gradient-to-b from-[#2c2527] to-[#231f20] rounded-2xl overflow-hidden shadow-xl border border-white/10 z-10"
            variants={modalAnimation}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Header */}
            <div className="px-5 py-4 flex justify-between items-center shrink-0 border-b border-white/10 bg-black/30">
              <div>
                <h2 className="font-bold text-lg text-white">
                  {t('booking.title')}
                </h2>
                <p className="text-sm text-[#f36e21]">{packageData.name}</p>
              </div>
              
              <button 
                onClick={onClose}
                className="text-gray-400 hover:text-[#f36e21] transition-colors h-8 w-8 rounded-full flex items-center justify-center hover:bg-black/40"
                aria-label={t('booking.close')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Steps progress */}
            <div className="px-5 py-4 bg-black/20">
              <div className="relative flex justify-between">
                {/* Progress bar */}
                <div className="absolute top-[15px] left-[30px] right-[30px] h-[2px] bg-white/10">
                  <div 
                    className="h-full bg-[#f36e21] transition-all duration-300"
                    style={{ 
                      width: currentStep === 'date' ? '0%' : 
                             currentStep === 'time' ? '25%' : 
                             currentStep === 'contact' ? '50%' : 
                             currentStep === 'extras' ? '75%' : '100%' 
                    }}
                  />
                </div>
                
                {/* Step 1: Date */}
                <div className="flex flex-col items-center z-10">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                    currentStep === 'date' ? 'bg-[#f36e21] text-white' : 
                    (currentStep === 'time' || currentStep === 'contact' || currentStep === 'extras' || currentStep === 'payment') ? 'bg-green-500 text-white' : 
                    'bg-black/60 text-white'
                  }`}>
                    {(currentStep === 'time' || currentStep === 'contact' || currentStep === 'extras' || currentStep === 'payment') 
                      ? <Check className="w-4 h-4" /> 
                      : <Calendar className="w-4 h-4" />
                    }
                  </div>
                  <span className="text-xs mt-2 text-gray-300">{t('booking.steps.date')}</span>
                </div>
                
                {/* Step 2: Time */}
                <div className="flex flex-col items-center z-10">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                    currentStep === 'time' ? 'bg-[#f36e21] text-white' : 
                    (currentStep === 'contact' || currentStep === 'extras' || currentStep === 'payment') ? 'bg-green-500 text-white' : 
                    'bg-black/60 text-white'
                  }`}>
                    {(currentStep === 'contact' || currentStep === 'extras' || currentStep === 'payment') 
                      ? <Check className="w-4 h-4" /> 
                      : <Clock className="w-4 h-4" />
                    }
                  </div>
                  <span className="text-xs mt-2 text-gray-300">{t('booking.steps.time')}</span>
                </div>
                
                {/* Step 3: Contact */}
                <div className="flex flex-col items-center z-10">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                    currentStep === 'contact' ? 'bg-[#f36e21] text-white' : 
                    (currentStep === 'extras' || currentStep === 'payment') ? 'bg-green-500 text-white' : 
                    'bg-black/60 text-white'
                  }`}>
                    {(currentStep === 'extras' || currentStep === 'payment') 
                      ? <Check className="w-4 h-4" /> 
                      : <User className="w-4 h-4" />
                    }
                  </div>
                  <span className="text-xs mt-2 text-gray-300">{t('booking.steps.contact')}</span>
                </div>
                
                {/* Step 4: Extras */}
                <div className="flex flex-col items-center z-10">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                    currentStep === 'extras' ? 'bg-[#f36e21] text-white' : 
                    currentStep === 'payment' ? 'bg-green-500 text-white' : 
                    'bg-black/60 text-white'
                  }`}>
                    {currentStep === 'payment' 
                      ? <Check className="w-4 h-4" /> 
                      : <Gift className="w-4 h-4" />
                    }
                  </div>
                  <span className="text-xs mt-2 text-gray-300">{t('booking.steps.extras')}</span>
                </div>
                
                {/* Step 5: Payment */}
                <div className="flex flex-col items-center z-10">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                    currentStep === 'payment' ? 'bg-[#f36e21] text-white' : 'bg-black/60 text-white'
                  }`}>
                    <PaymentIcon className="w-4 h-4" />
                  </div>
                  <span className="text-xs mt-2 text-gray-300">{t('booking.steps.payment')}</span>
                </div>
              </div>
            </div>
            
            {/* Error message */}
            {errorMessage && (
              <div className="mx-5 mt-4 p-3 bg-red-900/40 text-red-200 border border-red-500/50 rounded-lg text-sm flex items-start">
                <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                <div>{errorMessage}</div>
              </div>
            )}
            
            {/* Form content - scrollable area */}
            <div className="p-5 overflow-y-auto flex-grow">
              <AnimatePresence mode="wait">
                {/* Step 1: Date selection */}
                {currentStep === 'date' && (
                  <motion.div
                    key="date-step"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-5"
                  >
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold text-white">
                        {t('booking.date.title')}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {t('booking.date.subtitle')}
                      </p>
                    </div>
                    
                    <div className="space-y-5">
                      {/* Календарь для выбора даты */}
                      <div className="bg-black/20 border border-white/10 rounded-xl overflow-hidden">
                        <BookingCalendar
                          selectedDate={selectedDate}
                          onChange={handleDateSelect}
                        />
                      </div>
                      
                      {/* Информация о выбранной дате */}
                      {selectedDate && (
                        <div className="bg-[#f36e21]/10 border border-[#f36e21]/30 rounded-xl p-4">
                          <div className="flex items-start">
                            <Calendar className="w-5 h-5 text-[#f36e21] mr-3 mt-0.5" />
                            <div>
                              <div className="text-white text-sm font-medium">
                                {t('booking.date.selected')}
                              </div>
                              <div className="text-[#f36e21] text-base font-semibold mt-1">
                                {formatDate(selectedDate)}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
                
                {/* Step 2: Time selection */}
                {currentStep === 'time' && (
                  <motion.div
                    key="time-step"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-5"
                  >
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold text-white">
                        {t('booking.time.title')}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {t('booking.time.subtitle')}
                      </p>
                    </div>
                    
                    <div className="space-y-5">
                      {/* Информация о выбранной дате */}
                      <div className="bg-black/20 border border-white/10 rounded-xl p-4">
                        <div className="flex items-start">
                          <Calendar className="w-5 h-5 text-white/70 mr-3 mt-0.5" />
                          <div>
                            <div className="text-white/70 text-xs">
                              {t('booking.date.selected')}
                            </div>
                            <div className="text-white text-sm font-medium mt-0.5">
                              {formatDate(selectedDate!)}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Выбор времени */}
                      <div className="bg-black/20 border border-white/10 rounded-xl p-4">
                        <TimeSelector
                          selectedTime={selectedTime}
                          onChange={handleTimeSelect}
                          date={selectedDate!}
                          durationMinutes={packageData.duration}
                        />
                      </div>
                      
                      {/* Отображение выбранного времени */}
                      {selectedTime && (
                        <div className="bg-[#f36e21]/10 border border-[#f36e21]/30 rounded-xl p-4">
                          <div className="flex items-start">
                            <Clock className="w-5 h-5 text-[#f36e21] mr-3 mt-0.5" />
                            <div>
                              <div className="text-white text-sm font-medium">
                                {t('booking.time.selected')}
                              </div>
                              <div className="text-[#f36e21] text-base font-semibold mt-1">
                                {selectedTime} - {formData.endTime}
                              </div>
                              <div className="text-xs text-gray-400 mt-1">
                                {t('booking.date.duration')}: {packageData.duration} {t('booking.date.minutes')}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
                
                {/* Step 3: Contact information */}
                {currentStep === 'contact' && (
                  <motion.div
                    key="contact-step"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-5"
                  >
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold text-white">
                        {t('booking.contact.title')}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {t('booking.contact.subtitle')}
                      </p>
                    </div>
                    
                    {/* Выбранная дата и время (информационно) */}
                    <div className="bg-black/20 border border-white/10 rounded-xl p-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-start">
                          <Calendar className="w-4 h-4 text-white/70 mr-2 mt-0.5" />
                          <div>
                            <div className="text-white/70 text-xs">
                              {t('booking.date.selected')}
                            </div>
                            <div className="text-white text-sm font-medium mt-0.5">
                              {formatDate(selectedDate!)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <Clock className="w-4 h-4 text-white/70 mr-2 mt-0.5" />
                          <div>
                            <div className="text-white/70 text-xs">
                              {t('booking.time.selected')}
                            </div>
                            <div className="text-white text-sm font-medium mt-0.5">
                              {selectedTime} - {formData.endTime}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4 bg-black/20 border border-white/10 rounded-xl p-4">
                      {/* Personal information */}
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label htmlFor="name" className="block text-gray-300 text-sm mb-1.5">
                            {t('booking.contact.name')} *
                          </label>
                          <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className="w-full bg-black/40 text-white border border-white/20 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#f36e21] focus:ring-1 focus:ring-[#f36e21]/50 transition-colors"
                            placeholder={t('booking.contact.namePlaceholder')}
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="email" className="block text-gray-300 text-sm mb-1.5">
                              {t('booking.contact.email')} *
                            </label>
                            <input
                              type="email"
                              id="email"
                              name="email"
                              value={formData.email}
                              onChange={handleInputChange}
                              className="w-full bg-black/40 text-white border border-white/20 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#f36e21] focus:ring-1 focus:ring-[#f36e21]/50 transition-colors"
                              placeholder={t('booking.contact.emailPlaceholder')}
                            />
                          </div>
                          
                          <div>
                            <label htmlFor="phone" className="block text-gray-300 text-sm mb-1.5">
                              {t('booking.contact.phone')} *
                            </label>
                            <input
                              type="tel"
                              id="phone"
                              name="phone"
                              value={formData.phone}
                              onChange={handleInputChange}
                              className="w-full bg-black/40 text-white border border-white/20 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#f36e21] focus:ring-1 focus:ring-[#f36e21]/50 transition-colors"
                              placeholder={t('booking.contact.phonePlaceholder')}
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="numberOfPeople" className="block text-gray-300 text-sm mb-1.5">
                              {t('booking.contact.numberOfPeople')} *
                            </label>
                            <input
                              type="number"
                              id="numberOfPeople"
                              name="numberOfPeople"
                              value={formData.numberOfPeople}
                              onChange={handleInputChange}
                              min="1"
                              max={packageData.maxPeople}
                              className="w-full bg-black/40 text-white border border-white/20 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#f36e21] focus:ring-1 focus:ring-[#f36e21]/50 transition-colors"
                            />
                          </div>
                          
                          <div>
                            <label htmlFor="promoCode" className="block text-gray-300 text-sm mb-1.5">
                              {t('booking.contact.promoCode')}
                            </label>
                            <input
                              type="text"
                              id="promoCode"
                              name="promoCode"
                              value={formData.promoCode}
                              onChange={handleInputChange}
                              className="w-full bg-black/40 text-white border border-white/20 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#f36e21] focus:ring-1 focus:ring-[#f36e21]/50 transition-colors"
                              placeholder={t('booking.contact.promoCodePlaceholder')}
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label htmlFor="comment" className="block text-gray-300 text-sm mb-1.5">
                            {t('booking.contact.comment')}
                          </label>
                          <textarea
                            id="comment"
                            name="comment"
                            value={formData.comment}
                            onChange={handleInputChange}
                            className="w-full bg-black/40 text-white border border-white/20 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#f36e21] focus:ring-1 focus:ring-[#f36e21]/50 transition-colors"
                            placeholder={t('booking.contact.commentPlaceholder')}
                            rows={2}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
                
                {/* Step 4: Extra items */}
                {currentStep === 'extras' && (
                  <motion.div
                    key="extras-step"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-5"
                  >
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold text-white">
                        {t('booking.extras.title')}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {t('booking.extras.subtitle')}
                      </p>
                    </div>
                    
                    {/* Выбранная дата, время и информация о пользователе */}
                    <div className="bg-black/20 border border-white/10 rounded-xl p-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-start">
                          <Calendar className="w-4 h-4 text-white/70 mr-2 mt-0.5" />
                          <div>
                            <div className="text-white/70 text-xs">
                              {t('booking.date.selected')}
                            </div>
                            <div className="text-white text-sm font-medium mt-0.5">
                              {formatDate(selectedDate!)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <Clock className="w-4 h-4 text-white/70 mr-2 mt-0.5" />
                          <div>
                            <div className="text-white/70 text-xs">
                              {t('booking.time.selected')}
                            </div>
                            <div className="text-white text-sm font-medium mt-0.5">
                              {selectedTime} - {formData.endTime}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <User className="w-4 h-4 text-white/70 mr-2 mt-0.5" />
                          <div>
                            <div className="text-white/70 text-xs">
                              {t('booking.contact.name')}
                            </div>
                            <div className="text-white text-sm font-medium mt-0.5">
                              {formData.name}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <Users className="w-4 h-4 text-white/70 mr-2 mt-0.5" />
                          <div>
                            <div className="text-white/70 text-xs">
                              {t('booking.contact.numberOfPeople')}
                            </div>
                            <div className="text-white text-sm font-medium mt-0.5">
                              {formData.numberOfPeople} {t('booking.contact.persons')}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Список дополнительных услуг */}
                    <div className="bg-black/20 border border-white/10 rounded-xl p-4">
                      <CrossSellItems 
                        onItemToggle={handleCrossSellItemToggle}
                        selectedItems={selectedCrossSellItems}
                        totalAdditionalPrice={totalAdditionalPrice}
                      />
                    </div>
                    
                    {/* Убрано дублирование информации о выбранных товарах */}
                  </motion.div>
                )}
                
                {/* Step 5: Payment method */}
                {currentStep === 'payment' && (
                  <motion.div
                    key="payment-step"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-5"
                  >
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold text-white">
                        {t('booking.payment.title')}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {t('booking.payment.subtitle')}
                      </p>
                    </div>
                    
                    <div className="space-y-5">
                      {/* Booking summary */}
                      <div className="bg-black/20 border border-white/10 p-4 rounded-xl">
                        <div className="flex items-center gap-2 mb-3">
                          <ShoppingCart className="w-5 h-5 text-[#f36e21]" />
                          <h4 className="text-white text-base font-medium">{t('booking.payment.summary')}</h4>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between py-2 border-b border-white/10">
                            <span className="text-gray-300">{t('booking.payment.package')}:</span>
                            <span className="text-white font-medium">{packageData.name}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b border-white/10">
                            <span className="text-gray-300">{t('booking.payment.date')}:</span>
                            <span className="text-white">{selectedDate && formatDate(selectedDate)}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b border-white/10">
                            <span className="text-gray-300">{t('booking.payment.time')}:</span>
                            <span className="text-white">{selectedTime} - {formData.endTime}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b border-white/10">
                            <span className="text-gray-300">{t('booking.payment.people')}:</span>
                            <span className="text-white">{formData.numberOfPeople}</span>
                          </div>
                          
                          {/* Отображение базовой цены пакета */}
                          <div className="flex justify-between pt-3">
                            <span className="text-gray-300">{t('booking.payment.basePrice')}:</span>
                            <span className="text-white font-medium">{getPackagePrice()} PLN</span>
                          </div>
                          
                          {/* Отображение дополнительных товаров, если они выбраны */}
                          {selectedCrossSellItems.length > 0 && (
                            <div className="space-y-1 mt-1">
                              <div className="flex justify-between">
                                <span className="text-gray-300">{t('booking.payment.additionalItems')}:</span>
                                <span className="text-[#f36e21] font-medium">+{totalAdditionalPrice} PLN</span>
                              </div>
                              
                              {/* Список выбранных товаров */}
                              <div className="ml-4 space-y-1 mt-1">
                                {selectedCrossSellItems.map((itemId) => {
                                  return (
                                    <div key={itemId} className="flex justify-between text-gray-400">
                                      <span className="flex items-center">
                                        <Check className="w-3 h-3 mr-1 text-[#f36e21]" />
                                        {t(`home.pricing.extraItems.items.${itemId}`)}
                                      </span>
                                      <span>{getItemPrice(itemId)} PLN</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          
                          <div className="flex justify-between font-medium pt-3 mt-2 border-t border-white/10">
                            <span className="text-white text-base">{t('booking.payment.totalAmount')}:</span>
                            <span className="text-[#f36e21] text-lg font-bold">{formData.totalAmount} PLN</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Payment method selection */}
                      <div className="bg-black/20 border border-white/10 p-4 rounded-xl">
                        <div className="flex items-center gap-2 mb-3">
                          <PaymentIcon className="w-5 h-5 text-[#f36e21]" />
                          <h4 className="text-white text-base font-medium">{t('booking.payment.method')}</h4>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                          <button
                            type="button"
                            onClick={() => handlePaymentMethodSelect('FULLY_PAID')}
                            className={`p-4 rounded-lg transition-all duration-200 text-left relative overflow-hidden group ${
                              paymentMethod === 'FULLY_PAID'
                                ? 'bg-gradient-to-br from-[#f36e21]/20 to-[#f36e21]/10 border-2 border-[#f36e21]'
                                : 'bg-black/40 hover:bg-black/50 border-2 border-white/10 hover:border-white/20'
                            }`}
                          >
                            <div className="font-medium text-white text-sm mb-1">{t('booking.payment.fullPayment')}</div>
                            <div className="text-[#f36e21] font-semibold text-lg">{formData.totalAmount} PLN</div>
                            <div className="text-xs text-gray-400 mt-1.5">{t('booking.payment.fullPaymentDesc')}</div>
                            
                            {paymentMethod === 'FULLY_PAID' && (
                              <div className="absolute top-2 right-2 bg-[#f36e21] text-white p-1 rounded-full">
                                <Check className="w-3 h-3" />
                              </div>
                            )}
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => handlePaymentMethodSelect('DEPOSIT_PAID')}
                            className={`p-4 rounded-lg transition-all duration-200 text-left relative overflow-hidden group ${
                              paymentMethod === 'DEPOSIT_PAID'
                                ? 'bg-gradient-to-br from-[#f36e21]/20 to-[#f36e21]/10 border-2 border-[#f36e21]'
                                : 'bg-black/40 hover:bg-black/50 border-2 border-white/10 hover:border-white/20'
                            }`}
                          >
                            <div className="font-medium text-white text-sm mb-1">{t('booking.payment.depositPayment')}</div>
                            <div className="text-[#f36e21] font-semibold text-lg">20 PLN</div>
                            <div className="text-xs text-gray-400 mt-1.5">{t('booking.payment.depositPaymentDesc')}</div>
                            
                            {paymentMethod === 'DEPOSIT_PAID' && (
                              <div className="absolute top-2 right-2 bg-[#f36e21] text-white p-1 rounded-full">
                                <Check className="w-3 h-3" />
                              </div>
                            )}
                          </button>
                        </div>
                      </div>
                      
                      {/* Payment provider information */}
                      <div className="flex items-center p-3 bg-black/30 rounded-lg border border-white/10">
                        <div className="text-xs text-gray-400 mr-3">{t('booking.payment.provider')}</div>
                        <img 
                          src="/images/przelewy24-logo.png" 
                          alt="Przelewy24" 
                          className="h-5 opacity-70" 
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Footer with navigation buttons */}
            <div className="px-5 py-4 flex justify-between shrink-0 border-t border-white/10 bg-black/30">
              {/* Кнопка "Назад" (скрыта на первом шаге) */}
              {currentStep !== 'date' ? (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="flex items-center px-4 py-2.5 bg-black/40 border border-white/10 text-white text-sm rounded-lg hover:bg-black/60 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 mr-1.5" />
                  {t('booking.buttons.back')}
                </button>
              ) : (
                <div></div> // Empty div to maintain layout
              )}
              
              {/* Кнопка "Далее" (на последнем шаге - "Забронировать") */}
              {currentStep !== 'payment' ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="flex items-center px-5 py-2.5 bg-[#f36e21] text-white text-sm rounded-lg hover:bg-[#ff7b2e] transition-colors"
                >
                  {t('booking.buttons.next')}
                  <ChevronRight className="w-4 h-4 ml-1.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className={`px-5 py-2.5 bg-[#f36e21] text-white text-sm rounded-lg hover:bg-[#ff7b2e] transition-colors flex items-center ${
                    isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2.5"></div>
                      {t('booking.buttons.processing')}
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4 mr-1.5" />
                      {t('booking.buttons.book')}
                    </>
                  )}
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
} 