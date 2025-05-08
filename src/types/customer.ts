export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  notes?: string;
  bookingsCount: number;
  totalSpent: number;
  firstBookingDate: string;
  lastBookingDate: string;
  isVip: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CustomerFormData = Omit<Customer, 'id' | 'bookingsCount' | 'totalSpent' | 'firstBookingDate' | 'lastBookingDate' | 'createdAt' | 'updatedAt'>;

export function mapDatabaseCustomerToCustomer(dbCustomer: any): Customer {
  return {
    id: dbCustomer.id,
    name: dbCustomer.name || '',
    email: dbCustomer.email || '',
    phone: dbCustomer.phone || '',
    address: dbCustomer.address || '',
    city: dbCustomer.city || '',
    postalCode: dbCustomer.postal_code || '',
    country: dbCustomer.country || 'Poland',
    notes: dbCustomer.notes || '',
    bookingsCount: dbCustomer.bookings_count || 0,
    totalSpent: dbCustomer.total_spent || 0,
    firstBookingDate: dbCustomer.first_booking_date || '',
    lastBookingDate: dbCustomer.last_booking_date || '',
    isVip: dbCustomer.is_vip || false,
    createdAt: dbCustomer.created_at || '',
    updatedAt: dbCustomer.updated_at || ''
  };
} 