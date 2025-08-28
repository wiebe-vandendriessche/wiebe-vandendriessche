
import Image from "next/image";
import DecryptedText from "@/components/ui/decrypted-text";
import { useTranslations } from "next-intl";
import HeroSection from "@/components/sections/Hero";

export default function Home() {
  const t = useTranslations('HomePage');
  return (
    <HeroSection />
 );
}
