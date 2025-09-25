"use client"

import React, { useRef, useState, useEffect, Suspense } from 'react'
import * as THREE from 'three'
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
        // Group we animate (rot/scale)
        const groupRef = useRef<THREE.Group>(null!)
        const notifiedRef = useRef(false)
        const [hovered, setHovered] = useState(false)
        const speedRef = useRef(0.007)
        const baseScaleRef = useRef<number>(props.scale ?? 1)
        const { pointer } = useThree()
        const [collider, setCollider] = useState<{ size: THREE.Vector3; center: THREE.Vector3 } | null>(null)

        useEffect(() => {
            // Visual feedback via cursor
            document.body.style.cursor = hovered ? 'pointer' : ''
            return () => {
                document.body.style.cursor = ''
            }
        }, [hovered])

        useFrame(() => {
            if (!groupRef.current) return
            // Smoothly adjust rotation speed on hover
            const targetSpeed = hovered ? 0.005 : 0.01
            speedRef.current += (targetSpeed - speedRef.current) * 0.1
            groupRef.current.rotation.y += speedRef.current

            // Subtle tilt towards pointer when hovered
            const targetTiltX = hovered ? pointer.y * 0.2 : 0
            const targetTiltZ = hovered ? -pointer.x * 0.2 : 0
            groupRef.current.rotation.x += (targetTiltX - groupRef.current.rotation.x) * 0.2
            groupRef.current.rotation.z += (targetTiltZ - groupRef.current.rotation.z) * 0.2

            // Gentle scale up on hover
            const targetScale = hovered ? baseScaleRef.current * 1.05 : baseScaleRef.current
            const s = groupRef.current.scale.x
            const newS = s + (targetScale - s) * 0.12
            groupRef.current.scale.set(newS, newS, newS)
        })

        const { scene } = useGLTF('/avatar2export.glb')
        // Notify parent once when scene becomes available (Suspense resolved)
        useEffect(() => {
            if (scene && !notifiedRef.current) {
                notifiedRef.current = true
                setModelLoaded(true)
                // Compute collider bounds from scene
                const box = new THREE.Box3().setFromObject(scene)
                const size = new THREE.Vector3()
                const center = new THREE.Vector3()
                box.getSize(size)
                box.getCenter(center)
                // Add a small margin so it’s easier to hover
                size.multiplyScalar(1.1)
                setCollider({ size, center })
            }
        }, [scene])

        return (
            <group ref={groupRef}>
                {/* Hover collider: transparent box sized to model bounds */}
                {collider && (
                    <mesh
                        position={[collider.center.x, collider.center.y, collider.center.z]}
                        onPointerOver={(e: any) => { e.stopPropagation(); setHovered(true) }}
                        onPointerOut={(e: any) => { e.stopPropagation(); setHovered(false) }}
                    >
                        <boxGeometry args={[collider.size.x, collider.size.y, collider.size.z]} />
                        <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
                    </mesh>
                )}
                {/* Actual model */}
                <primitive object={scene} {...props} />
            </group>
        )
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
                                        <RotatingModel scale={1.2} />
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
