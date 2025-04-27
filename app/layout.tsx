import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from "@/components/ui/theme-provider"
import { cn } from "@/lib/utils"

// Initialize data on the server side
import { initData } from '@/lib/init-data'

const inter = Inter({ subsets: ['latin'] })

// This ensures data is loaded before the app renders
export async function generateMetadata(): Promise<Metadata> {
  try {
    // Initialize data from Supabase
    await initData();
    
    return {
      title: 'Управление оборудованием',
      description: 'Система управления лабораторным оборудованием',
    };
  } catch (error) {
    console.error('Error initializing data:', error);
    
    return {
      title: 'Управление оборудованием',
      description: 'Система управления лабораторным оборудованием',
    };
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head />
      <body 
        className={cn(
          "__className_d65c78 min-h-screen bg-background antialiased",
          "sm:px-2 md:px-0 pt-2 sm:pt-3 md:pt-4"
        )}
        suppressHydrationWarning={true}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="px-2 sm:px-4 md:px-0 pt-3 sm:pt-4 max-w-screen-xl mx-auto">
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
