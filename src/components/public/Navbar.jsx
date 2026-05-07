import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/#about" },
  { label: "Services", href: "/#services" },
  { label: "FAQ", href: "/#faq" },
  { label: "Contact", href: "/#contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          <Link to="/" className="flex-shrink-0">
            <img
              src="https://checkacase.com/wp-content/uploads/2023/05/CAC-Logo-Blue.png"
              alt="Check A Case"
              className="h-8 sm:h-10 w-auto"
            />
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-foreground/70 hover:text-primary transition-colors"
              >
                {link.label}
              </a>
            ))}
            <Link to="/Survey?s2=CAC-Home&utm_source=Website">
              <Button className="rounded-xl px-6 h-11 text-sm font-semibold">
                Start Your Claim
              </Button>
            </Link>
          </div>

          <button
            onClick={() => setOpen(!open)}
            className="md:hidden p-2 text-foreground"
          >
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-background px-4 pb-6 pt-2">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block py-3 text-base font-medium text-foreground/70 hover:text-primary"
            >
              {link.label}
            </a>
          ))}
          <Link to="/Survey?s2=CAC-Home&utm_source=Website" onClick={() => setOpen(false)}>
            <Button className="w-full rounded-xl h-12 mt-4 text-base font-semibold">
              Start Your Claim
            </Button>
          </Link>
        </div>
      )}
    </nav>
  );
}