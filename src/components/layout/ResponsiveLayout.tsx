"use client"

import { useLayout } from "@/contexts/LayoutContext";
import { Sidebar } from "./sidebar";
import { Header } from "./header";

interface ResponsiveLayoutProps {
  children: React.ReactNode;
}

export function ResponsiveLayout({ children }: ResponsiveLayoutProps) {
  const { isSidebarHidden, isFullscreen } = useLayout();

  return (
    <div className={`flex h-screen ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* 侧边栏 */}
      <div className={`${isSidebarHidden ? 'w-0' : 'w-64'} transition-all duration-300 ease-in-out border-r bg-card overflow-hidden`}>
        <div className={`w-64 ${isSidebarHidden ? 'opacity-0 pointer-events-none' : 'opacity-100'} transition-opacity duration-300`}>
          <Sidebar />
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 头部 - 全屏时可能需要特殊处理 */}
        {!isFullscreen && <Header />}
        
        {/* 全屏时的浮动头部 */}
        {isFullscreen && (
          <div className="absolute top-0 left-0 right-0 z-10 bg-background/80 backdrop-blur-sm border-b opacity-0 hover:opacity-100 transition-opacity duration-300">
            <Header />
          </div>
        )}

        {/* 主要内容 */}
        <main className={`flex-1 overflow-auto ${!isFullscreen ? 'p-6' : 'p-0'}`}>
          {children}
        </main>
      </div>
    </div>
  );
}