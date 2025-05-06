import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO, addMinutes } from 'date-fns';
import { pl, enUS } from 'date-fns/locale';
import { X, ChevronLeft, ChevronRight, CreditCard, Calendar, User, Check } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { Package as BasePackage, BookingFormData, PaymentStatus } from '@/types/booking';
import BookingCalendar from './BookingCalendar';
import TimeSelector from './TimeSelector';

// Определение типов
type BookingStep = 'date' | 'contact' | 'payment';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  packageData: BasePackage;
}

export default function BookingModal({ isOpen, onClose, packageData }: BookingModalProps) {
  const { t, locale } = useI18n();
  const [currentStep, setCurrentStep] = useState<BookingStep>('date');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Состояние для выбора даты и времени
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  
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
      setFormData({
        ...formData,
        packageId: packageData.id,
        packageName: packageData.name,
        date: '',
        startTime: '',
        endTime: '',
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
  
  // Validate date and time step
  const validateDateStep = (): boolean => {
    if (!selectedDate) {
      setErrorMessage(t('booking.validation.dateRequired'));
      return false;
    }
    
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
        setCurrentStep('contact');
      }
    } else if (currentStep === 'contact') {
      if (validateContactStep()) {
        setCurrentStep('payment');
      }
    }
  };
  
  // Handle previous step button click
  const handlePrevStep = () => {
    setErrorMessage('');
    
    if (currentStep === 'contact') {
      setCurrentStep('date');
    } else if (currentStep === 'payment') {
      setCurrentStep('contact');
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
      
      // In a real application, you would send this data to your API
      console.log('Booking submitted:', bookingData);
      
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
  
  // If the modal is not open, don't render anything
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center overflow-hidden">
      <div className="bg-[#231f20] w-full max-w-lg rounded-xl overflow-hidden shadow-xl flex flex-col max-h-[90vh] border border-white/10">
        {/* Header */}
        <div className="bg-black/40 backdrop-blur-sm px-4 py-3 flex justify-between items-center shrink-0 border-b border-white/10">
          <h2 className="font-bold text-lg text-white">
            {t('booking.title')} - {packageData.name}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-[#f36e21] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Progress indicator */}
        <div className="bg-black/40 backdrop-blur-sm px-4 pb-3 shrink-0 border-b border-white/10">
          <div className="flex justify-between">
            <div className="flex flex-col items-center">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                currentStep === 'date' ? 'bg-[#f36e21] text-white' : 
                currentStep === 'contact' || currentStep === 'payment' ? 'bg-green-500 text-white' : 
                'bg-black/60 text-white'
              }`}>
                {currentStep === 'contact' || currentStep === 'payment' ? <Check className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
              </div>
              <span className="text-xs mt-1 text-gray-300">{t('booking.steps.date')}</span>
            </div>
            
            <div className="flex flex-col items-center">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                currentStep === 'contact' ? 'bg-[#f36e21] text-white' : 
                currentStep === 'payment' ? 'bg-green-500 text-white' : 
                'bg-black/60 text-white'
              }`}>
                {currentStep === 'payment' ? <Check className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>
              <span className="text-xs mt-1 text-gray-300">{t('booking.steps.contact')}</span>
            </div>
            
            <div className="flex flex-col items-center">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                currentStep === 'payment' ? 'bg-[#f36e21] text-white' : 'bg-black/60 text-white'
              }`}>
                <CreditCard className="w-4 h-4" />
              </div>
              <span className="text-xs mt-1 text-gray-300">{t('booking.steps.payment')}</span>
            </div>
          </div>
        </div>
        
        {/* Error message */}
        {errorMessage && (
          <div className="mx-4 mt-3 p-2 bg-red-900/50 text-red-200 border border-red-500 rounded-md text-xs shrink-0">
            {errorMessage}
          </div>
        )}
        
        {/* Form content - scrollable area */}
        <div className="p-4 overflow-y-auto flex-grow">
          <AnimatePresence mode="wait">
            {/* Step 1: Date and time selection */}
            {currentStep === 'date' && (
              <motion.div
                key="date-step"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <h3 className="text-base font-semibold text-white mb-3">{t('booking.date.title')}</h3>
                
                <div className="space-y-4">
                  {/* Календарь для выбора даты */}
                  <div>
                    <BookingCalendar
                      selectedDate={selectedDate}
                      onChange={handleDateSelect}
                    />
                  </div>
                  
                  {/* Выбор времени (отображается только если выбрана дата) */}
                  {selectedDate && (
                    <div className="mt-3">
                      <TimeSelector
                        selectedTime={selectedTime}
                        onChange={handleTimeSelect}
                        date={selectedDate}
                        durationMinutes={packageData.duration}
                      />
                    </div>
                  )}
                  
                  {/* Отображение выбранной даты и времени */}
                  {selectedDate && selectedTime && (
                    <div className="mt-3 p-3 bg-black/40 backdrop-blur-sm rounded-lg border border-white/10">
                      <div className="text-white text-sm font-medium">
                        {locale === 'pl' ? 'Wybrana data i czas:' : 'Selected date and time:'}
                      </div>
                      <div className="text-gray-300 text-sm mt-1">
                        {formatDate(selectedDate)}, {selectedTime} - {formData.endTime}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
            
            {/* Step 2: Contact information */}
            {currentStep === 'contact' && (
              <motion.div
                key="contact-step"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="text-base font-semibold text-white mb-3">{t('booking.contact.title')}</h3>
                
                <div className="space-y-3">
                  {/* Personal information */}
                  <div>
                    <label htmlFor="name" className="block text-gray-300 text-sm mb-1">
                      {t('booking.contact.name')} *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full bg-black/40 text-white border border-white/10 rounded-md p-2 text-sm focus:outline-none focus:border-[#f36e21]"
                      placeholder={t('booking.contact.namePlaceholder')}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-gray-300 text-sm mb-1">
                      {t('booking.contact.email')} *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full bg-black/40 text-white border border-white/10 rounded-md p-2 text-sm focus:outline-none focus:border-[#f36e21]"
                      placeholder={t('booking.contact.emailPlaceholder')}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="phone" className="block text-gray-300 text-sm mb-1">
                      {t('booking.contact.phone')} *
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full bg-black/40 text-white border border-white/10 rounded-md p-2 text-sm focus:outline-none focus:border-[#f36e21]"
                      placeholder={t('booking.contact.phonePlaceholder')}
                    />
                  </div>
                  
                  {/* Additional information */}
                  <div>
                    <label htmlFor="numberOfPeople" className="block text-gray-300 text-sm mb-1">
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
                      className="w-full bg-black/40 text-white border border-white/10 rounded-md p-2 text-sm focus:outline-none focus:border-[#f36e21]"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="promoCode" className="block text-gray-300 text-sm mb-1">
                      {t('booking.contact.promoCode')}
                    </label>
                    <input
                      type="text"
                      id="promoCode"
                      name="promoCode"
                      value={formData.promoCode}
                      onChange={handleInputChange}
                      className="w-full bg-black/40 text-white border border-white/10 rounded-md p-2 text-sm focus:outline-none focus:border-[#f36e21]"
                      placeholder={t('booking.contact.promoCodePlaceholder')}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="comment" className="block text-gray-300 text-sm mb-1">
                      {t('booking.contact.comment')}
                    </label>
                    <textarea
                      id="comment"
                      name="comment"
                      value={formData.comment}
                      onChange={handleInputChange}
                      className="w-full bg-black/40 text-white border border-white/10 rounded-md p-2 text-sm focus:outline-none focus:border-[#f36e21]"
                      placeholder={t('booking.contact.commentPlaceholder')}
                      rows={2}
                    />
                  </div>
                </div>
              </motion.div>
            )}
            
            {/* Step 3: Payment method */}
            {currentStep === 'payment' && (
              <motion.div
                key="payment-step"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="text-base font-semibold text-white mb-3">{t('booking.payment.title')}</h3>
                
                <div className="space-y-4">
                  {/* Booking summary */}
                  <div className="bg-black/40 backdrop-blur-sm p-3 rounded-lg border border-white/10">
                    <h4 className="text-white text-sm font-medium mb-2">{t('booking.payment.summary')}</h4>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-400">{t('booking.payment.package')}:</span>
                        <span className="text-white">{packageData.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">{t('booking.payment.date')}:</span>
                        <span className="text-white">{selectedDate && formatDate(selectedDate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">{t('booking.payment.time')}:</span>
                        <span className="text-white">{selectedTime} - {formData.endTime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">{t('booking.payment.people')}:</span>
                        <span className="text-white">{formData.numberOfPeople}</span>
                      </div>
                      <div className="flex justify-between font-medium pt-1.5 border-t border-white/10">
                        <span className="text-gray-300">{t('booking.payment.totalAmount')}:</span>
                        <span className="text-[#f36e21]">{formData.totalAmount} PLN</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Payment method selection */}
                  <div>
                    <h4 className="text-white text-sm font-medium mb-2">{t('booking.payment.method')}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handlePaymentMethodSelect('FULLY_PAID')}
                        className={`p-3 rounded-lg border-2 transition-colors text-left ${
                          paymentMethod === 'FULLY_PAID'
                            ? 'border-[#f36e21] bg-[#f36e21]/10'
                            : 'border-white/10 bg-black/40 hover:bg-black/60'
                        }`}
                      >
                        <div className="font-medium text-white text-sm mb-1">{t('booking.payment.fullPayment')}</div>
                        <div className="text-gray-300 text-xs">{formData.totalAmount} PLN</div>
                        <div className="text-xs text-gray-400 mt-1.5">{t('booking.payment.fullPaymentDesc')}</div>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => handlePaymentMethodSelect('DEPOSIT_PAID')}
                        className={`p-3 rounded-lg border-2 transition-colors text-left ${
                          paymentMethod === 'DEPOSIT_PAID'
                            ? 'border-[#f36e21] bg-[#f36e21]/10'
                            : 'border-white/10 bg-black/40 hover:bg-black/60'
                        }`}
                      >
                        <div className="font-medium text-white text-sm mb-1">{t('booking.payment.depositPayment')}</div>
                        <div className="text-gray-300 text-xs">20 PLN</div>
                        <div className="text-xs text-gray-400 mt-1.5">{t('booking.payment.depositPaymentDesc')}</div>
                      </button>
                    </div>
                  </div>
                  
                  {/* Payment provider information */}
                  <div className="bg-black/20 p-2.5 rounded-lg text-xs text-gray-400 border border-white/5">
                    <p>{t('booking.payment.provider')}</p>
                    <img 
                      src="/images/przelewy24-logo.png" 
                      alt="Przelewy24" 
                      className="h-5 mt-2 opacity-70" 
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Footer with navigation buttons */}
        <div className="bg-black/40 backdrop-blur-sm px-4 py-3 flex justify-between shrink-0 border-t border-white/10">
          {currentStep !== 'date' ? (
            <button
              type="button"
              onClick={handlePrevStep}
              className="flex items-center px-3 py-1.5 bg-black/40 border border-white/10 text-white text-sm rounded-md hover:bg-black/60 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              {t('booking.buttons.back')}
            </button>
          ) : (
            <div></div> // Empty div to maintain layout
          )}
          
          {currentStep !== 'payment' ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="flex items-center px-4 py-1.5 bg-[#f36e21] text-white text-sm rounded-md hover:bg-[#ff7b2e] transition-colors"
            >
              {t('booking.buttons.next')}
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`px-4 py-1.5 bg-[#f36e21] text-white text-sm rounded-md hover:bg-[#ff7b2e] transition-colors flex items-center ${
                isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  {t('booking.buttons.processing')}
                </>
              ) : (
                t('booking.buttons.book')
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 