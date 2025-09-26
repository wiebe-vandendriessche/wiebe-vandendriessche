"use client"

import React, { useRef, useState, useEffect, Suspense } from 'react'
import * as THREE from 'three'
import { Link } from '@/i18n/navigation'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useProgress } from '@react-three/drei'
import { Button } from '@/components/ui/button'
import { useTranslations } from "next-intl";
import DecryptedText from '@/components/ui/decrypted-text'
import RotatingModel from './RotatingModel'

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

  return (
    <>
      <LoaderOverlay />
      <section className="pb-4 md:pb-8">
        <div className="pb-2 pt-2 sm:pb-4 sm:pt-4 md:pb-8 lg:pb-12 lg:pt-8">
          <div className="relative mx-auto flex max-w-6xl flex-col-reverse md:flex-row items-center gap-8 px-6">
            <div className="w-full md:w-1/2 flex flex-col justify-center items-start text-left">
              <div className="relative w-full">
                <div className="absolute inset-0 w-full h-full foggy-gradient-bg rounded-xl z-0" />
                <div className="relative z-10">
                  <h1>
                    {modelLoaded && (
                      <DecryptedText
                        text={t('name')}
                        className="mt-8 max-w-md text-balance text-2xl font-extrabold tracking-widest uppercase font-mono text-left sm:text-3xl md:text-5xl lg:mt-16 xl:text-6xl"
                        encryptedClassName="mt-8 max-w-md text-balance text-2xl font-extrabold tracking-widest uppercase font-mono text-left sm:text-3xl md:text-5xl lg:mt-16 xl:text-6xl"
                        animateOn="view"
                        sequential
                        revealDirection="start"
                        speed={15}
                        useOriginalCharsOnly
                      />
                    )}
                  </h1>
                  <p className="mt-8 max-w-2xl text-pretty text-lg">
                    {modelLoaded && (
                      <DecryptedText
                        text={t('description')}
                        className="text-base font-mono tracking-wider text-left sm:text-lg"
                        encryptedClassName="text-base font-mono tracking-wider text-left sm:text-lg"
                        animateOn="view"
                        sequential
                        revealDirection="start"
                        speed={10}
                        useOriginalCharsOnly
                      />
                    )}
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
            <div className="w-full md:w-1/2 flex justify-center items-center">
              <div style={{ width: '100%', height: '400px' }} className="relative">
                <Canvas camera={{ position: [-2, -0.3, -6], fov: 45 }}>
                  <Suspense fallback={null}>
                    <CameraLookForward />
                    <ambientLight intensity={0.5} />
                    <directionalLight position={[0, 5, -5]} intensity={1} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
                    <directionalLight position={[-5, 2, -2]} intensity={0.7} />
                    <RotatingModel scale={1.2} onLoaded={() => setModelLoaded(true)} />
                  </Suspense>
                </Canvas>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}