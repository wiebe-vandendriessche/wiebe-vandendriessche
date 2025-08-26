"use client";

import React, { useState } from "react";
import {
    Sheet,
    SheetTrigger,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetClose,
} from "@/components/ui/sheet";
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
import { Button } from "../ui/button";
import { ModeToggle } from "../ui/mode-toggle";
import LocaleSwitcher from "../LocaleSwitcher";
import { Menu } from "lucide-react";

export default function Navbar() {
    const t = useTranslations('Navbar');
    const [menuOpen, setMenuOpen] = useState(false);
    return (
        <nav className="w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky left-0 right-0 top-0 z-50">
            <div className="container mx-auto flex items-center justify-between py-2 flex-shrink-0">
                <div className="text-xl font-bold tracking-tight ml-2 flex-shrink-0">{t('brand')}</div>
                {/* Hamburger for mobile using Sheet */}
                <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                    <SheetTrigger asChild>
                        <Button
                            className="md:hidden p-2 mr-2 rounded focus:outline-none focus:ring-2 focus:ring-ring"
                            aria-label="Toggle menu"
                            variant="ghost"
                            size="icon"
                        >
                            <Menu />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0">
                        <SheetHeader className="p-4 border-b">
                            <SheetTitle>{t('menu')}</SheetTitle>
                        </SheetHeader>
                        <ul className="flex flex-col py-2">
                            <li>
                                <Link href="/" className="block px-4 py-2 hover:bg-accent" onClick={() => setMenuOpen(false)}>
                                    {t('me')}
                                </Link>
                            </li>
                            <li>
                                <Link href="/timeline" className="block px-4 py-2 hover:bg-accent" onClick={() => setMenuOpen(false)}>
                                    {t('timeline')}
                                </Link>
                            </li>
                            <li>
                                <Link href="/projects" className="block px-4 py-2 hover:bg-accent" onClick={() => setMenuOpen(false)}>
                                    {t('projects')}
                                </Link>
                            </li>
                            <li>
                                <Link href="/blog" className="block px-4 py-2 hover:bg-accent" onClick={() => setMenuOpen(false)}>
                                    {t('blog')}
                                </Link>
                            </li>
                            <li>
                                <Link href="/contact" className="block px-4 py-2 hover:bg-accent" onClick={() => setMenuOpen(false)}>
                                    {t('contact')}
                                </Link>
                            </li>
                        </ul>
                    </SheetContent>
                </Sheet>
                {/* Desktop menu */}
                <div className="hidden md:flex flex-shrink-0">
                    <NavigationMenu>
                        <NavigationMenuList>
                            <NavigationMenuItem>
                                <NavigationMenuLink asChild>
                                    <Button asChild variant="outline" className="px-3 py-1">
                                        <Link href="/">{t('me')}</Link>
                                    </Button>
                                </NavigationMenuLink>
                            </NavigationMenuItem>
                            <NavigationMenuItem>
                                <NavigationMenuLink asChild>
                                    <Button asChild variant="outline" className="px-3 py-1">
                                        <Link href="/timeline">{t('timeline')}</Link>
                                    </Button>
                                </NavigationMenuLink>
                            </NavigationMenuItem>
                            <NavigationMenuItem>
                                <NavigationMenuLink asChild>
                                    <Button asChild variant="outline" className="px-3 py-1">
                                        <Link href="/projects">{t('projects')}</Link>
                                    </Button>
                                </NavigationMenuLink>
                            </NavigationMenuItem>
                            <NavigationMenuItem>
                                <NavigationMenuLink asChild>
                                    <Button asChild variant="outline" className="px-3 py-1">
                                        <Link href="/blog">{t('blog')}</Link>
                                    </Button>
                                </NavigationMenuLink>
                            </NavigationMenuItem>
                            <NavigationMenuItem>
                                <NavigationMenuLink asChild>
                                    <Button asChild variant="outline" className="px-3 py-1">
                                        <Link href="/contact">{t('contact')}</Link>
                                    </Button>
                                </NavigationMenuLink>
                            </NavigationMenuItem>
                            <NavigationMenuItem>
                                <ModeToggle />
                            </NavigationMenuItem>
                            <NavigationMenuItem>
                                <LocaleSwitcher />
                            </NavigationMenuItem>
                        </NavigationMenuList>
                        <NavigationMenuIndicator />
                        <NavigationMenuViewport />
                    </NavigationMenu>
                </div>
            </div>
        </nav>
    );
}
