import RegisterForm from "@/components/auth/register-form"
import Link from "next/link"
import Image from "next/image"

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-white">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative h-8 w-8 overflow-hidden rounded-full">
              <Image src="/images/luna-logo.png" alt="Luna logo" width={32} height={32} className="object-cover" />
            </div>
            <span className="font-bold">Luna Brew House</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <RegisterForm />
        </div>
      </main>

      <footer className="border-t py-6">
        <div className="container">
          <p className="text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Luna Brew House. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}
