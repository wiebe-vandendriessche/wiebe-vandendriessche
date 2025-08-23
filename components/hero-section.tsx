import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { InfiniteSlider } from '@/components/ui/infinite-slider'
import { ProgressiveBlur } from '@/components/ui/progressive-blur'
import { useTranslations } from "next-intl";
import DecryptedText from './ui/decrypted-text'

export default function HeroSection() {
    const t = useTranslations('HomePage');

    return (
        <>
            <div className="overflow-x-hidden">
                <section className="pb-4 md:pb-8">
                    <div className="pb-4 pt-4 md:pb-8 lg:pb-12 lg:pt-8">
                        <div className="relative mx-auto flex max-w-6xl flex-col-reverse md:flex-row items-center gap-8 px-6">
                            <div className="w-full md:w-1/2 flex flex-col justify-center items-start text-left">
                                <h1>
                                    <DecryptedText
                                        text={t('name')}
                                        className="mt-8 max-w-md text-balance text-4xl font-extrabold tracking-widest uppercase font-mono text-left md:text-5xl lg:mt-16 xl:text-6xl"
                                        encryptedClassName="mt-8 max-w-md text-balance text-4xl font-extrabold tracking-widest uppercase font-mono text-left md:text-5xl lg:mt-16 xl:text-6xl"
                                        animateOn="view"
                                        sequential
                                        revealDirection="start"
                                    />
                                </h1>
                                <p className="mt-8 max-w-2xl text-pretty text-lg">
                                    <DecryptedText
                                        text={t('description')}
                                        className="text-lg font-mono tracking-wider text-left"
                                        encryptedClassName="text-lg font-mono tracking-wider text-left"
                                        animateOn="view"
                                        sequential
                                        revealDirection="start"
                                        speed={18}
                                    />
                                </p>
                                <div className="mt-12 flex flex-col items-center justify-center gap-2 sm:flex-row lg:justify-start">
                                    <Button
                                        size="lg"
                                        className="px-5 text-base">
                                        <Link href="#features">
                                            <span className="text-nowrap">Explore Features</span>
                                        </Link>
                                    </Button>
                                    <Button
                                        size="lg"
                                        variant="ghost"
                                        className="px-5 text-base">
                                        <Link href="/jobs/new">
                                            <span className="text-nowrap">Request Training Job</span>
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                            <div className="w-full md:w-1/2 flex justify-center items-center">
                                <Image
                                    className="object-cover rounded-full aspect-square max-w-full max-h-[800px]"
                                    src="/IMG_7827_cropped.jpg"
                                    alt="Hero"
                                    height={800}
                                    width={800}
                                    priority
                                />
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
            </div>
        </>
    )
}
