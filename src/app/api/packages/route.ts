import { NextResponse } from 'next/server';
import { Package } from '@/types/booking';
import { createClient } from '@/utils/supabase/server';

// Создаем клиент Supabase для серверных операций
const supabase = createClient();

export async function GET() {
  try {
    console.log('Fetching packages from Supabase...');
    
    // Получаем данные из таблицы packages
    const { data, error } = await supabase
      .from('packages')
      .select('*');
    
    if (error) {
      console.error('Error fetching packages:', error);
      return NextResponse.json({ error: 'Failed to fetch packages' }, { status: 500 });
    }
    
    if (!data || data.length === 0) {
      console.warn('No packages found in database');
      return NextResponse.json([]);
    }
    
    console.log(`Found ${data.length} packages`);
    
    // Преобразуем данные из формата БД в формат приложения
    const packages: Package[] = data.map((pkg: any) => ({
      id: pkg.id.toString(), // Преобразуем к строке, независимо от типа в БД
      name: pkg.name,
      description: pkg.description || '',
      price: pkg.price,
      depositAmount: pkg.deposit_amount || Math.round(pkg.price * 0.3),
      duration: pkg.duration,
      maxPeople: pkg.max_people,
      preferredRooms: pkg.preferred_rooms || []
    }));
    
    return NextResponse.json(packages);
  } catch (error) {
    console.error('Exception fetching packages:', error);
    return NextResponse.json({ error: 'Failed to fetch packages' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Проверяем обязательные поля
    if (!data.name || !data.price || !data.duration || !data.maxPeople) {
      return NextResponse.json(
        { error: 'Missing required fields: name, price, duration, maxPeople' },
        { status: 400 }
      );
    }
    
    // Подготавливаем данные для вставки в БД
    const dbPackage = {
      // Для пакетов, генерируем ID из имени пакета
      name: data.name,
      description: data.description || '',
      price: data.price,
      deposit_amount: data.depositAmount || Math.round(data.price * 0.3),
      duration: data.duration,
      max_people: data.maxPeople,
      preferred_rooms: data.preferredRooms || [],
      is_active: true
    };
    
    console.log('Sending to database:', dbPackage);
    
    // Вставляем данные в БД
    const { data: insertedData, error } = await supabase
      .from('packages')
      .insert(dbPackage)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating package:', error);
      return NextResponse.json({ error: 'Failed to create package: ' + error.message }, { status: 500 });
    }
    
    // Преобразуем данные из БД в формат приложения
    const newPackage: Package = {
      id: insertedData.id.toString(),
      name: insertedData.name,
      description: insertedData.description || '',
      price: insertedData.price,
      depositAmount: insertedData.deposit_amount || Math.round(insertedData.price * 0.3),
      duration: insertedData.duration,
      maxPeople: insertedData.max_people,
      preferredRooms: insertedData.preferred_rooms || []
    };
    
    console.log('Package created successfully:', newPackage);
    
    return NextResponse.json(newPackage, { status: 201 });
  } catch (error) {
    console.error('Exception creating package:', error);
    return NextResponse.json(
      { error: 'Failed to create package' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    
    if (!data.id) {
      return NextResponse.json(
        { error: 'Package ID is required' },
        { status: 400 }
      );
    }
    
    // Подготавливаем данные для обновления в БД
    const dbPackage: Record<string, any> = {};
    
    if (data.name !== undefined) dbPackage.name = data.name;
    if (data.description !== undefined) dbPackage.description = data.description;
    if (data.price !== undefined) dbPackage.price = data.price;
    if (data.depositAmount !== undefined) dbPackage.deposit_amount = data.depositAmount;
    if (data.duration !== undefined) dbPackage.duration = data.duration;
    if (data.maxPeople !== undefined) dbPackage.max_people = data.maxPeople;
    if (data.preferredRooms !== undefined) dbPackage.preferred_rooms = data.preferredRooms;
    if (data.isActive !== undefined) dbPackage.is_active = data.isActive;
    
    console.log(`Updating package with ID: ${data.id}`);
    
    // Обновляем данные в БД
    const { data: updatedData, error } = await supabase
      .from('packages')
      .update(dbPackage)
      .eq('id', data.id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating package:', error);
      return NextResponse.json({ error: 'Failed to update package' }, { status: 500 });
    }
    
    // Преобразуем данные из БД в формат приложения
    const updatedPackage: Package = {
      id: updatedData.id.toString(),
      name: updatedData.name,
      description: updatedData.description || '',
      price: updatedData.price,
      depositAmount: updatedData.deposit_amount || Math.round(updatedData.price * 0.3),
      duration: updatedData.duration,
      maxPeople: updatedData.max_people,
      preferredRooms: updatedData.preferred_rooms || []
    };
    
    return NextResponse.json(updatedPackage);
  } catch (error) {
    console.error('Exception updating package:', error);
    return NextResponse.json(
      { error: 'Failed to update package' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Package ID is required' },
        { status: 400 }
      );
    }
    
    console.log(`Deleting package with ID: ${id}`);
    
    // Удаляем запись из БД
    const { error } = await supabase
      .from('packages')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting package:', error);
      return NextResponse.json({ error: 'Failed to delete package' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Exception deleting package:', error);
    return NextResponse.json(
      { error: 'Failed to delete package' },
      { status: 500 }
    );
  }
} 