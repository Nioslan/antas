import { promises as fs } from "fs";
import path from "path";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Hero } from "@/components/home/Hero";
import { UpgradeSection } from "@/components/home/UpgradeSection";
import { PCLines } from "@/components/home/PCLines";
import { WhyAntas } from "@/components/home/WhyAntas";
import { HomeServices } from "@/components/home/HomeServices";
import { HomeWarranty } from "@/components/home/HomeWarranty";
import { HomeReviews } from "@/components/home/HomeReviews";
import { getLineStartingPrice, readInventory } from "@/lib/inventory";
import type { ProductLine } from "@/types/inventory";

async function publicAssetExists(url: string) {
  if (!url?.startsWith("/")) return false;
  try {
    await fs.access(path.join(process.cwd(), "public", url.slice(1)));
    return true;
  } catch {
    return false;
  }
}

export default async function Home() {
  const { products, settings } = await readInventory();
  const startingPrices: Partial<Record<ProductLine, number>> = {};

  for (const line of ["renew", "hybrid", "elite"] as const) {
    const price = getLineStartingPrice(products, line);
    if (price != null) startingPrices[line] = price;
  }

  const heroBanner = (await publicAssetExists("/images/hero-banner.png"))
    ? "/images/hero-banner.png"
    : "";
  const heroFallback = (await publicAssetExists("/images/hero-pc.png"))
    ? "/images/hero-pc.png"
    : "";

  const lineImages: Partial<Record<ProductLine, string>> = {};
  for (const line of ["renew", "hybrid", "elite"] as const) {
    const src = settings.lineImages[line];
    if (src && (await publicAssetExists(src))) {
      lineImages[line] = src;
    } else if (heroFallback) {
      lineImages[line] = heroFallback;
    }
  }

  const heroImage =
    heroBanner ||
    heroFallback ||
    settings.lineImages.elite ||
    settings.lineImages.hybrid ||
    "/images/hero-banner.png";

  return (
    <SiteLayout>
      <Hero imageUrl={heroImage} />
      <PCLines startingPrices={startingPrices} lineImages={lineImages} />
      <UpgradeSection />
      <HomeServices />
      <WhyAntas />
      <HomeWarranty />
      <HomeReviews />
    </SiteLayout>
  );
}
