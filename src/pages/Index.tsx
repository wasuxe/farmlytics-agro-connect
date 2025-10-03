import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Leaf, ShoppingCart, ScanLine } from "lucide-react";
import heroImage from "@/assets/hero-agriculture.jpg";
const Index = () => {
  const navigate = useNavigate();
  return <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative h-screen">
        <img src={heroImage} alt="Agriculture" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/90 to-primary/70" />
        <div className="relative h-full flex items-center justify-center text-center px-4">
          <div className="max-w-4xl space-y-6 animate-harvest text-white">
            <h1 className="text-6xl md:text-7xl font-bold">Farmlytics</h1>
            <p className="text-2xl md:text-3xl">Your Smart Agriculture Ecosystem</p>
            <p className="text-lg md:text-xl opacity-90">Connecting Farmers, Users, and Wholesalers</p>
            <div className="flex gap-4 justify-center pt-8">
              <Button size="lg" variant="secondary" onClick={() => navigate("/auth")} className="text-lg">
                Get Started
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/auth")} className="text-lg border-white hover:bg-white/20 text-slate-950">
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">Powerful Features</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center space-y-4 p-6 rounded-lg bg-card hover:shadow-lg transition-all">
              <ScanLine className="w-16 h-16 mx-auto text-primary" />
              <h3 className="text-2xl font-bold">Plant Diagnosis</h3>
              <p className="text-muted-foreground">AI-powered disease detection for your crops</p>
            </div>
            <div className="text-center space-y-4 p-6 rounded-lg bg-card hover:shadow-lg transition-all">
              <ShoppingCart className="w-16 h-16 mx-auto text-primary" />
              <h3 className="text-2xl font-bold">Marketplace</h3>
              <p className="text-muted-foreground">Buy and sell fresh produce directly</p>
            </div>
            <div className="text-center space-y-4 p-6 rounded-lg bg-card hover:shadow-lg transition-all">
              <Leaf className="w-16 h-16 mx-auto text-primary" />
              <h3 className="text-2xl font-bold">Community</h3>
              <p className="text-muted-foreground">Connect with farmers and wholesalers</p>
            </div>
          </div>
        </div>
      </section>
    </div>;
};
export default Index;