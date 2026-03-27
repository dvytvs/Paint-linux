import React, { useState, useEffect, useRef } from 'react';
import Toolbar from './components/Toolbar';
import DrawingCanvas from './components/DrawingCanvas';
import { Tool } from './types';
import { t } from './i18n';
import { 
  MousePointer2, Square, Minus, X, Undo, Redo, Maximize2, ZoomIn, ZoomOut, Settings, Download,
  File, FolderOpen, Clock, Save, FileEdit, Printer, Share, Monitor, Image as ImageIcon, ChevronRight,
  Scissors, Copy, ClipboardPaste, Check, Expand, PictureInPicture2
} from 'lucide-react';

export default function App() {
  const [currentTool, setCurrentTool] = useState<Tool>('pencil');
  const [primaryColor, setPrimaryColor] = useState<string>('#000000');
  const [secondaryColor, setSecondaryColor] = useState<string>('#ffffff');
  const [strokeSize, setStrokeSize] = useState<number>(3);
  const [canvasSize, setCanvasSize] = useState({ width: 1536, height: 960 });
  const [isFileMenuOpen, setIsFileMenuOpen] = useState(false);
  const [isEditMenuOpen, setIsEditMenuOpen] = useState(false);
  const [isViewMenuOpen, setIsViewMenuOpen] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [currentFile, setCurrentFile] = useState<{name: string, path?: string, date?: Date, size?: number} | null>(null);
  const [printers, setPrinters] = useState<any[]>([]);
  const [showExitPrompt, setShowExitPrompt] = useState(false);
  const [showProperties, setShowProperties] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [historyStep, setHistoryStep] = useState<number>(-1);
  const historyRef = useRef(history);
  const historyStepRef = useRef(historyStep);

  useEffect(() => {
    historyRef.current = history;
    historyStepRef.current = historyStep;
  }, [history, historyStep]);
  const [zoom, setZoom] = useState<number>(1);
  const [isResizingCanvas, setIsResizingCanvas] = useState<'e' | 's' | 'se' | null>(null);
  const [resizeStart, setResizeStart] = useState<{x: number, y: number, w: number, h: number} | null>(null);
  const [pastedImage, setPastedImage] = useState<{src: string, id: number} | null>(null);
  const [mousePos, setMousePos] = useState<{x: number, y: number} | null>(null);
  const [showRulers, setShowRulers] = useState(false);
  const [showGridlines, setShowGridlines] = useState(false);
  const [showStatusBar, setShowStatusBar] = useState(true);
  const [showThumbnail, setShowThumbnail] = useState(false);
  const [thumbnailPos, setThumbnailPos] = useState({ x: 16, y: 16 });
  const [isDraggingThumbnail, setIsDraggingThumbnail] = useState(false);
  const [thumbnailDragStart, setThumbnailDragStart] = useState({ x: 0, y: 0 });
  const fileMenuRef = React.useRef<HTMLButtonElement>(null);
  const editMenuRef = React.useRef<HTMLButtonElement>(null);
  const viewMenuRef = React.useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setZoom(prev => Math.max(0.1, Math.min(5, prev + delta)));
      }
    };
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  // Initialize history with blank canvas or restore on resize
  useEffect(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        if (historyRef.current.length === 0) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);
          const dataUrl = canvasRef.current.toDataURL();
          setHistory([dataUrl]);
          setHistoryStep(0);
          historyRef.current = [dataUrl];
          historyStepRef.current = 0;
        } else if (historyStepRef.current >= 0) {
          // Restore the current history step when canvas resizes
          const img = new Image();
          img.onload = () => {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);
            ctx.drawImage(img, 0, 0);
          };
          img.src = historyRef.current[historyStepRef.current];
        }
      }
    }
  }, [canvasSize]);

  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.getPrinters().then(p => setPrinters(p));
      
      window.electronAPI.onCloseRequested(() => {
        handleExit();
      });
      
      return () => {
        window.electronAPI?.offCloseRequested();
      };
    }
  }, [hasUnsavedChanges]);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData && e.clipboardData.items) {
        for (let i = 0; i < e.clipboardData.items.length; i++) {
          const item = e.clipboardData.items[i];
          if (item.type.indexOf('image') !== -1) {
            const file = item.getAsFile();
            if (file) {
              const reader = new FileReader();
              reader.onload = (event) => {
                const dataUrl = event.target?.result as string;
                const img = new Image();
                img.onload = () => {
                  const newWidth = Math.max(img.width, canvasSize.width);
                  const newHeight = Math.max(img.height, canvasSize.height);

                  if (newWidth !== canvasSize.width || newHeight !== canvasSize.height) {
                    setCanvasSize({ width: newWidth, height: newHeight });
                    setTimeout(() => {
                      setPastedImage({ src: dataUrl, id: Date.now() });
                      setCurrentTool('select');
                    }, 50);
                  } else {
                    setPastedImage({ src: dataUrl, id: Date.now() });
                    setCurrentTool('select');
                  }
                };
                img.src = dataUrl;
              };
              reader.readAsDataURL(file);
            }
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [canvasSize.width, canvasSize.height]);

  useEffect(() => {
    const handlePasteImage = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      const dataUrl = customEvent.detail;
      const img = new Image();
      img.onload = () => {
        const newWidth = Math.max(img.width, canvasSize.width);
        const newHeight = Math.max(img.height, canvasSize.height);

        if (newWidth !== canvasSize.width || newHeight !== canvasSize.height) {
          setCanvasSize({ width: newWidth, height: newHeight });
          setTimeout(() => {
            setPastedImage({ src: dataUrl, id: Date.now() });
            setCurrentTool('select');
          }, 50);
        } else {
          setPastedImage({ src: dataUrl, id: Date.now() });
          setCurrentTool('select');
        }
      };
      img.src = dataUrl;
    };

    window.addEventListener('paste-image', handlePasteImage);
    return () => window.removeEventListener('paste-image', handlePasteImage);
  }, [canvasSize.width, canvasSize.height]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.code === 'KeyN') { e.preventDefault(); handleNew(); }
      if (e.ctrlKey && e.code === 'KeyO') { e.preventDefault(); handleOpen(); }
      if (e.ctrlKey && e.code === 'KeyS') { e.preventDefault(); handleSave(false); }
      if (e.ctrlKey && e.code === 'KeyE') { e.preventDefault(); setShowProperties(true); }
      if (e.ctrlKey && e.code === 'KeyA') { e.preventDefault(); window.dispatchEvent(new CustomEvent('request-select-all')); }
      if (e.ctrlKey && e.code === 'KeyC') { e.preventDefault(); window.dispatchEvent(new CustomEvent('request-copy')); }
      if (e.ctrlKey && e.code === 'KeyX') { e.preventDefault(); window.dispatchEvent(new CustomEvent('request-cut')); }
      if (e.ctrlKey && e.code === 'KeyV') { e.preventDefault(); window.dispatchEvent(new CustomEvent('request-paste')); }
      if (e.ctrlKey && e.code === 'KeyQ') { e.preventDefault(); handleExit(); }
      if (e.ctrlKey && e.code === 'KeyW') { e.preventDefault(); window.dispatchEvent(new CustomEvent('clear-selection')); }
      if (e.ctrlKey && e.shiftKey && e.code === 'KeyX') { e.preventDefault(); window.dispatchEvent(new CustomEvent('request-crop')); }
      if (e.ctrlKey && e.code === 'KeyR') { e.preventDefault(); setShowRulers(prev => !prev); }
      if (e.ctrlKey && e.code === 'KeyG') { e.preventDefault(); setShowGridlines(prev => !prev); }
      if (e.code === 'F11') {
        e.preventDefault();
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(err => console.log(err));
        } else {
          document.exitFullscreen().catch(err => console.log(err));
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentFile, hasUnsavedChanges]);

  useEffect(() => {
    const handleZoomIn = () => setZoom(prev => Math.min(5, prev + 0.25));
    const handleZoomOut = () => setZoom(prev => Math.max(0.1, prev - 0.25));
    const handleResize = () => setShowProperties(true);
    const handleResizeCanvas = (e: any) => {
      if (e.detail && e.detail.width && e.detail.height) {
        setCanvasSize({ width: e.detail.width, height: e.detail.height });
        if (e.detail.dataUrl) {
          const newHistory = historyRef.current.slice(0, historyStepRef.current + 1);
          newHistory.push(e.detail.dataUrl);
          setHistory(newHistory);
          setHistoryStep(newHistory.length - 1);
          setHasUnsavedChanges(true);
          historyRef.current = newHistory;
          historyStepRef.current = newHistory.length - 1;
        }
      }
    };

    window.addEventListener('request-zoom-in', handleZoomIn);
    window.addEventListener('request-zoom-out', handleZoomOut);
    window.addEventListener('request-resize', handleResize);
    window.addEventListener('resize-canvas', handleResizeCanvas);
    
    return () => {
      window.removeEventListener('request-zoom-in', handleZoomIn);
      window.removeEventListener('request-zoom-out', handleZoomOut);
      window.removeEventListener('request-resize', handleResize);
      window.removeEventListener('resize-canvas', handleResizeCanvas);
    };
  }, []);

  useEffect(() => {
    if (!isResizingCanvas || !resizeStart) return;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = (e.clientX - resizeStart.x) / zoom;
      const dy = (e.clientY - resizeStart.y) / zoom;
      
      let newWidth = resizeStart.w;
      let newHeight = resizeStart.h;

      if (isResizingCanvas === 'e' || isResizingCanvas === 'se') {
        newWidth = Math.max(10, resizeStart.w + dx);
      }
      if (isResizingCanvas === 's' || isResizingCanvas === 'se') {
        newHeight = Math.max(10, resizeStart.h + dy);
      }

      setCanvasSize({ width: Math.round(newWidth), height: Math.round(newHeight) });
    };

    const handleMouseUp = () => {
      setIsResizingCanvas(null);
      setResizeStart(null);
      
      // Save state after resize
      setTimeout(() => {
        if (canvasRef.current) {
          handleDraw(canvasRef.current.toDataURL());
        }
      }, 50);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingCanvas, resizeStart, zoom]);

  const handleDraw = (dataUrl?: string) => {
    setHasUnsavedChanges(true);
    if (dataUrl) {
      const newHistory = history.slice(0, historyStep + 1);
      newHistory.push(dataUrl);
      setHistory(newHistory);
      setHistoryStep(newHistory.length - 1);
      historyRef.current = newHistory;
      historyStepRef.current = newHistory.length - 1;
    }
  };

  const handleUndo = () => {
    if (historyStep > 0) {
      const newStep = historyStep - 1;
      setHistoryStep(newStep);
      historyStepRef.current = newStep;
      restoreCanvas(history[newStep]);
    }
  };

  const handleRedo = () => {
    if (historyStep < history.length - 1) {
      const newStep = historyStep + 1;
      setHistoryStep(newStep);
      historyStepRef.current = newStep;
      restoreCanvas(history[newStep]);
    }
  };

  useEffect(() => {
    const handleUndoRedoKeys = (e: KeyboardEvent) => {
      if (e.ctrlKey && !e.shiftKey && e.code === 'KeyZ') {
        e.preventDefault();
        handleUndo();
      }
      if ((e.ctrlKey && e.code === 'KeyY') || (e.ctrlKey && e.shiftKey && e.code === 'KeyZ')) {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', handleUndoRedoKeys);
    return () => window.removeEventListener('keydown', handleUndoRedoKeys);
  }, [history, historyStep]);

  const restoreCanvas = (dataUrl: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
    img.src = dataUrl;
  };

  const handleNew = () => {
    if (window.electronAPI) window.electronAPI.newWindow();
  };

  const handleOpen = async () => {
    if (window.electronAPI) {
      const file = await window.electronAPI.openFile();
      if (file) {
        const img = new Image();
        img.onload = () => {
          const newWidth = img.width;
          const newHeight = img.height;
          
          const offCanvas = document.createElement('canvas');
          offCanvas.width = newWidth;
          offCanvas.height = newHeight;
          const offCtx = offCanvas.getContext('2d');
          if (offCtx) {
            offCtx.fillStyle = '#ffffff';
            offCtx.fillRect(0, 0, newWidth, newHeight);
            offCtx.drawImage(img, 0, 0);
            
            const newDataUrl = offCanvas.toDataURL();
            setHistory([newDataUrl]);
            setHistoryStep(0);
            setCanvasSize({ width: newWidth, height: newHeight });
          }
          
          setCurrentFile(file);
          setHasUnsavedChanges(false);
        };
        img.src = file.dataUrl;
      }
    }
  };

  const handleSave = async (saveAs = false) => {
    window.dispatchEvent(new Event('commit-selection'));
    if (window.electronAPI && canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      const defaultPath = !saveAs && currentFile?.path ? currentFile.path : (currentFile?.name || 'Untitled.png');
      const savedPath = await window.electronAPI.saveFile({ dataUrl, defaultPath });
      if (savedPath) {
        setCurrentFile(prev => ({ ...prev, name: savedPath.split('/').pop() || 'Untitled.png', path: savedPath }));
        setHasUnsavedChanges(false);
      }
    } else if (canvasRef.current) {
      // Fallback for browser environment
      const dataUrl = canvasRef.current.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = currentFile?.name || 'Untitled.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setHasUnsavedChanges(false);
    }
  };

  const handlePrint = async () => {
    if (window.electronAPI && printers.length > 0) {
      await window.electronAPI.print();
    }
  };

  const handleShare = async () => {
    window.dispatchEvent(new Event('commit-selection'));
    if (window.electronAPI && canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      await window.electronAPI.share(dataUrl);
    }
  };

  const handleSetWallpaper = async () => {
    window.dispatchEvent(new Event('commit-selection'));
    if (window.electronAPI && canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      await window.electronAPI.setWallpaper(dataUrl);
    }
  };

  const handleExit = () => {
    if (hasUnsavedChanges) {
      setShowExitPrompt(true);
    } else {
      if (window.electronAPI) window.electronAPI.exit(true);
    }
  };

  const confirmExit = async (save: boolean) => {
    if (save) {
      await handleSave(false);
    }
    if (window.electronAPI) window.electronAPI.exit(true);
  };

  const closeMenus = () => {
    setIsFileMenuOpen(false);
    setIsEditMenuOpen(false);
    setIsViewMenuOpen(false);
  };

  const MenuItem = ({ icon: Icon, label, shortcut, hasSubmenu, disabled, onClick }: any) => (
    <button 
      className={`w-full flex items-center px-3 py-1.5 ${disabled ? 'text-gray-500' : 'hover:bg-white/10'} text-left`}
      disabled={disabled}
      onClick={() => {
        if (!hasSubmenu) closeMenus();
        if (onClick) onClick();
      }}
    >
      {Icon ? <Icon size={16} className="mr-3" strokeWidth={1.5} /> : <div className="w-4 mr-3" />}
      <span className="flex-1 text-[13px]">{label}</span>
      {shortcut && <span className="text-xs text-gray-400 ml-4">{shortcut}</span>}
      {hasSubmenu && <ChevronRight size={16} className="text-gray-400 ml-4" />}
    </button>
  );

  const MenuDivider = () => <div className="h-px bg-white/10 my-1 mx-3" />;

  return (
    <div className="flex flex-col h-screen bg-[#202020] text-gray-300 font-sans select-none overflow-auto">

      {/* Title Bar */}
      <div className="h-10 w-full flex items-center justify-between px-3 flex-shrink-0" style={{ WebkitAppRegion: 'drag' } as any}>
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-4 h-4 rounded-sm bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0">
             <div className="w-2 h-2 bg-white rounded-full opacity-80"></div>
          </div>
          <span className="text-xs font-medium text-gray-200 truncate">{currentFile?.name || t('ui.untitled')} - Paint {hasUnsavedChanges && '*'}</span>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0" style={{ WebkitAppRegion: 'no-drag' } as any}>
          <div className="flex items-center gap-3 text-gray-400">
            <Minus size={16} className="cursor-pointer hover:text-white flex-shrink-0" onClick={() => window.electronAPI?.windowControl('minimize')} />
            <Square size={14} className="cursor-pointer hover:text-white flex-shrink-0" onClick={() => window.electronAPI?.windowControl('maximize')} />
            <X size={16} className="cursor-pointer hover:text-white flex-shrink-0" onClick={() => handleExit()} />
          </div>
        </div>
      </div>

      {/* Menu Bar */}
      <div className="h-8 w-full flex items-center px-2 text-xs gap-1 border-b border-black/40 relative z-[60] flex-shrink-0">
        <button
          ref={fileMenuRef}
          className={`px-3 py-1.5 rounded cursor-pointer transition-colors ${isFileMenuOpen ? 'bg-white/10' : 'hover:bg-white/10'}`}
          onClick={() => {
            setIsFileMenuOpen(!isFileMenuOpen);
            setIsEditMenuOpen(false);
            setIsViewMenuOpen(false);
          }}
        >
          {t('menu.file')}
        </button>
        <button
          ref={editMenuRef}
          className={`px-3 py-1.5 rounded cursor-pointer transition-colors ${isEditMenuOpen ? 'bg-white/10' : 'hover:bg-white/10'}`}
          onClick={() => {
            setIsEditMenuOpen(!isEditMenuOpen);
            setIsFileMenuOpen(false);
            setIsViewMenuOpen(false);
          }}
        >
          {t('menu.edit')}
        </button>
        <button
          ref={viewMenuRef}
          className={`px-3 py-1.5 rounded cursor-pointer transition-colors ${isViewMenuOpen ? 'bg-white/10' : 'hover:bg-white/10'}`}
          onClick={() => {
            setIsViewMenuOpen(!isViewMenuOpen);
            setIsFileMenuOpen(false);
            setIsEditMenuOpen(false);
          }}
        >
          {t('menu.view')}
        </button>
        
        <div className="w-px h-4 bg-white/20 mx-2"></div>
        
        <button 
          className={`p-1.5 rounded transition-colors ${historyStep > 0 ? 'hover:bg-white/10 text-gray-300 cursor-pointer' : 'text-gray-600 cursor-default'}`}
          onClick={handleUndo}
          disabled={historyStep <= 0}
        >
          <Undo size={14} />
        </button>
        <button 
          className={`p-1.5 rounded transition-colors ${historyStep < history.length - 1 ? 'hover:bg-white/10 text-gray-300 cursor-pointer' : 'text-gray-600 cursor-default'}`}
          onClick={handleRedo}
          disabled={historyStep >= history.length - 1}
        >
          <Redo size={14} />
        </button>
        
        <div className="flex-1"></div>
        
        <button className="p-1.5 hover:bg-white/10 rounded text-gray-300 mr-1" onClick={() => handleSave(false)}><Download size={14} /></button>
        <button className="p-1.5 hover:bg-white/10 rounded text-gray-300 mr-2" onClick={() => setShowProperties(true)}><Settings size={14} /></button>

        {/* Menus Overlay */}
        {(isFileMenuOpen || isEditMenuOpen || isViewMenuOpen) && (
          <div className="fixed inset-0 z-40" onClick={closeMenus}></div>
        )}

        {/* File Menu Dropdown */}
        {isFileMenuOpen && fileMenuRef.current && (
          <div className="fixed bg-[#2b2b2b] border border-[#404040] rounded-md shadow-2xl z-50 py-1.5 text-gray-200"
            style={{
              top: fileMenuRef.current.getBoundingClientRect().bottom + window.scrollY,
              left: fileMenuRef.current.getBoundingClientRect().left + window.scrollX
            }}
          >
            <MenuItem icon={File} label={t('action.new')} shortcut="Ctrl+N" onClick={handleNew} />
            <MenuItem icon={FolderOpen} label={t('action.open')} shortcut="Ctrl+O" onClick={handleOpen} />
            <MenuItem icon={Clock} label={t('action.recent')} hasSubmenu disabled />
            <MenuDivider />
            <MenuItem icon={Save} label={t('action.save')} shortcut="Ctrl+S" onClick={() => handleSave(false)} />
            <MenuItem icon={FileEdit} label={t('action.saveAs')} onClick={() => handleSave(true)} />
            <MenuDivider />
            <MenuItem icon={Printer} label={t('action.print')} onClick={handlePrint} disabled={printers.length === 0} />
            <MenuItem icon={Share} label={t('action.share')} onClick={handleShare} />
            <MenuDivider />
            <MenuItem icon={Monitor} label={t('action.setWallpaper')} onClick={handleSetWallpaper} />
            <MenuDivider />
            <MenuItem icon={ImageIcon} label={t('action.properties')} shortcut="Ctrl+E" onClick={() => setShowProperties(true)} />
            <MenuDivider />
            <MenuItem icon={X} label={t('action.exit')} onClick={handleExit} />
          </div>
        )}

        {/* Edit Menu Dropdown */}
        {isEditMenuOpen && editMenuRef.current && (
          <div className="fixed bg-[#2b2b2b] border border-[#404040] rounded-md shadow-2xl z-50 py-1.5 text-gray-200"
            style={{
              top: editMenuRef.current.getBoundingClientRect().bottom + window.scrollY,
              left: editMenuRef.current.getBoundingClientRect().left + window.scrollX
            }}
          >
            <MenuItem icon={Scissors} label={t('action.cut')} shortcut="Ctrl+X" onClick={() => { window.dispatchEvent(new CustomEvent('request-cut')); closeMenus(); }} />
            <MenuItem icon={Copy} label={t('action.copy')} shortcut="Ctrl+C" onClick={() => { window.dispatchEvent(new CustomEvent('request-copy')); closeMenus(); }} />
            <MenuItem icon={ClipboardPaste} label={t('action.paste')} shortcut="Ctrl+V" onClick={() => { window.dispatchEvent(new CustomEvent('request-paste')); closeMenus(); }} />
          </div>
        )}

        {/* View Menu Dropdown */}
        {isViewMenuOpen && viewMenuRef.current && (
          <div className="fixed bg-[#2b2b2b] border border-[#404040] rounded-md shadow-2xl z-50 py-1.5 text-gray-200"
            style={{
              top: viewMenuRef.current.getBoundingClientRect().bottom + window.scrollY,
              left: viewMenuRef.current.getBoundingClientRect().left + window.scrollX
            }}
          >
            <MenuItem icon={ZoomIn} label={t('action.zoomIn')} shortcut="Ctrl++" onClick={() => setZoom(prev => Math.min(5, prev + 0.25))} />
            <MenuItem icon={ZoomOut} label={t('action.zoomOut')} shortcut="Ctrl+-" onClick={() => setZoom(prev => Math.max(0.1, prev - 0.25))} />
            <MenuDivider />
            <MenuItem icon={showRulers ? Check : undefined} label={t('action.rulers')} shortcut="Ctrl+R" onClick={() => setShowRulers(prev => !prev)} />
            <MenuItem icon={showGridlines ? Check : undefined} label={t('action.gridlines')} shortcut="Ctrl+G" onClick={() => setShowGridlines(prev => !prev)} />
            <MenuItem icon={showStatusBar ? Check : undefined} label={t('action.statusBar')} onClick={() => setShowStatusBar(prev => !prev)} />
            <MenuDivider />
            <MenuItem icon={Expand} label={t('action.fullscreen')} shortcut="F11" onClick={() => {
              if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(err => console.log(err));
              } else {
                document.exitFullscreen().catch(err => console.log(err));
              }
            }} />
            <MenuItem icon={showThumbnail ? Check : undefined} label={t('action.thumbnail')} onClick={() => setShowThumbnail(prev => !prev)} />
          </div>
        )}
      </div>

      {/* Ribbon / Toolbar */}
      <Toolbar
        currentTool={currentTool}
        setCurrentTool={setCurrentTool}
        primaryColor={primaryColor}
        setPrimaryColor={setPrimaryColor}
        secondaryColor={secondaryColor}
        setSecondaryColor={setSecondaryColor}
        strokeSize={strokeSize}
        setStrokeSize={setStrokeSize}
      />

      {/* Canvas Area */}
      <div 
        ref={canvasContainerRef}
        className="flex-1 overflow-auto bg-[#202020] p-8 relative"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files[0];
          if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const dataUrl = event.target?.result as string;
              const img = new Image();
              img.onload = () => {
                const newWidth = Math.max(img.width, canvasSize.width);
                const newHeight = Math.max(img.height, canvasSize.height);

                if (newWidth !== canvasSize.width || newHeight !== canvasSize.height) {
                  setCanvasSize({ width: newWidth, height: newHeight });
                  // Wait for canvas to resize before setting pasted image
                  setTimeout(() => {
                    setPastedImage({ src: dataUrl, id: Date.now() });
                    setCurrentTool('select');
                  }, 50);
                } else {
                  setPastedImage({ src: dataUrl, id: Date.now() });
                  setCurrentTool('select');
                }
                
                setCurrentFile({ name: file.name, size: file.size, date: new Date(file.lastModified) });
                setHasUnsavedChanges(true);
              };
              img.src = dataUrl;
            };
            reader.readAsDataURL(file);
          }
        }}
      >
        
        {/* Vertical Stroke Slider */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-64 bg-[#2d2d2d] rounded-full border border-white/10 flex flex-col items-center py-4 shadow-lg z-10">
           <div className="w-4 h-1 bg-gray-400 rounded-full mb-2"></div>
           <div className="flex-1 w-1 bg-gray-600 rounded-full relative">
              <input 
                type="range" 
                min="1" 
                max="50" 
                value={strokeSize}
                onChange={(e) => setStrokeSize(parseInt(e.target.value))}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-1 appearance-none bg-transparent cursor-pointer -rotate-90 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-[#4cc2ff] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-[#202020]"
              />
           </div>
           <div className="w-1 h-1 bg-gray-400 rounded-full mt-2"></div>
        </div>

        {/* Thumbnail Window */}
        {showThumbnail && history[historyStep] && (
          <div
            className="fixed w-56 bg-[#2b2b2b] border border-[#404040] rounded shadow-2xl z-40 overflow-hidden flex flex-col"
            style={{ top: Math.max(120, thumbnailPos.y), right: thumbnailPos.x }}
          >
            <div
              className="bg-[#1e1e1e] px-2 py-1 text-xs text-gray-400 flex justify-between items-center border-b border-[#404040] cursor-move select-none"
              onPointerDown={(e) => {
                setIsDraggingThumbnail(true);
                setThumbnailDragStart({ x: e.clientX, y: e.clientY });
                e.currentTarget.setPointerCapture(e.pointerId);
              }}
              onPointerMove={(e) => {
                if (isDraggingThumbnail) {
                  const dx = e.clientX - thumbnailDragStart.x;
                  const dy = e.clientY - thumbnailDragStart.y;
                  setThumbnailPos(prev => ({ x: Math.max(0, prev.x - dx), y: Math.max(120, prev.y + dy) }));
                  setThumbnailDragStart({ x: e.clientX, y: e.clientY });
                }
              }}
              onPointerUp={(e) => {
                setIsDraggingThumbnail(false);
                e.currentTarget.releasePointerCapture(e.pointerId);
              }}
              onPointerCancel={(e) => {
                setIsDraggingThumbnail(false);
                e.currentTarget.releasePointerCapture(e.pointerId);
              }}
            >
              <span>{t('action.thumbnail')}</span>
              <button onClick={() => setShowThumbnail(false)} className="hover:text-white cursor-pointer">&times;</button>
            </div>
            <div className="p-2 bg-white/5 flex-1 flex justify-center items-center min-h-[180px]">
              <img
                src={history[historyStep]}
                alt="Thumbnail"
                className="w-full h-full object-contain bg-white"
                style={{ maxHeight: '300px' }}
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        )}

        {/* Canvas Container with Resize Handles */}
        <div 
          style={{ width: Math.max(canvasSize.width * zoom, 100), height: Math.max(canvasSize.height * zoom, 100) }} 
          className="relative m-auto"
        >
          <div 
            className="absolute top-0 left-0 bg-white shadow-sm"
            style={{ 
              width: canvasSize.width, 
              height: canvasSize.height,
              transform: `scale(${zoom})`,
              transformOrigin: 'top left'
            }}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = Math.round((e.clientX - rect.left) / zoom);
              const y = Math.round((e.clientY - rect.top) / zoom);
              setMousePos({ x, y });
            }}
            onMouseLeave={() => setMousePos(null)}
          >
            <DrawingCanvas
              currentTool={currentTool}
              setCurrentTool={setCurrentTool}
              primaryColor={primaryColor}
              secondaryColor={secondaryColor}
              strokeSize={strokeSize}
              width={canvasSize.width}
              height={canvasSize.height}
              canvasRef={canvasRef}
              onDraw={handleDraw}
              showRulers={showRulers}
              showGridlines={showGridlines}
              onColorPick={(color, isSecondary) => {
                if (isSecondary) setSecondaryColor(color);
                else setPrimaryColor(color);
                window.dispatchEvent(new CustomEvent('add-custom-color', { detail: color }));
              }}
              pastedImage={pastedImage}
            />
            
            {/* Resize Handles */}
            <div 
              className="absolute top-1/2 -right-1.5 w-3 h-3 bg-white border border-gray-400 cursor-e-resize -translate-y-1/2"
              onMouseDown={(e) => {
                e.preventDefault();
                setIsResizingCanvas('e');
                setResizeStart({ x: e.clientX, y: e.clientY, w: canvasSize.width, h: canvasSize.height });
              }}
            ></div>
            <div 
              className="absolute -bottom-1.5 left-1/2 w-3 h-3 bg-white border border-gray-400 cursor-s-resize -translate-x-1/2"
              onMouseDown={(e) => {
                e.preventDefault();
                setIsResizingCanvas('s');
                setResizeStart({ x: e.clientX, y: e.clientY, w: canvasSize.width, h: canvasSize.height });
              }}
            ></div>
            <div 
              className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border border-gray-400 cursor-se-resize"
              onMouseDown={(e) => {
                e.preventDefault();
                setIsResizingCanvas('se');
                setResizeStart({ x: e.clientX, y: e.clientY, w: canvasSize.width, h: canvasSize.height });
              }}
            ></div>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      {showStatusBar && (
        <div className="h-8 bg-[#202020] border-t border-black/40 flex items-center px-4 text-[11px] text-gray-400 justify-between">
          <div className="flex gap-6">
            <div className="flex items-center gap-1.5 hover:bg-white/5 px-2 py-1 rounded cursor-pointer">
              <MousePointer2 size={12} />
              <span>{mousePos ? `${mousePos.x}, ${mousePos.y} px` : ''}</span>
            </div>
            <div className="flex items-center gap-1.5 hover:bg-white/5 px-2 py-1 rounded cursor-pointer">
              <Square size={12} />
              <span>{canvasSize.width} × {canvasSize.height}px</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Maximize2 size={12} className="cursor-pointer hover:text-white mr-2" onClick={() => setZoom(1)} />
            <span className="w-10 text-right">{Math.round(zoom * 100)}%</span>
            <ZoomOut size={14} className="cursor-pointer hover:text-white" onClick={() => setZoom(prev => Math.max(0.1, prev - 0.1))} />
            <input 
              type="range" 
              min="0.1" 
              max="5" 
              step="0.1" 
              value={zoom} 
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-24 h-1 bg-gray-600 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-gray-300 [&::-webkit-slider-thumb]:rounded-sm"
            />
            <ZoomIn size={14} className="cursor-pointer hover:text-white" onClick={() => setZoom(prev => Math.min(5, prev + 0.1))} />
          </div>
        </div>
      )}

      {/* Modals */}
      {showProperties && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
          <div className="bg-[#2b2b2b] border border-[#404040] rounded-lg shadow-2xl w-80 p-4 text-gray-200">
            <h2 className="text-lg font-semibold mb-4">{t('action.properties')}</h2>
            <div className="space-y-4 text-sm">
              <div>
                <p><span className="text-gray-400">{t('ui.fileName')}:</span> {currentFile?.name || t('ui.untitled')}</p>
                <p><span className="text-gray-400">{t('ui.dateModified')}:</span> {currentFile?.date ? new Date(currentFile.date).toLocaleString() : 'N/A'}</p>
                <p><span className="text-gray-400">{t('ui.size')}:</span> {currentFile?.size ? (currentFile.size / 1024).toFixed(2) + ' KB' : 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-400 mb-2">{t('ui.resolution')}:</p>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    className="w-20 bg-[#1e1e1e] border border-[#404040] rounded px-2 py-1" 
                    defaultValue={canvasSize.width} 
                    id="prop-width"
                  />
                  <span>x</span>
                  <input 
                    type="number" 
                    className="w-20 bg-[#1e1e1e] border border-[#404040] rounded px-2 py-1" 
                    defaultValue={canvasSize.height} 
                    id="prop-height"
                  />
                  <span>px</span>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button 
                className="px-4 py-1.5 bg-[#4cc2ff] text-black hover:bg-[#3ab0ff] rounded font-medium" 
                onClick={() => {
                  const w = parseInt((document.getElementById('prop-width') as HTMLInputElement).value);
                  const h = parseInt((document.getElementById('prop-height') as HTMLInputElement).value);
                  if (w > 0 && h > 0) {
                    setCanvasSize({ width: w, height: h });
                  }
                  setShowProperties(false);
                }}
              >
                {t('ui.ok')}
              </button>
              <button className="px-4 py-1.5 bg-white/10 hover:bg-white/20 rounded" onClick={() => setShowProperties(false)}>{t('ui.cancel')}</button>
            </div>
          </div>
        </div>
      )}

      {showExitPrompt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
          <div className="bg-[#2b2b2b] border border-[#404040] rounded-lg shadow-2xl w-96 p-4 text-gray-200">
            <h2 className="text-lg font-semibold mb-2">Paint</h2>
            <p className="mb-6">{t('ui.savePrompt')} {currentFile?.name || t('ui.untitled')}?</p>
            <div className="flex justify-end gap-2 text-sm">
              <button className="px-4 py-1.5 bg-[#4cc2ff] text-black hover:bg-[#3ab0ff] rounded font-medium" onClick={() => confirmExit(true)}>{t('action.save')}</button>
              <button className="px-4 py-1.5 bg-white/10 hover:bg-white/20 rounded" onClick={() => confirmExit(false)}>{t('action.dontSave')}</button>
              <button className="px-4 py-1.5 bg-white/10 hover:bg-white/20 rounded" onClick={() => setShowExitPrompt(false)}>{t('ui.cancel')}</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
