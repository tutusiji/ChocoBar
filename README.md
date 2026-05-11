# ChocoPanel

A lightweight Windows quick-launch panel built with Tauri (Rust + React). Double-tap `Alt` to instantly access your favorite applications.

## Features

- **Quick Toggle**: Double-tap `Alt` key to show/hide the panel
- **System Tray**: Runs in the background with a tray icon
- **App Discovery**: Automatically scans installed Windows applications
- **Search**: Quickly find and pin applications
- **Grid Layout**: Two layout modes - Sequential and Free Tile
- **Edit Mode**: Drag-and-drop to arrange your apps
- **Desktop Drop**: Drag app shortcuts from desktop into the panel (edit mode only)
- **Persistence**: Your pinned apps and layout are saved between sessions

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Tauri v2 |
| Backend | Rust |
| Frontend | React 18 + TypeScript |
| Bundler | Vite |
| State | Zustand |
| Drag & Drop | @dnd-kit |
| Icons | Lucide React |

## Getting Started

### Prerequisites

- Windows 10/11
- [Node.js](https://nodejs.org/) v18+
- [Rust](https://www.rust-lang.org/tools/install) (stable)
- [Tauri Prerequisites](https://v2.tauri.app/start/prerequisites/)

### Install

```bash
# Install frontend dependencies
npm install

# Run in development mode
npm run tauri dev

# Build for production
npm run tauri build
```

### Usage

1. Launch ChocoPanel - a tray icon appears in the system tray
2. Double-tap `Alt` or click the tray icon to show the panel
3. Click `+` to search and add applications
4. Toggle edit mode to rearrange apps via drag-and-drop
5. Press `Esc` or click the close button to hide the panel
6. Right-click the tray icon to exit completely

## Project Structure

```
ChocoPanel/
├── src/                    # React frontend
│   ├── components/         # UI components
│   ├── store/              # Zustand state management
│   ├── styles/             # CSS styles
│   ├── types/              # TypeScript types
│   └── utils/              # Utility functions
├── src-tauri/              # Rust backend
│   └── src/
│       ├── app_scanner.rs  # Windows app discovery
│       ├── commands.rs     # IPC commands
│       ├── tray.rs         # System tray
│       ├── shortcut.rs     # Global shortcut (double-tap Alt)
│       └── state.rs        # State persistence
└── docs/                   # Documentation
```

## License

MIT
