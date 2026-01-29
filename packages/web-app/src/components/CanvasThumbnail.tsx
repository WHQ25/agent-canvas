import { useEffect, useState, useMemo } from 'react';
import type { CanvasSceneData } from '../lib/canvas-storage';

interface CanvasThumbnailProps {
  scene: CanvasSceneData | null;
  isDarkMode?: boolean;
}

export function CanvasThumbnail({
  scene,
  isDarkMode = false,
}: CanvasThumbnailProps) {
  const [svgString, setSvgString] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Filter out deleted elements
  const elements = useMemo(() => {
    if (!scene?.elements) return [];
    return scene.elements.filter((el: unknown) => {
      const element = el as { isDeleted?: boolean };
      return !element.isDeleted;
    });
  }, [scene?.elements]);

  // Create stable key from elements to avoid unnecessary re-renders
  // Only include properties that affect visual appearance
  const elementsKey = useMemo(() => {
    if (elements.length === 0) return '';
    return JSON.stringify(elements.map((el: unknown) => {
      const e = el as Record<string, unknown>;
      return {
        id: e.id,
        type: e.type,
        x: e.x,
        y: e.y,
        width: e.width,
        height: e.height,
        angle: e.angle,
        strokeColor: e.strokeColor,
        backgroundColor: e.backgroundColor,
        points: e.points,
        text: e.text,
      };
    }));
  }, [elements]);

  useEffect(() => {
    if (elements.length === 0) {
      setSvgString(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    const generateThumbnail = async () => {
      try {
        const { exportToSvg } = await import('@excalidraw/excalidraw');

        const svg = await exportToSvg({
          elements: elements as never,
          appState: {
            exportBackground: true,
            exportWithDarkMode: isDarkMode,
            exportEmbedScene: false,
          },
          files: (scene?.files as never) || null,
          skipInliningFonts: true, // Avoid Worker initialization issues
        });

        if (cancelled) return;

        // Don't set fixed width/height, let CSS handle it
        svg.removeAttribute('width');
        svg.removeAttribute('height');
        svg.style.maxWidth = '100%';
        svg.style.maxHeight = '100%';
        svg.style.width = 'auto';
        svg.style.height = 'auto';

        const serializer = new XMLSerializer();
        const svgStr = serializer.serializeToString(svg);
        setSvgString(svgStr);
      } catch (error) {
        console.error('Failed to generate thumbnail:', error);
        if (!cancelled) {
          setSvgString(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    generateThumbnail();

    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elementsKey, isDarkMode]);

  const containerStyle: React.CSSProperties = {
    width: '100%',
    aspectRatio: '16 / 10',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: isDarkMode ? '#121212' : '#ffffff',
    overflow: 'hidden',
  };

  const emptyStyle: React.CSSProperties = {
    color: isDarkMode ? '#666' : '#999',
    fontSize: 12,
  };

  if (isLoading) {
    return (
      <div style={containerStyle}>
        <span style={emptyStyle}>...</span>
      </div>
    );
  }

  if (!svgString || elements.length === 0) {
    return (
      <div style={containerStyle}>
        <span style={emptyStyle}>Empty</span>
      </div>
    );
  }

  return (
    <div
      style={containerStyle}
      dangerouslySetInnerHTML={{ __html: svgString }}
    />
  );
}
