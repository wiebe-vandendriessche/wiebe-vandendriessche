"use client";

import Masonry from "@/components/ui/masonry";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useMemo } from "react";

const categories = ["all", "web", "ai", "tools", "random"] as const;
type Category = typeof categories[number];

export default function ProjectsPage() {
    const [activeCategory, setActiveCategory] = useState<Category>("all");

    const items = [
        { id: "1", img: "/test.jpg", url: "https://example.com/one", height: 300, category: "web" },
        { id: "2", img: "/test.jpg", url: "https://example.com/two", height: 250, category: "ai" },
        { id: "3", img: "/test.jpg", url: "https://example.com/three", height: 500, category: "web" },
        { id: "4", img: "/test.jpg", url: "https://example.com/four", height: 350, category: "tools" },
        { id: "5", img: "/test.jpg", url: "https://example.com/five", height: 400, category: "ai" },
        { id: "6", img: "/test.jpg", url: "https://example.com/six", height: 350, category: "random" },
        { id: "7", img: "/test.jpg", url: "https://example.com/seven", height: 400, category: "web" },
        { id: "8", img: "/test.jpg", url: "https://example.com/eight", height: 350, category: "tools" },
        { id: "9", img: "/test.jpg", url: "https://example.com/nine", height: 400, category: "random" },
        { id: "10", img: "/test.jpg", url: "https://example.com/ten", height: 350, category: "ai" },
        { id: "11", img: "/test.jpg", url: "https://example.com/eleven", height: 350, category: "web" },
        { id: "12", img: "/test.jpg", url: "https://example.com/twelve", height: 300, category: "tools" },
        { id: "13", img: "/test.jpg", url: "https://example.com/thirteen", height: 400, category: "ai" },
        { id: "14", img: "/test.jpg", url: "https://example.com/fourteen", height: 250, category: "web" }
    ];

    // Keep full layout; Masonry will dim non-matching items when activeCategory != 'all'
    const masonryItems = useMemo(() => items, [items]);

        return (
            <section className="relative px-4 md:px-10 py-5 flex flex-col">
            <div className="foggy-gradient-bg absolute inset-0 -z-20 pointer-events-none" />

            <h1 className="text-3xl md:text-4xl font-bold text-center mb-6 z-10">Projects</h1>
                <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as Category)} className="w-full">
                <div className="flex justify-center mb-6">
                    <TabsList className="gap-1 sm:gap-3 flex-wrap h-auto p-1 z-10">
                        {categories.map(cat => (
                            <TabsTrigger key={cat} value={cat} className="capitalize px-3 py-1 text-sm">
                                {cat}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </div>

                {categories.map(cat => (
                    <TabsContent key={cat} value={cat} className="focus-visible:outline-none">
                        <Masonry
                            items={masonryItems}
                            ease="power3.out"
                            duration={0.6}
                            stagger={0.05}
                            animateFrom="bottom"
                            scaleOnHover={true}
                            hoverScale={0.95}
                            blurToFocus={true}
                            colorShiftOnHover={false}
                            activeCategory={cat === 'all' ? 'all' : cat}
                        />
                    </TabsContent>
                ))}
            </Tabs>
        </section>
    );
}
