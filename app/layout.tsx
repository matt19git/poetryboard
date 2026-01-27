import type { Metadata } from "next";
import { Inter, Libre_Baskerville, Courier_Prime, Caveat } from "next/font/google";
import "./globals.css";
// REMOVE or Comment out the import if you want, but removing the component below is enough
// import Navbar from "@/components/Navbar"; 

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

const baskerville = Libre_Baskerville({ 
  weight: ["400", "700"], 
  subsets: ["latin"], 
  style: ["normal", "italic"],
  variable: "--font-serif" 
});

const courier = Courier_Prime({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-typewriter"
});

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
<body 
  className={`${inter.variable} ${baskerville.variable} ${courier.variable} ${caveat.variable} antialiased`}
  suppressHydrationWarning={true} /* 👈 ADD THIS LINE */
>        {/* <Navbar />  <-- DELETE OR COMMENT THIS LINE */}
        {children}
      </body>
    </html>
  );
}