"use client";

import React, { useState } from "react";
import {
    Sheet,
    SheetTrigger,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
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
import { Button } from "../ui/button";
import { ModeToggle } from "../ui/mode-toggle";
import LocaleSwitcher from "../LocaleSwitcher";
import { Menu } from "lucide-react";
import { Link } from "@/i18n/navigation";

export default function Navbar() {
    const t = useTranslations('Navbar');
    const [menuOpen, setMenuOpen] = useState(false);
    return (
        <nav className="w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky left-0 right-0 top-0 z-50">
            <div className="container mx-auto flex items-center justify-between py-2 flex-shrink-0">
                <div className="text-xl font-bold tracking-tight ml-2 flex-shrink-0">{t('brand')}</div>
                {/* Hamburger for mobile using Sheet */}
                <Sheet
                    open={menuOpen}
                    onOpenChange={setMenuOpen}
                >
                    <SheetTrigger asChild>
                        <Button
                            className="md:hidden p-2 mr-2"
                            aria-label="Toggle menu"
                            variant="outline"
                            size="icon"
                        >
                            <Menu />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 max-w-[16rem] w-full">
                        <SheetHeader className="p-4 border-b">
                            <SheetTitle>{t('menu')}</SheetTitle>
                            <SheetDescription className="sr-only">
                                {t('menu')}
                            </SheetDescription>
                        </SheetHeader>
                        <ul className="flex flex-col">
                            <li>
                                <Button asChild variant="outline" className="flex justify-start m-3">
                                    <Link href="/" onClick={() => setMenuOpen(false)}>
                                        {t('me')}
                                    </Link>
                                </Button>
                            </li>
                            <li>
                                <Button asChild variant="outline" className="flex justify-start m-3">
                                    <Link href="/timeline" onClick={() => setMenuOpen(false)}>
                                        {t('timeline')}
                                    </Link>
                                </Button>
                            </li>
                            <li>
                                <Button asChild variant="outline" className="flex justify-start m-3">
                                    <Link href="/projects" onClick={() => setMenuOpen(false)}>
                                        {t('projects')}
                                    </Link>
                                </Button>
                            </li>
                            <li>
                                <Button asChild variant="outline" className="flex justify-start m-3">
                                    <Link href="/blog" onClick={() => setMenuOpen(false)}>
                                        {t('blog')}
                                    </Link>
                                </Button>
                            </li>
                            <li>
                                <Button asChild variant="outline" className="flex justify-start m-3">
                                    <Link href="/contact" onClick={() => setMenuOpen(false)}>
                                        {t('contact')}
                                    </Link>
                                </Button>
                            </li>
                            <li className="flex justify-start m-3 gap-2">
                                <ModeToggle />
                                <LocaleSwitcher />
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
