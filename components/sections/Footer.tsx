import { ReactNode } from "react";

import { cn } from "@/lib/utils";

import {
  Footer,
  FooterBottom,
  FooterColumn,
  FooterContent,
} from "../ui/footer";
import { ModeToggle } from "../ui/mode-toggle";

interface FooterLink {
  text: string;
  href: string;
}

interface FooterColumnProps {
  title: string;
  links: FooterLink[];
}

interface FooterProps {
  logo?: ReactNode;
  name?: string;
  columns?: FooterColumnProps[];
  copyright?: string;
  policies?: FooterLink[];
  showModeToggle?: boolean;
  className?: string;
  bottomOnly?: boolean;
}

export default function FooterSection({
  logo = null,
  name = "Launch UI",
  columns = [
    {
      title: "Product",
      links: [
        { text: "Changelog", href: "https://www.launchuicomponents.com/" },
        { text: "Documentation", href: "https://www.launchuicomponents.com/" },
      ],
    },
    {
      title: "Company",
      links: [
        { text: "About", href: "https://www.launchuicomponents.com/" },
        { text: "Careers", href: "https://www.launchuicomponents.com/" },
        { text: "Blog", href: "https://www.launchuicomponents.com/" },
      ],
    },
    {
      title: "Contact",
      links: [
        { text: "Discord", href: "https://www.launchuicomponents.com/" },
        { text: "Twitter", href: "https://www.launchuicomponents.com/" },
        { text: "Github", href: "https://www.launchuicomponents.com/" },
      ],
    },
  ],
  copyright = "© 2025 Mikołaj Dobrucki. All rights reserved",
  policies = [
    { text: "Privacy Policy", href: "https://www.launchuicomponents.com/" },
    { text: "Terms of Service", href: "https://www.launchuicomponents.com/" },
  ],
  showModeToggle = true,
  className,
  bottomOnly = false,
}: FooterProps) {
  if (bottomOnly) {
    return (
      <footer className={cn("w-full px-4 border-t bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60", className)}>
        <div className="max-w-container mx-auto">
          <Footer>
            <FooterBottom>
              <div>{copyright}</div>
              <div className="flex items-center gap-4">
                {policies.map((policy, index) => (
                  <a key={index} href={policy.href}>
                    {policy.text}
                  </a>
                ))}
                {showModeToggle && <ModeToggle />}
              </div>
            </FooterBottom>
          </Footer>
        </div>
      </footer>
    );
  }
  return (
    <footer className={cn("w-full px-4 border-t bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60", className)}>
      <div className="max-w-container mx-auto">
        <Footer>
          <FooterContent>
            <FooterColumn className="col-span-2 sm:col-span-3 md:col-span-1">
              <div className="flex items-center gap-2">
                {logo}
                <h3 className="text-xl font-bold">{name}</h3>
              </div>
            </FooterColumn>
            {columns.map((column, index) => (
              <FooterColumn key={index}>
                <h3 className="text-md pt-1 font-semibold">{column.title}</h3>
                {column.links.map((link, linkIndex) => (
                  <a
                    key={linkIndex}
                    href={link.href}
                    className="text-muted-foreground text-sm"
                  >
                    {link.text}
                  </a>
                ))}
              </FooterColumn>
            ))}
          </FooterContent>
          <FooterBottom>
            <div>{copyright}</div>
            <div className="flex items-center gap-4">
              {policies.map((policy, index) => (
                <a key={index} href={policy.href}>
                  {policy.text}
                </a>
              ))}
              {showModeToggle && <ModeToggle />}
            </div>
          </FooterBottom>
        </Footer>
      </div>
    </footer>
  );
}
