import { useState, useCallback } from 'react';
import { Plus, PanelLeftClose, GripVertical } from 'lucide-react';
import type { CanvasMetadata } from '../protocol';
import type { CanvasSceneData } from '../lib/canvas-storage';
import { CanvasThumbnail } from './CanvasThumbnail';

// Same font family as Excalidraw UI
const UI_FONT = 'Assistant, system-ui, BlinkMacSystemFont, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif';

interface CanvasSidebarProps {
  canvases: CanvasMetadata[];
  activeCanvasId: string;
  scenes: Map<string, CanvasSceneData | null>;
  isDarkMode?: boolean;
  canvasBackgroundColor?: string;
  isCollapsed?: boolean;
  onToggleCollapsed?: () => void;
  onSelectCanvas: (canvasId: string) => void;
  onCreateCanvas: () => void;
  onRenameCanvas: (canvasId: string, newName: string) => void;
  onDeleteCanvas: (canvasId: string) => void;
}

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} hr ago`;
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  return new Date(timestamp).toLocaleDateString();
}

interface CanvasItemProps {
  canvas: CanvasMetadata;
  isActive: boolean;
  scene: CanvasSceneData | null;
  isDarkMode?: boolean;
  onSelect: () => void;
  onRename: (newName: string) => void;
  onDelete: () => void;
}

function CanvasItem({
  canvas,
  isActive,
  scene,
  isDarkMode,
  onSelect,
  onRename,
  onDelete,
}: CanvasItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(canvas.name);
  const [isHovered, setIsHovered] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleSubmitRename = useCallback(() => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== canvas.name) {
      onRename(trimmed);
    }
    setIsEditing(false);
  }, [editName, canvas.name, onRename]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmitRename();
    } else if (e.key === 'Escape') {
      setEditName(canvas.name);
      setIsEditing(false);
    }
  }, [handleSubmitRename, canvas.name]);

  const containerStyle: React.CSSProperties = {
    marginBottom: 8,
    borderRadius: 6,
    cursor: 'pointer',
    border: isActive ? '2px solid #6965db' : '2px solid transparent',
    backgroundColor: isDarkMode ? '#2d2d2d' : '#fff',
    overflow: 'hidden',
  };

  const contentStyle: React.CSSProperties = {
    padding: '6px 8px 8px',
  };

  const nameStyle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: isActive ? 600 : 400,
    color: isDarkMode ? '#e0e0e0' : '#333',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  const timeRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  };

  const timeStyle: React.CSSProperties = {
    fontSize: 11,
    color: isDarkMode ? '#888' : '#999',
  };

  const menuContainerStyle: React.CSSProperties = {
    position: 'relative',
  };

  const menuButtonStyle: React.CSSProperties = {
    width: 20,
    height: 16,
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    borderRadius: 3,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    color: isDarkMode ? '#888' : '#666',
    padding: 0,
  };

  const menuStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: '100%',
    right: 0,
    marginBottom: 4,
    backgroundColor: isDarkMode ? '#3d3d3d' : '#fff',
    border: `1px solid ${isDarkMode ? '#555' : '#ddd'}`,
    borderRadius: 4,
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    zIndex: 10,
    minWidth: 80,
  };

  const menuItemStyle: React.CSSProperties = {
    padding: '6px 12px',
    fontSize: 12,
    cursor: 'pointer',
    color: isDarkMode ? '#e0e0e0' : '#333',
    whiteSpace: 'nowrap',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    fontSize: 13,
    padding: '2px 4px',
    border: `1px solid ${isDarkMode ? '#555' : '#ccc'}`,
    borderRadius: 3,
    backgroundColor: isDarkMode ? '#1e1e1e' : '#fff',
    color: isDarkMode ? '#e0e0e0' : '#333',
    outline: 'none',
    fontFamily: UI_FONT,
  };

  return (
    <div
      style={containerStyle}
      onClick={() => !isEditing && onSelect()}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setShowMenu(false); }}
    >
      <CanvasThumbnail
        scene={scene}
        isDarkMode={isDarkMode}
      />

      <div style={contentStyle}>
        {isEditing ? (
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleSubmitRename}
            onKeyDown={handleKeyDown}
            style={inputStyle}
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <div style={nameStyle}>{canvas.name}</div>
        )}

        <div style={timeRowStyle}>
        <span style={timeStyle}>{formatRelativeTime(canvas.updatedAt)}</span>
        {!isEditing && (
          <div style={{ ...menuContainerStyle, visibility: (isHovered || showMenu) ? 'visible' : 'hidden' }}>
            <button
              style={menuButtonStyle}
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
            >
              ···
            </button>
            {showMenu && (
              <div style={menuStyle} onClick={(e) => e.stopPropagation()}>
                <div
                  style={menuItemStyle}
                  onClick={() => {
                    setEditName(canvas.name);
                    setIsEditing(true);
                    setShowMenu(false);
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = isDarkMode ? '#4d4d4d' : '#f0f0f0';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  Rename
                </div>
                <div
                  style={{ ...menuItemStyle, color: '#e74c3c' }}
                  onClick={() => {
                    setShowMenu(false);
                    onDelete();
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = isDarkMode ? '#4d4d4d' : '#f0f0f0';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  Delete
                </div>
              </div>
            )}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

export function CanvasSidebar({
  canvases,
  activeCanvasId,
  scenes,
  isDarkMode,
  canvasBackgroundColor,
  isCollapsed = false,
  onToggleCollapsed,
  onSelectCanvas,
  onCreateCanvas,
  onRenameCanvas,
  onDeleteCanvas,
}: CanvasSidebarProps) {
  // Sort canvases by name alphabetically
  const sortedCanvases = [...canvases].sort((a, b) => a.name.localeCompare(b.name));

  // Excalidraw applies CSS filter in dark mode: invert(93%) hue-rotate(180deg)
  // So we use raw viewBackgroundColor + filter for consistency
  const THEME_FILTER = 'invert(93%) hue-rotate(180deg)';
  const sidebarBg = isDarkMode ? '#1e1e1e' : '#f8f8f8';

  const sidebarStyle: React.CSSProperties = {
    width: isCollapsed ? 12 : 200,
    height: '100%',
    backgroundColor: isCollapsed ? (canvasBackgroundColor || '#ffffff') : sidebarBg,
    borderRight: isCollapsed ? 'none' : `1px solid ${isDarkMode ? '#333' : '#e0e0e0'}`,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    transition: 'width 0.2s ease',
    fontFamily: UI_FONT,
    ...(isCollapsed && {
      justifyContent: 'center',
      alignItems: 'center',
      cursor: 'pointer',
      filter: isDarkMode ? THEME_FILTER : 'none',
    }),
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 12px',
    borderBottom: `1px solid ${isDarkMode ? '#333' : '#e0e0e0'}`,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 600,
    color: isDarkMode ? '#e0e0e0' : '#333',
  };

  const buttonStyle: React.CSSProperties = {
    width: 24,
    height: 24,
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    borderRadius: 4,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 16,
    color: isDarkMode ? '#888' : '#666',
  };

  const listStyle: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    padding: isCollapsed ? 0 : 8,
  };

  const iconSize = 16;

  if (isCollapsed) {
    return (
      <div
        style={sidebarStyle}
        onClick={onToggleCollapsed}
        title="Expand sidebar"
      >
        <GripVertical size={14} color={isDarkMode ? '#666' : '#999'} />
      </div>
    );
  }

  return (
    <div style={sidebarStyle}>
      <div style={headerStyle}>
        <span style={titleStyle}>Canvases</span>
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            style={buttonStyle}
            onClick={onCreateCanvas}
            title="New canvas"
          >
            <Plus size={iconSize} />
          </button>
          <button
            style={buttonStyle}
            onClick={onToggleCollapsed}
            title="Collapse sidebar"
          >
            <PanelLeftClose size={iconSize} />
          </button>
        </div>
      </div>

      <div style={listStyle}>
        {sortedCanvases.map((canvas) => (
          <CanvasItem
            key={canvas.id}
            canvas={canvas}
            isActive={canvas.id === activeCanvasId}
            scene={scenes.get(canvas.id) || null}
            isDarkMode={isDarkMode}
            onSelect={() => onSelectCanvas(canvas.id)}
            onRename={(newName) => onRenameCanvas(canvas.id, newName)}
            onDelete={() => onDeleteCanvas(canvas.id)}
          />
        ))}
      </div>
    </div>
  );
}
