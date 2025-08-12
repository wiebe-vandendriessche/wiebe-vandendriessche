"use client";

import React, { useState } from "react";
import { useTranslations } from 'next-intl';
import {
    NavigationMenu,
    NavigationMenuList,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuIndicator,
    NavigationMenuViewport
} from "@/components/ui/navigation-menu";
import Link from "next/link";
import { Button } from "./ui/button";

export default function Navbar() {
    const t = useTranslations('Navbar');
    const [menuOpen, setMenuOpen] = useState(false);
    return (
        <nav className="w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
            <div className="container mx-auto flex items-center justify-between py-2">
                <div className="text-xl font-bold tracking-tight">{t('brand')}</div>
                {/* Hamburger for mobile */}
                <Button
                    className="md:hidden p-2 rounded focus:outline-none focus:ring-2 focus:ring-ring"
                    aria-label="Toggle menu"
                    variant="ghost"
                    size="icon"
                    onClick={() => setMenuOpen((open) => !open)}
                >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 6h16M4 12h16M4 18h16"
                        />
                    </svg>
                </Button>
                {/* Desktop menu */}
                <div className="hidden md:flex">
                    <NavigationMenu>
                        <NavigationMenuList>
                            <NavigationMenuItem>
                                <NavigationMenuLink asChild>
                                    <Link href="/">{t('me')}</Link>
                                </NavigationMenuLink>
                            </NavigationMenuItem>
                            <NavigationMenuItem>
                                <NavigationMenuLink asChild>
                                    <Link href="/timeline">{t('timeline')}</Link>
                                </NavigationMenuLink>
                            </NavigationMenuItem>
                            <NavigationMenuItem>
                                <NavigationMenuLink asChild>
                                    <Link href="/projects">{t('projects')}</Link>
                                </NavigationMenuLink>
                            </NavigationMenuItem>
                            <NavigationMenuItem>
                                <NavigationMenuLink asChild>
                                    <Link href="/blog">{t('blog')}</Link>
                                </NavigationMenuLink>
                            </NavigationMenuItem>
                            <NavigationMenuItem>
                                <NavigationMenuLink asChild>
                                    <Link href="/contact">{t('contact')}</Link>
                                </NavigationMenuLink>
                            </NavigationMenuItem>
                        </NavigationMenuList>
                        <NavigationMenuIndicator />
                        <NavigationMenuViewport />
                    </NavigationMenu>
                </div>
                {/* Mobile menu dropdown */}
                {menuOpen && (
                    <div className="absolute top-full left-0 w-full bg-background border-b shadow-md md:hidden animate-fade-in z-50">
                        <ul className="flex flex-col py-2">
                            <li>
                                <Link href="/" className="block px-4 py-2 hover:bg-accent" onClick={() => setMenuOpen(false)}>
                                    {t('home')}
                                </Link>
                            </li>
                            <li>
                                <Link href="/about" className="block px-4 py-2 hover:bg-accent" onClick={() => setMenuOpen(false)}>
                                    {t('about')}
                                </Link>
                            </li>
                            <li>
                                <Link href="/projects" className="block px-4 py-2 hover:bg-accent" onClick={() => setMenuOpen(false)}>
                                    {t('projects')}
                                </Link>
                            </li>
                            <li>
                                <Link href="/contact" className="block px-4 py-2 hover:bg-accent" onClick={() => setMenuOpen(false)}>
                                    {t('contact')}
                                </Link>
                            </li>
                        </ul>
                    </div>
                )}
            </div>
        </nav>
    );
}
