import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Customer, CustomerFormData } from '@/types/customer';
import { X, Save, User, Mail, Phone, MapPin, Calendar, DollarSign, Edit, Star, StarOff } from 'lucide-react';

interface CustomerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer?: Customer;
  onSave: (customer: CustomerFormData) => Promise<void>;
}

export default function CustomerDetailModal({
  isOpen,
  onClose,
  customer,
  onSave
}: CustomerDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<CustomerFormData>({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'Poland',
    notes: '',
    isVip: false
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address || '',
        city: customer.city || '',
        postalCode: customer.postalCode || '',
        country: customer.country || 'Poland',
        notes: customer.notes || '',
        isVip: customer.isVip
      });
    }
  }, [customer]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      await onSave(formData);
      setIsEditing(false);
    } catch (err) {
      setError('Nie udało się zapisać zmian. Spróbuj ponownie.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd.MM.yyyy');
    } catch (e) {
      return dateString;
    }
  };

  if (!isOpen || !customer) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-black/80 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-auto">
        <div className="p-4 border-b border-gray-700 flex justify-between items-center sticky top-0 bg-gray-900 z-10">
          <h2 className="text-xl font-semibold text-white flex items-center">
            {customer.isVip ? <Star className="text-[#f36e21] mr-2" /> : <User className="mr-2" />}
            {isEditing ? 'Edycja klienta' : 'Szczegóły klienta'}
          </h2>
          <div className="flex items-center gap-2">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 text-[#f36e21] hover:text-orange-300 transition-colors"
              >
                <Edit size={20} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-900/50 text-white text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="p-6">
            {isEditing ? (
              // Edit mode
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Imię i nazwisko
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#f36e21] focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      E-mail
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#f36e21] focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Telefon
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#f36e21] focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Adres
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#f36e21] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Miasto
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#f36e21] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Kod pocztowy
                    </label>
                    <input
                      type="text"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleInputChange}
                      className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#f36e21] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Kraj
                    </label>
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#f36e21] focus:border-transparent"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Notatki
                    </label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#f36e21] focus:border-transparent"
                    ></textarea>
                  </div>
                  <div className="md:col-span-2">
                    <label className="flex items-center space-x-2 text-white">
                      <input
                        type="checkbox"
                        name="isVip"
                        checked={formData.isVip}
                        onChange={handleCheckboxChange}
                        className="rounded border-gray-600 text-[#f36e21] focus:ring-[#f36e21]"
                      />
                      <span>Klient VIP</span>
                    </label>
                  </div>
                </div>
              </>
            ) : (
              // View mode
              <>
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-white mb-4">Informacje podstawowe</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start space-x-3">
                      <User className="text-[#f36e21] mt-0.5" size={18} />
                      <div>
                        <div className="text-gray-400 text-sm">Imię i nazwisko</div>
                        <div className="text-white">{customer.name}</div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Mail className="text-[#f36e21] mt-0.5" size={18} />
                      <div>
                        <div className="text-gray-400 text-sm">E-mail</div>
                        <div className="text-white">{customer.email}</div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Phone className="text-[#f36e21] mt-0.5" size={18} />
                      <div>
                        <div className="text-gray-400 text-sm">Telefon</div>
                        <div className="text-white">{customer.phone}</div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <MapPin className="text-[#f36e21] mt-0.5" size={18} />
                      <div>
                        <div className="text-gray-400 text-sm">Adres</div>
                        <div className="text-white">
                          {customer.address ? (
                            <>
                              {customer.address}<br />
                              {customer.postalCode} {customer.city}<br />
                              {customer.country}
                            </>
                          ) : (
                            <span className="text-gray-500">Brak adresu</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-medium text-white mb-4">Statystyki klienta</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start space-x-3">
                      <Calendar className="text-blue-500 mt-0.5" size={18} />
                      <div>
                        <div className="text-gray-400 text-sm">Pierwsza wizyta</div>
                        <div className="text-white">{formatDate(customer.firstBookingDate)}</div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Calendar className="text-green-500 mt-0.5" size={18} />
                      <div>
                        <div className="text-gray-400 text-sm">Ostatnia wizyta</div>
                        <div className="text-white">{formatDate(customer.lastBookingDate)}</div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <DollarSign className="text-yellow-500 mt-0.5" size={18} />
                      <div>
                        <div className="text-gray-400 text-sm">Suma wydatków</div>
                        <div className="text-white">{customer.totalSpent} PLN</div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Calendar className="text-purple-500 mt-0.5" size={18} />
                      <div>
                        <div className="text-gray-400 text-sm">Liczba rezerwacji</div>
                        <div className="text-white">{customer.bookingsCount}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {customer.notes && (
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-white mb-2">Notatki</h3>
                    <div className="p-3 bg-gray-700 rounded text-white">
                      {customer.notes}
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <div className="text-sm font-medium text-gray-400">Status klienta:</div>
                  <div className="flex items-center">
                    {customer.isVip ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[#f36e21] text-white">
                        <Star size={12} className="mr-1" /> VIP
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-700 text-white">
                        Standardowy
                      </span>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {isEditing && (
            <div className="p-4 bg-gray-900 border-t border-gray-700 flex justify-end space-x-3 sticky bottom-0">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
                disabled={isLoading}
              >
                Anuluj
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#f36e21] text-white rounded hover:bg-orange-500 transition-colors flex items-center"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Zapisywanie...
                  </>
                ) : (
                  <>
                    <Save size={16} className="mr-2" />
                    Zapisz zmiany
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
} 