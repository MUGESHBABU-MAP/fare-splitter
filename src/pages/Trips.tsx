import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import TripCard from "@/components/trip/TripCard";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type DbTrip = Database['public']['Tables']['trips']['Row'];

interface Trip {
  id: string;
  name: string;
  member_count: number;
  members: string[];
  created_at: string;
  updated_at: string;
}

const Trips = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our interface
      const transformedTrips: Trip[] = (data || []).map(trip => ({
        ...trip,
        members: Array.isArray(trip.members) ? trip.members.filter(m => typeof m === 'string') as string[] : []
      }));
      
      setTrips(transformedTrips);
    } catch (error) {
      console.error('Error fetching trips:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTripForCard = (trip: Trip) => ({
    id: trip.id,
    name: trip.name,
    members: trip.members,
    totalExpenses: 0, // Will be calculated from expenses later
    lastUpdated: new Date(trip.updated_at),
    status: "active" as const
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2 bg-gradient-hero bg-clip-text text-transparent">
                Your Trips
              </h1>
              <p className="text-muted-foreground text-lg">
                Manage and track expenses for all your trips
              </p>
            </div>
            <Button variant="hero" asChild>
              <Link to="/create">
                <Plus className="w-4 h-4 mr-2" />
                New Trip
              </Link>
            </Button>
          </div>
          
          {trips.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trips.map((trip) => (
                <TripCard key={trip.id} {...formatTripForCard(trip)} />
              ))}
            </div>
          ) : (
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

export default Trips;