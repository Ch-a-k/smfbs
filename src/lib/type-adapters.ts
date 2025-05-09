import type { Package as MockPackage, Room as MockRoom } from './frontend-mocks';
import type { Package as BookingPackage, Room as BookingRoom } from '@/types/booking';

/**
 * Преобразует тип Package из frontend-mocks в тип Package из booking
 */
export function adaptMockPackageToBookingPackage(mockPackage: MockPackage): BookingPackage {
  return {
    id: mockPackage.id,
    name: mockPackage.name,
    description: mockPackage.description,
    price: mockPackage.price,
    depositAmount: mockPackage.depositAmount,
    duration: mockPackage.durationMinutes, // Переименовываем durationMinutes в duration
    maxPeople: mockPackage.maxPeople,
    preferredRooms: mockPackage.preferredRooms,
    isActive: mockPackage.isActive,
  };
}

/**
 * Преобразует тип Package из booking в тип Package из frontend-mocks
 */
export function adaptBookingPackageToMockPackage(bookingPackage: BookingPackage): MockPackage {
  return {
    id: typeof bookingPackage.id === 'string' ? parseInt(bookingPackage.id as string) : bookingPackage.id as number,
    name: bookingPackage.name,
    description: bookingPackage.description,
    price: typeof bookingPackage.price === 'string' ? parseInt(bookingPackage.price as string) : bookingPackage.price as number,
    durationMinutes: bookingPackage.duration, // Переименовываем duration в durationMinutes
    maxPeople: bookingPackage.maxPeople,
    depositAmount: bookingPackage.depositAmount,
    isActive: bookingPackage.isActive || true,
    preferredRooms: bookingPackage.preferredRooms,
  };
}

/**
 * Преобразует тип Room из frontend-mocks в тип Room из booking
 */
export function adaptMockRoomToBookingRoom(mockRoom: MockRoom): BookingRoom {
  return {
    id: mockRoom.id,
    name: mockRoom.name,
    capacity: mockRoom.capacity,
    maxPeople: mockRoom.maxPeople || mockRoom.capacity, // Используем capacity, если maxPeople не определено
    available: mockRoom.available,
    isActive: mockRoom.isActive,
    workSchedule: mockRoom.workSchedule,
  };
}

/**
 * Преобразует тип Room из booking в тип Room из frontend-mocks
 */
export function adaptBookingRoomToMockRoom(bookingRoom: BookingRoom): MockRoom {
  return {
    id: bookingRoom.id,
    name: bookingRoom.name,
    capacity: bookingRoom.capacity,
    maxPeople: bookingRoom.maxPeople,
    available: bookingRoom.available,
    isActive: bookingRoom.isActive,
    workSchedule: bookingRoom.workSchedule,
    description: `Room ${bookingRoom.name}`, // Добавляем отсутствующие поля
    image: '/images/default-room.jpg', // Добавляем отсутствующие поля
  };
}

/**
 * Преобразует массив Package из frontend-mocks в массив Package из booking
 */
export function adaptMockPackagesToBookingPackages(mockPackages: MockPackage[]): BookingPackage[] {
  return mockPackages.map(adaptMockPackageToBookingPackage);
}

/**
 * Преобразует массив Room из frontend-mocks в массив Room из booking
 */
export function adaptMockRoomsToBookingRooms(mockRooms: MockRoom[]): BookingRoom[] {
  return mockRooms.map(adaptMockRoomToBookingRoom);
} 