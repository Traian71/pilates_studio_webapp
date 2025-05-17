import type { Metadata } from "next";
import { Josefin_Sans } from "next/font/google";
import localFont from 'next/font/local';
import "./globals.css";
import { cn } from "@/lib/utils";
import Navbar from "@/components/layout/Navbar"; // Added Navbar import
import { AuthProvider } from "@/contexts/AuthContext"; // Added AuthProvider import
import StructuredData from "./structured-data"; // Added StructuredData import

const josefinSans = Josefin_Sans({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500"], // Added 200, Extra-light, Regular, Medium
  variable: "--font-sans", // Assign to CSS variable --font-sans
});

const josefinSansTitle = localFont({
  src: '../../public/fonts/josefin_sans/JosefinSans-Light.ttf',
  weight: '300',
  variable: '--font-title-specific',
});

const inter = localFont({
  src: [
    {
      path: '../../public/fonts/inter/Inter-Medium.ttf',
      weight: '500', // Medium
      style: 'normal',
    },
    {
      path: '../../public/fonts/inter/Inter-Bold.ttf',
      weight: '700', // Bold
      style: 'normal',
    },
  ],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: "Balance Pilates Studio",
  description: "Modern web platform for a Pilates studio that streamlines client onboarding, class booking, and studio management.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ro" suppressHydrationWarning>
      <head>
        <StructuredData />
      </head>
      <body className={cn("min-h-screen bg-[#EBCECE] font-sans antialiased", josefinSans.variable, josefinSansTitle.variable, inter.variable)}>
        <AuthProvider>
          <Navbar />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
