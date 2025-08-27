import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { LanguageProvider } from "@/components/providers/language-provider";
import { ToolsProvider } from "@/components/tools/tools-store";
import { WalletProvider } from "@/components/wallet/WalletProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
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
                  <div className="flex h-screen">
                    <div className="w-64 border-r bg-card">
                      <Sidebar />
                    </div>
                    <div className="flex-1 flex flex-col overflow-hidden">
                      <Header />
                      <main className="flex-1 overflow-auto p-6">
                        {children}
                      </main>
                    </div>
                  </div>
                </AuthProvider>
              </WalletProvider>
            </ToolsProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}