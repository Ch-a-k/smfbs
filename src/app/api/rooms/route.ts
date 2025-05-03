import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { Room, mapDatabaseRoomToRoom } from '@/types/booking';
import { getDefaultWorkSchedule, normalizeRoomSchedule, getDefaultWorkScheduleJson } from '@/utils/supabase/functions';

// Создаем клиент Supabase для серверных операций
const supabase = createClient();

// GET: Получение всех комнат или комнаты по id
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  
  try {
    console.log(`GET rooms request, id: ${id || 'all'}`);
    
    let query = supabase.from('rooms').select('*');
    
    if (id) {
      query = query.eq('id', id);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching rooms from DB:', error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      console.log('No rooms found');
      return NextResponse.json(id ? null : []);
    }
    
    console.log(`Found ${data.length} rooms`);
    
    // Преобразование данных из БД в формат интерфейса Room
    const rooms: Room[] = data.map((room: any) => {
      // Нормализуем расписание, чтобы убедиться, что оно соответствует структуре
      const workSchedule = normalizeRoomSchedule(room.work_schedule);
      return {
        ...mapDatabaseRoomToRoom(room),
        workSchedule
      };
    });
    
    return NextResponse.json(id ? rooms[0] : rooms);
  } catch (error: any) {
    console.error('Error fetching rooms:', error);
    return NextResponse.json(
      { error: `Failed to fetch rooms: ${error.message || 'Unknown error'}` }, 
      { status: 500 }
    );
  }
}

// POST: Создание новой комнаты
export async function POST(request: Request) {
  try {
    const roomData: Partial<Room> = await request.json();
    
    console.log('Creating new room:', roomData.name);
    
    // Проверяем обязательные поля
    if (!roomData.name) {
      return NextResponse.json({ error: 'Room name is required' }, { status: 400 });
    }
    
    // Преобразование данных из формата интерфейса Room в формат БД
    // Не включаем id, чтобы позволить базе данных назначить его автоматически
    const dbRoomData = {
      name: roomData.name,
      capacity: roomData.capacity || 4,
      max_people: roomData.maxPeople || roomData.capacity || 4,
      is_active: roomData.isActive !== undefined ? roomData.isActive : true,
      available: roomData.available !== undefined ? roomData.available : true,
      work_schedule: roomData.workSchedule 
        ? roomData.workSchedule 
        : getDefaultWorkScheduleJson()
    };
    
    console.log('Sending to database:', dbRoomData);
    
    const { data, error } = await supabase
      .from('rooms')
      .insert(dbRoomData)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating room in DB:', error);
      throw error;
    }
    
    console.log(`Room created with ID: ${data.id}`);
    
    // Преобразование данных из БД в формат интерфейса Room
    const room = mapDatabaseRoomToRoom(data);
    room.workSchedule = normalizeRoomSchedule(data.work_schedule);
    
    return NextResponse.json(room, { status: 201 });
  } catch (error: any) {
    console.error('Error creating room:', error);
    return NextResponse.json(
      { error: `Failed to create room: ${error.message || 'Unknown error'}` }, 
      { status: 500 }
    );
  }
}

// PUT: Обновление существующей комнаты
export async function PUT(request: Request) {
  try {
    const roomData: Partial<Room> = await request.json();
    
    if (!roomData.id) {
      return NextResponse.json({ error: 'Room ID is required' }, { status: 400 });
    }
    
    console.log(`Updating room ID: ${roomData.id}`);
    
    // Проверяем, существует ли комната
    const { data: existingRoom, error: checkError } = await supabase
      .from('rooms')
      .select('id')
      .eq('id', roomData.id)
      .single();
    
    if (checkError || !existingRoom) {
      console.error('Room not found:', checkError);
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }
    
    // Преобразование данных из формата интерфейса Room в формат БД
    const dbRoomData: Record<string, any> = {};
    
    if (roomData.name !== undefined) dbRoomData.name = roomData.name;
    if (roomData.capacity !== undefined) dbRoomData.capacity = roomData.capacity;
    if (roomData.maxPeople !== undefined) dbRoomData.max_people = roomData.maxPeople;
    if (roomData.isActive !== undefined) dbRoomData.is_active = roomData.isActive;
    if (roomData.available !== undefined) dbRoomData.available = roomData.available;
    if (roomData.workSchedule !== undefined) dbRoomData.work_schedule = roomData.workSchedule;
    
    const { data, error } = await supabase
      .from('rooms')
      .update(dbRoomData)
      .eq('id', roomData.id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating room in DB:', error);
      throw error;
    }
    
    console.log(`Room ID ${data.id} updated successfully`);
    
    // Преобразование данных из БД в формат интерфейса Room
    const room = mapDatabaseRoomToRoom(data);
    room.workSchedule = normalizeRoomSchedule(data.work_schedule);
    
    return NextResponse.json(room);
  } catch (error: any) {
    console.error('Error updating room:', error);
    return NextResponse.json(
      { error: `Failed to update room: ${error.message || 'Unknown error'}` }, 
      { status: 500 }
    );
  }
}

// DELETE: Удаление комнаты
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  
  if (!id) {
    return NextResponse.json({ error: 'Room ID is required' }, { status: 400 });
  }
  
  try {
    console.log(`Deleting room ID: ${id}`);
    
    // Проверяем, существует ли комната
    const { data: existingRoom, error: checkError } = await supabase
      .from('rooms')
      .select('id')
      .eq('id', id)
      .single();
    
    if (checkError || !existingRoom) {
      console.error('Room not found:', checkError);
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }
    
    const { error } = await supabase
      .from('rooms')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting room from DB:', error);
      throw error;
    }
    
    console.log(`Room ID ${id} deleted successfully`);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting room:', error);
    return NextResponse.json(
      { error: `Failed to delete room: ${error.message || 'Unknown error'}` }, 
      { status: 500 }
    );
  }
} 