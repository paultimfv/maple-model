import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const sans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  title: "SYRUP model",
  description: "Interactive SYRUP valuation model with inputs from onchain data",
};

// applied before paint so a saved theme never flashes the other one; ?theme=light|dark forces one (handy for screenshots)
const themeScript = `try{var t=new URLSearchParams(location.search).get("theme")||localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body className="bg-page text-ink antialiased">
        {children}
        <footer className="mx-auto max-w-6xl border-t border-line px-4 py-6 font-mono text-[11px] text-muted">
          Paul Timofeev. Inputs from <a className="underline" href="https://github.com/paultimfv/maple-pipeline">maple-pipeline</a>, refreshed daily. Dashboard: <a className="underline" href="https://maple-robinhood.vercel.app">maple-robinhood.vercel.app</a>. Not investment advice.
        </footer>
      </body>
    </html>
  );
}
