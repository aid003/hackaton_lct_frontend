import { NextRequest, NextResponse } from 'next/server';

// Конфигурация для загрузки больших файлов
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '100gb', // 100 ГБ
    },
    responseLimit: false,
  },
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'Файл не предоставлен' },
        { status: 400 }
      );
    }

    // Проверяем размер файла (100 ГБ = 100 * 1024 * 1024 * 1024 байт)
    const maxSize = 100 * 1024 * 1024 * 1024; // 100 ГБ в байтах
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `Размер файла превышает лимит в 100 ГБ. Размер файла: ${(file.size / (1024 * 1024 * 1024)).toFixed(2)} ГБ` },
        { status: 413 }
      );
    }

    // Здесь можно добавить логику обработки файла
    // Например, сохранение в файловую систему или отправка в бэкенд
    
    return NextResponse.json({
      success: true,
      message: 'Файл успешно загружен',
      fileInfo: {
        name: file.name,
        size: file.size,
        type: file.type,
        sizeInGB: (file.size / (1024 * 1024 * 1024)).toFixed(2)
      }
    });

  } catch (error) {
    console.error('Ошибка загрузки файла:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера при загрузке файла' },
      { status: 500 }
    );
  }
}
