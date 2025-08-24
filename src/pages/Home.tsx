import Header from "@/components/layout/Header";
import HeroSection from "@/components/hero/HeroSection";
import TripCard from "@/components/trip/TripCard";
import { Button } from "@/components/ui/button";
import { Plus, TestTube } from "lucide-react";
import { Link } from "react-router-dom";
import { runCalculationTests } from "@/lib/test-calculations";

const Home = () => {
  // Mock data for recent trips
  const recentTrips = [
    {
      id: "1",
      name: "Goa Beach Trip 2024",
      members: ["Alice", "Bob", "Charlie", "Diana"],
      totalExpenses: 45000,
      lastUpdated: new Date('2024-01-15'),
      status: "active" as const
    },
    {
      id: "2", 
      name: "Ooty Hills Adventure",
      members: ["John", "Sarah", "Mike"],
      totalExpenses: 28500,
      lastUpdated: new Date('2024-01-10'),
      status: "settled" as const
    },
    {
      id: "3",
      name: "Office Team Outing",
      members: ["Team A", "Team B", "Team C", "Team D", "Team E"],
      totalExpenses: 12000,
      lastUpdated: new Date('2024-01-08'),
      status: "draft" as const
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HeroSection />
      
      {/* Recent Trips Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">Recent Trips</h2>
              <p className="text-muted-foreground">Continue working on your existing trips</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={runCalculationTests}>
                <TestTube className="w-4 h-4 mr-2" />
                Test Calculations
              </Button>
              <Button variant="hero" asChild>
                <Link to="/create">
                  <Plus className="w-4 h-4 mr-2" />
                  New Trip
                </Link>
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentTrips.map((trip) => (
              <TripCard key={trip.id} {...trip} />
            ))}
          </div>
          
          {recentTrips.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No trips yet</h3>
              <p className="text-muted-foreground mb-6">Create your first trip to get started</p>
              <Button variant="hero" asChild>
                <Link to="/create">Create First Trip</Link>
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;