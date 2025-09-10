import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { LanguageProvider } from "@/components/providers/language-provider";
import { ToolsProvider } from "@/components/tools/tools-store";
import { WalletProvider } from "@/components/wallet/WalletProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { LayoutProvider } from "@/contexts/LayoutContext";
import { ResponsiveLayout } from "@/components/layout/ResponsiveLayout";
import { FloatingNewsWrapper } from "@/components/layout/FloatingNewsWrapper";
import { WalletAccessWarning } from "@/components/wallet/WalletAccessWarning";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Web3 Dashboard",
  description: "Comprehensive Web3 trading and portfolio management dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // 防止钱包扩展冲突错误
              (function() {
                const originalError = console.error;
                console.error = function(...args) {
                  const message = args[0];
                  if (typeof message === 'string' && 
                      (message.includes('Cannot redefine property: ethereum') ||
                       message.includes('chrome-extension'))) {
                    return;
                  }
                  originalError.apply(console, args);
                };
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LanguageProvider>
            <ToolsProvider>
              <WalletProvider>
                <AuthProvider>
                  <LayoutProvider>
                    <ResponsiveLayout>
                      {children}
                    </ResponsiveLayout>
                    
                    {/* 浮动新闻组件 */}
                    <FloatingNewsWrapper />
                  </LayoutProvider>
                </AuthProvider>
              </WalletProvider>
            </ToolsProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}