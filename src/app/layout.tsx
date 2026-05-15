import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "../components/Sidebar";
import AuthGuard from "../components/AuthGuard";

export const metadata: Metadata = {
  title: "MathSpace 3D",
  description: "Une plateforme éducative moderne pour la Géométrie",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
      style={{
        fontFamily: 'system-ui, -apple-system, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"',
      }}
    >
      <body className="min-h-full flex bg-slate-900 text-white">
        <AuthGuard />
        <Sidebar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </body>
    </html>
  );
}
