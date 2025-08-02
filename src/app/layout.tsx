import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import { CircleCheck, CircleX } from 'lucide-react'
import { Open_Sans } from 'next/font/google'

export const metadata: Metadata = {
   title: 'XML Product Manager',
   description: 'Manage products from XML feed',
}

const open_sans = Open_Sans({
   subsets: ['greek', 'latin'],
   display: 'swap',
})

export default function RootLayout({
   children,
}: {
   children: React.ReactNode
}) {
   return (
      <html lang="en" className={open_sans.className}>
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
