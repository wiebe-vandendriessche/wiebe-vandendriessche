
import Image from "next/image";
import DecryptedText from "@/components/ui/decrypted-text";

export default function Home() {
  return (
    <div className="flex min-h-[80vh] items-center px-4">
      <div className="flex flex-col md:flex-row items-center gap-20 w-full max-w-6xl">
        <div className="relative flex flex-col justify-center items-end w-[500px] h-[500px]">
          <div className="relative flex flex-col justify-center p-12">
            <div className="blurry-gradient-bg"></div>
            <div className="relative z-10">
              <h1 className="text-5xl font-extrabold mb-4 text-right font-mono">
                <DecryptedText
                  text="Wiebe Vandendriessche"
                  className="text-5xl font-extrabold tracking-widest uppercase font-mono text-right"
                  animateOn="view"
                  sequential
                  revealDirection="start"
                />
              </h1>
              <p className="text-right text-lg text-muted-foreground mt-2 font-mono tracking-wider">
                <DecryptedText
                  text={"I am a creative developer passionate about building beautiful, performant web experiences. I love working with modern web technologies and design systems."}
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
        {/* Large, circular monochrome photo */}
        <div className="flex items-center justify-center">
          <div className="relative w-[500] h-[500]">
            {/* Blurred edge layer */}
            <Image
              src="/IMG_7827_cropped.jpg"
              alt="Wiebe Vandendriessche blurred edge"
              width={500}
              height={500}
              className="absolute inset-0 w-full h-full object-cover rounded-full grayscale blur-xl mask-edge"
              aria-hidden="true"
              draggable={false}
              priority
            />
            {/* Sharp center layer */}
            <Image
              src="/IMG_7827_cropped.jpg"
              alt="Wiebe Vandendriessche"
              width={500}
              height={500}
              className="relative w-full h-full object-cover rounded-full grayscale mask-center"
              priority
            />
          </div>
        </div>
      </div>
  {/* DecryptedText handles its own animation */}
    </div>
  );
}
