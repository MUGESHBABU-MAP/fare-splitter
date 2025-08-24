import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, DollarSign } from "lucide-react";
import { Link } from "react-router-dom";

interface TripCardProps {
  id: string;
  name: string;
  members: string[];
  totalExpenses: number;
  lastUpdated: Date;
  status?: "active" | "settled" | "draft";
}

const TripCard = ({ id, name, members, totalExpenses, lastUpdated, status = "active" }: TripCardProps) => {
  const statusColors = {
    active: "bg-success text-success-foreground",
    settled: "bg-muted text-muted-foreground", 
    draft: "bg-warning text-warning-foreground"
  };

  return (
    <Card className="group hover:shadow-primary transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-card to-card/50">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-semibold truncate pr-2">{name}</CardTitle>
          <Badge className={statusColors[status]} variant="secondary">
            {status}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="w-4 h-4" />
          <span>{members.length} members</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <DollarSign className="w-4 h-4" />
          <span>₹{totalExpenses.toLocaleString()}</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>{lastUpdated.toLocaleDateString()}</span>
        </div>
      </CardContent>
      
      <CardFooter className="pt-3">
        <Button 
          variant="ocean" 
          className="w-full group-hover:scale-105 transition-transform" 
          asChild
        >
          <Link to={`/trip/${id}`}>
            Open Trip
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TripCard;