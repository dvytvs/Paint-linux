export type Tool = 'pencil' | 'eraser' | 'fill' | 'picker' | 'text' | 'magnifier' | 'brush' | 'rectangle' | 'circle' | 'line' | 'select' | 'lasso-select' | 'calligraphy' | 'pen' | 'airbrush' | 'oil' | 'crayon' | 'marker' | 'texture' | 'watercolor' | 'curve' | 'rounded-rectangle' | 'polygon' | 'triangle' | 'right-triangle' | 'diamond' | 'pentagon' | 'hexagon' | 'arrow-right' | 'arrow-left' | 'arrow-up' | 'arrow-down' | 'star-4' | 'star-5' | 'star-6' | 'callout-rounded' | 'callout-oval' | 'callout-cloud' | 'heart' | 'lightning';

declare global {
  interface Window {
    electronAPI?: {
      newWindow: () => Promise<void>;
      openFile: () => Promise<{dataUrl: string, name: string, path: string, date: Date, size: number} | null>;
      saveFile: (data: {dataUrl: string, defaultPath?: string}) => Promise<string | null>;
      getPrinters: () => Promise<any[]>;
      print: () => Promise<boolean>;
      setWallpaper: (dataUrl: string) => Promise<boolean>;
      share: (dataUrl: string) => Promise<boolean>;
      exit: (force?: boolean) => Promise<void>;
      windowControl: (action: 'minimize' | 'maximize' | 'close') => Promise<void>;
      onCloseRequested: (callback: () => void) => void;
      offCloseRequested: () => void;
    };
  }
}