
import Image from "next/image";
import DecryptedText from "@/components/ui/decrypted-text";
import { useTranslations } from "next-intl";
import HeroSection from "@/components/sections/Hero";

export default function Home() {
  return (
    <div className="flex-1 flex flex-col justify-center items-stretch">
      <HeroSection />
    </div>
  );
}
