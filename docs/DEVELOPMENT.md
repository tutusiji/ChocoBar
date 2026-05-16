# ChocoBar Development Guide

## Architecture Overview

ChocoBar is a Tauri v2 application with a Rust backend and React frontend. The backend handles Windows system integration (app discovery, global shortcuts, system tray), while the frontend provides the UI.

## Tech Stack Details

### Backend (Rust)

| Crate | Purpose |
|-------|---------|
| `tauri` v2 | Application framework, window management, IPC |
| `tauri-plugin-global-shortcut` | Global keyboard shortcut registration |
| `winreg` | Windows Registry access for app discovery |
| `serde` / `serde_json` | JSON serialization for state persistence |
| `dirs` | Standard Windows directory paths |
| `sha2` | Hashing app paths for unique IDs |

### Frontend (React)

| Package | Purpose |
|---------|---------|
| `react` 18 | UI framework |
| `typescript` | Type safety |
| `vite` | Build tool / dev server |
| `zustand` | Lightweight state management |
| `@dnd-kit/core` + `@dnd-kit/sortable` | Drag-and-drop for app reordering |
| `lucide-react` | Icon library |

## Key Design Decisions

### Window Configuration

The panel window is configured as:
- **Always on top** - stays above other windows
- **Skip taskbar** - doesn't appear in taskbar
- **Decorations off** - custom title bar with close button
- **Transparent background** - glass-morphism effect
- **Size**: 800x500px, positioned at top-center of screen

### Double-Tap Alt Detection

Since Tauri's global shortcut API registers single shortcuts, we implement double-tap detection in Rust:

1. Register `Alt` as a global shortcut
2. On each press, check time since last press
3. If < 300ms, treat as double-tap -> toggle panel
4. Debounce to prevent rapid toggling

### App Discovery

Scans two sources:
1. **Windows Registry**: `HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall` and `HKCU` equivalent
2. **Start Menu**: `.lnk` files in `ProgramData\Microsoft\Windows\Start Menu` and user's Start Menu

Filters out:
- Entries without `DisplayName` or `InstallLocation`
- Windows system components (entries with "Microsoft Windows" in name)
- Updates and hotfixes
- Uninstallers

### State Persistence

App state is saved to `%APPDATA%/ChocoBar/state.json`:
```json
{
  "pinned_apps": [
    { "id": "abc123", "grid_x": 0, "grid_y": 0, "order": 0 }
  ],
  "layout_mode": "sequential",
  "grid_cols": 8,
  "grid_rows": 4
}
```

### Layout Modes

1. **Sequential**: Apps fill grid cells left-to-right, top-to-bottom. Dragging reorders the sequence. Grid positions are auto-calculated from order index.

2. **Free Tile**: Each app has explicit (x, y) grid coordinates. Dragging moves an app to a specific cell. Empty cells are allowed.

### Edit Mode

- Toggle via toolbar button (pencil icon)
- **ON**: Apps are draggable, delete buttons visible, desktop drop accepted
- **OFF**: Clicking an app launches it, layout is fixed

### Drag-and-Drop

Using `@dnd-kit`:
- `DndContext` wraps the grid
- `SortableContext` for sequential mode (reorder)
- Custom collision detection for free-tile mode
- `useDroppable` on each grid cell in free-tile mode
- `useDraggable` on each app icon

## IPC Commands (Rust -> React)

| Command | Description |
|---------|-------------|
| `get_installed_apps` | Returns all discovered applications |
| `search_apps(query)` | Filters apps by name |
| `launch_app(path)` | Executes an application |
| `get_state` | Returns persisted state |
| `save_state(state)` | Saves state to disk |
| `toggle_panel` | Shows/hides the panel window |

## Development Workflow

```bash
# Start dev server with hot reload
npm run tauri dev

# Type check frontend
npx tsc --noEmit

# Check Rust code
cd src-tauri && cargo check

# Build release
npm run tauri build
```

## File Responsibilities

### Rust

| File | Responsibility |
|------|---------------|
| `main.rs` | Entry point, Tauri app builder |
| `lib.rs` | Module declarations, plugin registration |
| `app_scanner.rs` | Registry + Start Menu scanning, app filtering |
| `commands.rs` | IPC command handlers |
| `tray.rs` | System tray icon and menu |
| `shortcut.rs` | Global shortcut registration, double-tap detection |
| `state.rs` | State struct, load/save to JSON |

### React

| File | Responsibility |
|------|---------------|
| `App.tsx` | Root component, panel visibility |
| `Panel.tsx` | Panel container with glass-morphism |
| `Toolbar.tsx` | Top bar: add, edit, layout, close buttons |
| `AppGrid.tsx` | Grid layout with DnD context |
| `AppIcon.tsx` | Single app icon with drag handle |
| `SearchModal.tsx` | Search overlay for finding apps |
| `useAppStore.ts` | Zustand store for all app state |
| `grid.ts` | Grid calculation utilities |
