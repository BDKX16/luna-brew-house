import type { ReactNode } from "react"
import Link from "next/link"
import Image from "next/image"
import { LayoutDashboard, Beer, ShoppingCart, Settings, Users, LogOut, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

interface AdminLayoutProps {
  children: ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const navItems = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/productos", label: "Productos", icon: Beer },
    { href: "/admin/ventas", label: "Ventas y Pedidos", icon: ShoppingCart },
    { href: "/admin/configuracion", label: "Configuración", icon: Settings },
    { href: "/admin/usuarios", label: "Usuarios", icon: Users },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/admin" className="flex items-center gap-2">
              <div className="relative h-8 w-8 overflow-hidden rounded-full">
                <Image src="/images/luna-logo.png" alt="Luna logo" width={32} height={32} className="object-cover" />
              </div>
              <span className="font-bold">Luna Admin</span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
              Ver tienda
            </Link>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Abrir menú</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64">
                <div className="flex items-center gap-2 mb-8">
                  <div className="relative h-8 w-8 overflow-hidden rounded-full">
                    <Image
                      src="/images/luna-logo.png"
                      alt="Luna logo"
                      width={32}
                      height={32}
                      className="object-cover"
                    />
                  </div>
                  <span className="font-bold">Luna Admin</span>
                </div>
                <nav className="flex flex-col gap-1">
                  {navItems.map((item, index) => {
                    const Icon = item.icon
                    return (
                      <Link
                        key={index}
                        href={item.href}
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      >
                        <Icon className="h-5 w-5" />
                        {item.label}
                      </Link>
                    )
                  })}
                  <Link
                    href="/"
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors mt-4"
                  >
                    <LogOut className="h-5 w-5" />
                    Cerrar sesión
                  </Link>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Sidebar (desktop) */}
        <aside className="w-64 border-r bg-white hidden md:block">
          <div className="h-full py-6 px-3">
            <nav className="flex flex-col gap-1">
              {navItems.map((item, index) => {
                const Icon = item.icon
                return (
                  <Link
                    key={index}
                    href={item.href}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                )
              })}
              <Link
                href="/"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors mt-4"
              >
                <LogOut className="h-5 w-5" />
                Cerrar sesión
              </Link>
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto bg-gray-50">
          <div className="container py-6">{children}</div>
        </main>
      </div>
    </div>
  )
}
