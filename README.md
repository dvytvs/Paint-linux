<div align="center">

<img src="build/icons/linux/icon.png" alt="Linux Paint Logo" width="200" height="200" />

# Linux Paint

**Кроссплатформенный графический редактор в стиле Windows 11 Paint**

**Cross-platform graphics editor inspired by Windows 11 Paint**

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](https://github.com)
[![Electron](https://img.shields.io/badge/Electron-40.8.0-47848F.svg?logo=electron)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-19.0.0-61DAFB.svg?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.2-3178C6.svg?logo=typescript)](https://www.typescriptlang.org/)

[English](#english) | [Русский](#русский)

</div>

---

## <a id="русский"></a>🇷 О Проекте (Russian)

**Linux Paint** — это современный графический редактор с открытым исходным кодом, созданный по мотивам классического приложения Paint из Windows 11. Приложение оптимизировано для работы на Linux и в веб-браузерах, предоставляя пользователям интуитивно понятный интерфейс и богатый набор инструментов для рисования и редактирования изображений.

### ✨ Особенности

#### 🎨 Инструменты рисования
- **Карандаш** — базовый инструмент для рисования
- **Кисть** — кисть с настраиваемым размером
- **Ластик** — стирание элементов
- **Заливка** — заполнение области цветом
- **Текст** — добавление текстовых элементов
- **Пипетка** — выбор цвета с холста
- **Лупа** — увеличение/уменьшение масштаба

#### 🖌️ Разнообразные кисти
- Каллиграфическая кисть
- Перьевая ручка
- Распылитель (Airbrush)
- Кисть для масляных красок
- Цветной карандаш (Crayon)
- Маркер
- Текстурный карандаш
- Кисть для акварели

#### 🔷 Фигуры
- Линия, Кривая Безье
- Прямоугольник, Скруглённый прямоугольник
- Круг, Эллипс
- Треугольник, Прямоугольный треугольник
- Ромб, Пятиугольник, Шестиугольник
- Многоугольник (произвольный)
- Стрелки (вправо, влево, вверх, вниз)
- Звёзды (4, 5, 6 лучей)
- Выноски (овальная, скруглённая, облако)
- Сердце, Молния

#### ✂️ Выделение и редактирование
- Прямоугольное выделение
- Произвольное выделение (Лассо)
- Перемещение и изменение размера выделенной области
- Поворот выделенного
- Отражение по горизонтали/вертикали
- Вырезать, Копировать, Вставить
- Обрезка (Crop)

#### 🖼️ Работа с изображением
- Изменение размера холста
- Поворот изображения
- Отражение изображения
- Инверсия цветов
- Очистка холста
- Линейки и линии сетки
- Миниатюра навигации

#### 📁 Файловые операции
- Создание нового файла
- Открытие файлов (PNG, JPG, GIF, WebP, BMP)
- Сохранение и Сохранение как
- Печать
- Установка как обои рабочего стола
- Поделиться изображением

#### ⌨️ Горячие клавиши
| Действие | Комбинация |
|----------|------------|
| Новый файл | Ctrl+N |
| Открыть | Ctrl+O |
| Сохранить | Ctrl+S |
| Свойства | Ctrl+E |
| Выделить всё | Ctrl+A |
| Копировать | Ctrl+C |
| Вырезать | Ctrl+X |
| Вставить | Ctrl+V |
| Отменить | Ctrl+Z |
| Повторить | Ctrl+Y / Ctrl+Shift+Z |
| Выход | Ctrl+Q |
| Очистить выделение | Ctrl+W |
| Обрезать | Ctrl+Shift+X |
| Линейки | Ctrl+R |
| Сетка | Ctrl+G |
| Полный экран | F11 |
| Увеличить | Ctrl++ |
| Уменьшить | Ctrl+- |

#### 🌐 Многоязычность
Поддержка 6 языков:
- 🇬🇧 English
- 🇷🇺 Русский
- 🇪 Español
- 🇷 Français
- 🇪 Deutsch
- 🇨🇳 中文

### 🛠️ Технологии

- **Frontend:** React 19, TypeScript, Tailwind CSS 4, Motion (анимации)
- **Desktop:** Electron 40, Vite 6
- **Icons:** Lucide React
- **Сборка:** electron-builder (AppImage, deb, snap, pacman, flatpak, tar.gz)

### 📋 Требования

- Node.js >= 18
- npm >= 9
- Linux (рекомендуется) или любая ОС с поддержкой Electron

### 🚀 Установка и запуск

```bash
# 1. Клонируйте репозиторий
git clone <repository-url>
cd linux-paint

# 2. Установите зависимости
npm install

# 3. Запуск в режиме разработки
npm run dev

# 4. Сборка приложения
npm run build

# 5. Сборка дистрибутивов для Linux
npm run dist
```

### 📦 Доступные пакеты

После выполнения `npm run dist` в папке `dist-electron/` будут созданы:
- `.AppImage` — портативная версия
- `.deb` — для Debian/Ubuntu
- `.snap` — для Snap Store
- `.pacman` — для Arch Linux
- `.flatpak` — для Flatpak
- `.tar.gz` — архив

### 📁 Структура проекта

```
linux-paint/
├── electron/           # Electron main процесс
│   ├── main.cjs       # Главный процесс Electron
│   └── preload.cjs    # Preload скрипт
├── src/               # Исходный код React
│   ├── components/    # React компоненты
│   │   ├── Toolbar.tsx
│   │   └── DrawingCanvas.tsx
│   ├── App.tsx        # Главный компонент
│   ├── i18n.ts        # Интернационализация
│   ├── types.ts       # TypeScript типы
│   ├── main.tsx       # Точка входа
│   └── index.css      # Глобальные стили
├── build/icons/       # Иконки приложения
│   └── linux/
│       └── icon.png
├── package.json       # Зависимости и скрипты
├── tsconfig.json      # Конфигурация TypeScript
├── vite.config.ts     # Конфигурация Vite
└── README.md          # Документация
```

### 🔧 Скрипты npm

| Команда | Описание |
|---------|----------|
| `npm run dev` | Запуск в режиме разработки |
| `npm run build` | Сборка production версии |
| `npm run preview` | Предпросмотр сборки |
| `npm run start` | Запуск Electron + Vite dev server |
| `npm run dist` | Сборка дистрибутивов |
| `npm run clean` | Очистка папки dist |
| `npm run lint` | Проверка TypeScript |

---

## <a id="english"></a>🇺🇸 About Project (English)

**Linux Paint** is a modern open-source graphics editor inspired by the classic Paint application from Windows 11. The application is optimized for Linux and web browsers, providing users with an intuitive interface and a rich set of tools for drawing and image editing.

### ✨ Features

#### 🎨 Drawing Tools
- **Pencil** — basic drawing tool
- **Brush** — brush with adjustable size
- **Eraser** — erase elements
- **Fill** — fill area with color
- **Text** — add text elements
- **Color Picker** — pick color from canvas
- **Magnifier** — zoom in/out

#### 🖌️ Various Brushes
- Calligraphy Brush
- Fountain Pen
- Airbrush
- Oil Brush
- Crayon
- Marker
- Texture Pencil
- Watercolor Brush

#### 🔷 Shapes
- Line, Bézier Curve
- Rectangle, Rounded Rectangle
- Circle, Ellipse
- Triangle, Right Triangle
- Diamond, Pentagon, Hexagon
- Polygon (custom)
- Arrows (right, left, up, down)
- Stars (4, 5, 6 points)
- Callouts (oval, rounded, cloud)
- Heart, Lightning

#### ✂️ Selection and Editing
- Rectangular selection
- Free-form selection (Lasso)
- Move and resize selection
- Rotate selection
- Flip horizontal/vertical
- Cut, Copy, Paste
- Crop

#### 🖼️ Image Operations
- Canvas resize
- Image rotation
- Image flip
- Color inversion
- Clear canvas
- Rulers and gridlines
- Thumbnail navigation

#### 📁 File Operations
- Create new file
- Open files (PNG, JPG, GIF, WebP, BMP)
- Save and Save As
- Print
- Set as desktop wallpaper
- Share image

#### ⌨️ Keyboard Shortcuts
| Action | Shortcut |
|--------|----------|
| New File | Ctrl+N |
| Open | Ctrl+O |
| Save | Ctrl+S |
| Properties | Ctrl+E |
| Select All | Ctrl+A |
| Copy | Ctrl+C |
| Cut | Ctrl+X |
| Paste | Ctrl+V |
| Undo | Ctrl+Z |
| Redo | Ctrl+Y / Ctrl+Shift+Z |
| Exit | Ctrl+Q |
| Clear Selection | Ctrl+W |
| Crop | Ctrl+Shift+X |
| Rulers | Ctrl+R |
| Gridlines | Ctrl+G |
| Fullscreen | F11 |
| Zoom In | Ctrl++ |
| Zoom Out | Ctrl+- |

#### 🌐 Internationalization
Support for 6 languages:
- 🇬 English
- 🇷🇺 Русский
- 🇪 Español
- 🇫 Français
- 🇩🇪 Deutsch
- 🇨 中文

### ️ Tech Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS 4, Motion (animations)
- **Desktop:** Electron 40, Vite 6
- **Icons:** Lucide React
- **Build:** electron-builder (AppImage, deb, snap, pacman, flatpak, tar.gz)

### 📋 Requirements

- Node.js >= 18
- npm >= 9
- Linux (recommended) or any OS with Electron support

### 🚀 Installation and Running

```bash
# 1. Clone the repository
git clone <repository-url>
cd linux-paint

# 2. Install dependencies
npm install

# 3. Run in development mode
npm run dev

# 4. Build the application
npm run build

# 5. Build distributions for Linux
npm run dist
```

### 📦 Available Packages

After running `npm run dist`, the following files will be created in `dist-electron/`:
- `.AppImage` — portable version
- `.deb` — for Debian/Ubuntu
- `.snap` — for Snap Store
- `.pacman` — for Arch Linux
- `.flatpak` — for Flatpak
- `.tar.gz` — archive

### 📁 Project Structure

```
linux-paint/
├── electron/           # Electron main process
│   ├── main.cjs       # Electron main process
│   └── preload.cjs    # Preload script
├── src/               # React source code
│   ├── components/    # React components
│   │   ├── Toolbar.tsx
│   │   └── DrawingCanvas.tsx
│   ├── App.tsx        # Main component
│   ├── i18n.ts        # Internationalization
│   ├── types.ts       # TypeScript types
│   ├── main.tsx       # Entry point
│   └── index.css      # Global styles
├── build/icons/       # Application icons
│   └── linux/
│       └── icon.png
├── package.json       # Dependencies and scripts
├── tsconfig.json      # TypeScript configuration
├── vite.config.ts     # Vite configuration
└── README.md          # Documentation
```

### 🔧 npm Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Run in development mode |
| `npm run build` | Build production version |
| `npm run preview` | Preview build |
| `npm run start` | Run Electron + Vite dev server |
| `npm run dist` | Build distributions |
| `npm run clean` | Clean dist folder |
| `npm run lint` | TypeScript check |

---

<div align="center">

### 📄 License / Лицензия

MIT License

**Linux Paint** — создано с ❤️ для Linux-сообщества

**Linux Paint** — made with ❤️ for the Linux community

</div>
