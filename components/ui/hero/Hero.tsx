"use client"

import React, { useState, useEffect, Suspense } from 'react'
import { Link } from '@/i18n/navigation'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useProgress } from '@react-three/drei'
import { Button } from '@/components/ui/button'
import { useTranslations } from "next-intl";
import TextType from '@/components/ui/texttype'
import RotatingModel from './RotatingModel'

// Animated scroll icon SVG component
function AnimatedScrollIcon() {
  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 z-50 flex items-center justify-center"
      style={{
        bottom: '8%', // Lower 10% of the screen
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: 180,
          height: 180,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 0,
          background: 'radial-gradient(circle, var(--secondary) 0%, var(--secondary) 30%, transparent 80%)',
          opacity: 0.7,
          pointerEvents: 'none',
        }}
      />
      <svg width="40" height="60" viewBox="0 0 40 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="animate-bounce" style={{ position: 'relative', zIndex: 1 }}>
        <rect x="2" y="2" width="36" height="56" rx="18" stroke="var(--primary)" strokeWidth="4" fill="none" />
        <circle cx="20" cy="18" r="6" fill="var(--primary)" className="scroll-dot" />
      </svg>
      <style>{`
        @media (min-width: 768px) {
          .scroll-indicator-mobile { display: none !important; }
        }
        .animate-bounce {
          animation: bounce-scroll 1.4s infinite;
        }
        @keyframes bounce-scroll {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(16px); }
        }
        .scroll-dot {
          animation: dot-move 1.4s infinite;
        }
        @keyframes dot-move {
          0%, 100% { cy: 18; }
          50% { cy: 40; }
        }
      `}</style>
    </div>
  );
}

export default function HeroSection() {
  const [modelLoaded, setModelLoaded] = useState(false)
  const { progress } = useProgress()

  const LoaderOverlay = () => (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-background/80 backdrop-blur-md transition-opacity duration-500 ${modelLoaded ? 'pointer-events-none opacity-0' : 'opacity-100'}`}
      aria-hidden={modelLoaded}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="flex flex-col items-center gap-1 font-mono tracking-wider text-md uppercase">
          <span>Loading Portfolio</span>
          <div className="w-48 h-1.5 bg-muted/40 rounded overflow-hidden">
            <div className="h-full bg-primary transition-all duration-200" style={{ width: `${Math.min(100, Math.round(progress))}%` }} />
          </div>
          <span className="tabular-nums text-sm opacity-70">{Math.min(100, Math.round(progress))}%</span>
        </div>
      </div>
    </div>
  )

  const t = useTranslations('HomePage');

  function CameraLookForward() {
    const { camera } = useThree()
    useFrame(() => {
      camera.lookAt(0, camera.position.y, 0)
    })
    return null
  }

  // Track theme and set ambient light intensity accordingly
  const [ambientIntensity, setAmbientIntensity] = useState(0.1);
  useEffect(() => {
    const getIntensity = () => {
      return document.documentElement.classList.contains("dark") ? 0.1 : 0.62;
    };
    setAmbientIntensity(getIntensity());
    const observer = new MutationObserver(() => {
      setAmbientIntensity(getIntensity());
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  // Show scroll icon on mobile until user scrolls
  const [showScrollIcon, setShowScrollIcon] = useState(true);
  useEffect(() => {
    const onScroll = () => {
      if (window.scrollY > 10) setShowScrollIcon(false);
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <LoaderOverlay />
      {/* Show scroll icon only on mobile, only if not scrolled yet and after loading */}
      {modelLoaded && showScrollIcon && (
        <div className="scroll-indicator-mobile md:hidden">
          <AnimatedScrollIcon />
        </div>
      )}
      <section className="pb-4 md:pb-8 select-none">
        <div className="relative mx-auto flex max-w-7xl flex-col-reverse md:flex-row items-center gap-7 px-6">
          <div className="w-full md:w-3/5 flex flex-col justify-center items-start text-left">
            <div className="relative w-full">
              <div className="absolute inset-0 w-full h-full foggy-gradient-bg rounded-xl z-0" />
              <div className="relative z-10">
                <div className="h-20 mt-4 sm:mt-0s">
                  <TextType
                    as="h1"
                    text={[t('name'), "PhD Researcher"]}
                    typingSpeed={75}
                    pauseDuration={1500}
                    deletingSpeed={50}
                    cursorBlinkDuration={0.5}
                    showCursor={true}
                    cursorCharacter="_"
                    className="max-w-xl text-balance text-3xl sm:text-4xl md:text-[2.5rem] xl:text-5xl font-extrabold tracking-widest font-mono text-left"
                  />
                </div>
                <p className="mt-8 max-w-3xl text-pretty text-base font-mono tracking-wider text-left sm:text-lg">
                  {t('description')}
                </p>
                <div className="mt-12 flex flex-col items-center justify-center gap-2 sm:flex-row lg:justify-start">
                  <Button size="lg" className="px-5 text-base">
                    <Link href="/contact">
                      <span className="text-nowrap">{t('contactMe')}</span>
                    </Link>
                  </Button>
                  <Button size="lg" variant="ghost" className="px-5 text-base">
                    <Link href="/projects">
                      <span className="text-nowrap">{t('myProjects')}</span>
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <div className="w-full md:w-3/5 flex justify-center items-center">
            <div style={{ width: '100%', height: '400px' }} className="relative">
              <Canvas camera={{ position: [-2, -0.3, -6], fov: 45 }} style={{ touchAction: 'none' }}>
                <Suspense fallback={null}>
                  <CameraLookForward />
                  <ambientLight intensity={0.7} color={"#ff6fcf"} />
                  <ambientLight intensity={ambientIntensity} color={"#fff"} />
                  <directionalLight
                    position={[0, 5, -5]}
                    intensity={1}
                    castShadow
                    color={"#01ffcc"}
                  />
                  {/**
                     * Rotating model configuration
                     * Tweak these values to adjust default framing and interaction.
                     */}
                  <RotatingModel
                    // Visual
                    scale={1.5}
                    hoverScale={1.06}
                    showPointer
                    // Spin/tilt behavior
                    idleSpinSpeed={0.01}
                    stopSpinOnHover
                    hoverAlignSpeed={0.3}
                    alignSnap={0.012}
                    hoverTilt={0.22}
                    enableTilt
                    // Facing & collider
                    facingOffset={Math.PI}
                    colliderMargin={0.9}
                    // Damping
                    dampSpeed={0.12}
                    dampTilt={0.18}
                    dampScale={0.12}
                    // Lifecycle
                    onLoaded={() => setModelLoaded(true)}
                  />
                </Suspense>
              </Canvas>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}