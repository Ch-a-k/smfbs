import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO, addMinutes } from 'date-fns';
import { pl, enUS } from 'date-fns/locale';
import { 
  X, ChevronLeft, ChevronRight, CreditCard, 
  Calendar, User, Check, ShoppingCart, 
  Clock, CreditCard as PaymentIcon, AlertCircle,
  Gift, Users, Loader2, Tag
} from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { Package as BasePackage, BookingFormData, PaymentStatus } from '@/types/booking';
import BookingCalendar from './BookingCalendar';
import TimeSelector from './TimeSelector';
import CrossSellItems, { CrossSellItem } from './CrossSellItems';
import Cookies from "universal-cookie";

type BookingStep = 'date' | 'time' | 'contact' | 'extras' | 'payment';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  packageData: BasePackage;
}

interface Discount {
  code: string;
  fixed_amount: number;
  valid_until: string;
  is_active: boolean;
}

const cookies = new Cookies();
const accessToken = cookies.get('access_token');

const modalAnimation = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] }
  },
  exit: { 
    opacity: 0, 
    scale: 0.95,
    transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] }
  }
};

export default function BookingModal({ isOpen, onClose, packageData }: BookingModalProps) {
  const { t, locale } = useI18n();
  const [currentStep, setCurrentStep] = useState<BookingStep>('date');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [discount, setDiscount] = useState<Discount | null>(null);
  const [isCheckingDiscount, setIsCheckingDiscount] = useState(false);
  const [discountMessage, setDiscountMessage] = useState('');
  
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedCrossSellItems, setSelectedCrossSellItems] = useState<string[]>([]);
  const [totalAdditionalPrice, setTotalAdditionalPrice] = useState(0);
  
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
    depositAmount: packageData.depositAmount || 20,
  });
  
  const [paymentMethod, setPaymentMethod] = useState<PaymentStatus>('FULLY_PAID');

  function getPackagePrice(): number {
    if (typeof packageData.price === 'number') return packageData.price;
    if (typeof packageData.price === 'string') {
      const numericValue = packageData.price.replace(/[^\d]/g, '');
      return numericValue ? parseInt(numericValue, 10) : 0;
    }
    return 0;
  }

  const calculateTotalAmount = (): number => {
    const basePrice = getPackagePrice();
    const total = basePrice + totalAdditionalPrice;
    if (discount) {
      return Math.max(0, total - discount.fixed_amount);
    }
    return total;
  };

  const checkDiscountCode = async () => {
    if (!formData.promoCode) {
      setDiscountMessage(t('booking.promoCode.enterCode'));
      return;
    }

    setIsCheckingDiscount(true);
    setDiscountMessage('');

    try {
      const response = await fetch(
        `http://localhost:89/api/discounts/check`,
        {
          method: 'POST', // Используем POST вместо GET
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            discount_code: formData.promoCode // Передаем промокод в теле запроса
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.detail?.includes('expired')
            ? t('booking.promoCode.expired')
            : errorData.detail?.includes('not found')
              ? t('booking.promoCode.notFound')
              : t('booking.promoCode.invalid')
        );
      }

      const discountData = await response.json();
      setDiscount(discountData);
      
      // Now this will work with proper typing
      setDiscountMessage(
        `${t('booking.promoCode.applied')} ${discountData.fixed_amount} PLN`
      );
      
      setFormData(prev => ({
        ...prev,
        totalAmount: calculateTotalAmount()
      }));
    } catch (error: any) {
      setDiscount(null);
      setDiscountMessage(error.message);
      setFormData(prev => ({
        ...prev,
        totalAmount: calculateTotalAmount()
      }));
    } finally {
      setIsCheckingDiscount(false);
    }
  };

  const removeDiscount = () => {
    setDiscount(null);
    setDiscountMessage('');
    setFormData(prev => ({
      ...prev,
      totalAmount: calculateTotalAmount()
    }));
  };

  const fetchAvailableTimes = async (date: Date) => {
    try {
      setIsLoading(true);
      const formattedDate = format(date, 'yyyy-MM-dd');
      
      const response = await fetch(
        `http://localhost:89/api/bookings/available-times?package_id=${packageData.id}&date=${formattedDate}`,
        {
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) throw new Error(t('booking.error.fetchTimes'));
      
      const data = await response.json();
      setAvailableTimes(data);
    } catch (error) {
      console.error('Error fetching available times:', error);
      setErrorMessage(t('booking.error.fetchTimes'));
      setAvailableTimes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const createCustomer = async () => {
    try {
      const response = await fetch('http://localhost:89/api/customers', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          email: formData.email,
          phone: formData.phone,
          name: formData.name,
          password: generateTempPassword(),
          is_vip: false
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || t('booking.error.customerCreate'));
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  };

  const generateTempPassword = () => {
    return Math.random().toString(36).slice(-8);
  };

  const submitBooking = async () => {
    try {
      const response = await fetch('http://localhost:89/api/bookings/user', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          package_id: formData.packageId,
          customer_name: formData.name,
          customer_email: formData.email,
          customer_phone: formData.phone,
          booking_date: formData.date,
          start_time: formData.startTime,
          end_time: formData.endTime,
          num_people: formData.numberOfPeople,
          total_price: formData.totalAmount,
          payment_status: paymentMethod,
          paid_amount: paymentMethod === 'FULLY_PAID' 
            ? formData.totalAmount 
            : formData.depositAmount,
          additional_items: selectedCrossSellItems,
          notes: formData.comment,
          promo_code: formData.promoCode
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || t('booking.error.submit'));
      }

      return await response.json();
    } catch (error) {
      console.error('Error submitting booking:', error);
      throw error;
    }
  };

  const handleDateSelect = async (date: Date) => {
    setSelectedDate(date);
    setSelectedTime(null);
    await fetchAvailableTimes(date);
  };

  const handleSubmit = async () => {
    setErrorMessage('');
    setIsSubmitting(true);
    
    try {
      await createCustomer();
      await submitBooking();
      
      alert(t('booking.success.message'));
      onClose();
    } catch (error: any) {
      console.error('Booking error:', error);
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errorMessage) setErrorMessage('');
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  const handlePaymentMethodSelect = (method: PaymentStatus) => {
    setPaymentMethod(method);
  };

  const handleCrossSellItemToggle = (item: CrossSellItem) => {
    setSelectedCrossSellItems(prev => {
      const isSelected = prev.includes(item.id);
      const priceChange = isSelected ? -getItemPrice(item.id) : getItemPrice(item.id);
      
      setTotalAdditionalPrice(prev => prev + priceChange);
      
      const newTotalAmount = calculateTotalAmount();
      setFormData(current => ({
        ...current,
        totalAmount: newTotalAmount
      }));
      
      return isSelected ? prev.filter(id => id !== item.id) : [...prev, item.id];
    });
  };

  const validateDateStep = () => {
    if (!selectedDate) {
      setErrorMessage(t('booking.validation.dateRequired'));
      return false;
    }
    return true;
  };

  const validateTimeStep = () => {
    if (!selectedTime) {
      setErrorMessage(t('booking.validation.timeRequired'));
      return false;
    }
    return true;
  };

  const validateContactStep = () => {
    if (!formData.name.trim()) {
      setErrorMessage(t('booking.validation.nameRequired'));
      return false;
    }
    if (!formData.email.trim()) {
      setErrorMessage(t('booking.validation.emailRequired'));
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setErrorMessage(t('booking.validation.emailInvalid'));
      return false;
    }
    if (!formData.phone.trim()) {
      setErrorMessage(t('booking.validation.phoneRequired'));
      return false;
    }
    if (formData.phone.replace(/\D/g, '').length < 9) {
      setErrorMessage(t('booking.validation.phoneInvalid'));
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    setErrorMessage('');
    
    if (currentStep === 'date' && !validateDateStep()) return;
    if (currentStep === 'time' && !validateTimeStep()) return;
    if (currentStep === 'contact' && !validateContactStep()) return;
    
    const nextSteps: Record<BookingStep, BookingStep> = {
      date: 'time',
      time: 'contact',
      contact: 'extras',
      extras: 'payment',
      payment: 'payment'
    };
    setCurrentStep(nextSteps[currentStep]);
  };

  const handlePrevStep = () => {
    setErrorMessage('');
    const prevSteps: Record<BookingStep, BookingStep | null> = {
      date: null,
      time: 'date',
      contact: 'time',
      extras: 'contact',
      payment: 'extras'
    };
    if (prevSteps[currentStep]) {
      setCurrentStep(prevSteps[currentStep]!);
    }
  };

  const formatDate = (date: Date) => {
    return format(date, 'EEEE, d MMMM yyyy', { locale: locale === 'pl' ? pl : enUS });
  };

  const getItemPrice = (itemId: string): number => {
    const prices: Record<string, number> = {
      'glass': 50, 'keyboard': 20, 'tvMonitor': 100,
      'furniture': 120, 'printer': 50, 'mouse': 10,
      'phone': 30, 'goProRecording': 50
    };
    return prices[itemId] || 0;
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep('date');
      setSelectedDate(null);
      setSelectedTime(null);
      setSelectedCrossSellItems([]);
      setTotalAdditionalPrice(0);
      setDiscount(null);
      setDiscountMessage('');
      setFormData({
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
        depositAmount: packageData.depositAmount || 20,
      });
      setPaymentMethod('FULLY_PAID');
    }
  }, [isOpen, packageData]);

  useEffect(() => {
    if (selectedDate) {
      setFormData(prev => ({
        ...prev,
        date: format(selectedDate, 'yyyy-MM-dd')
      }));
    }
  }, [selectedDate]);

  useEffect(() => {
    if (selectedTime && selectedDate) {
      const startDate = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
        parseInt(selectedTime.split(':')[0]),
        parseInt(selectedTime.split(':')[1])
      );
      
      const endDate = addMinutes(startDate, packageData.duration);
      const endTime = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
      
      setFormData(prev => ({
        ...prev,
        startTime: selectedTime,
        endTime: endTime
      }));
    }
  }, [selectedTime, selectedDate, packageData.duration]);

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      crossSellItems: selectedCrossSellItems,
      totalAmount: calculateTotalAmount()
    }));
  }, [selectedCrossSellItems, discount]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4 sm:p-6 md:p-8">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />
          
          <motion.div
            className="relative w-full max-w-lg max-h-[90vh] flex flex-col bg-gradient-to-b from-[#2c2527] to-[#231f20] rounded-2xl overflow-hidden shadow-xl border border-white/10 z-10"
            variants={modalAnimation}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="px-5 py-4 flex justify-between items-center shrink-0 border-b border-white/10 bg-black/30">
              <div>
                <h2 className="font-bold text-lg text-white">{t('booking.title')}</h2>
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
            
            <div className="px-5 py-4 bg-black/20">
              <div className="relative flex justify-between">
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
                
                {['date', 'time', 'contact', 'extras', 'payment'].map((step, index) => (
                  <div key={step} className="flex flex-col items-center z-10">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                      currentStep === step 
                        ? 'bg-[#f36e21] text-white' 
                        : index < ['date', 'time', 'contact', 'extras', 'payment'].indexOf(currentStep) 
                          ? 'bg-green-500 text-white' 
                          : 'bg-black/60 text-white'
                    }`}>
                      {index < ['date', 'time', 'contact', 'extras', 'payment'].indexOf(currentStep) ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        {
                          date: <Calendar className="w-4 h-4" />,
                          time: <Clock className="w-4 h-4" />,
                          contact: <User className="w-4 h-4" />,
                          extras: <Gift className="w-4 h-4" />,
                          payment: <PaymentIcon className="w-4 h-4" />
                        }[step]
                      )}
                    </div>
                    <span className="text-xs mt-2 text-gray-300">
                      {t(`booking.steps.${step}`)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            {errorMessage && (
              <div className="mx-5 mt-4 p-3 bg-red-900/40 text-red-200 border border-red-500/50 rounded-lg text-sm flex items-start">
                <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                <div>{errorMessage}</div>
              </div>
            )}
            
            <div className="p-5 overflow-y-auto flex-grow">
              <AnimatePresence mode="wait">
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
                      <div className="bg-black/20 border border-white/10 rounded-xl overflow-hidden">
                        <BookingCalendar
                          selectedDate={selectedDate}
                          onChange={handleDateSelect}
                        />
                      </div>
                      
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
                      <div className="bg-black/20 border border-white/10 rounded-xl p-4">
                        <div className="flex items-start">
                          <Calendar className="w-5 h-5 text-white/70 mr-3 mt-0.5" />
                          <div>
                            <div className="text-white/70 text-xs">
                              {t('booking.date.selected')}
                            </div>
                            <div className="text-white text-sm font-medium mt-0.5">
                              {selectedDate && formatDate(selectedDate)}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-black/20 border border-white/10 rounded-xl p-4">
                        {selectedDate && (
                          <TimeSelector
                            selectedTime={selectedTime}
                            onChange={handleTimeSelect}
                            availableTimes={availableTimes}
                            isLoading={isLoading}
                            date={selectedDate}
                            durationMinutes={packageData.duration}
                          />
                        )}
                      </div>
                      
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
                    
                    <div className="bg-black/20 border border-white/10 rounded-xl p-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-start">
                          <Calendar className="w-4 h-4 text-white/70 mr-2 mt-0.5" />
                          <div>
                            <div className="text-white/70 text-xs">
                              {t('booking.date.selected')}
                            </div>
                            <div className="text-white text-sm font-medium mt-0.5">
                              {selectedDate && formatDate(selectedDate)}
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
                          
                          <div className="relative">
                            <label htmlFor="promoCode" className="block text-gray-300 text-sm mb-1.5">
                              {t('booking.contact.promoCode')}
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                id="promoCode"
                                name="promoCode"
                                value={formData.promoCode}
                                onChange={handleInputChange}
                                className="w-full bg-black/40 text-white border border-white/20 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#f36e21] focus:ring-1 focus:ring-[#f36e21]/50 transition-colors"
                                placeholder={t('booking.contact.promoCodePlaceholder')}
                              />
                              <button
                                onClick={discount ? removeDiscount : checkDiscountCode}
                                disabled={isCheckingDiscount || !formData.promoCode}
                                className={`px-3 rounded-lg flex items-center justify-center ${
                                  discount 
                                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                    : 'bg-[#f36e21]/20 text-[#f36e21] border border-[#f36e21]/30'
                                } ${isCheckingDiscount ? 'opacity-50 cursor-not-allowed' : ''}`}
                              >
                                {isCheckingDiscount ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : discount ? (
                                  <Check className="w-4 h-4" />
                                ) : (
                                  <Tag className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                            {discountMessage && (
                              <div className={`mt-1 text-xs ${
                                discount ? 'text-green-400' : 'text-[#f36e21]'
                              }`}>
                                {discountMessage}
                              </div>
                            )}
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
                    
                    <div className="bg-black/20 border border-white/10 rounded-xl p-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-start">
                          <Calendar className="w-4 h-4 text-white/70 mr-2 mt-0.5" />
                          <div>
                            <div className="text-white/70 text-xs">
                              {t('booking.date.selected')}
                            </div>
                            <div className="text-white text-sm font-medium mt-0.5">
                              {selectedDate && formatDate(selectedDate)}
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
                    
                    <div className="bg-black/20 border border-white/10 rounded-xl p-4">
                      <CrossSellItems 
                        onItemToggle={handleCrossSellItemToggle}
                        selectedItems={selectedCrossSellItems}
                        totalAdditionalPrice={totalAdditionalPrice}
                      />
                    </div>
                  </motion.div>
                )}
                
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
                          
                          <div className="flex justify-between pt-3">
                            <span className="text-gray-300">{t('booking.payment.basePrice')}:</span>
                            <span className="text-white font-medium">{getPackagePrice()} PLN</span>
                          </div>
                          
                          {selectedCrossSellItems.length > 0 && (
                            <div className="space-y-1 mt-1">
                              <div className="flex justify-between">
                                <span className="text-gray-300">{t('booking.payment.additionalItems')}:</span>
                                <span className="text-[#f36e21] font-medium">+{totalAdditionalPrice} PLN</span>
                              </div>
                              
                              <div className="ml-4 space-y-1 mt-1">
                                {selectedCrossSellItems.map((itemId) => (
                                  <div key={itemId} className="flex justify-between text-gray-400">
                                    <span className="flex items-center">
                                      <Check className="w-3 h-3 mr-1 text-[#f36e21]" />
                                      {t(`home.pricing.extraItems.items.${itemId}`)}
                                    </span>
                                    <span>{getItemPrice(itemId)} PLN</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {discount && (
                            <div className="flex justify-between pt-3 border-t border-white/10">
                              <span className="text-gray-300">{t('booking.payment.discount')}:</span>
                              <span className="text-green-400 font-medium">-{discount.fixed_amount} PLN</span>
                            </div>
                          )}
                          
                          <div className="flex justify-between font-medium pt-3 mt-2 border-t border-white/10">
                            <span className="text-white text-base">{t('booking.payment.totalAmount')}:</span>
                            <span className="text-[#f36e21] text-lg font-bold">{formData.totalAmount} PLN</span>
                          </div>
                        </div>
                      </div>
                      
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
                            <div className="text-[#f36e21] font-semibold text-lg">{formData.depositAmount} PLN</div>
                            <div className="text-xs text-gray-400 mt-1.5">{t('booking.payment.depositPaymentDesc')}</div>
                            
                            {paymentMethod === 'DEPOSIT_PAID' && (
                              <div className="absolute top-2 right-2 bg-[#f36e21] text-white p-1 rounded-full">
                                <Check className="w-3 h-3" />
                              </div>
                            )}
                          </button>
                        </div>
                      </div>
                      
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
            
            <div className="px-5 py-4 flex justify-between shrink-0 border-t border-white/10 bg-black/30">
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
                <div></div>
              )}
              
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
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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