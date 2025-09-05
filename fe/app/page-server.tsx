import { generatePredefinedMetadata } from "@/lib/seo-helpers";
import type { Metadata } from "next";
import HomeClient from "./HomeClient";

export async function generateMetadata(): Promise<Metadata> {
  return generatePredefinedMetadata("home");
}

export default function HomePage() {
  return <HomeClient />;
}
