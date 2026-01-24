import type { Metadata } from "next";
import { Inter, Libre_Baskerville, Courier_Prime, Caveat } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

// 1. Standard Sans
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

// 2. Quill Font (Serif)
const baskerville = Libre_Baskerville({ 
  weight: ["400", "700"], 
  subsets: ["latin"], 
  style: ["normal", "italic"],
  variable: "--font-serif" 
});

// 3. Typewriter Font (Mono)
const courier = Courier_Prime({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-typewriter"
});

// 4. Note Font (Handwriting)
const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-handwriting"
});

export const metadata: Metadata = {
  title: "Poetry Snaps 🫰",
  description: "A daily word-bank poetry challenge.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${baskerville.variable} ${courier.variable} ${caveat.variable} antialiased`}>
        <Navbar />
        {children}
      </body>
    </html>
  );
}