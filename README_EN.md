# ChocoBar

![ChocoBar](banner01.png)

A lightweight Windows quick-launch panel built with Tauri v2 (Rust + React). Press `Ctrl + Space` to show the panel, press again to hide, or press `Esc` to hide.

> **[Download ChocoBar v0.1.0](https://tuziki.com/demo/chocobar/ChocoBar_0.1.0.exe)**

## Features

- **Quick Toggle**: Press `Ctrl + Space` to show the panel, press again to hide, or press `Esc` to hide
- **Custom Shortcut**: Record any keyboard combination as the panel toggle shortcut in Settings
- **System Tray**: Background tray icon with right-click menu (Settings, About, Check for Updates, Exit)
- **App Discovery**: Automatically scans installed Windows applications from registry and Start Menu
- **Search**: Quickly find and pin applications by keyword
- **Grid Layout**: Two layout modes - Sequential and Free Tile
- **Edit Mode**: Drag-and-drop to arrange app icons, drag window edges to resize
- **Desktop Drop**: Drag `.exe` / `.lnk` files from desktop into the panel (edit mode only)
- **Custom Background**: Upload images as panel background with stretch, tile, or center fill modes, adjustable Gaussian blur and opacity
- **Persistence**: All settings are automatically saved between sessions

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Tauri v2 |
| Backend | Rust (edition 2021) |
| Frontend | React 18 + TypeScript |
| Bundler | Vite 6 |
| State | Zustand 5 |
| Drag & Drop | Mouse event custom drag |
| Icons | Lucide React |

## Getting Started

### Prerequisites

- Windows 10/11
- [Node.js](https://nodejs.org/) v18+
- [Rust](https://www.rust-lang.org/tools/install) (stable)
- [Tauri Prerequisites](https://v2.tauri.app/start/prerequisites/)

### Install & Run

```bash
# Install frontend dependencies
npm install

# Run in development mode (with hot reload)
npm run tauri dev

# Build for production
npm run tauri build
```

### Usage

1. Launch ChocoBar - a tray icon appears in the system tray
2. Press `Ctrl + Space` (or custom shortcut) to show the panel, press again to hide
3. Click "Add" to search and pin applications
4. Click "Edit" to enter edit mode - drag icons to rearrange, drag window edges to resize
5. Press `Esc` or click the close button to hide the panel
6. Right-click the tray icon for Settings, About, Check for Updates, or Exit

## License

MIT
