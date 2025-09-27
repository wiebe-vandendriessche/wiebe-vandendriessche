"use client";
import { usePathname } from "next/navigation";

export default function UnderConstructionWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Main page: /en or /nl (adjust if your locales differ)
  const isMainPage = /^\/(en|nl)\/?$/.test(pathname);

  if (!isMainPage) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h1 className="text-3xl font-bold mb-4">🚧 Under Construction 🚧</h1>
        <p>This page is not available yet. Please check back later!</p>
      </div>
    );
  }

  return <>{children}</>;
}