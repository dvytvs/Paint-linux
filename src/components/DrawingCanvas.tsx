import React, { useEffect, useState, useRef } from 'react';
import { Tool } from '../types';
import { Scissors, Copy, ClipboardPaste, Crop, Maximize2, Trash2, RotateCw, ArrowLeftRight, Image as ImageIcon, SquareDashed, LassoSelect, Sparkles } from 'lucide-react';
import { t } from '../i18n';

interface CanvasProps {
  currentTool: Tool;
  setCurrentTool: (tool: Tool) => void;
  primaryColor: string;
  secondaryColor: string;
  strokeSize: number;
  width: number;
  height: number;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onDraw: (dataUrl?: string) => void;
  onColorPick?: (color: string, isSecondary: boolean) => void;
  pastedImage?: { src: string, id: number } | null;
  showRulers?: boolean;
  showGridlines?: boolean;
}

export default function DrawingCanvas({ currentTool, setCurrentTool, primaryColor, secondaryColor, strokeSize, width, height, canvasRef, onDraw, onColorPick, pastedImage, showRulers, showGridlines }: CanvasProps) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{x: number, y: number} | null>(null);
  const [snapshot, setSnapshot] = useState<ImageData | null>(null);
  const [textInput, setTextInput] = useState<{x: number, y: number, text: string} | null>(null);
  const [curveState, setCurveState] = useState<{
    step: 0 | 1 | 2;
    start: {x: number, y: number};
    end: {x: number, y: number};
    cp1?: {x: number, y: number};
    cp2?: {x: number, y: number};
  } | null>(null);
  const [polygonState, setPolygonState] = useState<{
    points: {x: number, y: number}[];
    currentPos: {x: number, y: number};
  } | null>(null);
  
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const [selection, setSelection] = useState<{
    active: boolean;
    x: number;
    y: number;
    w: number;
    h: number;
    isMoving: boolean;
    isResizing?: string | null;
    startX: number;
    startY: number;
    image: HTMLCanvasElement | null;
    path?: {x: number, y: number}[];
  } | null>(null);
  const [contextMenu, setContextMenu] = useState<{x: number, y: number} | null>(null);

  const commitSelection = () => {
    if (selection?.image && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.drawImage(selection.image, selection.x, selection.y, selection.w, selection.h);
        onDraw(canvasRef.current.toDataURL());
      }
    }
    setSelection(null);
  };

  const rotateSelection = () => {
    if (!selection) return;
    const img = selection.image || extractSelection(true);
    if (!img) return;

    const canvas = document.createElement('canvas');
    canvas.width = selection.h;
    canvas.height = selection.w;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(Math.PI / 2);
    ctx.drawImage(img, -selection.w / 2, -selection.h / 2);

    setSelection({
      ...selection,
      x: selection.x + selection.w / 2 - selection.h / 2,
      y: selection.y + selection.h / 2 - selection.w / 2,
      w: selection.h,
      h: selection.w,
      image: canvas,
      path: undefined // Clear path as it's no longer valid
    });
    setContextMenu(null);
  };

  const flipSelection = (horizontal: boolean) => {
    if (!selection) return;
    const img = selection.image || extractSelection(true);
    if (!img) return;

    const canvas = document.createElement('canvas');
    canvas.width = selection.w;
    canvas.height = selection.h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (horizontal) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    } else {
      ctx.translate(0, canvas.height);
      ctx.scale(1, -1);
    }
    ctx.drawImage(img, 0, 0);

    setSelection({
      ...selection,
      image: canvas,
      path: undefined // Clear path as it's no longer valid
    });
    setContextMenu(null);
  };

  const extractSelection = (fillOriginal: boolean = false) => {
    if (!selection || !canvasRef.current) return null;
    if (selection.image) return selection.image;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    let tempCanvas = document.createElement('canvas');
    tempCanvas.width = selection.w;
    tempCanvas.height = selection.h;
    let tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return null;

    if (selection.path) {
      tempCtx.beginPath();
      tempCtx.moveTo(selection.path[0].x - selection.x, selection.path[0].y - selection.y);
      for (let i = 1; i < selection.path.length; i++) {
        tempCtx.lineTo(selection.path[i].x - selection.x, selection.path[i].y - selection.y);
      }
      tempCtx.closePath();
      tempCtx.clip();
      tempCtx.drawImage(canvas, selection.x, selection.y, selection.w, selection.h, 0, 0, selection.w, selection.h);
      
      if (fillOriginal) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(selection.path[0].x, selection.path[0].y);
        for (let i = 1; i < selection.path.length; i++) {
          ctx.lineTo(selection.path[i].x, selection.path[i].y);
        }
        ctx.closePath();
        ctx.fillStyle = secondaryColor;
        ctx.fill();
        ctx.restore();
        onDraw(canvas.toDataURL());
      }
    } else {
      const imgData = ctx.getImageData(selection.x, selection.y, selection.w, selection.h);
      tempCtx.putImageData(imgData, 0, 0);
      if (fillOriginal) {
        ctx.fillStyle = secondaryColor;
        ctx.fillRect(selection.x, selection.y, selection.w, selection.h);
        onDraw(canvas.toDataURL());
      }
    }
    return tempCanvas;
  };

  useEffect(() => {
    if (currentTool !== 'select' && currentTool !== 'lasso-select' && selection) {
      commitSelection();
    }
    if (currentTool !== 'curve' && curveState) {
      setCurveState(null);
    }
    if (currentTool !== 'polygon' && polygonState) {
      setPolygonState(null);
    }
  }, [currentTool, curveState, polygonState]);

  useEffect(() => {
    if (pastedImage && canvasRef.current) {
      if (selection) {
        commitSelection();
      }
      const img = new Image();
      img.onload = () => {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = img.width;
        tempCanvas.height = img.height;
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx) {
          tempCtx.drawImage(img, 0, 0);
          setSelection({
            active: true,
            x: 0,
            y: 0,
            w: img.width,
            h: img.height,
            isMoving: false,
            startX: 0,
            startY: 0,
            image: tempCanvas
          });
        }
      };
      img.src = pastedImage.src;
    }
  }, [pastedImage]);

  useEffect(() => {
    const overlay = overlayCanvasRef.current;
    if (overlay) {
      const ctx = overlay.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, width, height);
        if (selection) {
          if (selection.image) {
            ctx.drawImage(selection.image, selection.x, selection.y, selection.w, selection.h);
          }
          // Отрисовка path для lasso-select
          if (selection.path && selection.path.length > 0) {
            ctx.setLineDash([5, 5]);
            ctx.strokeStyle = '#0078d7';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(selection.path[0].x, selection.path[0].y);
            for (let i = 1; i < selection.path.length; i++) {
              ctx.lineTo(selection.path[i].x, selection.path[i].y);
            }
            // Замыкаем контур если выделение активно
            if (selection.active) {
              ctx.closePath();
            }
            ctx.stroke();
            
            // Если выделение активно, рисуем рамку и ручки
            if (selection.active) {
              ctx.setLineDash([]);
              ctx.fillStyle = '#ffffff';
              ctx.strokeStyle = '#0078d7';
              const handleSize = 6;
              const handles = [
                { x: selection.x - handleSize/2, y: selection.y - handleSize/2 },
                { x: selection.x + selection.w/2 - handleSize/2, y: selection.y - handleSize/2 },
                { x: selection.x + selection.w - handleSize/2, y: selection.y - handleSize/2 },
                { x: selection.x - handleSize/2, y: selection.y + selection.h/2 - handleSize/2 },
                { x: selection.x + selection.w - handleSize/2, y: selection.y + selection.h/2 - handleSize/2 },
                { x: selection.x - handleSize/2, y: selection.y + selection.h - handleSize/2 },
                { x: selection.x + selection.w/2 - handleSize/2, y: selection.y + selection.h - handleSize/2 },
                { x: selection.x + selection.w - handleSize/2, y: selection.y + selection.h - handleSize/2 },
              ];
              handles.forEach(h => {
                ctx.fillRect(h.x, h.y, handleSize, handleSize);
                ctx.strokeRect(h.x, h.y, handleSize, handleSize);
              });
            }
          } else if (!selection.path) {
            // Отрисовка прямоугольного выделения
            ctx.setLineDash([5, 5]);
            ctx.strokeStyle = '#0078d7';
            ctx.lineWidth = 1;
            ctx.strokeRect(selection.x, selection.y, selection.w, selection.h);

            if (selection.active) {
              ctx.setLineDash([]);
              ctx.fillStyle = '#ffffff';
              ctx.strokeStyle = '#0078d7';
              const handleSize = 6;
              const handles = [
                { x: selection.x - handleSize/2, y: selection.y - handleSize/2 },
                { x: selection.x + selection.w/2 - handleSize/2, y: selection.y - handleSize/2 },
                { x: selection.x + selection.w - handleSize/2, y: selection.y - handleSize/2 },
                { x: selection.x - handleSize/2, y: selection.y + selection.h/2 - handleSize/2 },
                { x: selection.x + selection.w - handleSize/2, y: selection.y + selection.h/2 - handleSize/2 },
                { x: selection.x - handleSize/2, y: selection.y + selection.h - handleSize/2 },
                { x: selection.x + selection.w/2 - handleSize/2, y: selection.y + selection.h - handleSize/2 },
                { x: selection.x + selection.w - handleSize/2, y: selection.y + selection.h - handleSize/2 },
              ];
              handles.forEach(h => {
                ctx.fillRect(h.x, h.y, handleSize, handleSize);
                ctx.strokeRect(h.x, h.y, handleSize, handleSize);
              });
            }
          }
          ctx.setLineDash([]);
        }
      }
    }
  }, [selection, width, height]);

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    if (contextMenu) setContextMenu(null);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Получаем координаты относительно самого canvas элемента
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);

    if (e.button === 2) {
      if (currentTool === 'picker') {
        const pixel = ctx.getImageData(x, y, 1, 1).data;
        const hex = `#${pixel[0].toString(16).padStart(2, '0')}${pixel[1].toString(16).padStart(2, '0')}${pixel[2].toString(16).padStart(2, '0')}`;
        if (onColorPick) onColorPick(hex, true);
        return;
      }
      if (currentTool === 'magnifier') {
        window.dispatchEvent(new CustomEvent('request-zoom-out'));
        return;
      }
      if (selection && selection.active && x >= selection.x && x <= selection.x + selection.w && y >= selection.y && y <= selection.y + selection.h) {
        setContextMenu({ x: e.clientX, y: e.clientY });
      }
      return;
    }

    if (currentTool === 'picker') {
      const pixel = ctx.getImageData(x, y, 1, 1).data;
      const hex = `#${pixel[0].toString(16).padStart(2, '0')}${pixel[1].toString(16).padStart(2, '0')}${pixel[2].toString(16).padStart(2, '0')}`;
      if (onColorPick) onColorPick(hex, false);
      return;
    }

    if (currentTool === 'magnifier') {
      window.dispatchEvent(new CustomEvent('request-zoom-in'));
      return;
    }

    if (currentTool === 'text') {
      setTextInput({ x, y, text: '' });
      return;
    }

    if (textInput) {
      setTextInput(null);
    }

    if (currentTool === 'curve') {
      if (curveState) {
        if (curveState.step === 1) {
          setCurveState({ ...curveState, cp1: {x, y} });
        } else if (curveState.step === 2) {
          setCurveState({ ...curveState, cp2: {x, y} });
        }
        setIsDrawing(true);
        return;
      } else {
        setCurveState({ step: 0, start: {x, y}, end: {x, y} });
      }
    }

    if (currentTool === 'polygon') {
      if (polygonState) {
        setPolygonState({
          ...polygonState,
          points: [...polygonState.points, {x, y}],
          currentPos: {x, y}
        });
      } else {
        setPolygonState({
          points: [{x, y}],
          currentPos: {x, y}
        });
        setSnapshot(ctx.getImageData(0, 0, canvas.width, canvas.height));
      }
      setIsDrawing(true);
      return;
    }

    if (currentTool === 'select' || currentTool === 'lasso-select') {
      if (selection && selection.active) {
        const handleSize = 10; // slightly larger hit area
        const handles = [
          { id: 'nw', x: selection.x - handleSize/2, y: selection.y - handleSize/2 },
          { id: 'n', x: selection.x + selection.w/2 - handleSize/2, y: selection.y - handleSize/2 },
          { id: 'ne', x: selection.x + selection.w - handleSize/2, y: selection.y - handleSize/2 },
          { id: 'w', x: selection.x - handleSize/2, y: selection.y + selection.h/2 - handleSize/2 },
          { id: 'e', x: selection.x + selection.w - handleSize/2, y: selection.y + selection.h/2 - handleSize/2 },
          { id: 'sw', x: selection.x - handleSize/2, y: selection.y + selection.h - handleSize/2 },
          { id: 's', x: selection.x + selection.w/2 - handleSize/2, y: selection.y + selection.h - handleSize/2 },
          { id: 'se', x: selection.x + selection.w - handleSize/2, y: selection.y + selection.h - handleSize/2 },
        ];
        
        const clickedHandle = handles.find(h => 
          x >= h.x && x <= h.x + handleSize && 
          y >= h.y && y <= h.y + handleSize
        );

        if (clickedHandle) {
          if (!selection.image) {
            const tempCanvas = extractSelection(true);
            setSelection({ ...selection, isResizing: clickedHandle.id, startX: x, startY: y, image: tempCanvas });
          } else {
            setSelection({ ...selection, isResizing: clickedHandle.id, startX: x, startY: y });
          }
          return;
        }

        if (x >= selection.x && x <= selection.x + selection.w && y >= selection.y && y <= selection.y + selection.h) {
          if (!selection.image) {
            const tempCanvas = extractSelection(true);
            setSelection({ ...selection, isMoving: true, startX: x, startY: y, image: tempCanvas });
          } else {
            setSelection({ ...selection, isMoving: true, startX: x, startY: y });
          }
          return;
        } else {
          commitSelection();
        }
      }
      
      setSelection({ 
        active: false, 
        x, y, w: 0, h: 0, 
        isMoving: false, 
        startX: x, startY: y, 
        image: null,
        path: currentTool === 'lasso-select' ? [{x, y}] : undefined
      });
      setIsDrawing(true);
      setStartPos({ x, y });
      return;
    }

    setIsDrawing(true);
    setStartPos({ x, y });
    setSnapshot(ctx.getImageData(0, 0, canvas.width, canvas.height));

    ctx.beginPath();
    ctx.moveTo(x, y);

    if (currentTool === 'fill') {
       floodFill(ctx, Math.floor(x), Math.floor(y), hexToRgb(primaryColor));
       setIsDrawing(false);
       onDraw(canvas.toDataURL());
    }
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (currentTool === 'select' || currentTool === 'lasso-select') {
      if (!isDrawing && !selection?.isMoving && !selection?.isResizing) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      // Получаем координаты относительно самого canvas элемента
      const rect = e.currentTarget.getBoundingClientRect();
      const x = Math.round(e.clientX - rect.left);
      const y = Math.round(e.clientY - rect.top);

      if (selection?.isResizing && selection.image) {
        const dx = x - selection.startX;
        const dy = y - selection.startY;
        setSelection(prev => {
          if (!prev) return null;
          let newX = prev.x;
          let newY = prev.y;
          let newW = prev.w;
          let newH = prev.h;

          if (prev.isResizing?.includes('w')) { newX += dx; newW -= dx; }
          if (prev.isResizing?.includes('e')) { newW += dx; }
          if (prev.isResizing?.includes('n')) { newY += dy; newH -= dy; }
          if (prev.isResizing?.includes('s')) { newH += dy; }

          return {
            ...prev,
            x: newX,
            y: newY,
            w: newW,
            h: newH,
            startX: x,
            startY: y
          };
        });
      } else if (selection?.isMoving && selection.image) {
        const dx = x - selection.startX;
        const dy = y - selection.startY;
        setSelection(prev => prev ? {
          ...prev,
          x: prev.x + dx,
          y: prev.y + dy,
          startX: x,
          startY: y
        } : null);
      } else if (isDrawing && selection && !selection.active && startPos) {
        if (currentTool === 'lasso-select') {
          setSelection(prev => prev && prev.path ? {
            ...prev,
            path: [...prev.path, {x, y}]
          } : prev);
        } else {
          setSelection(prev => prev ? {
            ...prev,
            w: x - startPos.x,
            h: y - startPos.y
          } : prev);
        }
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Получаем координаты относительно самого canvas элемента
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);

    if (currentTool === 'curve' && curveState) {
      if (curveState.step === 0) {
        setCurveState(prev => prev ? { ...prev, end: {x, y} } : prev);
      } else if (curveState.step === 1) {
        setCurveState(prev => prev ? { ...prev, cp1: {x, y} } : prev);
      } else if (curveState.step === 2) {
        setCurveState(prev => prev ? { ...prev, cp2: {x, y} } : prev);
      }
      
      if (snapshot) {
        ctx.putImageData(snapshot, 0, 0);
        ctx.beginPath();
        ctx.moveTo(curveState.start.x, curveState.start.y);
        if (curveState.step === 0) {
          ctx.lineTo(x, y);
        } else if (curveState.step === 1) {
          ctx.quadraticCurveTo(x, y, curveState.end.x, curveState.end.y);
        } else if (curveState.step === 2) {
          ctx.bezierCurveTo(
            curveState.cp1!.x, curveState.cp1!.y,
            x, y,
            curveState.end.x, curveState.end.y
          );
        }
        ctx.strokeStyle = primaryColor;
        ctx.lineWidth = strokeSize;
        ctx.stroke();
      }
      return;
    }

    if (currentTool === 'polygon' && polygonState) {
      setPolygonState(prev => prev ? { ...prev, currentPos: {x, y} } : prev);
      
      if (snapshot) {
        ctx.putImageData(snapshot, 0, 0);
        ctx.beginPath();
        ctx.moveTo(polygonState.points[0].x, polygonState.points[0].y);
        for (let i = 1; i < polygonState.points.length; i++) {
          ctx.lineTo(polygonState.points[i].x, polygonState.points[i].y);
        }
        ctx.lineTo(x, y);
        ctx.strokeStyle = primaryColor;
        ctx.lineWidth = strokeSize;
        ctx.stroke();
      }
      return;
    }

    if (!isDrawing || !startPos) return;

    if (['pencil', 'brush', 'eraser', 'calligraphy', 'pen', 'airbrush', 'oil', 'crayon', 'marker', 'texture', 'watercolor'].includes(currentTool)) {
      ctx.lineTo(x, y);
      ctx.strokeStyle = currentTool === 'eraser' ? secondaryColor : primaryColor;
      ctx.lineWidth = strokeSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = 1.0;

      if (currentTool === 'brush') {
        ctx.lineWidth = strokeSize * 3;
      } else if (currentTool === 'calligraphy') {
        ctx.lineWidth = strokeSize * 2;
        ctx.lineCap = 'square';
      } else if (currentTool === 'marker') {
        ctx.lineWidth = strokeSize * 4;
        ctx.globalAlpha = 0.5;
        ctx.lineCap = 'square';
      } else if (currentTool === 'watercolor') {
        ctx.lineWidth = strokeSize * 5;
        ctx.globalAlpha = 0.1;
      } else if (currentTool === 'airbrush') {
        ctx.lineWidth = strokeSize * 4;
        ctx.shadowBlur = strokeSize * 2;
        ctx.shadowColor = primaryColor;
      } else if (currentTool === 'oil') {
        ctx.lineWidth = strokeSize * 3;
        ctx.globalAlpha = 0.8;
      } else if (currentTool === 'crayon' || currentTool === 'texture') {
        ctx.lineWidth = strokeSize * 2;
        ctx.globalAlpha = 0.7;
      }

      ctx.stroke();
      
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1.0;
    } else if (snapshot && ['rectangle', 'circle', 'line', 'rounded-rectangle', 'triangle', 'right-triangle', 'diamond', 'pentagon', 'hexagon', 'arrow-right', 'arrow-left', 'arrow-up', 'arrow-down', 'star-4', 'star-5', 'star-6', 'callout-rounded', 'callout-oval', 'callout-cloud', 'heart', 'lightning'].includes(currentTool)) {
      ctx.putImageData(snapshot, 0, 0);
      ctx.beginPath();
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = strokeSize;
      
      let w = x - startPos.x;
      let h = y - startPos.y;

      if (e.shiftKey) {
        const size = Math.max(Math.abs(w), Math.abs(h));
        w = w < 0 ? -size : size;
        h = h < 0 ? -size : size;
        if (currentTool === 'line') {
          const angle = Math.atan2(y - startPos.y, x - startPos.x);
          const snappedAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
          const length = Math.sqrt(Math.pow(x - startPos.x, 2) + Math.pow(y - startPos.y, 2));
          w = Math.cos(snappedAngle) * length;
          h = Math.sin(snappedAngle) * length;
        }
      }

      const drawX = startPos.x;
      const drawY = startPos.y;

      switch (currentTool) {
        case 'line':
          ctx.moveTo(drawX, drawY);
          ctx.lineTo(drawX + w, drawY + h);
          break;
        case 'rectangle':
          ctx.rect(drawX, drawY, w, h);
          break;
        case 'circle':
          ctx.ellipse(drawX + w/2, drawY + h/2, Math.abs(w/2), Math.abs(h/2), 0, 0, 2 * Math.PI);
          break;
        case 'rounded-rectangle':
          const radius = Math.min(Math.abs(w), Math.abs(h)) * 0.1;
          ctx.roundRect(Math.min(drawX, drawX+w), Math.min(drawY, drawY+h), Math.abs(w), Math.abs(h), radius);
          break;
        case 'triangle':
          ctx.moveTo(drawX + w/2, drawY);
          ctx.lineTo(drawX + w, drawY + h);
          ctx.lineTo(drawX, drawY + h);
          ctx.closePath();
          break;
        case 'right-triangle':
          ctx.moveTo(drawX, drawY);
          ctx.lineTo(drawX, drawY + h);
          ctx.lineTo(drawX + w, drawY + h);
          ctx.closePath();
          break;
        case 'diamond':
          ctx.moveTo(drawX + w/2, drawY);
          ctx.lineTo(drawX + w, drawY + h/2);
          ctx.lineTo(drawX + w/2, drawY + h);
          ctx.lineTo(drawX, drawY + h/2);
          ctx.closePath();
          break;
        case 'pentagon':
          for (let i = 0; i < 5; i++) {
            const angle = (i * 2 * Math.PI / 5) - Math.PI / 2;
            const px = drawX + w/2 + (Math.abs(w)/2) * Math.cos(angle);
            const py = drawY + h/2 + (Math.abs(h)/2) * Math.sin(angle);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          break;
        case 'hexagon':
          for (let i = 0; i < 6; i++) {
            const angle = (i * 2 * Math.PI / 6) - Math.PI / 2;
            const px = drawX + w/2 + (Math.abs(w)/2) * Math.cos(angle);
            const py = drawY + h/2 + (Math.abs(h)/2) * Math.sin(angle);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          break;
        case 'star-4':
        case 'star-5':
        case 'star-6':
          const points = currentTool === 'star-4' ? 4 : currentTool === 'star-5' ? 5 : 6;
          const innerRadius = 0.4;
          for (let i = 0; i < points * 2; i++) {
            const r = i % 2 === 0 ? 1 : innerRadius;
            const angle = (i * Math.PI / points) - Math.PI / 2;
            const px = drawX + w/2 + (Math.abs(w)/2) * r * Math.cos(angle);
            const py = drawY + h/2 + (Math.abs(h)/2) * r * Math.sin(angle);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          break;
        case 'arrow-right':
          ctx.moveTo(drawX, drawY + h*0.25);
          ctx.lineTo(drawX + w*0.5, drawY + h*0.25);
          ctx.lineTo(drawX + w*0.5, drawY);
          ctx.lineTo(drawX + w, drawY + h*0.5);
          ctx.lineTo(drawX + w*0.5, drawY + h);
          ctx.lineTo(drawX + w*0.5, drawY + h*0.75);
          ctx.lineTo(drawX, drawY + h*0.75);
          ctx.closePath();
          break;
        case 'arrow-left':
          ctx.moveTo(drawX + w, drawY + h*0.25);
          ctx.lineTo(drawX + w*0.5, drawY + h*0.25);
          ctx.lineTo(drawX + w*0.5, drawY);
          ctx.lineTo(drawX, drawY + h*0.5);
          ctx.lineTo(drawX + w*0.5, drawY + h);
          ctx.lineTo(drawX + w*0.5, drawY + h*0.75);
          ctx.lineTo(drawX + w, drawY + h*0.75);
          ctx.closePath();
          break;
        case 'arrow-up':
          ctx.moveTo(drawX + w*0.25, drawY + h);
          ctx.lineTo(drawX + w*0.25, drawY + h*0.5);
          ctx.lineTo(drawX, drawY + h*0.5);
          ctx.lineTo(drawX + w*0.5, drawY);
          ctx.lineTo(drawX + w, drawY + h*0.5);
          ctx.lineTo(drawX + w*0.75, drawY + h*0.5);
          ctx.lineTo(drawX + w*0.75, drawY + h);
          ctx.closePath();
          break;
        case 'arrow-down':
          ctx.moveTo(drawX + w*0.25, drawY);
          ctx.lineTo(drawX + w*0.25, drawY + h*0.5);
          ctx.lineTo(drawX, drawY + h*0.5);
          ctx.lineTo(drawX + w*0.5, drawY + h);
          ctx.lineTo(drawX + w, drawY + h*0.5);
          ctx.lineTo(drawX + w*0.75, drawY + h*0.5);
          ctx.lineTo(drawX + w*0.75, drawY);
          ctx.closePath();
          break;
        case 'heart':
          const topCurveHeight = h * 0.3;
          ctx.moveTo(drawX + w/2, drawY + topCurveHeight);
          ctx.bezierCurveTo(drawX + w/2, drawY, drawX, drawY, drawX, drawY + topCurveHeight);
          ctx.bezierCurveTo(drawX, drawY + (h + topCurveHeight)/2, drawX + w/2, drawY + h, drawX + w/2, drawY + h);
          ctx.bezierCurveTo(drawX + w/2, drawY + h, drawX + w, drawY + (h + topCurveHeight)/2, drawX + w, drawY + topCurveHeight);
          ctx.bezierCurveTo(drawX + w, drawY, drawX + w/2, drawY, drawX + w/2, drawY + topCurveHeight);
          ctx.closePath();
          break;
        case 'lightning':
          ctx.moveTo(drawX + w*0.5, drawY);
          ctx.lineTo(drawX, drawY + h*0.6);
          ctx.lineTo(drawX + w*0.4, drawY + h*0.6);
          ctx.lineTo(drawX + w*0.3, drawY + h);
          ctx.lineTo(drawX + w, drawY + h*0.4);
          ctx.lineTo(drawX + w*0.6, drawY + h*0.4);
          ctx.closePath();
          break;
        case 'callout-rounded':
          const crRadius = Math.min(Math.abs(w), Math.abs(h)) * 0.1;
          const crTailH = h * 0.2;
          ctx.moveTo(drawX + crRadius, drawY);
          ctx.lineTo(drawX + w - crRadius, drawY);
          ctx.quadraticCurveTo(drawX + w, drawY, drawX + w, drawY + crRadius);
          ctx.lineTo(drawX + w, drawY + h - crTailH - crRadius);
          ctx.quadraticCurveTo(drawX + w, drawY + h - crTailH, drawX + w - crRadius, drawY + h - crTailH);
          ctx.lineTo(drawX + w * 0.6, drawY + h - crTailH);
          ctx.lineTo(drawX + w * 0.4, drawY + h);
          ctx.lineTo(drawX + w * 0.4, drawY + h - crTailH);
          ctx.lineTo(drawX + crRadius, drawY + h - crTailH);
          ctx.quadraticCurveTo(drawX, drawY + h - crTailH, drawX, drawY + h - crTailH - crRadius);
          ctx.lineTo(drawX, drawY + crRadius);
          ctx.quadraticCurveTo(drawX, drawY, drawX + crRadius, drawY);
          ctx.closePath();
          break;
        case 'callout-oval':
          const ovalTailH = h * 0.2;
          const ovalH = h - ovalTailH;
          const kappa = 0.5522848;
          const ox = (w / 2) * kappa;
          const oy = (ovalH / 2) * kappa;
          const xe = drawX + w;
          const ye = drawY + ovalH;
          const xm = drawX + w / 2;
          const ym = drawY + ovalH / 2;

          ctx.moveTo(drawX, ym);
          ctx.bezierCurveTo(drawX, ym - oy, xm - ox, drawY, xm, drawY);
          ctx.bezierCurveTo(xm + ox, drawY, xe, ym - oy, xe, ym);
          ctx.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
          
          // Tail
          ctx.lineTo(drawX + w * 0.4, drawY + h);
          ctx.lineTo(drawX + w * 0.3, ye - (ovalH * 0.05));
          
          ctx.bezierCurveTo(drawX + w * 0.15, ye, drawX, ym + oy, drawX, ym);
          ctx.closePath();
          break;
        case 'callout-cloud':
          const cloudTailH = h * 0.2;
          const cloudH = h - cloudTailH;
          ctx.moveTo(drawX + w * 0.2, drawY + cloudH * 0.4);
          ctx.bezierCurveTo(drawX, drawY + cloudH * 0.1, drawX + w * 0.3, drawY - cloudH * 0.1, drawX + w * 0.4, drawY + cloudH * 0.2);
          ctx.bezierCurveTo(drawX + w * 0.5, drawY - cloudH * 0.2, drawX + w * 0.8, drawY, drawX + w * 0.7, drawY + cloudH * 0.3);
          ctx.bezierCurveTo(drawX + w, drawY + cloudH * 0.2, drawX + w, drawY + cloudH * 0.7, drawX + w * 0.8, drawY + cloudH * 0.7);
          ctx.bezierCurveTo(drawX + w * 0.9, drawY + cloudH, drawX + w * 0.5, drawY + cloudH, drawX + w * 0.5, drawY + cloudH * 0.8);
          ctx.lineTo(drawX + w * 0.3, drawY + h);
          ctx.lineTo(drawX + w * 0.35, drawY + cloudH * 0.8);
          ctx.bezierCurveTo(drawX, drawY + cloudH, drawX, drawY + cloudH * 0.5, drawX + w * 0.2, drawY + cloudH * 0.4);
          ctx.closePath();
          break;
      }
      ctx.stroke();
    }
  };

  const stopDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    if (currentTool === 'select' || currentTool === 'lasso-select') {
      setSelection(prev => {
        if (!prev) return prev;
        if (prev.isResizing) {
          return { ...prev, isResizing: null };
        } else if (prev.isMoving) {
          return { ...prev, isMoving: false };
        } else if (isDrawing && !prev.active) {
          if (currentTool === 'lasso-select' && prev.path && prev.path.length > 2) {
            let minX = prev.path[0].x;
            let minY = prev.path[0].y;
            let maxX = prev.path[0].x;
            let maxY = prev.path[0].y;
            
            for (const p of prev.path) {
              if (p.x < minX) minX = p.x;
              if (p.y < minY) minY = p.y;
              if (p.x > maxX) maxX = p.x;
              if (p.y > maxY) maxY = p.y;
            }
            
            return {
              ...prev,
              active: true,
              x: minX,
              y: minY,
              w: maxX - minX,
              h: maxY - minY
            };
          } else if (currentTool === 'select' && prev.w !== 0 && prev.h !== 0) {
            const normX = prev.w < 0 ? prev.x + prev.w : prev.x;
            const normY = prev.h < 0 ? prev.y + prev.h : prev.y;
            const normW = Math.abs(prev.w);
            const normH = Math.abs(prev.h);
            return { ...prev, active: true, x: normX, y: normY, w: normW, h: normH };
          } else {
            return null;
          }
        }
        return prev;
      });
      setIsDrawing(false);
      return;
    }

    if (currentTool === 'curve' && curveState) {
      if (curveState.step === 0) {
        setCurveState({ ...curveState, step: 1, cp1: curveState.end, cp2: curveState.end });
      } else if (curveState.step === 1) {
        setCurveState({ ...curveState, step: 2, cp2: curveState.cp1 });
      } else if (curveState.step === 2) {
        if (canvasRef.current && snapshot) {
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) {
            ctx.putImageData(snapshot, 0, 0);
            ctx.beginPath();
            ctx.moveTo(curveState.start.x, curveState.start.y);
            ctx.bezierCurveTo(
              curveState.cp1!.x, curveState.cp1!.y,
              curveState.cp2!.x, curveState.cp2!.y,
              curveState.end.x, curveState.end.y
            );
            ctx.strokeStyle = primaryColor;
            ctx.lineWidth = strokeSize;
            ctx.stroke();
            onDraw(canvasRef.current.toDataURL());
          }
        }
        setCurveState(null);
      }
      setIsDrawing(false);
      return;
    }

    if (currentTool === 'polygon') {
      // Do nothing on pointer up for polygon, wait for double click
      return;
    }

    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
       const ctx = canvas.getContext('2d');
       if (ctx) ctx.closePath();
       onDraw(canvas.toDataURL());
    }
  };

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
      a: 255
    } : { r: 0, g: 0, b: 0, a: 255 };
  };

  const floodFill = (ctx: CanvasRenderingContext2D, startX: number, startY: number, fillColor: {r:number, g:number, b:number, a:number}) => {
     const canvasWidth = ctx.canvas.width;
     const canvasHeight = ctx.canvas.height;
     const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
     const data = imageData.data;
     
     const startPos = (startY * canvasWidth + startX) * 4;
     const startR = data[startPos];
     const startG = data[startPos + 1];
     const startB = data[startPos + 2];
     const startA = data[startPos + 3];

     if (startR === fillColor.r && startG === fillColor.g && startB === fillColor.b && startA === fillColor.a) return;

     const matchStartColor = (pos: number) => {
       return data[pos] === startR && data[pos + 1] === startG && data[pos + 2] === startB && data[pos + 3] === startA;
     };

     const colorPixel = (pos: number) => {
       data[pos] = fillColor.r;
       data[pos + 1] = fillColor.g;
       data[pos + 2] = fillColor.b;
       data[pos + 3] = fillColor.a;
     };

     const pixelStack = [[startX, startY]];

     while (pixelStack.length) {
       const newPos = pixelStack.pop()!;
       const x = newPos[0];
       let y = newPos[1];
       let pixelPos = (y * canvasWidth + x) * 4;

       while (y >= 0 && matchStartColor(pixelPos)) {
         y--;
         pixelPos -= canvasWidth * 4;
       }
       pixelPos += canvasWidth * 4;
       y++;

       let reachLeft = false;
       let reachRight = false;

       while (y < canvasHeight && matchStartColor(pixelPos)) {
         colorPixel(pixelPos);

         if (x > 0) {
           if (matchStartColor(pixelPos - 4)) {
             if (!reachLeft) {
               pixelStack.push([x - 1, y]);
               reachLeft = true;
             }
           } else if (reachLeft) {
             reachLeft = false;
           }
         }

         if (x < canvasWidth - 1) {
           if (matchStartColor(pixelPos + 4)) {
             if (!reachRight) {
               pixelStack.push([x + 1, y]);
               reachRight = true;
             }
           } else if (reachRight) {
             reachRight = false;
           }
         }

         y++;
         pixelPos += canvasWidth * 4;
       }
     }
     ctx.putImageData(imageData, 0, 0);
  };

  const getCursor = () => {
    if (currentTool === 'select' || currentTool === 'lasso-select') return selection?.isMoving ? 'move' : 'crosshair';
    switch (currentTool) {
      case 'pencil':
      case 'brush':
        return 'crosshair';
      case 'eraser':
        return 'cell';
      case 'fill':
        return 'alias';
      case 'text':
        return 'text';
      case 'picker':
        return 'crosshair';
      default:
        return 'crosshair';
    }
  };

  useEffect(() => {
    const handleCommitSelection = () => {
      if (selection) {
        commitSelection();
      }
    };
    
    const handleRequestCopy = async () => {
      if (canvasRef.current) {
        try {
          const blob = await new Promise<Blob | null>(resolve => {
            canvasRef.current!.toBlob(resolve, 'image/png');
          });
          if (blob) {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ]);
          }
        } catch (err) {
          console.error('Failed to copy image: ', err);
        }
      }
    };

    const handleRequestCut = async () => {
      if (selection) {
        const img = selection.image || extractSelection(true);
        if (img) {
          try {
            const blob = await new Promise<Blob | null>(resolve => {
              img.toBlob(resolve, 'image/png');
            });
            if (blob) {
              await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob })
              ]);
              setSelection(null);
            }
          } catch (err) {
            console.error('Failed to cut image: ', err);
          }
        }
      } else if (canvasRef.current) {
        // Если нет выделения, копируем весь холст
        try {
          const blob = await new Promise<Blob | null>(resolve => {
            canvasRef.current!.toBlob(resolve, 'image/png');
          });
          if (blob) {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ]);
          }
        } catch (err) {
          console.error('Failed to cut image: ', err);
        }
      }
    };

    const handleRequestCrop = () => {
      if (selection) {
        const img = selection.image || extractSelection(false);
        if (!img) return;
        
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const w = selection.w;
        const h = selection.h;
        
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = w;
        tempCanvas.height = h;
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx) {
          tempCtx.fillStyle = '#ffffff';
          tempCtx.fillRect(0, 0, w, h);
          tempCtx.drawImage(img, 0, 0, w, h);
          
          setSelection(null);
          window.dispatchEvent(new CustomEvent('resize-canvas', { detail: { width: w, height: h, dataUrl: tempCanvas.toDataURL() } }));
        }
      }
    };

    const handleRequestRotate = () => {
      if (selection) {
        rotateSelection();
      } else {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const oldWidth = canvas.width;
        const oldHeight = canvas.height;
        const imgData = ctx.getImageData(0, 0, oldWidth, oldHeight);
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = oldWidth;
        tempCanvas.height = oldHeight;
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx) {
          tempCtx.putImageData(imgData, 0, 0);
          
          const newWidth = oldHeight;
          const newHeight = oldWidth;
          
          const finalCanvas = document.createElement('canvas');
          finalCanvas.width = newWidth;
          finalCanvas.height = newHeight;
          const finalCtx = finalCanvas.getContext('2d');
          if (finalCtx) {
            finalCtx.fillStyle = '#ffffff';
            finalCtx.fillRect(0, 0, newWidth, newHeight);
            finalCtx.translate(newWidth / 2, newHeight / 2);
            finalCtx.rotate(Math.PI / 2);
            finalCtx.drawImage(tempCanvas, -oldWidth / 2, -oldHeight / 2);
            
            window.dispatchEvent(new CustomEvent('resize-canvas', { detail: { width: newWidth, height: newHeight, dataUrl: finalCanvas.toDataURL() } }));
          }
        }
      }
    };

    const handleRequestSelectAll = () => {
      setCurrentTool('select');
      setSelection({
        active: true,
        x: 0,
        y: 0,
        w: width,
        h: height,
        isMoving: false,
        startX: 0,
        startY: 0,
        startW: width,
        startH: height,
        isResizing: false,
        resizeHandle: null
      });
    };

    const handleClearSelection = () => {
      if (selection) {
        commitSelection();
      }
    };

    const handleRequestPaste = async () => {
      try {
        const clipboardItems = await navigator.clipboard.read();
        for (const item of clipboardItems) {
          if (item.types.some(type => type.startsWith('image/'))) {
            const blob = await item.getType(item.types.find(type => type.startsWith('image/'))!);
            const dataUrl = URL.createObjectURL(blob);
            const img = new Image();
            img.onload = () => {
              const newWidth = Math.max(img.width, width);
              const newHeight = Math.max(img.height, height);
              if (newWidth !== width || newHeight !== height) {
                window.dispatchEvent(new CustomEvent('resize-canvas', { 
                  detail: { width: newWidth, height: newHeight } 
                }));
              }
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent('paste-image', { detail: dataUrl }));
              }, 100);
            };
            img.src = dataUrl;
            break;
          }
        }
      } catch (err) {
        console.error('Failed to paste: ', err);
      }
    };

    window.addEventListener('commit-selection', handleCommitSelection);
    window.addEventListener('request-copy', handleRequestCopy);
    window.addEventListener('request-cut', handleRequestCut);
    window.addEventListener('request-paste', handleRequestPaste);
    window.addEventListener('request-crop', handleRequestCrop);
    window.addEventListener('request-rotate', handleRequestRotate);
    window.addEventListener('request-select-all', handleRequestSelectAll);
    window.addEventListener('clear-selection', handleClearSelection);
    return () => {
      window.removeEventListener('commit-selection', handleCommitSelection);
      window.removeEventListener('request-copy', handleRequestCopy);
      window.removeEventListener('request-cut', handleRequestCut);
      window.removeEventListener('request-paste', handleRequestPaste);
      window.removeEventListener('request-crop', handleRequestCrop);
      window.removeEventListener('request-rotate', handleRequestRotate);
      window.removeEventListener('request-select-all', handleRequestSelectAll);
      window.removeEventListener('clear-selection', handleClearSelection);
    };
  }, [selection, commitSelection, width, height, setCurrentTool]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete') {
        const activeTag = document.activeElement?.tagName.toLowerCase();
        if (activeTag === 'input' || activeTag === 'textarea') return;
        
        if (selection && selection.active) {
          handleDelete();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selection]);

  const handleCopy = () => {
    const img = selection?.image || extractSelection(false);
    if (img) {
      img.toBlob(blob => {
        if (blob) navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      });
    }
    setContextMenu(null);
  };

  const handleCut = () => {
    const img = selection?.image || extractSelection(true);
    if (img) {
      img.toBlob(blob => {
        if (blob) navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      });
    }
    setSelection(null);
    setContextMenu(null);
  };

  const handleDelete = () => {
    if (selection && !selection.image) {
      extractSelection(true);
    }
    setSelection(null);
    setContextMenu(null);
  };

  const handleSelectAll = () => {
    setSelection({
      active: true,
      x: 0,
      y: 0,
      w: width,
      h: height,
      isMoving: false,
      startX: 0,
      startY: 0,
      image: null,
      path: undefined
    });
    setContextMenu(null);
  };

  const handleCrop = () => {
    if (selection && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        const img = selection.image || extractSelection(false);
        ctx.fillStyle = secondaryColor;
        ctx.fillRect(0, 0, width, height);
        if (img) {
          ctx.drawImage(img, selection.x, selection.y);
        }
        onDraw(canvasRef.current.toDataURL());
      }
      setSelection(null);
    }
    setContextMenu(null);
  };

  const handleInvertColor = () => {
    if (selection && canvasRef.current) {
      const img = selection.image || extractSelection(false);
      if (img) {
        const tempCtx = img.getContext('2d');
        if (tempCtx) {
          const imgData = tempCtx.getImageData(0, 0, selection.w, selection.h);
          const data = imgData.data;
          for (let i = 0; i < data.length; i += 4) {
            if (data[i+3] > 0) {
              data[i] = 255 - data[i];
              data[i + 1] = 255 - data[i + 1];
              data[i + 2] = 255 - data[i + 2];
            }
          }
          tempCtx.putImageData(imgData, 0, 0);
          
          if (!selection.image) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) {
              ctx.save();
              if (selection.path) {
                ctx.beginPath();
                ctx.moveTo(selection.path[0].x, selection.path[0].y);
                for (let i = 1; i < selection.path.length; i++) {
                  ctx.lineTo(selection.path[i].x, selection.path[i].y);
                }
                ctx.closePath();
                ctx.clip();
                ctx.clearRect(selection.x, selection.y, selection.w, selection.h);
              }
              ctx.drawImage(img, selection.x, selection.y);
              ctx.restore();
              onDraw(canvasRef.current.toDataURL());
            }
          } else {
            setSelection({...selection, image: img});
          }
        }
      }
    }
    setContextMenu(null);
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (currentTool === 'polygon' && polygonState) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx || !snapshot) return;

      ctx.putImageData(snapshot, 0, 0);
      ctx.beginPath();
      ctx.moveTo(polygonState.points[0].x, polygonState.points[0].y);
      for (let i = 1; i < polygonState.points.length; i++) {
        ctx.lineTo(polygonState.points[i].x, polygonState.points[i].y);
      }
      ctx.closePath();
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = strokeSize;
      ctx.stroke();
      onDraw(canvas.toDataURL());
      setPolygonState(null);
      setIsDrawing(false);
    }
  };

  return (
    <div className="relative shadow-md bg-white" style={{ width, height }} onContextMenu={(e) => e.preventDefault()}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="absolute top-0 left-0 touch-none"
        style={{ cursor: getCursor() }}
        onPointerDown={startDrawing}
        onPointerMove={draw}
        onPointerUp={stopDrawing}
        onDoubleClick={handleDoubleClick}
      />
      <canvas
        ref={overlayCanvasRef}
        width={width}
        height={height}
        className="absolute top-0 left-0 pointer-events-none"
        style={{ zIndex: 45 }}
      />

      {showGridlines && (
        <div 
          className="absolute top-0 left-0 w-full h-full pointer-events-none" 
          style={{
            backgroundImage: 'linear-gradient(to right, rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.1) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
            zIndex: 40
          }}
        />
      )}

      {showRulers && (
        <>
          <div className="absolute top-[-20px] left-0 w-full h-[20px] bg-white border-b border-gray-300 overflow-hidden" style={{ zIndex: 45 }}>
            {Array.from({ length: Math.ceil(width / 100) }).map((_, i) => (
              <div key={i} className="absolute top-0 h-full border-l border-gray-400 text-[10px] text-gray-500 pl-1" style={{ left: i * 100 }}>
                {i * 100}
              </div>
            ))}
          </div>
          <div className="absolute top-0 left-[-20px] w-[20px] h-full bg-white border-r border-gray-300 overflow-hidden" style={{ zIndex: 45 }}>
            {Array.from({ length: Math.ceil(height / 100) }).map((_, i) => (
              <div key={i} className="absolute left-0 w-full border-t border-gray-400 text-[10px] text-gray-500 pt-1 text-center" style={{ top: i * 100, transform: 'rotate(-90deg)', transformOrigin: 'left top', marginTop: i * 100 > 0 ? '20px' : '0' }}>
                {i * 100}
              </div>
            ))}
          </div>
        </>
      )}

      {textInput && (
        <textarea
          autoFocus
          className="absolute bg-transparent border border-blue-500 border-dashed outline-none resize-none overflow-hidden"
          style={{
            left: textInput.x,
            top: textInput.y,
            color: primaryColor,
            fontFamily: 'Arial',
            fontSize: `${Math.max(16, strokeSize * 4)}px`,
            lineHeight: '1.2',
            minWidth: '50px',
            minHeight: '30px',
            padding: 0,
            margin: 0,
            zIndex: 50,
            pointerEvents: 'auto'
          }}
          value={textInput.text}
          onChange={(e) => {
            e.target.style.height = 'auto';
            e.target.style.height = e.target.scrollHeight + 'px';
            e.target.style.width = 'auto';
            e.target.style.width = Math.max(50, e.target.scrollWidth) + 'px';
            setTextInput({...textInput, text: e.target.value});
          }}
          onBlur={() => {
            if (textInput.text.trim() && canvasRef.current) {
              const fontSize = Math.max(16, strokeSize * 4);
              const ctx = canvasRef.current.getContext('2d');
              if (ctx) {
                ctx.font = `${fontSize}px Arial`;
                ctx.fillStyle = primaryColor;
                ctx.textBaseline = 'top';
                const lines = textInput.text.split('\n');
                lines.forEach((line, i) => {
                  ctx.fillText(line, textInput.x, textInput.y + i * (fontSize * 1.2));
                });
                onDraw(canvasRef.current.toDataURL());
              }
            }
            setTextInput(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setTextInput(null);
            }
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              setTextInput(null);
            }
          }}
        />
      )}

      {contextMenu && (
        <div 
          className="fixed z-[100] w-64 bg-[#2b2b2b] border border-[#404040] rounded-md shadow-2xl py-1 text-gray-200 text-sm select-none"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onContextMenu={(e) => e.preventDefault()}
        >
          <button className="w-full flex items-center px-4 py-1.5 hover:bg-white/10 text-left justify-between" onClick={handleCut}>
            <div className="flex items-center"><Scissors size={16} className="mr-3" /> {t('action.cut')}</div>
            <span className="text-xs text-gray-400">Ctrl+X</span>
          </button>
          <button className="w-full flex items-center px-4 py-1.5 hover:bg-white/10 text-left justify-between" onClick={handleCopy}>
            <div className="flex items-center"><Copy size={16} className="mr-3" /> {t('action.copy')}</div>
            <span className="text-xs text-gray-400">Ctrl+C</span>
          </button>
          <button className="w-full flex items-center px-4 py-1.5 hover:bg-white/10 text-left justify-between text-gray-500" disabled>
            <div className="flex items-center"><ClipboardPaste size={16} className="mr-3" /> {t('action.paste')}</div>
            <span className="text-xs text-gray-400">Ctrl+V</span>
          </button>
          <div className="h-px bg-white/10 my-1 mx-2" />
          <button className="w-full flex items-center px-4 py-1.5 hover:bg-white/10 text-left justify-between">
            <div className="flex items-center"><Copy size={16} className="mr-3" /> {t('action.copyVisible')}</div>
            <span className="text-xs text-gray-400">Ctrl+Shift+C</span>
          </button>
          <button className="w-full flex items-center px-4 py-1.5 hover:bg-white/10 text-left justify-between" onClick={handleCrop}>
            <div className="flex items-center"><Crop size={16} className="mr-3" /> {t('action.crop')}</div>
            <span className="text-xs text-gray-400">Ctrl+Shift+X</span>
          </button>
          <button className="w-full flex items-center px-4 py-1.5 hover:bg-white/10 text-left justify-between" onClick={handleSelectAll}>
            <div className="flex items-center"><Maximize2 size={16} className="mr-3" /> {t('action.selectAll')}</div>
            <span className="text-xs text-gray-400">Ctrl+A</span>
          </button>
          <button className="w-full flex items-center px-4 py-1.5 hover:bg-white/10 text-left text-gray-500" disabled>
            <div className="flex items-center"><SquareDashed size={16} className="mr-3" /> {t('action.invertSelect')}</div>
          </button>
          <button className="w-full flex items-center px-4 py-1.5 hover:bg-white/10 text-left justify-between" onClick={handleDelete}>
            <div className="flex items-center"><Trash2 size={16} className="mr-3" /> {t('action.delete')}</div>
            <span className="text-xs text-gray-400">Delete</span>
          </button>
          <div className="h-px bg-white/10 my-1 mx-2" />
          <button className="w-full flex items-center px-4 py-1.5 hover:bg-white/10 text-left text-gray-500" disabled>
            <div className="flex items-center"><ImageIcon size={16} className="mr-3" /> {t('action.removeBg')}</div>
          </button>
          <button className="w-full flex items-center px-4 py-1.5 hover:bg-white/10 text-left text-gray-500" disabled>
            <div className="flex items-center"><Sparkles size={16} className="mr-3" /> {t('action.genRemove')}</div>
          </button>
          <div className="h-px bg-white/10 my-1 mx-2" />
          <button 
            className="w-full flex items-center px-4 py-1.5 hover:bg-white/10 text-left justify-between"
            onClick={rotateSelection}
          >
            <div className="flex items-center"><RotateCw size={16} className="mr-3" /> {t('action.rotate')}</div>
          </button>
          <button
            className="w-full flex items-center px-4 py-1.5 hover:bg-white/10 text-left justify-between"
            onClick={() => flipSelection(true)}
          >
            <div className="flex items-center"><ArrowLeftRight size={16} className="mr-3" /> {t('action.flip')}</div>
          </button>
          <button className="w-full flex items-center px-4 py-1.5 hover:bg-white/10 text-left justify-between" onClick={() => window.dispatchEvent(new CustomEvent('request-resize'))}>
            <div className="flex items-center"><Maximize2 size={16} className="mr-3" /> {t('action.resize')}</div>
            <span className="text-xs text-gray-400">Ctrl+E</span>
          </button>
          <button className="w-full flex items-center px-4 py-1.5 hover:bg-white/10 text-left justify-between" onClick={handleInvertColor}>
            <div className="flex items-center"><ImageIcon size={16} className="mr-3" /> {t('action.invert')}</div>
            <span className="text-xs text-gray-400">Ctrl+Shift+I</span>
          </button>
        </div>
      )}
    </div>
  );
}
