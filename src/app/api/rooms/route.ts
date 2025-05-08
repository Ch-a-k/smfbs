import { NextRequest, NextResponse } from 'next/server';
import { Room } from '@/types/booking';
import { 
  getAllRooms, 
  getRoomById, 
  createRoom, 
  updateRoom, 
  deleteRoom,
  getDefaultWorkSchedule
} from '@/lib/mock-api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Получение конкретной комнаты по ID
    if (id) {
      const room = await getRoomById(Number(id));
      if (!room) {
        return NextResponse.json({ error: 'Комната не найдена' }, { status: 404 });
      }
      return NextResponse.json(room);
    }

    // Получение всех комнат
    const rooms = await getAllRooms();
    return NextResponse.json(rooms);
  } catch (error: any) {
    console.error('Ошибка при получении комнат:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const roomData = await request.json();
    
    // Проверка наличия обязательных полей
    if (!roomData.name) {
      return NextResponse.json(
        { error: 'Отсутствуют обязательные поля: name' },
        { status: 400 }
      );
    }
    
    // Если расписание не предоставлено, используем стандартное
    if (!roomData.workSchedule) {
      roomData.workSchedule = getDefaultWorkSchedule();
    }
    
    const newRoom = await createRoom(roomData);
    return NextResponse.json(newRoom, { status: 201 });
  } catch (error: any) {
    console.error('Ошибка при создании комнаты:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID комнаты не указан' }, { status: 400 });
    }
    
    const roomId = Number(id);
    const room = await getRoomById(roomId);
    
    if (!room) {
      return NextResponse.json({ error: 'Комната не найдена' }, { status: 404 });
    }
    
    const updateData = await request.json();
    const updatedRoom = await updateRoom(roomId, updateData);
    
    return NextResponse.json(updatedRoom);
  } catch (error: any) {
    console.error('Ошибка при обновлении комнаты:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID комнаты не указан' }, { status: 400 });
    }
    
    const roomId = Number(id);
    const room = await getRoomById(roomId);
    
    if (!room) {
      return NextResponse.json({ error: 'Комната не найдена' }, { status: 404 });
    }
    
    const success = await deleteRoom(roomId);
    
    if (success) {
      return NextResponse.json({ success: true, message: 'Комната успешно удалена' });
    } else {
      return NextResponse.json(
        { error: 'Произошла ошибка при удалении комнаты' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Ошибка при удалении комнаты:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 