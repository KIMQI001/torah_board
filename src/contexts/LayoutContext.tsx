"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';

interface LayoutContextType {
  isSidebarHidden: boolean;
  isFullscreen: boolean;
  toggleSidebar: () => void;
  toggleFullscreen: () => void;
  setSidebarHidden: (hidden: boolean) => void;
  setFullscreen: (fullscreen: boolean) => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarHidden(prev => !prev);
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      // 进入全屏模式
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
      } else if ((document.documentElement as any).webkitRequestFullscreen) {
        (document.documentElement as any).webkitRequestFullscreen();
      } else if ((document.documentElement as any).msRequestFullscreen) {
        (document.documentElement as any).msRequestFullscreen();
      }
      setIsFullscreen(true);
      setIsSidebarHidden(true); // 全屏时自动隐藏侧边栏
    } else {
      // 退出全屏模式
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }
      setIsFullscreen(false);
      setIsSidebarHidden(false); // 退出全屏时显示侧边栏
    }
  };

  const setSidebarHidden = (hidden: boolean) => {
    setIsSidebarHidden(hidden);
  };

  const setFullscreen = (fullscreen: boolean) => {
    setIsFullscreen(fullscreen);
  };

  // 监听浏览器全屏状态变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(document.fullscreenElement || 
        (document as any).webkitFullscreenElement || 
        (document as any).msFullscreenElement);
      
      if (!isCurrentlyFullscreen && isFullscreen) {
        // 用户通过ESC键退出全屏
        setIsFullscreen(false);
        setIsSidebarHidden(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, [isFullscreen]);

  // 键盘快捷键
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // F11 - 切换全屏
      if (e.key === 'F11') {
        e.preventDefault();
        toggleFullscreen();
      }
      // Ctrl+B / Cmd+B - 切换侧边栏
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <LayoutContext.Provider value={{
      isSidebarHidden,
      isFullscreen,
      toggleSidebar,
      toggleFullscreen,
      setSidebarHidden,
      setFullscreen
    }}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  const context = useContext(LayoutContext);
  if (context === undefined) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
}