import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host") || "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  const base = new URL(`${protocol}://${host}`);

  return {
    metadataBase: base,
    title: "Signal Messenger Replica",
    description: "Private, familiar, beautifully responsive.",
    openGraph: {
      title: "Signal Messenger Replica",
      description: "Private, familiar, beautifully responsive.",
      type: "website",
      images: [{ url: "/og.png", width: 1672, height: 941, alt: "Signal Messenger Replica interface" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Signal Messenger Replica",
      description: "Private, familiar, beautifully responsive.",
      images: ["/og.png"],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
