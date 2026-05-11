# ChocoPanel

A lightweight Windows quick-launch panel built with Tauri v2 (Rust + React). Double-tap `Ctrl` to instantly access your favorite applications from a top-level floating panel.

## Features

- **Quick Toggle**: Double-tap shortcut key (default `Ctrl+Space`) to show/hide the panel
- **System Tray**: Background tray icon with right-click menu (Settings, About, Check for Updates, Exit)
- **App Discovery**: Automatically scans installed Windows applications from registry and Start Menu
- **Search**: Quickly find and pin applications by keyword
- **Grid Layout**: Two layout modes - Sequential and Free Tile
- **Edit Mode**: Drag-and-drop to arrange app icons, drag window edges to resize (glowing border)
- **Desktop Drop**: Drag `.exe` / `.lnk` files from desktop into the panel (edit mode only)
- **Customizable Settings**: Window size, opacity slider (real-time), background image upload with fill modes
- **Custom Shortcut**: Record any keyboard combination as the panel toggle shortcut
- **Persistence**: All settings are automatically saved between sessions

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Tauri v2 |
| Backend | Rust (edition 2021) |
| Frontend | React 18 + TypeScript |
| Bundler | Vite 6 |
| State | Zustand 5 |
| Drag & Drop | Native HTML5 Drag API |
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

1. Launch ChocoPanel - a tray icon appears in the system tray
2. Double-tap `Ctrl` (or custom shortcut) to show the panel
3. Click "Add" to search and pin applications
4. Click "Edit" to enter edit mode - drag icons to rearrange, drag window edges to resize
5. Press `Esc` or click the close button to hide the panel
6. Right-click the tray icon for Settings, About, Check for Updates, or Exit

## License

MIT
