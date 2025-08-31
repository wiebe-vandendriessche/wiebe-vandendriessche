"use client"

import React, { useRef, useState, useEffect, Suspense } from 'react'
import { Link } from '@/i18n/navigation'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, useGLTF, useProgress } from '@react-three/drei'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { InfiniteSlider } from '@/components/ui/infinite-slider'
import { ProgressiveBlur } from '@/components/ui/progressive-blur'
import { useTranslations } from "next-intl";
import DecryptedText from '../ui/decrypted-text'
// Removed import of AxesHelper from three.js

export default function HeroSection() {
    // Track when the 3D model has fully loaded so we can trigger text animation afterwards
    const [modelLoaded, setModelLoaded] = useState(false)
    const { progress } = useProgress()

    // Fullscreen loader overlay
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

    function RotatingModel(props: any) {
        const ref = useRef<any>(null)
        const notifiedRef = useRef(false)
        useFrame(() => {
            if (ref.current) {
                ref.current.rotation.y += 0.002;
            }
        })
        const { scene } = useGLTF('/avatar2export.glb')
        // Notify parent once when scene becomes available (Suspense resolved)
        useEffect(() => {
            if (scene && !notifiedRef.current) {
                notifiedRef.current = true
                setModelLoaded(true)
            }
        }, [scene])
        return <primitive ref={ref} object={scene} {...props} />
    }

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
            {/* Global fullscreen loader */}
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
                                        <Button
                                            size="lg"
                                            className="px-5 text-base">
                                            <Link href="/contact">
                                                <span className="text-nowrap">{t('contactMe')}</span>
                                            </Link>
                                        </Button>
                                        <Button
                                            size="lg"
                                            variant="ghost"
                                            className="px-5 text-base">
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
                                {/* 3D Canvas with Suspense for model loading */}
                                <Canvas  camera={{ position: [-2, -0.3, -6], fov: 45 }}>
                                    <Suspense fallback={null}>
                                        <CameraLookForward />
                                        {/* Soft ambient light for base illumination */}
                                        <ambientLight intensity={0.5} />
                                        {/* Key light from above/front */}
                                        <directionalLight position={[0, 5, -5]} intensity={1} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
                                        {/* Fill light from the side */}
                                        <directionalLight position={[-5, 2, -2]} intensity={0.7} />
                                        <RotatingModel scale={1.5} />
                                    </Suspense>
                                </Canvas>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            {/* 
                <section className="pb-4 md:pb-6 pt-4 md:pt-6">
                    <div className="w-full bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                        <div className="container mx-auto flex items-center justify-between py-2">
                            <div className="text-end text-sm md:max-w-44 md:border-r md:pr-6">
                                Powering the best teams

                            </div>
                            <div className="relative flex-1 flex items-center py-6 min-w-0">
                                <InfiniteSlider
                                    speedOnHover={20}
                                    speed={40}
                                    gap={112}
                                    className="w-full"
                                >

                                    <div className="flex">
                                        <img
                                            className="mx-auto h-5 w-fit dark:invert"
                                            src="https://html.tailus.io/blocks/customers/nvidia.svg"
                                            alt="Nvidia Logo"
                                            height="20"
                                            width="auto"
                                        />
                                    </div>

                                    <div className="flex">
                                        <img
                                            className="mx-auto h-4 w-fit dark:invert"
                                            src="https://html.tailus.io/blocks/customers/column.svg"
                                            alt="Column Logo"
                                            height="16"
                                            width="auto"
                                        />
                                    </div>
                                    <div className="flex">
                                        <img
                                            className="mx-auto h-4 w-fit dark:invert"
                                            src="https://html.tailus.io/blocks/customers/github.svg"
                                            alt="GitHub Logo"
                                            height="16"
                                            width="auto"
                                        />
                                    </div>
                                    <div className="flex">
                                        <img
                                            className="mx-auto h-5 w-fit dark:invert"
                                            src="https://html.tailus.io/blocks/customers/nike.svg"
                                            alt="Nike Logo"
                                            height="20"
                                            width="auto"
                                        />
                                    </div>
                                    <div className="flex">
                                        <img
                                            className="mx-auto h-5 w-fit dark:invert"
                                            src="https://html.tailus.io/blocks/customers/lemonsqueezy.svg"
                                            alt="Lemon Squeezy Logo"
                                            height="20"
                                            width="auto"
                                        />
                                    </div>
                                    <div className="flex">
                                        <img
                                            className="mx-auto h-4 w-fit dark:invert"
                                            src="https://html.tailus.io/blocks/customers/laravel.svg"
                                            alt="Laravel Logo"
                                            height="16"
                                            width="auto"
                                        />
                                    </div>
                                    <div className="flex">
                                        <img
                                            className="mx-auto h-7 w-fit dark:invert"
                                            src="https://html.tailus.io/blocks/customers/lilly.svg"
                                            alt="Lilly Logo"
                                            height="28"
                                            width="auto"
                                        />
                                    </div>

                                    <div className="flex">
                                        <img
                                            className="mx-auto h-6 w-fit dark:invert"
                                            src="https://html.tailus.io/blocks/customers/openai.svg"
                                            alt="OpenAI Logo"
                                            height="24"
                                            width="auto"
                                        />
                                    </div>
                                </InfiniteSlider>
                                <ProgressiveBlur
                                    className="pointer-events-none absolute left-0 top-0 h-full w-20"
                                    direction="left"
                                    blurIntensity={1}
                                />
                                <ProgressiveBlur
                                    className="pointer-events-none absolute right-0 top-0 h-full w-20"
                                    direction="right"
                                    blurIntensity={1}
                                />
                            </div>
                        </div>
                    </div>
                </section>
                */}
        </>
    )
}
