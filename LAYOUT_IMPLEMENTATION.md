# Maverick Client - Layout Implementation

## Overview
Implemented a professional 4-panel layout with menu system, collapsible panels, and resizable sections for the Maverick Client broadcast playout controller.

## Components Created

### 1. Menu System (`src/renderer/src/components/Menu.tsx`)
- **File Menu**
  - Settings (Ctrl+,)
  - Exit (Alt+F4)
- **Help Menu**
  - Documentation (F1)
  - About
- Keyboard shortcuts fully implemented
- Dropdown menus with hover states

### 2. Layout Store (`src/renderer/src/stores/layoutStore.ts`)
- Zustand store for persistent layout state
- Tracks panel sizes and collapse states
- Survives app restarts via localStorage
- State includes:
  - `panelSizes`: Left column and top-right proportions
  - `collapsedPanels`: Individual panel collapse states

### 3. Collapsible Panels (`src/renderer/src/components/CollapsiblePanel.tsx`)
- Reusable panel component with collapse/expand functionality
- Collapsed state shows vertical tab with rotated text
- Header with title and collapse button
- Smooth transitions and hover effects

### 4. Panel Components
- **TemplatesPanel** - Templates list (top-left)
- **ElementsPanel** - Elements/pages list (bottom-left)
- **FieldEditorPanel** - Tag/field editor (top-right)
- **PreviewPanel** - Preview display (bottom-right)

### 5. Main Layout (`src/renderer/src/components/Layout.tsx`)
- Uses `react-resizable-panels` for smooth dragging
- 2-column layout with vertical splits
- Resizable handles with hover effects
- Default sizes: 30% left, 70% right; 50/50 vertical splits
- Min/max constraints to prevent over-collapsing

## Features

### Resizable Panels
- Drag handles between all panels
- Smooth animations
- Min/max size constraints
- Persistent sizing via Zustand store

### Collapsible Panels
- Click header button to collapse/expand
- Collapsed panels show as vertical tabs
- Individual collapse state persistence
- Smooth transitions

### Menu System
- Keyboard shortcuts fully functional
- Dropdown menus with proper styling
- Click-outside to close menus
- Dark theme with zinc color palette

## File Structure
```
src/renderer/src/
├── components/
│   ├── Menu.tsx
│   ├── Layout.tsx
│   ├── CollapsiblePanel.tsx
│   ├── TemplatesPanel.tsx
│   ├── ElementsPanel.tsx
│   ├── FieldEditorPanel.tsx
│   └── PreviewPanel.tsx
├── stores/
│   └── layoutStore.ts
└── App.tsx (updated)
```

## Dependencies Added
- `react-resizable-panels@^2.1.7` - For smooth panel resizing

## Usage

The layout is automatically integrated into the app. Users can:
1. Drag panel dividers to resize sections
2. Click collapse buttons to hide panels
3. Use keyboard shortcuts for menu access
4. All layout preferences persist across sessions

## Styling
- Dark theme using Tailwind zinc palette
- Hover effects on interactive elements
- Smooth transitions and animations
- Professional broadcast-grade appearance
