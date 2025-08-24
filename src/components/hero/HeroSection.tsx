import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Calculator, Download } from "lucide-react";
import heroImage from "@/assets/hero-travel.jpg";

const HeroSection = () => {
  return (
    <div className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/70 to-accent/80" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 animate-slide-up">
            Split Trip Expenses
            <span className="block text-3xl md:text-4xl text-white/90 font-normal mt-2">
              Fair & Simple
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed animate-fade-in">
            Track expenses, split bills fairly among friends, and settle up effortlessly. 
            Perfect for group trips, shared meals, and adventures.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 animate-slide-up">
            <Button variant="accent" size="xl" asChild>
              <Link to="/create" className="group">
                Create Your Trip
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button variant="outline" size="xl" className="bg-white/10 border-white/30 text-white hover:bg-white/20" asChild>
              <Link to="/trips">View Past Trips</Link>
            </Button>
          </div>

          {/* Feature highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-white animate-float">
              <Users className="w-8 h-8 mb-3 mx-auto text-white" />
              <h3 className="font-semibold mb-2">Multiple Members</h3>
              <p className="text-sm text-white/80">Support 2-100 members per trip</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-white animate-float" style={{ animationDelay: '0.2s' }}>
              <Calculator className="w-8 h-8 mb-3 mx-auto text-white" />
              <h3 className="font-semibold mb-2">Smart Splitting</h3>
              <p className="text-sm text-white/80">Automatic fair calculations</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-white animate-float" style={{ animationDelay: '0.4s' }}>
              <Download className="w-8 h-8 mb-3 mx-auto text-white" />
              <h3 className="font-semibold mb-2">Export & Import</h3>
              <p className="text-sm text-white/80">Excel/CSV support included</p>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-background to-transparent z-10" />
    </div>
  );
};

export default HeroSection;