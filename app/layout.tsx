import type { Metadata, Viewport } from "next";
import { Figtree } from "next/font/google";
import "./globals.css";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "Carlust — Affordable self-drive cars at your doorstep",
    template: "%s · Carlust",
  },
  description:
    "Rent self-drive cars by the hour from verified hosts. Pick up yourself or get the car delivered to your doorstep, with or without a driver.",
};

export const viewport: Viewport = {
  themeColor: "#DF4058",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${figtree.variable} antialiased`}>
      <body className="min-h-dvh font-sans">{children}</body>
    </html>
  );
}
