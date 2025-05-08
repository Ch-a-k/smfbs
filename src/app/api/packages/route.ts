import { NextRequest, NextResponse } from 'next/server';
import { Package } from '@/types/booking';
import { 
  getAllPackages, 
  getPackageById, 
  createPackage, 
  updatePackage, 
  deletePackage 
} from '@/lib/mock-api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Получение конкретного пакета по ID
    if (id) {
      const pkg = await getPackageById(id);
      if (!pkg) {
        return NextResponse.json({ error: 'Пакет не найден' }, { status: 404 });
      }
      return NextResponse.json(pkg);
    }

    // Получение всех пакетов
    const packages = await getAllPackages();
    return NextResponse.json(packages);
  } catch (error: any) {
    console.error('Ошибка при получении пакетов:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const packageData: Package = await request.json();
    
    // Проверка наличия обязательных полей
    if (!packageData.id || !packageData.name || packageData.price === undefined) {
      return NextResponse.json(
        { error: 'Отсутствуют обязательные поля: id, name, price' },
        { status: 400 }
      );
    }
    
    const newPackage = await createPackage(packageData);
    return NextResponse.json(newPackage, { status: 201 });
  } catch (error: any) {
    console.error('Ошибка при создании пакета:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID пакета не указан' }, { status: 400 });
    }
    
    const packageId = id;
    const pkg = await getPackageById(packageId);
    
    if (!pkg) {
      return NextResponse.json({ error: 'Пакет не найден' }, { status: 404 });
    }
    
    const updateData = await request.json();
    const updatedPackage = await updatePackage(packageId, updateData);
    
    return NextResponse.json(updatedPackage);
  } catch (error: any) {
    console.error('Ошибка при обновлении пакета:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID пакета не указан' }, { status: 400 });
    }
    
    const packageId = id;
    const pkg = await getPackageById(packageId);
    
    if (!pkg) {
      return NextResponse.json({ error: 'Пакет не найден' }, { status: 404 });
    }
    
    const success = await deletePackage(packageId);
    
    if (success) {
      return NextResponse.json({ success: true, message: 'Пакет успешно удален' });
    } else {
      return NextResponse.json(
        { error: 'Произошла ошибка при удалении пакета' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Ошибка при удалении пакета:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 