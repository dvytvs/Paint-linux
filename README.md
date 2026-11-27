


<div align="center">

<img width="512" height="512" alt="icon" src="https://github.com/user-attachments/assets/45b04c93-e6c6-48bd-b9a2-0af8f62554ed" />


# Linux Paint

**Кроссплатформенный графический редактор в стиле Windows 11 Paint**

**Cross-platform graphics editor inspired by Windows 11 Paint**

[![Version](https://img.shields.io/badge/version-1.3.0-blue.svg)](https://github.com/dvytvs/Paint-linux)
[![License](https://img.shields.io/badge/license-GPL--3.0-green.svg)](./LICENSE)
[![Electron](https://img.shields.io/badge/Electron-42.5.0-47848F.svg?logo=electron)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-19.0.0-61DAFB.svg?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.2-3178C6.svg?logo=typescript)](https://www.typescriptlang.org/)

[English](#english) | [Русский](#русский)

**Автор / Author:** [dvytvs](https://github.com/dvytvs) · **Репозиторий / Repository:** [github.com/dvytvs/Paint-linux](https://github.com/dvytvs/Paint-linux) · **Лицензия / License:** GPL-3.0

</div>

---

## 🆕 Что нового в 1.3.0 / What's new in 1.3.0

- 🖥️ Нативный **Wayland без XWayland** (поддержка X11 сохранена) — *native Wayland backend, X11 still supported*
- 🔍 **Зум до 1600%** — *zoom up to 1600%*
- 🧱 Тумблер **«Резкие пиксели»** (без сглаживания при увеличении) — *crisp pixels / no smoothing*
- 🖌️ Удобная **толщина кисти**: пресеты + числовое поле, до 100 px — *brush size presets + numeric input*
- 🖼️ Меню **«Изображение»**: поворот 90°/180°/270°, отражение всего изображения, инверсия цветов — *Image menu with rotate/flip/invert*
- 💾 **«Сохранить как»** пишет настоящий PNG/JPEG/WebP/BMP (раньше всегда сохранялся PNG) — *real format conversion*
- 🪟 **«По размеру окна»** — *fit to window*
- 🐞 Палитра больше не превращается в градиент при выборе цвета; ползунок размера кисти не уезжает при прокрутке; ручки выделения не перекрывают маленькие выделения
- ℹ️ Окно **«О программе»** (Справка → О программе Paint) — *About dialog*
- 📦 Отдельные команды сборки под каждый формат пакета — *per-format build scripts*
- 🐞 Исправлены: стрелки двигают выделение, контекстное меню при зуме, прозрачное выделение
- 📜 Лицензия: **GPL-3.0-only** с обязательным сохранением указания автора (см. [`NOTICE`](./NOTICE))

---

## <a id="русский"></a>🇷 О Проекте (Russian)

**Linux Paint** — это современный графический редактор с открытым исходным кодом, созданный по мотивам классического приложения Paint из Windows 11. Приложение оптимизировано для работы на Linux и в веб-браузерах, предоставляя пользователям интуитивно понятный интерфейс и богатый набор инструментов для рисования и редактирования изображений.

<img width="2560" height="1396" alt="изображение" src="https://github.com/user-attachments/assets/9f0cc922-11e0-4905-96e3-b2024217306a" />


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
- **Desktop:** Electron 42, Vite 6
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

**Про иконки и `dist-electron`:** исходники иконок приложения лежат в `build/icons/linux/`
(они коммитятся в репозиторий). Папка `dist-electron/` — это результат сборки
(пакеты, `linux-unpacked/` и автоматически сгенерированный `dist-electron/.icon-set`),
поэтому она целиком в `.gitignore`. `.icon-set` не нужно хранить в git — electron-builder
создаёт его из `build/icons/linux/` при сборке пакетов.

### 🖥️ Wayland и X11

Приложение автоматически определяет графическую сессию:

- **Wayland** (`XDG_SESSION_TYPE=wayland` или задан `WAYLAND_DISPLAY`) — запускается на нативном Wayland-бэкенде, **без XWayland**, с включённым Wayland IME (корректный ввод текста в инструменте «Текст», в том числе CJK).
- **X11** — используется обычный X11-бэкенд, поддержка сохранена.

Бэкенд можно выбрать принудительно (переменная окружения или флаг командной строки):

```bash
# Нативный Wayland
ELECTRON_OZONE_PLATFORM_HINT=wayland npm start
# X11 / XWayland
ELECTRON_OZONE_PLATFORM_HINT=x11 npm start

# Для собранного приложения можно так:
./Paint-1.2.0.AppImage --ozone-platform=wayland
```

Проверить, какой бэкенд выбран, можно так (в консоль печатается строка `[paint] display backend: ...`):

```bash
PAINT_DEBUG_DISPLAY=1 npm start
```

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
| `npm run dist` | Сборка **всех** дистрибутивов |
| `npm run dist:appimage` | Только `.AppImage` |
| `npm run dist:deb` | Только `.deb` (Debian/Ubuntu) |
| `npm run dist:rpm` | Только `.rpm` (Fedora/openSUSE) |
| `npm run dist:snap` | Только `.snap` |
| `npm run dist:pacman` | Только `.pacman` (Arch) |
| `npm run dist:flatpak` | Только `.flatpak` |
| `npm run dist:tar` | Только `.tar.gz` |
| `npm run dist:dir` | Неупакованная сборка (`linux-unpacked/`, для быстрой проверки) |
| `npm run dist:rpm:docker` | `.rpm` в Docker-контейнере |
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
- **Desktop:** Electron 42, Vite 6
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

**About icons and `dist-electron`:** the application icon sources live in `build/icons/linux/`
(they are committed to the repository). `dist-electron/` is build output (packages,
`linux-unpacked/` and the generated `dist-electron/.icon-set`), so it is fully git-ignored.
`.icon-set` does not need to be committed — electron-builder generates it from
`build/icons/linux/` when packaging.

### 🖥️ Wayland and X11

The app detects the graphical session automatically:

- **Wayland** (`XDG_SESSION_TYPE=wayland` or `WAYLAND_DISPLAY` is set) — runs on the native Wayland backend, **without XWayland**, with Wayland IME enabled (proper text input in the Text tool, including CJK).
- **X11** — keeps using the regular X11 backend, support is preserved.

The backend can be forced via an environment variable or a command line flag:

```bash
# Native Wayland
ELECTRON_OZONE_PLATFORM_HINT=wayland npm start
# X11 / XWayland
ELECTRON_OZONE_PLATFORM_HINT=x11 npm start

# For a packaged build:
./Paint-1.2.0.AppImage --ozone-platform=wayland
```

To see which backend was picked (prints `[paint] display backend: ...`):

```bash
PAINT_DEBUG_DISPLAY=1 npm start
```

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
| `npm run dist` | Build **all** distributions |
| `npm run dist:appimage` | `.AppImage` only |
| `npm run dist:deb` | `.deb` only (Debian/Ubuntu) |
| `npm run dist:rpm` | `.rpm` only (Fedora/openSUSE) |
| `npm run dist:snap` | `.snap` only |
| `npm run dist:pacman` | `.pacman` only (Arch) |
| `npm run dist:flatpak` | `.flatpak` only |
| `npm run dist:tar` | `.tar.gz` only |
| `npm run dist:dir` | Unpacked build (`linux-unpacked/`, quick check) |
| `npm run dist:rpm:docker` | `.rpm` inside a Docker container |
| `npm run clean` | Clean dist folder |
| `npm run lint` | TypeScript check |

---

<div align="center">

### 📄 License / Лицензия

Проект распространяется под **GNU General Public License v3.0** (SPDX: `GPL-3.0-only`):

- [`LICENSE`](./LICENSE) — полный текст GNU GPL v3.0
- [`NOTICE`](./NOTICE) — уведомление об авторстве. Согласно §7(b) GPL v3.0 **упоминание автора (`dvytvs`) обязательно сохраняется** при распространении проекта, изменённых версий и производных работ.

The project is licensed under the **GNU GPL v3.0**; author attribution (`dvytvs`) must be preserved — see [`NOTICE`](./NOTICE).

**Автор / Author:** [dvytvs](https://github.com/dvytvs) · **Репозиторий / Repository:** [github.com/dvytvs/Paint-linux](https://github.com/dvytvs/Paint-linux)

**Linux Paint** — создано с ❤️ для Linux-сообщества

**Linux Paint** — made with ❤️ for the Linux community

</div>
