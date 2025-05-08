import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Customer } from '@/types/customer';
import { User, Phone, Mail, Calendar, DollarSign, Edit, Trash, Star, StarOff, BadgeCheck } from 'lucide-react';

interface AdminCustomerListProps {
  customers: Customer[];
  isLoading: boolean;
  onViewCustomer: (customerId: number) => void;
  onDeleteCustomer: (customerId: number) => void;
}

export default function AdminCustomerList({
  customers,
  isLoading,
  onViewCustomer,
  onDeleteCustomer
}: AdminCustomerListProps) {
  const [sortField, setSortField] = useState<keyof Customer>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState('');

  const handleSort = (field: keyof Customer) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredAndSortedCustomers = useMemo(() => {
    // Сначала фильтруем
    const filtered = customers.filter(customer => {
      const searchFields = [
        customer.name.toLowerCase(),
        customer.email.toLowerCase(),
        customer.phone.toLowerCase(),
        customer.city?.toLowerCase() || '',
      ];
      
      return searchFields.some(field => field.includes(searchTerm.toLowerCase()));
    });

    // Затем сортируем
    return [...filtered].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      // Обработка undefined значений
      if (aValue === undefined) aValue = '';
      if (bValue === undefined) bValue = '';
      
      if (aValue === bValue) return 0;
      
      const compareResult = aValue < bValue ? -1 : 1;
      return sortDirection === 'asc' ? compareResult : -compareResult;
    });
  }, [customers, searchTerm, sortField, sortDirection]);

  const getSortArrow = (field: keyof Customer) => {
    if (field !== sortField) return null;
    return sortDirection === 'asc' ? ' ↑' : ' ↓';
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd.MM.yyyy');
    } catch (e) {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#f36e21]"></div>
        <span className="ml-2 text-gray-400">Ładowanie klientów...</span>
      </div>
    );
  }

  if (!isLoading && customers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <User size={48} className="text-gray-400 mb-2" />
        <h3 className="text-xl font-semibold text-white mb-1">Brak klientów</h3>
        <p className="text-gray-400">Nie znaleziono żadnych klientów w systemie.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg shadow-md overflow-hidden">
      {/* Search bar */}
      <div className="p-4 bg-gray-900">
        <input
          type="text"
          placeholder="Szukaj klienta..."
          className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#f36e21] focus:border-transparent"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      {/* Customer table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-900">
            <tr>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('name')}
              >
                Klient {getSortArrow('name')}
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('bookingsCount')}
              >
                Rezerwacje {getSortArrow('bookingsCount')}
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('totalSpent')}
              >
                Suma {getSortArrow('totalSpent')}
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('lastBookingDate')}
              >
                Ostatnia wizyta {getSortArrow('lastBookingDate')}
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                Akcje
              </th>
            </tr>
          </thead>
          <tbody className="bg-gray-800 divide-y divide-gray-700">
            {filteredAndSortedCustomers.map((customer) => (
              <tr key={customer.id} className="hover:bg-gray-750 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap" onClick={() => onViewCustomer(customer.id)}>
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-700 flex items-center justify-center text-white">
                      {customer.isVip ? (
                        <BadgeCheck className="text-[#f36e21]" />
                      ) : (
                        <User />
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-white">
                          {customer.name}
                        </div>
                        {customer.isVip && (
                          <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-[#f36e21] text-white">
                            VIP
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-400 flex flex-col sm:flex-row sm:space-x-2">
                        <span className="flex items-center">
                          <Mail size={12} className="mr-1" />
                          {customer.email}
                        </span>
                        <span className="flex items-center">
                          <Phone size={12} className="mr-1" />
                          {customer.phone}
                        </span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                  {customer.bookingsCount}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                  <div className="flex items-center">
                    <DollarSign size={16} className="mr-1 text-green-500" />
                    {customer.totalSpent} PLN
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                  <div className="flex items-center">
                    <Calendar size={16} className="mr-1 text-blue-500" />
                    {formatDate(customer.lastBookingDate)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button 
                    onClick={() => onViewCustomer(customer.id)}
                    className="text-[#f36e21] hover:text-orange-300 mr-4"
                  >
                    <Edit size={18} />
                  </button>
                  <button 
                    onClick={() => onDeleteCustomer(customer.id)}
                    className="text-red-500 hover:text-red-300"
                  >
                    <Trash size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 