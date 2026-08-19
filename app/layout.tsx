import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host") || "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;
  const title = "知命排盘｜水墨青山中的四柱排盘";
  const description = "输入阳历出生时间与出生地，在新中式水墨界面中按节气和真太阳时生成详实四柱命盘，并支持公元 1000–2100 年八字反查。";
  return {
    title,
    description,
    icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
    openGraph: { title, description, type: "website", images: [{ url: `${origin}/ink-mountains.png`, width: 1736, height: 907, alt: "知命排盘水墨青山" }] },
    twitter: { card: "summary_large_image", title, description, images: [`${origin}/ink-mountains.png`] },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
