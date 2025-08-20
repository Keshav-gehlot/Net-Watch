import { Link, NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { useState } from "react";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
    isActive ? "bg-accent text-accent-foreground" : "hover:bg-accent hover:text-accent-foreground"
  }`;

const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
  `block px-3 py-2 rounded-md text-base font-medium transition-colors ${
    isActive ? "bg-accent text-accent-foreground" : "hover:bg-accent hover:text-accent-foreground"
  }`;

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const NavLinks = ({ mobile = false }) => (
    <>
      <NavLink to="/" className={mobile ? mobileNavLinkClass : navLinkClass} end onClick={() => mobile && setIsOpen(false)}>
        Dashboard
      </NavLink>
      <NavLink to="/packets" className={mobile ? mobileNavLinkClass : navLinkClass} onClick={() => mobile && setIsOpen(false)}>
        Packets
      </NavLink>
      <NavLink to="/alerts" className={mobile ? mobileNavLinkClass : navLinkClass} onClick={() => mobile && setIsOpen(false)}>
        Alerts
      </NavLink>
      <NavLink to="/upload" className={mobile ? mobileNavLinkClass : navLinkClass} onClick={() => mobile && setIsOpen(false)}>
        Upload
      </NavLink>
      <NavLink to="/url-check" className={mobile ? mobileNavLinkClass : navLinkClass} onClick={() => mobile && setIsOpen(false)}>
        URL Check
      </NavLink>
      <NavLink to="/features" className={mobile ? mobileNavLinkClass : navLinkClass} onClick={() => mobile && setIsOpen(false)}>
        Features
      </NavLink>
    </>
  );

  return (
    <header className="w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <nav className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md" style={{ backgroundImage: "var(--gradient-primary)" }} />
          <span className="text-lg font-semibold">NetWatch</span>
        </Link>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-1">
          <NavLinks />
        </div>
        
        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <a href="#agent">Get Agent</a>
          </Button>
          <Button asChild variant="hero" size="sm">
            <Link to="/upload">Analyze</Link>
          </Button>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <div className="flex flex-col space-y-4 mt-8">
                <NavLinks mobile />
                <div className="pt-4 space-y-2 border-t">
                  <Button asChild variant="outline" className="w-full" onClick={() => setIsOpen(false)}>
                    <a href="#agent">Get Python Agent</a>
                  </Button>
                  <Button asChild variant="hero" className="w-full" onClick={() => setIsOpen(false)}>
                    <Link to="/upload">Analyze File</Link>
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
