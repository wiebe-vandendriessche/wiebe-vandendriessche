import Masonry from "@/components/ui/masonry";

export default function ProjectsPage() {

    const items = [
        { id: "1", img: "/test.jpg", url: "https://example.com/one", height: 400 },
        { id: "2", img: "/test.jpg", url: "https://example.com/two", height: 250 },
        { id: "3", img: "/test.jpg", url: "https://example.com/three", height: 600 },
        { id: "4", img: "/test.jpg", url: "https://example.com/four", height: 350 },
        { id: "5", img: "/test.jpg", url: "https://example.com/five", height: 500 },
        { id: "6", img: "/test.jpg", url: "https://example.com/six", height: 450 },
        { id: "7", img: "/test.jpg", url: "https://example.com/seven", height: 400 },
        { id: "8", img: "/test.jpg", url: "https://example.com/eight", height: 350 },
        { id: "9", img: "/test.jpg", url: "https://example.com/nine", height: 500 },
        { id: "10", img: "/test.jpg", url: "https://example.com/ten", height: 450 },
        { id: "11", img: "/test.jpg", url: "https://example.com/eleven", height: 350 },
        { id: "12", img: "/test.jpg", url: "https://example.com/twelve", height: 400 },
        { id: "13", img: "/test.jpg", url: "https://example.com/thirteen", height: 600 },
        { id: "14", img: "/test.jpg", url: "https://example.com/fourteen", height: 250 }
    ];

    return (
        <section
            className="px-10"
        >
            {/* Blurry gradient background as very first child, absolutely positioned and behind all content */}
            <h1 className="text-3xl md:text-4xl font-bold text-center mb-8">Projects</h1>
            <div className="">
                <Masonry
                    items={items}
                    ease="power3.out"
                    duration={0.6}
                    stagger={0.05}
                    animateFrom="bottom"
                    scaleOnHover={true}
                    hoverScale={0.95}
                    blurToFocus={true}
                    colorShiftOnHover={false}
                />
            </div>
        </section>
    );
}