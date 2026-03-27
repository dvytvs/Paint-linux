import React from 'react';
import {
  Pencil, Eraser, PaintBucket, Type, Pipette, Search,
  Crop, Maximize, RotateCw,
  Minus, Square, Circle, Triangle,
  Brush, ChevronDown, Sparkles, Layers,
  SquareDashed, Hexagon, Pentagon, Diamond, Star, MessageCircle,
  LassoSelect, Maximize2, Trash2, ArrowRight, ArrowLeft, ArrowUp, ArrowDown, Heart, Zap, Cloud
} from 'lucide-react';
import { Tool } from '../types';
import { t } from '../i18n';

interface ToolbarProps {
  currentTool: Tool;
  setCurrentTool: (t: Tool) => void;
  primaryColor: string;
  setPrimaryColor: (c: string) => void;
  secondaryColor: string;
  setSecondaryColor: (c: string) => void;
  strokeSize: number;
  setStrokeSize: (s: number) => void;
}

const ToolBtn = ({ icon, active, onClick, label }: { icon: React.ReactNode, active: boolean, onClick: () => void, label?: string }) => (
  <button
    title={label}
    className={`p-1.5 rounded flex items-center justify-center transition-colors ${active ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-gray-300'}`}
    onClick={onClick}
  >
    {icon}
  </button>
);

export default function Toolbar({
  currentTool, setCurrentTool,
  primaryColor, setPrimaryColor,
  secondaryColor, setSecondaryColor,
  strokeSize, setStrokeSize
}: ToolbarProps) {
  const brushesRef = React.useRef<HTMLButtonElement>(null);
  const brushesMenuRef = React.useRef<HTMLDivElement>(null);
  const sizeRef = React.useRef<HTMLButtonElement>(null);
  const sizeMenuRef = React.useRef<HTMLDivElement>(null);
  const [isBrushesOpen, setIsBrushesOpen] = React.useState(false);
  const [isSizeOpen, setIsSizeOpen] = React.useState(false);
  const [isSelectionOpen, setIsSelectionOpen] = React.useState(false);
  const selectionRef = React.useRef<HTMLButtonElement>(null);
  const selectionMenuRef = React.useRef<HTMLDivElement>(null);
  const [activeColorSlot, setActiveColorSlot] = React.useState<1 | 2>(1);
  const [customColors, setCustomColors] = React.useState<string[]>(() => {
    const saved = localStorage.getItem('paint-custom-colors');
    return saved ? JSON.parse(saved) : Array(10).fill('transparent');
  });

  React.useEffect(() => {
    if (currentTool === 'eraser') {
      setActiveColorSlot(2);
    } else {
      setActiveColorSlot(1);
    }
  }, [currentTool]);

  React.useEffect(() => {
    const handleAddColor = (e: Event) => {
      const customEvent = e as CustomEvent;
      const newColor = customEvent.detail;
      const newCustomColors = [...customColors];
      newCustomColors.unshift(newColor);
      newCustomColors.pop();
      setCustomColors(newCustomColors);
      localStorage.setItem('paint-custom-colors', JSON.stringify(newCustomColors));
    };
    window.addEventListener('add-custom-color', handleAddColor);
    return () => window.removeEventListener('add-custom-color', handleAddColor);
  }, [customColors]);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      // Selection menu
      if (selectionRef.current && !selectionRef.current.contains(target) && 
          (!selectionMenuRef.current || !selectionMenuRef.current.contains(target))) {
        setIsSelectionOpen(false);
      }
      // Brushes menu
      if (brushesRef.current && !brushesRef.current.contains(target) && 
          (!brushesMenuRef.current || !brushesMenuRef.current.contains(target))) {
        setIsBrushesOpen(false);
      }
      // Size menu
      if (sizeRef.current && !sizeRef.current.contains(target) && 
          (!sizeMenuRef.current || !sizeMenuRef.current.contains(target))) {
        setIsSizeOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside, true);
    return () => document.removeEventListener('mousedown', handleClickOutside, true);
  }, []);

  const handleColorSelect = (c: string, e?: React.MouseEvent) => {
    if (e && e.type === 'contextmenu') {
      e.preventDefault();
      setSecondaryColor(c);
      setActiveColorSlot(2);
    } else {
      if (activeColorSlot === 1) setPrimaryColor(c);
      else setSecondaryColor(c);
    }
  };

  const handleAddCustomColor = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    if (activeColorSlot === 1) setPrimaryColor(newColor);
    else setSecondaryColor(newColor);
    
    const newCustomColors = [...customColors];
    newCustomColors.unshift(newColor);
    newCustomColors.pop();
    setCustomColors(newCustomColors);
    localStorage.setItem('paint-custom-colors', JSON.stringify(newCustomColors));
  };

  const colors = [
    // Row 1
    '#000000', '#7f7f7f', '#880015', '#ed1c24', '#ff7f27', '#fff200', '#22b14c', '#00a2e8', '#3f48cc', '#a349a4',
    // Row 2
    '#ffffff', '#c3c3c3', '#b97a57', '#ffaec9', '#ffc90e', '#efe4b0', '#b5e61d', '#99d9ea', '#7092be', '#c8bfe7',
    // Row 3
    '#0c0c0c', '#333333', '#59000e', '#9e0013', '#c24b00', '#b5a600', '#0e732d', '#006494', '#202680', '#6b236c'
  ];

  return (
    <div className="h-28 bg-[#202020] border-b border-black/40 flex items-start px-2 py-2 gap-1 shadow-sm z-50 relative text-gray-300 select-none overflow-x-auto overflow-y-hidden flex-shrink-0">

      {/* Selection */}
      <div className="flex flex-col h-full px-3 border-r border-white/10 relative flex-shrink-0">
        <div className="flex items-center h-[60px]">
          <button
            ref={selectionRef}
            className={`flex flex-col items-center justify-center gap-1 p-2 rounded w-14 h-14 ${['select', 'lasso-select'].includes(currentTool) || isSelectionOpen ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-gray-300'}`}
            onClick={() => {
              if (!['select', 'lasso-select'].includes(currentTool)) setCurrentTool('select');
            }}
          >
            {currentTool === 'lasso-select' ? <LassoSelect size={24} strokeWidth={1.5} /> : <SquareDashed size={24} strokeWidth={1.5} />}
            <div
              className="flex items-center text-[10px] mt-1 px-1 hover:bg-white/20 rounded"
              onClick={(e) => {
                e.stopPropagation();
                setIsSelectionOpen(!isSelectionOpen);
                setIsBrushesOpen(false);
                setIsSizeOpen(false);
              }}
            >
              <ChevronDown size={10} />
            </div>
          </button>
        </div>
        <span className="text-[11px] text-center mt-auto text-gray-400">{t('ui.selection')}</span>

        {isSelectionOpen && selectionRef.current && (
          <div ref={selectionMenuRef} className="fixed w-56 bg-[#2b2b2b] border border-[#404040] rounded-md shadow-2xl z-[100] py-1 text-gray-200 text-sm"
            style={{
              top: selectionRef.current.getBoundingClientRect().bottom + window.scrollY,
              left: selectionRef.current.getBoundingClientRect().left + window.scrollX
            }}
          >
            <button className={`w-full flex items-center px-4 py-1.5 hover:bg-white/10 text-left ${currentTool === 'select' ? 'bg-[#4cc2ff]/20' : ''}`} onClick={() => { setCurrentTool('select'); setIsSelectionOpen(false); }}>
              <SquareDashed size={16} className="mr-3" /> {t('action.rectSelect')}
            </button>
            <button className={`w-full flex items-center px-4 py-1.5 hover:bg-white/10 text-left ${currentTool === 'lasso-select' ? 'bg-[#4cc2ff]/20' : ''}`} onClick={() => { setCurrentTool('lasso-select'); setIsSelectionOpen(false); }}>
              <LassoSelect size={16} className="mr-3" /> {t('action.freeSelect')}
            </button>
            <div className="h-px bg-white/10 my-1 mx-2" />
            <button className="w-full flex items-center px-4 py-1.5 hover:bg-white/10 text-left justify-between" onClick={() => { window.dispatchEvent(new CustomEvent('request-select-all')); setIsSelectionOpen(false); }}>
              <div className="flex items-center"><Maximize2 size={16} className="mr-3" /> {t('action.selectAll')}</div>
              <span className="text-xs text-gray-400">Ctrl+A</span>
            </button>
            <button className="w-full flex items-center px-4 py-1.5 hover:bg-white/10 text-left text-gray-500" disabled>
              <div className="flex items-center"><SquareDashed size={16} className="mr-3" /> {t('action.invertSelect')}</div>
            </button>
            <button className="w-full flex items-center px-4 py-1.5 hover:bg-white/10 text-left">
              <div className="w-4 mr-3" /> {t('action.transparentSelect')}
            </button>
            <button className="w-full flex items-center px-4 py-1.5 hover:bg-white/10 text-left justify-between" onClick={() => { setIsSelectionOpen(false); }}>
              <div className="flex items-center"><Trash2 size={16} className="mr-3" /> {t('action.delete')}</div>
              <span className="text-xs text-gray-400">Delete</span>
            </button>
          </div>
        )}
      </div>

      {/* Image */}
      <div className="flex flex-col h-full px-3 border-r border-white/10 flex-shrink-0">
        <div className="flex gap-1 h-[60px] items-center">
          <div className="flex flex-col justify-center gap-0.5">
            <button onClick={() => window.dispatchEvent(new CustomEvent('request-crop'))} className="flex items-center gap-2 px-2 py-1 hover:bg-white/5 rounded text-gray-300 text-xs"><Crop size={14}/> {t('action.crop')}</button>
            <button onClick={() => window.dispatchEvent(new CustomEvent('request-resize'))} className="flex items-center gap-2 px-2 py-1 hover:bg-white/5 rounded text-gray-300 text-xs"><Maximize size={14}/> {t('action.resize')}</button>
            <button onClick={() => window.dispatchEvent(new CustomEvent('request-rotate'))} className="flex items-center gap-2 px-2 py-1 hover:bg-white/5 rounded text-gray-300 text-xs"><RotateCw size={14}/> {t('action.rotate')}</button>
          </div>
        </div>
        <span className="text-[11px] text-center mt-auto text-gray-400">{t('menu.image')}</span>
      </div>

      {/* Tools */}
      <div className="flex flex-col h-full px-3 border-r border-white/10 flex-shrink-0">
        <div className="grid grid-cols-3 gap-0.5 h-[60px] content-center">
          <ToolBtn icon={<Pencil size={16} strokeWidth={1.5}/>} active={currentTool==='pencil'} onClick={()=>setCurrentTool('pencil')} label={t('tool.pencil')} />
          <ToolBtn icon={<PaintBucket size={16} strokeWidth={1.5}/>} active={currentTool==='fill'} onClick={()=>setCurrentTool('fill')} label={t('tool.fill')} />
          <ToolBtn icon={<Type size={16} strokeWidth={1.5}/>} active={currentTool==='text'} onClick={()=>setCurrentTool('text')} label={t('tool.text')} />
          <ToolBtn icon={<Eraser size={16} strokeWidth={1.5}/>} active={currentTool==='eraser'} onClick={()=>setCurrentTool('eraser')} label={t('tool.eraser')} />
          <ToolBtn icon={<Pipette size={16} strokeWidth={1.5}/>} active={currentTool==='picker'} onClick={()=>setCurrentTool('picker')} label={t('tool.picker')} />
          <ToolBtn icon={<Search size={16} strokeWidth={1.5}/>} active={currentTool==='magnifier'} onClick={()=>setCurrentTool('magnifier')} label={t('tool.magnifier')} />
        </div>
        <span className="text-[11px] text-center mt-auto text-gray-400">{t('ui.tools')}</span>
      </div>

      {/* Brushes */}
      <div className="flex flex-col h-full px-3 border-r border-white/10 relative flex-shrink-0">
        <div className="flex items-center h-[60px]">
          <button
            ref={brushesRef}
            className={`flex flex-col items-center justify-center gap-1 p-2 rounded w-14 h-14 ${currentTool === 'brush' || isBrushesOpen ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-gray-300'}`}
            onClick={() => {
              setIsBrushesOpen(!isBrushesOpen);
              setIsSizeOpen(false);
              setIsSelectionOpen(false);
            }}
          >
            <Brush size={24} strokeWidth={1.5} />
            <div className="flex items-center text-[10px] mt-1">
              <ChevronDown size={10} />
            </div>
          </button>
        </div>
        <span className="text-[11px] text-center mt-auto text-gray-400">{t('ui.brushes')}</span>

        {isBrushesOpen && brushesRef.current && (
          <div ref={brushesMenuRef} className="fixed w-64 bg-[#2b2b2b] border border-[#404040] rounded-md shadow-2xl z-[100] py-2 text-gray-200"
            style={{
              top: brushesRef.current.getBoundingClientRect().bottom + window.scrollY,
              left: brushesRef.current.getBoundingClientRect().left + window.scrollX
            }}
          >
            {[
              { id: 'brush', label: t('tool.brush'), icon: <Brush size={16} /> },
              { id: 'calligraphy', label: t('brush.calligraphy'), icon: <Pencil size={16} /> },
              { id: 'pen', label: t('brush.pen'), icon: <Pencil size={16} /> },
              { id: 'airbrush', label: t('brush.airbrush'), icon: <Sparkles size={16} /> },
              { id: 'oil', label: t('brush.oil'), icon: <Brush size={16} /> },
              { id: 'crayon', label: t('brush.crayon'), icon: <Pencil size={16} /> },
              { id: 'marker', label: t('brush.marker'), icon: <Pencil size={16} /> },
              { id: 'texture', label: t('brush.texture'), icon: <Pencil size={16} /> },
              { id: 'watercolor', label: t('brush.watercolor'), icon: <Brush size={16} /> },
            ].map(b => (
              <button
                key={b.id}
                className={`w-full flex items-center px-4 py-2 hover:bg-white/10 text-left text-sm ${currentTool === b.id ? 'bg-[#4cc2ff]/20' : ''}`}
                onClick={() => {
                  setCurrentTool(b.id as Tool);
                  setIsBrushesOpen(false);
                }}
              >
                <div className="w-6">{b.icon}</div>
                <span>{b.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Size */}
      <div className="flex flex-col h-full px-3 border-r border-white/10 relative flex-shrink-0">
        <div className="flex items-center h-[60px]">
          <button
            ref={sizeRef}
            className={`flex flex-col items-center justify-center gap-1 p-2 rounded w-14 h-14 ${isSizeOpen ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-gray-300'}`}
            onClick={() => {
              setIsSizeOpen(!isSizeOpen);
              setIsBrushesOpen(false);
              setIsSelectionOpen(false);
            }}
          >
            <div className="w-6 h-6 flex items-center justify-center">
              <div className="w-full bg-white rounded-full" style={{ height: Math.max(2, strokeSize) + 'px' }}></div>
            </div>
            <div className="flex items-center text-[10px] mt-1">
              <span className="mr-1">{strokeSize}px</span>
              <ChevronDown size={10} />
            </div>
          </button>
        </div>
        <span className="text-[11px] text-center mt-auto text-gray-400">{t('ui.size')}</span>

        {isSizeOpen && sizeRef.current && (
          <div ref={sizeMenuRef} className="fixed w-32 bg-[#2b2b2b] border border-[#404040] rounded-md shadow-2xl z-[100] py-1 text-gray-200"
            style={{
              top: sizeRef.current.getBoundingClientRect().bottom + window.scrollY,
              left: sizeRef.current.getBoundingClientRect().left + window.scrollX
            }}
          >
            {[1, 3, 5, 8].map(size => (
              <button
                key={size}
                className={`w-full flex items-center justify-center px-4 py-2 hover:bg-white/10 ${strokeSize === size ? 'bg-[#4cc2ff]/20' : ''}`}
                onClick={() => {
                  setStrokeSize(size);
                  setIsSizeOpen(false);
                }}
              >
                <div className="w-20 bg-white rounded-full" style={{ height: size + 'px' }}></div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Shapes */}
      <div className="flex flex-col h-full px-3 border-r border-white/10 flex-shrink-0">
        <div className="flex gap-2 h-[60px] items-center">
          <div className="grid grid-cols-7 gap-0.5 bg-[#1a1a1a] border border-white/10 rounded p-1 w-48 h-[52px] overflow-y-auto">
            <ToolBtn icon={<Minus size={14}/>} active={currentTool==='line'} onClick={()=>setCurrentTool('line')} label={t('tool.line')} />
            <ToolBtn icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 19c4-4 4-10 14-10"/></svg>} active={currentTool==='curve'} onClick={()=>setCurrentTool('curve')} label={t('tool.curve')} />
            <ToolBtn icon={<Circle size={14}/>} active={currentTool==='circle'} onClick={()=>setCurrentTool('circle')} label={t('tool.circle')} />
            <ToolBtn icon={<Square size={14}/>} active={currentTool==='rectangle'} onClick={()=>setCurrentTool('rectangle')} label={t('tool.rectangle')} />
            <ToolBtn icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="4" ry="4"/></svg>} active={currentTool==='rounded-rectangle'} onClick={()=>setCurrentTool('rounded-rectangle')} label={t('tool.rounded-rectangle')} />
            <ToolBtn icon={<Hexagon size={14}/>} active={currentTool==='polygon'} onClick={()=>setCurrentTool('polygon')} label={t('tool.polygon')} />
            <ToolBtn icon={<Triangle size={14}/>} active={currentTool==='triangle'} onClick={()=>setCurrentTool('triangle')} label={t('tool.triangle')} />
            <ToolBtn icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3,21 21,21 3,3"/></svg>} active={currentTool==='right-triangle'} onClick={()=>setCurrentTool('right-triangle')} label={t('tool.right-triangle')} />
            <ToolBtn icon={<Diamond size={14}/>} active={currentTool==='diamond'} onClick={()=>setCurrentTool('diamond')} label={t('tool.diamond')} />
            <ToolBtn icon={<Pentagon size={14}/>} active={currentTool==='pentagon'} onClick={()=>setCurrentTool('pentagon')} label={t('tool.pentagon')} />
            <ToolBtn icon={<Hexagon size={14}/>} active={currentTool==='hexagon'} onClick={()=>setCurrentTool('hexagon')} label={t('tool.hexagon')} />
            <ToolBtn icon={<ArrowRight size={14}/>} active={currentTool==='arrow-right'} onClick={()=>setCurrentTool('arrow-right')} label={t('tool.arrow-right')} />
            <ToolBtn icon={<ArrowLeft size={14}/>} active={currentTool==='arrow-left'} onClick={()=>setCurrentTool('arrow-left')} label={t('tool.arrow-left')} />
            <ToolBtn icon={<ArrowUp size={14}/>} active={currentTool==='arrow-up'} onClick={()=>setCurrentTool('arrow-up')} label={t('tool.arrow-up')} />
            <ToolBtn icon={<ArrowDown size={14}/>} active={currentTool==='arrow-down'} onClick={()=>setCurrentTool('arrow-down')} label={t('tool.arrow-down')} />
            <ToolBtn icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12,2 15,9 22,9 16,14 18,21 12,17 6,21 8,14 2,9 9,9"/></svg>} active={currentTool==='star-5'} onClick={()=>setCurrentTool('star-5')} label={t('tool.star-5')} />
            <ToolBtn icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12,2 14,10 22,12 14,14 12,22 10,14 2,12 10,10"/></svg>} active={currentTool==='star-4'} onClick={()=>setCurrentTool('star-4')} label={t('tool.star-4')} />
            <ToolBtn icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12,2 15,7 21,5 18,11 22,16 16,16 12,22 8,16 2,16 6,11 3,5 9,7"/></svg>} active={currentTool==='star-6'} onClick={()=>setCurrentTool('star-6')} label={t('tool.star-6')} />
            <ToolBtn icon={<MessageCircle size={14}/>} active={currentTool==='callout-oval'} onClick={()=>setCurrentTool('callout-oval')} label={t('tool.callout-oval')} />
            <ToolBtn icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>} active={currentTool==='callout-rounded'} onClick={()=>setCurrentTool('callout-rounded')} label={t('tool.callout-rounded')} />
            <ToolBtn icon={<Cloud size={14}/>} active={currentTool==='callout-cloud'} onClick={()=>setCurrentTool('callout-cloud')} label={t('tool.callout-cloud')} />
            <ToolBtn icon={<Heart size={14}/>} active={currentTool==='heart'} onClick={()=>setCurrentTool('heart')} label={t('tool.heart')} />
            <ToolBtn icon={<Zap size={14}/>} active={currentTool==='lightning'} onClick={()=>setCurrentTool('lightning')} label={t('tool.lightning')} />
          </div>
        </div>
        <span className="text-[11px] text-center mt-auto text-gray-400">{t('ui.shapes')}</span>
      </div>

      {/* Colors */}
      <div className="flex flex-col h-full px-3 border-r border-white/10 flex-shrink-0">
        <div className="flex gap-3 h-[60px] items-center">
          <div className="flex gap-2 flex-shrink-0">
            <button 
              className="flex flex-col items-center justify-center relative w-8 h-8 rounded-full"
              onClick={() => setActiveColorSlot(1)}
            >
              <div className={`absolute inset-0 rounded-full border-2 ${activeColorSlot === 1 ? 'border-[#4cc2ff]' : 'border-transparent'}`}></div>
              <div className="w-6 h-6 rounded-full border border-white/20" style={{backgroundColor: primaryColor}}></div>
            </button>
            <button 
              className="flex flex-col items-center justify-center relative w-8 h-8 rounded-full"
              onClick={() => setActiveColorSlot(2)}
            >
              <div className={`absolute inset-0 rounded-full border-2 ${activeColorSlot === 2 ? 'border-[#4cc2ff]' : 'border-transparent'}`}></div>
              <div className="w-6 h-6 rounded-full border border-white/20" style={{backgroundColor: secondaryColor}}></div>
            </button>
          </div>
          
          <div className="flex flex-col gap-1 flex-shrink-0">
            <div className="grid grid-cols-10 gap-1">
              {colors.map((c, i) => (
                <button
                  key={i}
                  className="w-4 h-4 rounded-full border border-white/10 hover:scale-110 transition-transform flex-shrink-0"
                  style={{backgroundColor: c}}
                  onClick={(e) => handleColorSelect(c, e)}
                  onContextMenu={(e) => handleColorSelect(c, e)}
                />
              ))}
            </div>
            <div className="grid grid-cols-10 gap-1">
              {customColors.map((c, i) => (
                <button
                  key={`custom-${i}`}
                  className="w-4 h-4 rounded-full border border-white/10 hover:scale-110 transition-transform flex-shrink-0"
                  style={{backgroundColor: c === 'transparent' ? '#202020' : c}}
                  onClick={(e) => c !== 'transparent' && handleColorSelect(c, e)}
                  onContextMenu={(e) => c !== 'transparent' && handleColorSelect(c, e)}
                />
              ))}
            </div>
          </div>
          
          <div className="flex flex-col gap-1 ml-1">
            <label className="w-6 h-6 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 cursor-pointer" title={t('ui.colors')}>
               <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-purple-500 via-red-500 to-yellow-500"></div>
               <input 
                 type="color" 
                 className="hidden" 
                 value={activeColorSlot === 1 ? primaryColor : secondaryColor}
                 onChange={handleAddCustomColor} 
               />
            </label>
            <button 
              className="w-6 h-6 rounded border border-white/20 flex items-center justify-center hover:bg-white/10 text-gray-300 text-lg leading-none"
              title={t('ui.addColor')}
              onClick={() => {
                const newColor = activeColorSlot === 1 ? primaryColor : secondaryColor;
                const newCustomColors = [...customColors];
                if (!newCustomColors.includes(newColor)) {
                  newCustomColors.unshift(newColor);
                  newCustomColors.pop();
                  setCustomColors(newCustomColors);
                  localStorage.setItem('paint-custom-colors', JSON.stringify(newCustomColors));
                }
              }}
            >
              +
            </button>
          </div>
        </div>
        <span className="text-[11px] text-center mt-auto text-gray-400">{t('ui.colors')}</span>
      </div>

      {/* Layers */}
      <div className="flex flex-col h-full px-3 flex-shrink-0">
        <div className="flex items-center h-[60px]">
          <button className="flex flex-col items-center justify-center gap-1 p-2 rounded w-14 h-14 hover:bg-white/5 text-gray-300">
            <Layers size={24} strokeWidth={1.5} />
          </button>
        </div>
        <span className="text-[11px] text-center mt-auto text-gray-400">{t('ui.layers')}</span>
      </div>

    </div>
  );
}
