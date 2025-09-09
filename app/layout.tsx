import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'

export const metadata: Metadata = {
  title: 'Darbaal Plaza',
  description: 'Plaza Management System',
  generator: 'Darbaal Plaza',
  // SEO and performance improvements
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={GeistSans.variable}>
      <head>
        {/* Preconnect to improve loading performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* DNS prefetch for external resources */}
        <link rel="dns-prefetch" href="https://supabase.co" />
        
        {/* Note: Font preloading is handled automatically by Next.js font optimization */}
        
        {/* Critical CSS - moved to globals.css for better performance */}
      </head>
      <body className={`font-sans antialiased ${GeistSans.variable} ${GeistMono.variable}`}>
        {/* Skip to main content for accessibility and performance */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 z-50 p-4 bg-primary text-primary-foreground"
        >
          Skip to main content
        </a>
        
        <div id="main-content">
          {children}
        </div>
        
        {/* Performance monitoring script (only in development) */}
        {process.env.NODE_ENV === 'development' && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                // Monitor performance in development
                if (typeof window !== 'undefined' && window.performance) {
                  window.addEventListener('load', () => {
                    setTimeout(() => {
                      const perfData = performance.getEntriesByType('navigation')[0];
                      console.log('\\n🚀 Performance Metrics:');
                      console.log('📊 DOM Content Loaded:', perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart, 'ms');
                      console.log('⚡ Load Complete:', perfData.loadEventEnd - perfData.loadEventStart, 'ms');
                      console.log('🎯 Time to Interactive:', perfData.domInteractive - perfData.navigationStart, 'ms');
                      
                      // Monitor Core Web Vitals
                      if ('PerformanceObserver' in window) {
                        const observer = new PerformanceObserver((list) => {
                          for (const entry of list.getEntries()) {
                            if (entry.entryType === 'largest-contentful-paint') {
                              console.log('🖼️ LCP:', entry.startTime.toFixed(2), 'ms');
                            }
                          }
                        });
                        observer.observe({ entryTypes: ['largest-contentful-paint'] });
                      }
                    }, 1000);
                  });
                }
              `,
            }}
          />
        )}
      </body>
    </html>
  )
}
