import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Leaf, ShoppingCart, ScanLine, TrendingUp, Users, MessageSquare, UserSearch } from "lucide-react";
import plantDiagnosisIcon from "@/assets/plant-diagnosis-icon.png";
import marketplaceIcon from "@/assets/marketplace-icon.png";
import { VoiceSaathiAI } from "@/components/VoiceSaathiAI";
interface Profile {
  role: "farmer" | "user" | "wholesaler";
  full_name: string;
}
const Dashboard = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  useEffect(() => {
    fetchProfile();
  }, []);
  const fetchProfile = async () => {
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const {
        data,
        error
      } = await supabase.from("profiles").select("role, full_name").eq("id", user.id).single();
      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error loading profile",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>;
  }
  const getDashboardContent = () => {
    switch (profile?.role) {
      case "farmer":
        return {
          title: "Farmer Dashboard",
          subtitle: "Manage your crops and sell products",
          features: [{
            title: "Plant Diagnosis",
            description: "AI-powered disease detection for your crops",
            icon: ScanLine,
            image: plantDiagnosisIcon,
            action: () => navigate("/diagnosis")
          }, {
            title: "My Products",
            description: "List and manage your products for sale",
            icon: Leaf,
            image: marketplaceIcon,
            action: () => navigate("/marketplace")
          }, {
            title: "Community Forum",
            description: "Connect with other farmers and wholesalers",
            icon: MessageSquare,
            action: () => navigate("/community")
          }, {
            title: "User Directory",
            description: "Find and connect with farmers and wholesalers",
            icon: UserSearch,
            action: () => navigate("/directory")
          }, {
            title: "Market Analysis",
            description: "View real-time market trends and prices",
            icon: TrendingUp,
            action: () => navigate("/market-analysis")
          }]
        };
      case "wholesaler":
        return {
          title: "Wholesaler Dashboard",
          subtitle: "Source products in bulk from farmers",
          features: [{
            title: "Browse Products",
            description: "Find quality products from local farmers",
            icon: ShoppingCart,
            image: marketplaceIcon,
            action: () => navigate("/marketplace")
          }, {
            title: "Community Forum",
            description: "Connect with farmers",
            icon: MessageSquare,
            action: () => navigate("/community")
          }, {
            title: "Find Farmers",
            description: "Search and connect with suppliers",
            icon: UserSearch,
            action: () => navigate("/directory")
          }, {
            title: "Market Analysis",
            description: "Analyze supply and demand trends",
            icon: TrendingUp,
            action: () => navigate("/market-analysis")
          }]
        };
      default:
        return {
          title: "User Dashboard",
          subtitle: "Discover fresh produce from local farmers",
          features: [{
            title: "Marketplace",
            description: "Browse and purchase fresh produce",
            icon: ShoppingCart,
            image: marketplaceIcon,
            action: () => navigate("/marketplace")
          }, {
            title: "Plant Diagnosis",
            description: "Get help identifying plant issues",
            icon: ScanLine,
            image: plantDiagnosisIcon,
            action: () => navigate("/diagnosis")
          }, {
            title: "Community Forum",
            description: "Connect with farmers and learn",
            icon: MessageSquare,
            action: () => navigate("/community")
          }, {
            title: "Find Farmers",
            description: "Search and connect with local farmers",
            icon: UserSearch,
            action: () => navigate("/directory")
          }]
        };
    }
  };
  const content = getDashboardContent();
  return <div className="min-h-screen bg-muted/30">
      <header className="bg-card border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary">Farmlytics</h1>
            <p className="text-sm text-muted-foreground">Welcome, {profile?.full_name}</p>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 animate-harvest">
          <h2 className="text-3xl font-bold mb-2">{content.title}</h2>
          <p className="text-muted-foreground">{content.subtitle}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {content.features.map((feature, index) => {
          const Icon = feature.icon;
          return <Card key={index} className="cursor-pointer hover:shadow-lg transition-all hover:scale-105 animate-grow" style={{
            animationDelay: `${index * 100}ms`
          }} onClick={feature.action}>
                <CardHeader>
                  {feature.image ? <img src={feature.image} alt={feature.title} className="w-16 h-16 mb-4" /> : <Icon className="w-12 h-12 mb-4 text-primary" />}
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">Get Started</Button>
                </CardContent>
              </Card>;
        })}
        </div>
      </main>
      
      <VoiceSaathiAI />
    </div>;
};
export default Dashboard;