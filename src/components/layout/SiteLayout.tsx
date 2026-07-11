import { promises as fs } from "fs";
import path from "path";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { getSettings } from "@/lib/inventory";

type SiteLayoutProps = {
  children: React.ReactNode;
};

async function publicAssetExists(url: string) {
  if (!url?.startsWith("/")) return false;
  try {
    await fs.access(path.join(process.cwd(), "public", url.slice(1)));
    return true;
  } catch {
    return false;
  }
}

export async function SiteLayout({ children }: SiteLayoutProps) {
  const settings = await getSettings();
  const logoUrl = (await publicAssetExists(settings.logo)) ? settings.logo : "";

  return (
    <>
      <Navbar logoUrl={logoUrl} />
      <main className="flex-1 pt-[var(--nav-h)]">{children}</main>
      <Footer logoUrl={logoUrl} />
    </>
  );
}
