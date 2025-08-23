
import Image from "next/image";
import DecryptedText from "@/components/ui/decrypted-text";
import { useTranslations } from "next-intl";
import HeroSection from "@/components/hero-section";

export default function Home() {
  const t = useTranslations('HomePage');
  return (
    <HeroSection />
    /*
    <div className="flex min-h-[80vh] items-center px-4">
      <div className="flex flex-col md:flex-row items-center gap-20 w-full max-w-6xl">
        <div className="relative flex flex-col justify-center items-end w-[500px] h-[500px]">
          <div className="relative flex flex-col justify-center p-12">
            <div className="foggy-gradient-bg"></div>
            <div className="relative z-10">
              <h1 className="text-5xl font-extrabold mb-4 text-right font-mono">
                <DecryptedText
                  text={t('name')}
                  className="text-5xl font-extrabold tracking-widest uppercase font-mono text-right"
                  animateOn="view"
                  sequential
                  revealDirection="start"
                />
              </h1>
              <p className="text-right text-lg text-muted-foreground mt-2 font-mono tracking-wider">
                <DecryptedText
                  text={t('description')}
                  className="text-lg font-mono tracking-wider text-right"
                  animateOn="view"
                  sequential
                  revealDirection="start"
                  speed={18}
                />
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center">
          <div className="relative w-[500] h-[500]">
            <Image
              src="/IMG_7827_cropped.jpg"
              alt="Wiebe Vandendriessche blurred edge"
              width={500}
              height={500}
              className="absolute inset-0 w-full h-full object-cover rounded-full blur-xl mask-edge"
              aria-hidden="true"
              draggable={false}
              priority
            />
            <Image
              src="/IMG_7827_cropped.jpg"
              alt="Wiebe Vandendriessche"
              width={500}
              height={500}
              className="relative w-full h-full object-cover rounded-full mask-center"
              priority
            />
          </div>
        </div>
      </div>
    </div>
  */ 
 );
}
