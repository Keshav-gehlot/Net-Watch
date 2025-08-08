import { Link, NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
    isActive ? "bg-accent text-accent-foreground" : "hover:bg-accent hover:text-accent-foreground"
  }`;

const Navbar = () => {
  return (
    <header className="w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <nav className="container mx-auto flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md" style={{ backgroundImage: "var(--gradient-primary)" }} />
          <span className="text-lg font-semibold">NetWatch</span>
        </Link>
        <div className="flex items-center gap-1">
          <NavLink to="/" className={navLinkClass} end>
            Dashboard
          </NavLink>
          <NavLink to="/packets" className={navLinkClass}>
            Packets
          </NavLink>
          <NavLink to="/alerts" className={navLinkClass}>
            Alerts
          </NavLink>
          <NavLink to="/upload" className={navLinkClass}>
            Upload
          </NavLink>
          <NavLink to="/url-check" className={navLinkClass}>
            URL Check
          </NavLink>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <a href="#agent">Get Python Agent</a>
          </Button>
          <Button asChild variant="hero">
            <Link to="/upload">Analyze File</Link>
          </Button>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
