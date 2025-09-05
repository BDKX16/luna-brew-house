import { generatePredefinedMetadata } from "@/lib/seo-helpers";
import type { Metadata } from "next";
import ProductsPageContent from "./ProductsPageContent";

export async function generateMetadata(): Promise<Metadata> {
  return generatePredefinedMetadata("products");
}

export default function ProductsPage() {
  return <ProductsPageContent />;
}
