'use client';

import React, { useState } from 'react';
import { User, UserPlus, Trash2 } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminCustomerList from '@/components/admin/AdminCustomerList';
import CustomerDetailModal from '@/components/admin/CustomerDetailModal';
import { useCustomers, useCustomerMutations } from '@/app/api/hooks';
import { Customer, CustomerFormData } from '@/types/customer';

export default function CustomersPage() {
  const { customers, isLoading, error, refetch } = useCustomers();
  const { create, update, remove, isLoading: isMutating } = useCustomerMutations();
  
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  
  // Получаем выбранного клиента
  const selectedCustomer = customers.find(customer => customer.id === selectedCustomerId);
  
  // Обработчики для работы с клиентами
  const handleViewCustomer = (customerId: number) => {
    setSelectedCustomerId(customerId);
    setIsDetailModalOpen(true);
  };
  
  const handleDeleteCustomer = (customerId: number) => {
    setSelectedCustomerId(customerId);
    setIsDeleteConfirmOpen(true);
  };
  
  const confirmDeleteCustomer = async () => {
    if (selectedCustomerId) {
      try {
        await remove(selectedCustomerId);
        setIsDeleteConfirmOpen(false);
        refetch();
      } catch (err) {
        console.error('Error deleting customer:', err);
      }
    }
  };
  
  const handleSaveCustomer = async (customerData: CustomerFormData) => {
    if (selectedCustomer) {
      const updatedCustomer = {
        ...selectedCustomer,
        ...customerData
      };
      
      await update(updatedCustomer);
      refetch();
    }
  };
  
  const handleCreateCustomer = () => {
    setSelectedCustomerId(null);
    setIsDetailModalOpen(true);
  };
  
  const handleCreateNewCustomer = async (customerData: CustomerFormData) => {
    await create(customerData);
    setIsDetailModalOpen(false);
    refetch();
  };
  
  return (
    <AdminLayout>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Klienci
          </h1>
          <p className="text-gray-400">
            Zarządzaj bazą klientów, sprawdzaj statystyki i edytuj dane.
          </p>
        </div>
        <button
          onClick={handleCreateCustomer}
          className="mt-4 sm:mt-0 bg-[#f36e21] hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center justify-center transition-colors"
        >
          <UserPlus size={18} className="mr-2" />
          Dodaj klienta
        </button>
      </div>
      
      {error && (
        <div className="p-4 mb-6 bg-red-900/30 border border-red-700 text-white rounded-lg">
          {error}
        </div>
      )}
      
      <AdminCustomerList
        customers={customers}
        isLoading={isLoading}
        onViewCustomer={handleViewCustomer}
        onDeleteCustomer={handleDeleteCustomer}
      />
      
      {/* Modal для детальной информации о клиенте */}
      {isDetailModalOpen && (
        <CustomerDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          customer={selectedCustomer}
          onSave={selectedCustomer ? handleSaveCustomer : handleCreateNewCustomer}
        />
      )}
      
      {/* Модальное окно подтверждения удаления */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center space-x-4 mb-4">
              <div className="bg-red-500/20 p-3 rounded-full">
                <Trash2 size={24} className="text-red-500" />
              </div>
              <h2 className="text-xl font-semibold text-white">Usuń klienta</h2>
            </div>
            
            <p className="text-gray-300 mb-6">
              Czy na pewno chcesz usunąć tego klienta? Ta operacja jest nieodwracalna i spowoduje utratę wszystkich danych klienta.
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
                disabled={isMutating}
              >
                Anuluj
              </button>
              <button
                onClick={confirmDeleteCustomer}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center"
                disabled={isMutating}
              >
                {isMutating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Usuwanie...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} className="mr-2" />
                    Usuń
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
} 