"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Calendar,
  Mail,
  MapPin,
  Phone,
  Check,
  ChevronRight,
  ChevronLeft,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useRef, useEffect } from "react";
import UserNav from "@/components/user-nav";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getBeers, getSubscriptionPlans } from "@/services/public";
import useFetchAndLoad from "@/hooks/useFetchAndLoad";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

// Definición de tipos
interface Beer {
  id: string;
  name: string;
  type: string;
  typeId: string;
  price: number;
  image: string;
  description: string;
  stock: number;
}

interface Subscription {
  id: string;
  name: string;
  liters: number;
  price: number;
  features: string[];
  popular?: boolean;
}

interface BubbleProps {
  src: string;
  alt: string;
  size: number;
  position: {
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
  };
  delay: number;
  duration: number;
}

// Componente para burbujas de ingredientes con framer-motion
const BubbleIngredient = ({
  src,
  alt,
  size,
  position,
  delay,
  duration,
}: BubbleProps) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Creamos springs para un movimiento más suave y natural
  const springConfig = { damping: 15, stiffness: 150 };
  const x = useSpring(mouseX, springConfig);
  const y = useSpring(mouseY, springConfig);

  // Referencia para el elemento padre
  const bubbleRef = useRef<HTMLDivElement>(null);

  // Efecto para gestionar el tracking del mouse
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!bubbleRef.current) return;

      const { left, top, width, height } =
        bubbleRef.current.getBoundingClientRect();
      const centerX = left + width / 2;
      const centerY = top + height / 2;

      // Calcular distancia entre el mouse y el centro de la burbuja
      const distanceX = e.clientX - centerX;
      const distanceY = e.clientY - centerY;
      const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

      // Solo aplicar repulsión si el mouse está suficientemente cerca
      const maxDistance = 300; // Aumentar la distancia de influencia
      if (distance < maxDistance) {
        // Fuerza del efecto basado en la cercanía
        const force = maxDistance / Math.max(10, distance);
        // Dirección opuesta al mouse
        const directionX = distanceX / distance;
        const directionY = distanceY / distance;

        // Aplicar la fuerza en la dirección opuesta con más intensidad
        // Esto permite que las burbujas se alejen más del cursor
        mouseX.set(-directionX * force * 40);
        mouseY.set(-directionY * force * 40);
      } else {
        // Regresar a posición original gradualmente con un retraso
        setTimeout(() => {
          mouseX.set(0);
          mouseY.set(0);
        }, 500); // Añade un retraso para un movimiento más natural
      }
    };

    const handleMouseLeave = () => {
      // Regresar a posición original gradualmente
      setTimeout(() => {
        mouseX.set(0);
        mouseY.set(0);
      }, 500);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [mouseX, mouseY]);

  return (
    <motion.div
      ref={bubbleRef}
      className="bubble-ingredient hidden md:block"
      style={{
        ...position,
        display: "inline-flex",
        position: "absolute",
        zIndex: 10,
      }}
      animate={{
        y: ["0px", "-15px", "0px"],
        rotate: ["0deg", "3deg", "-2deg", "0deg"],
      }}
      transition={{
        duration: duration,
        repeat: Infinity,
        ease: "easeInOut",
        delay: delay,
      }}
      whileHover={{
        scale: 1.1,
        transition: { duration: 0.3 },
      }}
      drag // Permite arrastrar la burbuja
      dragConstraints={{
        top: -150,
        left: -150,
        right: 150,
        bottom: 150,
      }}
      dragElastic={0.8} // Hace que la burbuja rebote cuando la sueltas
      dragTransition={{ bounceStiffness: 200, bounceDamping: 10 }}
    >
      <motion.div
        className="bubble-ingredient-inner"
        style={{
          x,
          y,
        }}
      >
        <Image
          src={src}
          alt={alt}
          width={size}
          height={size}
          className="rounded-full"
          draggable={false}
        />
      </motion.div>
    </motion.div>
  );
};

export default function Home() {
  const [beers, setBeers] = useState<Beer[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loadingBeers, setLoadingBeers] = useState(true);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { callEndpoint } = useFetchAndLoad();

  // Ya no necesitamos este efecto a nivel de sección porque
  // ahora cada burbuja maneja su propia interacción de manera independiente

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Cargar cervezas
        const beersResponse = await callEndpoint(getBeers());
        if (beersResponse && beersResponse.data && beersResponse.data.beers) {
          setBeers(beersResponse.data.beers);
        }
      } catch (error) {
        console.error("Error al cargar cervezas:", error);
        setError("No se pudieron cargar los productos.");
      } finally {
        setLoadingBeers(false);
      }

      try {
        // Cargar planes de suscripción
        const subsResponse = await callEndpoint(getSubscriptionPlans());
        if (
          subsResponse &&
          subsResponse.data &&
          subsResponse.data.subscriptions
        ) {
          setSubscriptions(subsResponse.data.subscriptions);
        }
      } catch (error) {
        console.error("Error al cargar planes de suscripción:", error);
        setError("No se pudieron cargar los planes de suscripción.");
      } finally {
        setLoadingSubscriptions(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between py-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="relative h-10 w-10 overflow-hidden rounded-full">
              <Image
                src="/images/luna-logo.png"
                alt="Luna logo"
                width={40}
                height={40}
                className="object-cover"
              />
            </div>
            {/* Título solo visible en desktop cuando hay navegación */}
            <span className="text-xl font-bold hidden md:block">
              Luna Brew House
            </span>
          </div>

          {/* Título centrado en mobile si entra en una línea */}
          <div className="flex-1 flex justify-center md:hidden">
            <span className="text-lg font-bold text-center">
              Luna Brew House
            </span>
          </div>

          {/* Navegación solo visible en desktop */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="#inicio"
              className="text-sm font-medium hover:text-primary"
            >
              Inicio
            </Link>
            <Link
              href="#cervezas"
              className="text-sm font-medium hover:text-primary"
            >
              Nuestras Cervezas
            </Link>
            <Link
              href="#proceso"
              className="text-sm font-medium hover:text-primary"
            >
              Nuestro Proceso
            </Link>
            <Link
              href="#suscripciones"
              className="text-sm font-medium hover:text-primary"
            >
              Suscripciones
            </Link>
            <Link
              href="#historia"
              className="text-sm font-medium hover:text-primary"
            >
              Historia
            </Link>
            <Link
              href="#contacto"
              className="text-sm font-medium hover:text-primary"
            >
              Contacto
            </Link>
          </nav>

          {/* UserNav - siempre visible */}
          <div className="flex items-center">
            <UserNav />
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section id="inicio" className="relative pt-0">
          <div className="absolute inset-0 top-0 w-full h-full">
            <Image
              src="/images/hero-background.png"
              alt="Paisaje natural"
              fill
              className="object-cover brightness-95"
              priority
            />
            <div className="absolute inset-0 bg-black/40"></div>
          </div>
          <div className="container relative z-10 flex flex-col lg:flex-row items-center gap-8 py-16 md:py-24">
            <div className="flex-1 space-y-6 text-white">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter text-shadow-lg">
                Cerveza artesanal con el{" "}
                <span className="text-amber-300">alma de Luna</span>
              </h1>
              <p className="text-lg text-white/90 text-shadow-sm max-w-xl">
                Elaborada con pasión en Mar del Plata por una familia con raíces
                vascas y el espíritu alegre de nuestra fiel compañera Luna.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="bg-amber-600 hover:bg-amber-700 rounded-full"
                  asChild
                >
                  <Link href="#cervezas">Nuestras Cervezas</Link>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-full bg-white/10 text-white border-white hover:bg-white/20 hover:text-white"
                  asChild
                >
                  <Link href="#historia">Nuestra Historia</Link>
                </Button>
              </div>
            </div>
            <div className="relative w-full max-w-md">
              <div className="bg-white/20 backdrop-blur-sm p-4 rounded-3xl shadow-lg">
                <Image
                  src="/images/luna-beer.png"
                  alt="Cerveza Luna Brew House - Hecha en casa con amor"
                  width={500}
                  height={700}
                  className="rounded-2xl object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section className="container py-16 md:py-24">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold tracking-tight">
                Nuestra Pasión
              </h2>
              <p className="text-muted-foreground">
                En Luna Brew House, cada cerveza cuenta una historia y cada
                sorbo celebra la unión de la familia, la amistad y la pasión por
                lo artesanal. Somos una familia apasionada por la cerveza y la
                buena comida, residentes de la hermosa ciudad de Mar del Plata,
                Argentina, conocida como "La Feliz".
              </p>
              <p className="text-muted-foreground">
                Nuestra historia está profundamente arraigada en nuestras raíces
                vascas, donde la tradición y el amor por lo artesanal siempre
                han sido parte de nuestra vida.
              </p>
            </div>
            <div className="relative h-[300px] overflow-hidden rounded-3xl">
              <Image
                src="/images/brewery-interior.png"
                alt="Elaboración artesanal"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </section>

        {/* Products Section */}
        <section id="cervezas" className="bg-amber-900/10 py-16 md:py-24">
          <div className="container space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold tracking-tight">
                Nuestras Cervezas
              </h2>
              <p className="text-muted-foreground max-w-3xl mx-auto">
                Elaboradas con ingredientes seleccionados y el cariño que solo
                una familia cervecera puede ofrecer. Cada variedad tiene su
                propia personalidad, como Luna.
              </p>
            </div>

            {loadingBeers ? (
              <div className="flex justify-center items-center py-12">
                <LoadingSpinner />
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-500">{error}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {beers.map((beer) => (
                  <Card
                    key={beer.id}
                    className="overflow-hidden rounded-3xl h-full relative"
                  >
                    {beer.stock === 0 && (
                      <div className="absolute top-3 right-3 z-10">
                        <Badge className="bg-red-500 hover:bg-red-600 px-3 py-1 text-white font-bold">
                          Agotada
                        </Badge>
                      </div>
                    )}
                    <div className="h-72 relative">
                      <Image
                        src={beer.image || "/placeholder.svg"}
                        alt={beer.name}
                        fill
                        className={`object-cover ${
                          beer.stock === 0 ? "opacity-70" : ""
                        }`}
                      />
                    </div>
                    <CardContent className="p-6 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-bold">{beer.name}</h3>
                          <p className="text-sm text-amber-700 font-medium">
                            {beer.type}
                          </p>
                        </div>
                        <div className="bg-amber-100 px-3 py-1 rounded-full">
                          <p className="text-amber-800 font-bold">
                            ${beer.price}/litro
                          </p>
                        </div>
                      </div>

                      <p className="text-muted-foreground">
                        {beer.description}
                      </p>
                      {beer.stock === 0 ? (
                        <>
                          <Button
                            className="w-full mt-2 bg-gray-400 rounded-full cursor-not-allowed"
                            disabled
                          >
                            Comprar ahora
                          </Button>
                        </>
                      ) : (
                        <Button
                          className="w-full mt-2 bg-amber-600 hover:bg-amber-700 rounded-full"
                          asChild
                        >
                          <Link href={`/checkout?product=${beer.id}&type=beer`}>
                            Comprar ahora
                          </Link>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Special Edition Beer */}
            <div className="mt-16">
              <div className="bg-gradient-to-r from-amber-100 to-amber-50 rounded-3xl overflow-hidden">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="p-8 md:p-10 flex flex-col justify-center">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-amber-600 hover:bg-amber-700 px-3 py-1 text-xs">
                          Edición Limitada
                        </Badge>
                        <Badge className="bg-amber-800 hover:bg-amber-900 px-3 py-1 text-xs">
                          20 botellas
                        </Badge>
                      </div>
                      <h3 className="text-2xl md:text-3xl font-bold">
                        Luna Especial
                      </h3>
                      <p className="text-amber-800 font-medium">
                        Cerveza Premium de Temporada
                      </p>
                      <p className="text-muted-foreground">
                        Nuestra creación más exclusiva, elaborada con
                        ingredientes premium cuidadosamente seleccionados. Con
                        delicadas notas de banana y clavo, esta cerveza de
                        temporada ofrece una experiencia sensorial única.
                        Disponibilidad limitada a solo 20 botellas por
                        temporada.
                      </p>
                      <Button className="bg-amber-700 hover:bg-amber-800 rounded-full w-fit mt-2">
                        Reserva tu botella
                      </Button>
                    </div>
                  </div>
                  <div className="relative h-[300px] md:h-auto">
                    <Image
                      src="/images/special-edition.png"
                      alt="Luna Especial - Edición Limitada"
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-l from-transparent to-amber-900/20"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Beneficios de la Cerveza Artesanal */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-amber-50 to-white">
          <div className="container space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold tracking-tight">
                Beneficios de Nuestra Cerveza Artesanal
              </h2>
              <p className="text-muted-foreground max-w-3xl mx-auto">
                En Luna Brew House elaboramos cerveza 100% artesanal, sin
                conservantes ni agregados químicos. Descubre por qué nuestra
                cerveza no solo es más sabrosa, sino también más saludable.
              </p>
            </div>

            {/* Contenedor con posicionamiento relativo para los ingredientes flotantes */}
            <div className="relative min-h-[600px]" id="ingredients-container">
              {/* Burbujas de ingredientes solo para desktop */}
              <BubbleIngredient
                src="/images/ingredient-barley.png"
                alt="Cebada"
                size={100}
                position={{ top: "20px", left: "40px" }}
                delay={0}
                duration={8}
              />

              <BubbleIngredient
                src="/images/ingredient-hops.png"
                alt="Lúpulo"
                size={85}
                position={{ bottom: "80px", left: "15%" }}
                delay={1}
                duration={6}
              />

              <BubbleIngredient
                src="/images/ingredient-water.png"
                alt="Agua"
                size={75}
                position={{ top: "50px", right: "15%" }}
                delay={0.5}
                duration={7}
              />

              <BubbleIngredient
                src="/images/ingredient-yeast.png"
                alt="Levadura"
                size={90}
                position={{ bottom: "40px", right: "60px" }}
                delay={1.5}
                duration={9}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-5 mt-8">
                {/* Beneficio 1: Antioxidantes */}
                <div className="bg-white rounded-3xl p-6 shadow-md hover:shadow-lg transition-shadow">
                  <div className="h-14 w-14 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-amber-600"
                    >
                      <path d="M8.4 10.6a4 4 0 1 0 6.3 4.3 4 4 0 0 0-6.3-4.3"></path>
                      <path d="m13 8.3-2.1-5.6a1 1 0 0 0-1.8 0L7 8.3"></path>
                      <path d="m9 6.2 1 2.8"></path>
                      <path d="M16 18a4 4 0 0 0 4-4"></path>
                      <path d="m12 12 1.3 1.5"></path>
                      <path d="M19 16c.6 0 1 .4 1 1v1a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-1c0-.6.4-1 1-1"></path>
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold mb-2">
                    Mayor concentración de antioxidantes
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Nuestras cervezas contienen niveles más altos de polifenoles
                    y flavonoides, compuestos antioxidantes que ayudan a
                    combatir el estrés oxidativo y la inflamación. Estos
                    antioxidantes pueden contribuir a la salud cardiovascular y
                    a la prevención de enfermedades neurodegenerativas.
                  </p>
                  <div className="text-sm text-amber-700">
                    Fuentes: elviejoartesano.com, TuChecador App
                  </div>
                </div>

                {/* Beneficio 2: Nutrientes */}
                <div className="bg-white rounded-3xl p-6 shadow-md hover:shadow-lg transition-shadow">
                  <div className="h-14 w-14 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-amber-600"
                    >
                      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"></path>
                      <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"></path>
                      <path d="M12 17.5v-11"></path>
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold mb-2">
                    Nutrientes esenciales
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Gracias a procesos menos agresivos como la no pasteurización
                    y la filtración mínima, nuestra cerveza conserva una mayor
                    cantidad de vitaminas del grupo B (B2, B3, B6) y minerales
                    como magnesio, fósforo y potasio. Estos nutrientes son
                    importantes para funciones metabólicas y la salud ósea.
                  </p>
                  <div className="text-sm text-amber-700">
                    Fuente: www.elsevier.com
                  </div>
                </div>

                {/* Beneficio 3: Salud digestiva */}
                <div className="bg-white rounded-3xl p-6 shadow-md hover:shadow-lg transition-shadow">
                  <div className="h-14 w-14 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-amber-600"
                    >
                      <path d="M17 10c.7-.7 1.5-1 2.5-1 2 0 3.5 1.5 3.5 3.5 0 .7-.2 1.4-.5 2"></path>
                      <path d="M9 12a4 4 0 1 0 0 8h10a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-3"></path>
                      <path d="M13 5c-.4-1.2-1.5-2-3-2-2.2 0-4 1.8-4 4 0 .5.1.9.2 1.2"></path>
                      <path d="M9 10c-.4-1.2-1.5-2-3-2-2.2 0-4 1.8-4 4 0 .5.1.9.2 1.2"></path>
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold mb-2">
                    Mejora de la salud digestiva
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    La presencia de fibras solubles como los beta-glucanos y
                    probióticos naturales en nuestra cerveza artesanal puede
                    favorecer una digestión saludable y aliviar problemas como
                    el estreñimiento. Estos componentes también apoyan la salud
                    intestinal al promover el crecimiento de bacterias
                    beneficiosas.
                  </p>
                  <div className="text-sm text-amber-700">
                    Fuente: Cervecería FESTA
                  </div>
                </div>
              </div>

              <div className="bg-amber-100 rounded-3xl p-6 md:p-8 mt-8">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="md:w-1/4 flex justify-center">
                    <div className="h-32 w-32 rounded-full bg-amber-200 flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="64"
                        height="64"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-amber-700"
                      >
                        <path d="M6 12h12"></path>
                        <path d="M12 6v12"></path>
                      </svg>
                    </div>
                  </div>
                  <div className="md:w-3/4">
                    <h3 className="text-xl font-bold mb-2">
                      100% Natural, 100% Artesanal
                    </h3>
                    <p className="text-muted-foreground">
                      A diferencia de las cervezas industriales, que suelen
                      contener conservantes, estabilizantes y otros aditivos
                      químicos, nuestras cervezas artesanales están elaboradas
                      exclusivamente con ingredientes naturales: agua, malta,
                      lúpulo y levadura. No utilizamos aditivos artificiales,
                      conservantes ni aceleradores del proceso de fermentación,
                      lo que resulta en un producto más puro, sabroso y
                      saludable.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Badge className="bg-amber-200 text-amber-800 hover:bg-amber-300">
                        Sin conservantes
                      </Badge>
                      <Badge className="bg-amber-200 text-amber-800 hover:bg-amber-300">
                        Sin aditivos químicos
                      </Badge>
                      <Badge className="bg-amber-200 text-amber-800 hover:bg-amber-300">
                        Ingredientes naturales
                      </Badge>
                      <Badge className="bg-amber-200 text-amber-800 hover:bg-amber-300">
                        Proceso tradicional
                      </Badge>
                      <Badge className="bg-amber-200 text-amber-800 hover:bg-amber-300">
                        Mayor sabor
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fin del contenedor relativo para los ingredientes */}
            </div>
          </div>
        </section>

        {/* Subscription Section */}
        <section
          id="suscripciones"
          className="py-16 md:py-24 bg-gradient-to-b from-amber-50 to-white"
        >
          <div className="container space-y-12">
            <div className="text-center space-y-4">
              <Badge className="bg-amber-600 hover:bg-amber-700 px-3 py-1 text-sm mb-2">
                ¡NUEVO!
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                Club Luna
              </h2>
              <p className="text-muted-foreground max-w-3xl mx-auto">
                Únete a nuestro club de suscripción y recibe tu cerveza favorita
                cada mes con un 20% de descuento y una botella de nuestra
                edición especial de temporada completamente gratis.
              </p>
            </div>
            <div className="max-w-xl mx-auto mt-4">
              <Alert className="bg-amber-50 border-amber-200">
                <Truck className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800 text-sm">
                  <span className="font-bold">¡Envío GRATIS!</span> Acercamos la
                  cerveza a tu casa sin cargo adicional en Mar del Plata.
                </AlertDescription>
              </Alert>
            </div>

            {loadingSubscriptions ? (
              <div className="flex justify-center items-center py-12">
                <LoadingSpinner />
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-500">{error}</p>
              </div>
            ) : (
              <SubscriptionPlans subscriptions={subscriptions} />
            )}
          </div>
        </section>

        {/* History Section */}
        <section id="historia" className="container py-16 md:py-24">
          <div className="space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold tracking-tight">
                Nuestra Historia
              </h2>
              <p className="text-muted-foreground max-w-3xl mx-auto">
                Una familia, un sueño y una perra llamada Luna que lo cambió
                todo.
              </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-2 items-center">
              <div className="relative h-[400px] overflow-hidden rounded-3xl">
                <Image
                  src="/images/family-brewing.png"
                  alt="Familia Luna Brew House"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold">
                    El alma de nuestra cervecería
                  </h3>
                  <p className="text-muted-foreground">
                    Luna no es solo un nombre, sino nuestra inspiración. Luna es
                    nuestra fiel compañera, una perra que llegó a nuestras vidas
                    una mágica noche de luna llena. Desde ese momento, su
                    espíritu alegre y amigable se convirtió en el símbolo
                    perfecto de nuestra cervecería artesanal: auténtica, cálida
                    y hecha con amor.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold">Raíces vascas</h3>
                  <p className="text-muted-foreground">
                    Nuestra historia está profundamente arraigada en nuestras
                    raíces vascas, donde la tradición y el amor por lo artesanal
                    siempre han sido parte de nuestra vida. Traemos esa herencia
                    a cada cerveza que elaboramos.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold">
                    Mar del Plata, nuestro hogar
                  </h3>
                  <p className="text-muted-foreground">
                    Desde "La Feliz", creamos cervezas que capturan la esencia
                    de nuestra ciudad costera: refrescantes, auténticas y con
                    carácter.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Proceso de Elaboración */}
        {/*<section
          id="proceso"
          className="py-16 md:py-24 bg-gradient-to-b from-amber-50 to-white"
        >
          <div className="container space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold tracking-tight">
                Nuestra Casa Cervecera
              </h2>
              <p className="text-muted-foreground max-w-3xl mx-auto">
                Descubre el corazón de Luna Brew House: nuestro sistema de
                microcervecería artesanal donde cada gota de cerveza es
                elaborada con pasión, paciencia y dedicación.
              </p>
            </div>

            <BreweryGallery />

            <div className="mt-16">
              <h3 className="text-2xl font-bold text-center mb-8">
                El Proceso Artesanal
              </h3>
              <BrewingTimeline />n 
            </div>
          </div>
        </section> */}

        {/* Contact Section */}
        <section id="contacto" className="bg-amber-900/10 py-16 md:py-24">
          <div className="container">
            <div className="grid gap-8 lg:grid-cols-2">
              <div className="space-y-6">
                <h2 className="text-3xl font-bold tracking-tight">Visítanos</h2>
                <p className="text-muted-foreground">
                  Te esperamos para compartir nuestras cervezas y conocer a Luna
                  en persona. ¡Brindemos juntos por momentos inolvidables!
                </p>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-amber-700 mt-0.5" />
                    <div>
                      <h3 className="font-medium">Dirección</h3>
                      <p className="text-muted-foreground">
                        Av. Luro 2514, Mar del Plata, Argentina
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-amber-700 mt-0.5" />
                    <div>
                      <h3 className="font-medium">Teléfono</h3>
                      <p className="text-muted-foreground">+54 223 634-4785</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-amber-700 mt-0.5" />
                    <div>
                      <h3 className="font-medium">Email</h3>
                      <p className="text-muted-foreground">
                        lunabrewhouse@gmail.com
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-amber-700 mt-0.5" />
                    <div>
                      <h3 className="font-medium">Horarios</h3>
                      <p className="text-muted-foreground">
                        Miércoles a Domingo: 8:00 - 17:00
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="h-[300px] lg:h-auto rounded-3xl overflow-hidden">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d201064.7438104767!2d-57.69584542753437!3d-38.00439777546787!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x9584d94d19d34209%3A0xdd9670804bfed126!2sMar%20del%20Plata%2C%20Provincia%20de%20Buenos%20Aires!5e0!3m2!1ses!2sar!4v1715252512000!5m2!1ses!2sar"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Mapa de ubicación de Luna Brew House"
                ></iframe>
              </div>
            </div>
          </div>
        </section>

        {/* Newsletter Section */}
        <section className="container py-16 md:py-24">
          <div className="rounded-3xl bg-amber-50 p-8 md:p-12">
            <div className="grid gap-6 lg:grid-cols-2 items-center">
              <div className="space-y-4">
                <h2 className="text-3xl font-bold tracking-tight">
                  Mantente conectado
                </h2>
                <p className="text-muted-foreground">
                  Suscríbete a nuestro newsletter para recibir noticias sobre
                  nuevas cervezas, eventos especiales y promociones exclusivas.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  placeholder="Tu email"
                  className="flex h-10 w-full rounded-full border border-input bg-background px-5 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <Button className="bg-amber-700 hover:bg-amber-800 shrink-0 rounded-full">
                  Suscribirse
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t bg-amber-900/5">
        <div className="container py-8 md:py-12">
          <div className="grid gap-8 lg:grid-cols-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="relative h-10 w-10 overflow-hidden rounded-full">
                  <Image
                    src="/images/luna-logo.png"
                    alt="Luna logo"
                    width={40}
                    height={40}
                    className="object-cover"
                  />
                </div>
                <span className="text-xl font-bold">Luna Brew House</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Cerveza artesanal con el alma de Luna. Elaborada con pasión en
                Mar del Plata.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Enlaces</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="#inicio"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Inicio
                  </Link>
                </li>
                <li>
                  <Link
                    href="#cervezas"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Nuestras Cervezas
                  </Link>
                </li>
                <li>
                  <Link
                    href="#proceso"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Nuestro Proceso
                  </Link>
                </li>
                <li>
                  <Link
                    href="#suscripciones"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Suscripciones
                  </Link>
                </li>
                <li>
                  <Link
                    href="#historia"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Historia
                  </Link>
                </li>
                <li>
                  <Link
                    href="#contacto"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Contacto
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Contacto</h3>
              <ul className="space-y-2 text-sm">
                <li className="text-muted-foreground">
                  Av. Luro 2514, Mar del Plata
                </li>
                <li className="text-muted-foreground">+54 223 555-1234</li>
                <li className="text-muted-foreground">
                  lunabrewhouse@gmail.com
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Síguenos</h3>
              <div className="flex gap-4">
                <Link
                  href="#"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <span className="sr-only">Instagram</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                  >
                    <rect
                      width="20"
                      height="20"
                      x="2"
                      y="2"
                      rx="5"
                      ry="5"
                    ></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line>
                  </svg>
                </Link>
                <Link
                  href="#"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <span className="sr-only">Facebook</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                  >
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                  </svg>
                </Link>
                <Link
                  href="#"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <span className="sr-only">Twitter</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                  >
                    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                  </svg>
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
            <p>
              &copy; {new Date().getFullYear()} Luna Brew House. Todos los
              derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function SubscriptionPlans({
  subscriptions,
}: {
  subscriptions: Subscription[];
}) {
  const [selectedBeerTypes, setSelectedBeerTypes] = useState<
    Record<string, string>
  >({});

  const beerPrices = {
    golden: 3500,
    red: 4500,
    ipa: 5000,
  };

  // Inicializar los tipos de cerveza seleccionados para cada plan
  useEffect(() => {
    const initialBeerTypes: Record<string, string> = {};
    subscriptions.forEach((plan) => {
      initialBeerTypes[plan.id] = "golden"; // Valor por defecto
    });
    setSelectedBeerTypes(initialBeerTypes);
  }, [subscriptions]);

  const calculatePrice = (liters: number, beerType: string) => {
    const regularPrice =
      beerPrices[beerType as keyof typeof beerPrices] * liters;
    const discountedPrice = regularPrice * 0.8; // 20% discount
    return Math.round(discountedPrice);
  };

  const calculatePricePerLiter = (liters: number, beerType: string) => {
    const totalPrice = calculatePrice(liters, beerType);
    return Math.round(totalPrice / liters);
  };

  const updateBeerType = (planId: string, beerType: string) => {
    setSelectedBeerTypes((prev) => ({
      ...prev,
      [planId]: beerType,
    }));
  };

  // Si no hay planes, mostrar mensaje
  if (!subscriptions || subscriptions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-amber-800">
          No hay planes de suscripción disponibles en este momento.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {subscriptions.map((plan) => (
        <div
          key={plan.id}
          className={`relative rounded-3xl overflow-hidden border ${
            plan.popular
              ? "border-amber-500 shadow-lg shadow-amber-100"
              : "border-gray-200 shadow-md shadow-gray-100"
          }`}
        >
          {plan.popular && (
            <div className="absolute top-0 right-0 bg-amber-500 text-white px-4 py-1 rounded-bl-lg font-medium text-sm">
              Más popular
            </div>
          )}
          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <h3 className="text-xl font-bold">{plan.name}</h3>
              <p className="text-muted-foreground">
                {plan.liters} litros por mes
              </p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label
                  htmlFor={`beer-type-${plan.id}`}
                  className="text-sm font-medium"
                >
                  Selecciona tu variedad:
                </label>
                <Select
                  value={selectedBeerTypes[plan.id] || "golden"}
                  onValueChange={(value) => updateBeerType(plan.id, value)}
                  id={`beer-type-${plan.id}`}
                >
                  <SelectTrigger className="w-full rounded-full">
                    <SelectValue placeholder="Selecciona una variedad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="golden">
                      Luna Dorada (Golden Ale)
                    </SelectItem>
                    <SelectItem value="red">
                      Luna Roja (Irish Red Ale)
                    </SelectItem>
                    <SelectItem value="ipa">Luna Brillante (IPA)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-4 pb-2">
                <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-amber-800">
                        Precio por litro
                      </p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-amber-700">
                          $
                          {calculatePricePerLiter(
                            plan.liters,
                            selectedBeerTypes[plan.id] || "golden"
                          )}
                        </span>
                        <span className="text-sm line-through text-amber-700/60">
                          $
                          {
                            beerPrices[
                              (selectedBeerTypes[
                                plan.id
                              ] as keyof typeof beerPrices) || "golden"
                            ]
                          }
                        </span>
                      </div>
                      <p className="text-xs text-amber-600 font-medium">
                        Ahorras 20% por litro
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-amber-800">
                        Total mensual
                      </p>
                      <p className="text-xl font-bold text-amber-700">
                        $
                        {calculatePrice(
                          plan.liters,
                          selectedBeerTypes[plan.id] || "golden"
                        )}
                      </p>
                      <p className="text-xs text-amber-600">
                        por {plan.liters} litros
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t">
              <p className="text-sm font-medium">Incluye:</p>
              <ul className="space-y-2">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
                <li className="flex items-start gap-2 text-sm font-medium text-amber-700">
                  <Check className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                  <span>1 botella de Luna Especial GRATIS</span>
                </li>
              </ul>
            </div>

            <Button
              className={`w-full rounded-full ${
                plan.popular
                  ? "bg-amber-600 hover:bg-amber-700"
                  : "bg-amber-500 hover:bg-amber-600"
              }`}
              asChild
            >
              <Link
                href={`/checkout?product=${
                  plan.id
                }&type=subscription&beer-type=${
                  selectedBeerTypes[plan.id] || "golden"
                }`}
              >
                Suscribirse ahora
              </Link>
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

function BreweryGallery() {
  const images = [
    {
      src: "/placeholder.svg?height=600&width=800",
      alt: "Ollas de maceración",
      caption: "Nuestras ollas de maceración de 30 litros",
    },
    {
      src: "/placeholder.svg?height=600&width=800",
      alt: "Fermentadores cónicos",
      caption: "Fermentadores cónicos para una fermentación óptima",
    },
    {
      src: "/placeholder.svg?height=600&width=800",
      alt: "Proceso de embotellado",
      caption: "Embotellado artesanal para preservar el sabor",
    },
    {
      src: "/placeholder.svg?height=600&width=800",
      alt: "Ingredientes naturales",
      caption: "Solo usamos ingredientes naturales de la mejor calidad",
    },
    {
      src: "/placeholder.svg?height=600&width=800",
      alt: "Cata de cerveza",
      caption: "Cata y control de calidad de cada lote",
    },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const timerRef = useRef(null);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  useEffect(() => {
    if (!isHovering) {
      timerRef.current = setInterval(() => {
        nextSlide();
      }, 5000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isHovering, currentIndex]);

  return (
    <div
      className="relative rounded-3xl overflow-hidden"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="relative h-[400px] md:h-[500px]">
        {images.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentIndex
                ? "opacity-100"
                : "opacity-0 pointer-events-none"
            }`}
          >
            <Image
              src={image.src || "/placeholder.svg"}
              alt={image.alt}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <p className="text-xl font-bold">{image.caption}</p>
            </div>
          </div>
        ))}
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm hover:bg-white/40 text-white rounded-full h-10 w-10"
        onClick={prevSlide}
      >
        <ChevronLeft className="h-6 w-6" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm hover:bg-white/40 text-white rounded-full h-10 w-10"
        onClick={nextSlide}
      >
        <ChevronRight className="h-6 w-6" />
      </Button>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {images.map((_, index) => (
          <button
            key={index}
            className={`h-2 rounded-full transition-all ${
              index === currentIndex ? "w-8 bg-white" : "w-2 bg-white/50"
            }`}
            onClick={() => goToSlide(index)}
          ></button>
        ))}
      </div>
    </div>
  );
}

function BrewingTimeline() {
  const [activeStep, setActiveStep] = useState(0);
  const timelineRef = useRef(null);

  const brewingSteps = [
    {
      id: "step-1",
      title: "Selección de ingredientes",
      description:
        "Elegimos cuidadosamente malta, lúpulo, levadura y agua de la mejor calidad. Cada ingrediente es seleccionado por su aporte al perfil de sabor único de nuestras cervezas.",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2a8 8 0 0 0-8 8c0 5.2 8 12 8 12s8-6.8 8-12a8 8 0 0 0-8-8Z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
      ),
    },
    {
      id: "step-2",
      title: "Maceración",
      description:
        "En nuestras ollas de 30 litros, mezclamos la malta molida con agua caliente para extraer los azúcares fermentables. Este proceso dura aproximadamente 60-90 minutos a temperatura controlada.",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M17 3v10"></path>
          <path d="M7 3v10"></path>
          <path d="M17 13H7"></path>
          <path d="M7 13v3a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-3"></path>
          <line x1="3" x2="21" y1="3" y2="3"></line>
        </svg>
      ),
    },
    {
      id: "step-3",
      title: "Cocción y lupulado",
      description:
        "Hervimos el mosto durante 60-90 minutos, añadiendo lúpulo en diferentes momentos para aportar amargor, sabor y aroma. Este paso es crucial para el perfil final de cada cerveza.",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 14.66c0 2.95 2.55 5.34 5.5 5.34s5.5-2.39 5.5-5.34a5.5 5.5 0 0 0-11 0"></path>
          <path d="M10.5 8a2.5 2.5 0 1 0 5 0 2.5 2.5 0 1 0-5 0"></path>
          <path d="M2 21.5V9"></path>
          <path d="M22 21.5V9"></path>
          <path d="M2 14h20"></path>
        </svg>
      ),
    },
    {
      id: "step-4",
      title: "Clarificación",
      description:
        "Enfriamos rápidamente el mosto y lo clarificamos para eliminar partículas sólidas. Este proceso es fundamental para obtener una cerveza limpia y brillante.",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M8.8 20v-4.1l1.9.2a2.3 2.3 0 0 0 2.164-2.1V8.3A5.37 5.37 0 0 0 2 8.25c0 2.8.656 3.95 1 4.8a.671.671 0 0 1 .1.5L2 20"></path>
          <path d="M19.8 17.8a7.5 7.5 0 0 0-2.4-3.8"></path>
          <path d="M22 19a9.65 9.65 0 0 0-3-5"></path>
          <path d="M13.4 13.35 15 12l-1.6-1.35a2.15 2.15 0 0 1-.8-1.65V6"></path>
        </svg>
      ),
    },
    {
      id: "step-5",
      title: "Fermentación",
      description:
        "Transferimos el mosto a nuestros fermentadores cónicos donde añadimos la levadura. Durante 1-3 semanas, la levadura convierte los azúcares en alcohol y CO2, desarrollando los sabores característicos.",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M10 2v7.31"></path>
          <path d="M14 9.3V1.99"></path>
          <path d="M8.5 2h7"></path>
          <path d="M14 9.3a6.5 6.5 0 1 1-4 0"></path>
          <path d="M5.58 16.5h12.85"></path>
        </svg>
      ),
    },
    {
      id: "step-6",
      title: "Embotellado y carbonatación",
      description:
        "Embotellamos la cerveza con una pequeña cantidad de azúcar para la carbonatación natural en botella. Este proceso artesanal permite que la cerveza desarrolle su efervescencia de forma natural.",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M10 2v1"></path>
          <path d="M14 2v1"></path>
          <path d="M12 2v6"></path>
          <path d="M13.8 8.2c1 .7 1.7 1.7 2 2.8.3 1.1.1 2.3-.5 3.3-.5.9-1.4 1.5-2.4 1.7-1 .2-2 0-2.8-.6-.8-.6-1.4-1.5-1.6-2.5-.2-1 0-2 .5-2.9.5-.9 1.4-1.5 2.4-1.7.9-.2 1.8 0 2.4.9Z"></path>
          <path d="M15.2 22H8.8c-1.76 0-3.2-1.4-3.2-3.2V14c0-1.4 1.1-2.5 2.5-2.5 0 0 1.3.5 2.9.5 1.6 0 2.9-.5 2.9-.5 1.4 0 2.5 1.1 2.5 2.5v4.8c0 1.76-1.44 3.2-3.2 3.2Z"></path>
        </svg>
      ),
    },
    {
      id: "step-7",
      title: "Maduración",
      description:
        "Dejamos que nuestras cervezas maduren en botella durante al menos 2 semanas. Este tiempo permite que los sabores se integren y la carbonatación se desarrolle completamente.",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
          <line x1="12" x2="12" y1="8" y2="16"></line>
          <line x1="8" x2="16" y1="12" y2="12"></line>
        </svg>
      ),
    },
  ];

  const scrollToStep = (index) => {
    setActiveStep(index);
    if (timelineRef.current) {
      const stepElement = document.getElementById(brewingSteps[index].id);
      if (stepElement) {
        const containerRect = timelineRef.current.getBoundingClientRect();
        const stepRect = stepElement.getBoundingClientRect();
        const offset =
          stepRect.left -
          containerRect.left -
          containerRect.width / 2 +
          stepRect.width / 2;
        timelineRef.current.scrollLeft += offset;
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Timeline horizontal para desktop */}
      <div className="hidden md:block">
        <div
          ref={timelineRef}
          className="relative flex overflow-x-auto pb-8 scrollbar-hide snap-x snap-mandatory"
          style={{ scrollBehavior: "smooth" }}
        >
          {/* Línea de tiempo */}
          <div className="absolute h-1 bg-amber-200 top-7 left-0 right-0 z-0 mx-8"></div>

          {/* Pasos */}
          <div className="flex space-x-16 px-8">
            {brewingSteps.map((step, index) => (
              <div
                key={index}
                id={step.id}
                className={`flex flex-col items-center snap-center`}
                style={{ minWidth: "200px" }}
              >
                <button
                  onClick={() => scrollToStep(index)}
                  className={`relative z-10 flex items-center justify-center w-14 h-14 rounded-full transition-all ${
                    activeStep === index
                      ? "bg-amber-600 text-white scale-110"
                      : "bg-amber-100 text-amber-600 hover:bg-amber-200"
                  }`}
                >
                  <div className="w-6 h-6">{step.icon}</div>
                </button>
                <h4
                  className={`mt-4 font-bold text-center transition-colors ${
                    activeStep === index ? "text-amber-700" : "text-gray-600"
                  }`}
                >
                  {step.title}
                </h4>
                <p
                  className={`mt-2 text-sm text-center max-w-xs transition-colors ${
                    activeStep === index ? "text-gray-700" : "text-gray-500"
                  }`}
                >
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline vertical para mobile */}
      <div className="md:hidden space-y-8">
        {brewingSteps.map((step, index) => (
          <div
            key={index}
            className={`relative pl-10 ${
              index !== brewingSteps.length - 1
                ? "pb-8 border-l-2 border-amber-200 ml-6"
                : ""
            }`}
          >
            <div
              className={`absolute left-0 flex items-center justify-center w-12 h-12 rounded-full ${
                activeStep === index
                  ? "bg-amber-600 text-white"
                  : "bg-amber-100 text-amber-600"
              }`}
            >
              <div className="w-6 h-6">{step.icon}</div>
            </div>
            <div className="pt-1">
              <h4
                className={`font-bold ${
                  activeStep === index ? "text-amber-700" : "text-gray-600"
                }`}
                onClick={() => setActiveStep(index)}
              >
                {step.title}
              </h4>
              <p className="mt-2 text-sm text-gray-500">{step.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs para mostrar detalles de cada paso */}
      <div className="mt-12 bg-amber-50 rounded-3xl p-6">
        <Tabs
          value={brewingSteps[activeStep].id}
          onValueChange={(value) =>
            setActiveStep(brewingSteps.findIndex((step) => step.id === value))
          }
        >
          <TabsList className="grid grid-cols-3 md:grid-cols-7 h-auto">
            {brewingSteps.map((step, index) => (
              <TabsTrigger
                key={index}
                value={step.id}
                className={`text-xs md:text-sm py-2 ${
                  activeStep === index ? "bg-amber-600 text-white" : ""
                }`}
              >
                {index + 1}. {step.title.split(" ")[0]}
              </TabsTrigger>
            ))}
          </TabsList>
          {brewingSteps.map((step, index) => (
            <TabsContent key={index} value={step.id} className="mt-6">
              <div className="grid md:grid-cols-2 gap-6 items-center">
                <div>
                  <h3 className="text-xl font-bold text-amber-800">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-muted-foreground">
                    {step.description}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {index === 0 && (
                      <>
                        <Badge className="bg-amber-200 text-amber-800">
                          Malta de cebada
                        </Badge>
                        <Badge className="bg-amber-200 text-amber-800">
                          Lúpulo fresco
                        </Badge>
                        <Badge className="bg-amber-200 text-amber-800">
                          Levadura seleccionada
                        </Badge>
                        <Badge className="bg-amber-200 text-amber-800">
                          Agua filtrada
                        </Badge>
                      </>
                    )}
                    {index === 1 && (
                      <>
                        <Badge className="bg-amber-200 text-amber-800">
                          60-90 minutos
                        </Badge>
                        <Badge className="bg-amber-200 text-amber-800">
                          65-68°C
                        </Badge>
                        <Badge className="bg-amber-200 text-amber-800">
                          Ollas de 30L
                        </Badge>
                      </>
                    )}
                    {index === 2 && (
                      <>
                        <Badge className="bg-amber-200 text-amber-800">
                          Lúpulo de amargor
                        </Badge>
                        <Badge className="bg-amber-200 text-amber-800">
                          Lúpulo de sabor
                        </Badge>
                        <Badge className="bg-amber-200 text-amber-800">
                          Lúpulo de aroma
                        </Badge>
                      </>
                    )}
                    {index === 3 && (
                      <>
                        <Badge className="bg-amber-200 text-amber-800">
                          Enfriamiento rápido
                        </Badge>
                        <Badge className="bg-amber-200 text-amber-800">
                          Filtración natural
                        </Badge>
                        <Badge className="bg-amber-200 text-amber-800">
                          Sin químicos
                        </Badge>
                      </>
                    )}
                    {index === 4 && (
                      <>
                        <Badge className="bg-amber-200 text-amber-800">
                          Fermentadores cónicos
                        </Badge>
                        <Badge className="bg-amber-200 text-amber-800">
                          1-3 semanas
                        </Badge>
                        <Badge className="bg-amber-200 text-amber-800">
                          Temperatura controlada
                        </Badge>
                      </>
                    )}
                    {index === 5 && (
                      <>
                        <Badge className="bg-amber-200 text-amber-800">
                          Botellas de vidrio
                        </Badge>
                        <Badge className="bg-amber-200 text-amber-800">
                          Carbonatación natural
                        </Badge>
                        <Badge className="bg-amber-200 text-amber-800">
                          Proceso manual
                        </Badge>
                      </>
                    )}
                    {index === 6 && (
                      <>
                        <Badge className="bg-amber-200 text-amber-800">
                          Mínimo 2 semanas
                        </Badge>
                        <Badge className="bg-amber-200 text-amber-800">
                          Temperatura estable
                        </Badge>
                        <Badge className="bg-amber-200 text-amber-800">
                          Desarrollo de sabores
                        </Badge>
                      </>
                    )}
                  </div>
                </div>
                <div className="relative h-64 rounded-xl overflow-hidden">
                  <Image
                    src="/placeholder.svg?height=400&width=600"
                    alt={step.title}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      <div className="text-center mt-8">
        <p className="text-muted-foreground max-w-3xl mx-auto">
          Cada paso de nuestro proceso artesanal está diseñado para preservar
          los sabores naturales y crear una cerveza de calidad excepcional. No
          utilizamos conservantes ni aditivos químicos, solo ingredientes
          naturales y mucha pasión.
        </p>
        <Button className="mt-6 bg-amber-600 hover:bg-amber-700 rounded-full">
          Visita nuestra cervecería
        </Button>
      </div>
    </div>
  );
}
