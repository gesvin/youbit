import './globals.css'
import PwaRegister from '@/components/PwaRegister'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className="bg-slate-950 text-slate-100 antialiased selection:bg-blue-500 selection:text-white">
        {children}
        <PwaRegister />
      </body>
    </html>
  )
}