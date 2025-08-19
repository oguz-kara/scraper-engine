import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ApolloClientProvider } from "@/providers/apollo-provider";
import { Header } from "@/components/layout/header";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Scraper Engine - Job Manager",
  description: "Manage and monitor web scraping jobs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ApolloClientProvider>
          <div className="min-h-screen bg-white">
            <Header />
            <main className="container mx-auto py-6">
              {children}
            </main>
          </div>
          <Toaster />
        </ApolloClientProvider>
      </body>
    </html>
  );
}
