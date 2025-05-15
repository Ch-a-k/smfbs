# Используем официальный образ Node.js
FROM node:18-alpine

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем файлы зависимостей
COPY package.json package-lock.json* ./

# Устанавливаем зависимости
RUN npm install

# Копируем все файлы проекта
COPY . .

# Указываем порт
EXPOSE 3000

# Команда для запуска приложения
CMD ["npm", "run", "dev"]