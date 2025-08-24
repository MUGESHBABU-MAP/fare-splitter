import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Calculator, Menu } from "lucide-react";

const Header = () => {
  return (
    <header className="bg-card/80 backdrop-blur-md border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-gradient-hero rounded-lg flex items-center justify-center">
              <Calculator className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-hero bg-clip-text text-transparent">
              TripSplit
            </span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/trips" className="text-muted-foreground hover:text-foreground transition-colors">
              My Trips
            </Link>
            <Link to="/create" className="text-muted-foreground hover:text-foreground transition-colors">
              New Trip
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Button variant="hero" size="sm" asChild>
              <Link to="/create">Start Trip</Link>
            </Button>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;