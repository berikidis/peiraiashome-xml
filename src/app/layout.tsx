import type { Metadata } from 'next'
import './globals.css'
import { GeistSans } from 'geist/font/sans'
import { Toaster } from '@/components/ui/sonner'
import { CircleCheck, CircleX } from 'lucide-react'

export const metadata: Metadata = {
   title: 'XML Product Manager',
   description: 'Manage products from XML feed',
}

export default function RootLayout({
   children,
}: {
   children: React.ReactNode
}) {
   return (
      <html lang="en" className={GeistSans.className}>
         <body>
            <main>{children}</main>
            <Toaster
               theme="light"
               position="top-center"
               duration={4000}
               closeButton
               icons={{
                  success: <CircleCheck />,
                  error: <CircleX />,
               }}
               toastOptions={{
                  classNames: {
                     toast: '!shadow-none !gap-x-4',
                     title: '!font-semibold',
                  },
               }}
            />
         </body>
      </html>
   )
}
