import {
  getSEOConfig,
  generateMetadata as generateSEOMetadata,
} from "@/lib/seo";
import type { Metadata } from "next";
import SubscriptionClient from "./SubscriptionClient";

interface PageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const seoConfig = await getSEOConfig();

  // En una implementación real, aquí podrías obtener los datos de la suscripción específica
  // const subscription = await getSubscription(params.id);

  return generateSEOMetadata(
    seoConfig,
    `Suscripción ${params.id}`,
    "Detalles de tu plan de suscripción de cerveza artesanal. Personaliza tu experiencia y disfruta de entregas mensuales.",
    undefined,
    `/suscripciones/${params.id}`
  );
}

export default function SubscriptionPage({ params }: PageProps) {
  return <SubscriptionClient subscriptionId={params.id} />;
}
