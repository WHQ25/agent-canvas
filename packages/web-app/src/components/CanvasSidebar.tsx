import { useState, useCallback } from 'react';
import { Plus, PanelLeftClose, GripVertical, Bot, ChevronRight, ChevronDown, FolderPlus } from 'lucide-react';
import type { CanvasMetadata, CanvasCategory } from '../protocol';
import type { CanvasSceneData } from '../lib/canvas-storage';
import { CanvasThumbnail } from './CanvasThumbnail';

// Same font family as Excalidraw UI
const UI_FONT = 'Assistant, system-ui, BlinkMacSystemFont, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif';

interface CanvasSidebarProps {
  canvases: CanvasMetadata[];
  activeCanvasId: string;
  agentActiveCanvasId: string | null;
  scenes: Map<string, CanvasSceneData | null>;
  categories?: CanvasCategory[];
  canvasCategoryMap?: Record<string, string>;
  isDarkMode?: boolean;
  canvasBackgroundColor?: string;
  isCollapsed?: boolean;
  onToggleCollapsed?: () => void;
  onSelectCanvas: (canvasId: string) => void;
  onCreateCanvas: () => void;
  onRenameCanvas: (canvasId: string, newName: string) => void;
  onDeleteCanvas: (canvasId: string) => void;
  onCreateCategory?: () => void;
  onRenameCategory?: (categoryId: string, newName: string) => void;
  onDeleteCategory?: (categoryId: string) => void;
  onToggleCategoryCollapse?: (categoryId: string) => void;
  onMoveCanvasToCategory?: (canvasId: string, categoryId: string | null) => void;
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
  isAgentActive: boolean;
  scene: CanvasSceneData | null;
  isDarkMode?: boolean;
  draggable?: boolean;
  onSelect: () => void;
  onRename: (newName: string) => void;
  onDelete: () => void;
  onRemoveFromCategory?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
}

function CanvasItem({
  canvas,
  isActive,
  isAgentActive,
  scene,
  isDarkMode,
  draggable,
  onSelect,
  onRename,
  onDelete,
  onRemoveFromCategory,
  onDragStart,
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

  // Border color: purple for user-active canvas, subtle gray for inactive in light mode
  const borderColor = isActive ? '#6965db' : (isDarkMode ? 'transparent' : '#e0e0e0');

  const containerStyle: React.CSSProperties = {
    marginBottom: 8,
    borderRadius: 6,
    cursor: 'pointer',
    border: `1px solid ${borderColor}`,
    backgroundColor: isDarkMode ? '#2d2d2d' : '#fff',
    overflow: 'hidden',
    position: 'relative',
  };

  const contentStyle: React.CSSProperties = {
    padding: '6px 8px 8px',
    borderTop: isDarkMode ? 'none' : '1px solid #eee',
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
      draggable={draggable && !isEditing}
      onDragStart={(e) => {
        if (isEditing) { e.preventDefault(); return; }
        onDragStart?.(e);
      }}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {isAgentActive && <Bot size={12} color="#40c057" />}
          <span style={timeStyle}>{formatRelativeTime(canvas.updatedAt)}</span>
        </div>
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
                {onRemoveFromCategory && (
                  <div
                    style={menuItemStyle}
                    onClick={() => {
                      setShowMenu(false);
                      onRemoveFromCategory();
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = isDarkMode ? '#4d4d4d' : '#f0f0f0';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    Ungroup
                  </div>
                )}
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

// ============================================================================
// CategoryHeader Component
// ============================================================================

interface CategoryHeaderProps {
  category: CanvasCategory;
  canvasCount: number;
  showAgentIcon: boolean;
  isDarkMode?: boolean;
  isDragOver: boolean;
  onToggleCollapse: () => void;
  onRename: (newName: string) => void;
  onDelete: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
}

function CategoryHeader({
  category,
  canvasCount,
  showAgentIcon,
  isDarkMode,
  isDragOver,
  onToggleCollapse,
  onRename,
  onDelete,
  onDragOver,
  onDragLeave,
  onDrop,
}: CategoryHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(category.name);
  const [showMenu, setShowMenu] = useState(false);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleSubmitRename = useCallback(() => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== category.name) {
      onRename(trimmed);
    }
    setIsEditing(false);
  }, [editName, category.name, onRename]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmitRename();
    } else if (e.key === 'Escape') {
      setEditName(category.name);
      setIsEditing(false);
    }
  }, [handleSubmitRename, category.name]);

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    padding: '6px 4px',
    cursor: 'pointer',
    borderRadius: 4,
    backgroundColor: isDragOver
      ? (isDarkMode ? '#3a3a5c' : '#e8e7f8')
      : 'transparent',
    transition: 'background-color 0.15s ease',
    userSelect: 'none',
  };

  const chevronStyle: React.CSSProperties = {
    flexShrink: 0,
    color: isDarkMode ? '#888' : '#666',
  };

  const nameStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: isDarkMode ? '#bbb' : '#555',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  const countStyle: React.CSSProperties = {
    fontSize: 10,
    color: isDarkMode ? '#999' : '#777',
    backgroundColor: isDarkMode ? '#3a3a3a' : '#e8e8e8',
    borderRadius: 8,
    padding: '0 5px',
    lineHeight: '16px',
    marginLeft: 4,
    flexShrink: 0,
  };

  const menuStyle: React.CSSProperties = {
    position: 'fixed',
    top: menuPos.y,
    left: menuPos.x,
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
    flex: 1,
    fontSize: 12,
    padding: '1px 4px',
    border: `1px solid ${isDarkMode ? '#555' : '#ccc'}`,
    borderRadius: 3,
    backgroundColor: isDarkMode ? '#1e1e1e' : '#fff',
    color: isDarkMode ? '#e0e0e0' : '#333',
    outline: 'none',
    fontFamily: UI_FONT,
    fontWeight: 600,
  };

  return (
    <div
      style={{ marginTop: 4, marginBottom: 2 }}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div
        style={headerStyle}
        onClick={() => !isEditing && onToggleCollapse()}
        onContextMenu={(e) => {
          if (isEditing) return;
          e.preventDefault();
          setMenuPos({ x: e.clientX, y: e.clientY });
          setShowMenu(true);
        }}
      >
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', overflow: 'hidden', minWidth: 0 }}>
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
            <>
              <span style={nameStyle}>{category.name}</span>
              <span style={countStyle}>{canvasCount}</span>
            </>
          )}
        </div>
        {category.isCollapsed && showAgentIcon && (
          <Bot size={12} color="#40c057" style={{ flexShrink: 0, marginLeft: 4 }} />
        )}
        <span style={chevronStyle}>
          {category.isCollapsed
            ? <ChevronRight size={14} />
            : <ChevronDown size={14} />
          }
        </span>
      </div>
      {showMenu && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 9 }}
            onClick={() => setShowMenu(false)}
            onContextMenu={(e) => { e.preventDefault(); setShowMenu(false); }}
          />
          <div style={menuStyle} onClick={(e) => e.stopPropagation()}>
            <div
              style={menuItemStyle}
              onClick={() => {
                setEditName(category.name);
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
        </>
      )}
    </div>
  );
}

// ============================================================================
// UncategorizedHeader Component (simplified, no menu)
// ============================================================================

interface UncategorizedHeaderProps {
  canvasCount: number;
  isCollapsed: boolean;
  showAgentIcon: boolean;
  isDarkMode?: boolean;
  isDragOver: boolean;
  onToggleCollapse: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
}

function UncategorizedHeader({
  canvasCount,
  isCollapsed,
  showAgentIcon,
  isDarkMode,
  isDragOver,
  onToggleCollapse,
  onDragOver,
  onDragLeave,
  onDrop,
}: UncategorizedHeaderProps) {
  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    padding: '6px 4px',
    cursor: 'pointer',
    borderRadius: 4,
    backgroundColor: isDragOver
      ? (isDarkMode ? '#3a3a5c' : '#e8e7f8')
      : 'transparent',
    transition: 'background-color 0.15s ease',
    userSelect: 'none',
    marginTop: 4,
    marginBottom: 2,
  };

  return (
    <div
      style={headerStyle}
      onClick={onToggleCollapse}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', overflow: 'hidden', minWidth: 0 }}>
        <span style={{
          fontSize: 12,
          fontWeight: 600,
          color: isDarkMode ? '#777' : '#888',
          fontStyle: 'italic',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          Ungrouped
        </span>
        <span style={{
          fontSize: 10,
          color: isDarkMode ? '#999' : '#777',
          backgroundColor: isDarkMode ? '#3a3a3a' : '#e8e8e8',
          borderRadius: 8,
          padding: '0 5px',
          lineHeight: '16px',
          marginLeft: 4,
          flexShrink: 0,
        }}>
          {canvasCount}
        </span>
      </div>
      {isCollapsed && showAgentIcon && (
        <Bot size={12} color="#40c057" style={{ flexShrink: 0, marginLeft: 4 }} />
      )}
      <span style={{ flexShrink: 0, color: isDarkMode ? '#888' : '#666' }}>
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
      </span>
    </div>
  );
}

// ============================================================================
// CanvasSidebar Component
// ============================================================================

export function CanvasSidebar({
  canvases,
  activeCanvasId,
  agentActiveCanvasId,
  scenes,
  categories,
  canvasCategoryMap,
  isDarkMode,
  canvasBackgroundColor,
  isCollapsed = false,
  onToggleCollapsed,
  onSelectCanvas,
  onCreateCanvas,
  onRenameCanvas,
  onDeleteCanvas,
  onCreateCategory,
  onRenameCategory,
  onDeleteCategory,
  onToggleCategoryCollapse,
  onMoveCanvasToCategory,
}: CanvasSidebarProps) {
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null); // categoryId or '__uncategorized__'
  const [uncategorizedCollapsed, setUncategorizedCollapsed] = useState(false);

  const hasCategories = categories && categories.length > 0;

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

  // Drag-and-drop handlers
  const handleCanvasDragStart = useCallback((e: React.DragEvent, canvasId: string) => {
    e.dataTransfer.setData('text/plain', canvasId);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleCategoryDragOver = useCallback((e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverTarget(targetId);
  }, []);

  const handleCategoryDragLeave = useCallback(() => {
    setDragOverTarget(null);
  }, []);

  const handleCategoryDrop = useCallback((e: React.DragEvent, categoryId: string | null) => {
    e.preventDefault();
    const canvasId = e.dataTransfer.getData('text/plain');
    if (canvasId && onMoveCanvasToCategory) {
      onMoveCanvasToCategory(canvasId, categoryId);
    }
    setDragOverTarget(null);
  }, [onMoveCanvasToCategory]);

  // Helper to render a list of canvas items
  // categoryId: if provided, canvas is in this category and can be removed from it
  const renderCanvasItems = (canvasList: CanvasMetadata[], categoryId?: string) =>
    canvasList.map((canvas) => (
      <CanvasItem
        key={canvas.id}
        canvas={canvas}
        isActive={canvas.id === activeCanvasId}
        isAgentActive={canvas.id === agentActiveCanvasId}
        scene={scenes.get(canvas.id) || null}
        isDarkMode={isDarkMode}
        draggable={hasCategories}
        onSelect={() => onSelectCanvas(canvas.id)}
        onRename={(newName) => onRenameCanvas(canvas.id, newName)}
        onDelete={() => onDeleteCanvas(canvas.id)}
        onRemoveFromCategory={categoryId && onMoveCanvasToCategory
          ? () => onMoveCanvasToCategory(canvas.id, null)
          : undefined}
        onDragStart={(e) => handleCanvasDragStart(e, canvas.id)}
      />
    ));

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

  // Group canvases by category
  const renderGroupedList = () => {
    if (!hasCategories) {
      // No categories: flat list (same as before)
      return renderCanvasItems(sortedCanvases);
    }

    const map = canvasCategoryMap || {};
    const sortedCategories = [...categories].sort((a, b) => a.order - b.order);

    // Build categorized groups
    const categorizedCanvases: Record<string, CanvasMetadata[]> = {};
    for (const cat of sortedCategories) {
      categorizedCanvases[cat.id] = [];
    }
    const uncategorized: CanvasMetadata[] = [];

    for (const canvas of sortedCanvases) {
      const catId = map[canvas.id];
      if (catId && categorizedCanvases[catId]) {
        categorizedCanvases[catId].push(canvas);
      } else {
        uncategorized.push(canvas);
      }
    }

    return (
      <>
        {sortedCategories.map((cat) => {
          const catCanvases = categorizedCanvases[cat.id];
          const hasAgentCanvas = cat.isCollapsed && agentActiveCanvasId != null &&
            catCanvases.some(c => c.id === agentActiveCanvasId);

          return (
            <div key={cat.id}>
              <CategoryHeader
                category={cat}
                canvasCount={catCanvases.length}
                showAgentIcon={hasAgentCanvas}
                isDarkMode={isDarkMode}
                isDragOver={dragOverTarget === cat.id}
                onToggleCollapse={() => onToggleCategoryCollapse?.(cat.id)}
                onRename={(newName) => onRenameCategory?.(cat.id, newName)}
                onDelete={() => onDeleteCategory?.(cat.id)}
                onDragOver={(e) => handleCategoryDragOver(e, cat.id)}
                onDragLeave={handleCategoryDragLeave}
                onDrop={(e) => handleCategoryDrop(e, cat.id)}
              />
              {!cat.isCollapsed && renderCanvasItems(catCanvases, cat.id)}
            </div>
          );
        })}

        {/* Uncategorized section */}
        {uncategorized.length > 0 && (
          <div>
            <UncategorizedHeader
              canvasCount={uncategorized.length}
              isCollapsed={uncategorizedCollapsed}
              showAgentIcon={uncategorizedCollapsed && agentActiveCanvasId != null &&
                uncategorized.some(c => c.id === agentActiveCanvasId)}
              isDarkMode={isDarkMode}
              isDragOver={dragOverTarget === '__uncategorized__'}
              onToggleCollapse={() => setUncategorizedCollapsed(prev => !prev)}
              onDragOver={(e) => handleCategoryDragOver(e, '__uncategorized__')}
              onDragLeave={handleCategoryDragLeave}
              onDrop={(e) => handleCategoryDrop(e, null)}
            />
            {!uncategorizedCollapsed && renderCanvasItems(uncategorized)}
          </div>
        )}
      </>
    );
  };

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
          {onCreateCategory && (
            <button
              style={buttonStyle}
              onClick={onCreateCategory}
              title="New group"
            >
              <FolderPlus size={iconSize} />
            </button>
          )}
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
        {renderGroupedList()}
      </div>
    </div>
  );
}
