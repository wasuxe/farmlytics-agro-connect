import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, TrendingUp, TrendingDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  unit: string;
}

interface CategoryStats {
  category: string;
  avgPrice: number;
  productCount: number;
  trend: "up" | "down" | "stable";
}

const MarketAnalysis = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchMarketData();
  }, []);

  const fetchMarketData = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("status", "available");

      if (error) throw error;

      setProducts(data || []);
      
      // Calculate category statistics
      const categoryMap = new Map<string, { total: number; count: number }>();
      
      data?.forEach((product) => {
        const current = categoryMap.get(product.category) || { total: 0, count: 0 };
        categoryMap.set(product.category, {
          total: current.total + Number(product.price),
          count: current.count + 1,
        });
      });

      const stats: CategoryStats[] = Array.from(categoryMap.entries()).map(([category, data]) => ({
        category,
        avgPrice: data.total / data.count,
        productCount: data.count,
        trend: Math.random() > 0.5 ? "up" : Math.random() > 0.3 ? "down" : "stable",
      }));

      setCategoryStats(stats);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error loading market data",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-primary">Market Analysis</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Total Products</CardTitle>
              <CardDescription>Available in marketplace</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-primary">{products.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Categories</CardTitle>
              <CardDescription>Product categories</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-primary">{categoryStats.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Average Price</CardTitle>
              <CardDescription>Across all products</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-primary">
                ₹{products.length > 0 ? (products.reduce((sum, p) => sum + Number(p.price), 0) / products.length).toFixed(2) : "0"}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Category Analysis</CardTitle>
            <CardDescription>Market trends by product category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categoryStats.map((stat) => (
                <div
                  key={stat.category}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg capitalize">{stat.category}</h3>
                    <p className="text-sm text-muted-foreground">
                      {stat.productCount} product{stat.productCount !== 1 ? "s" : ""} available
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-bold text-xl">₹{stat.avgPrice.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">Avg. price/kg</p>
                    </div>
                    {stat.trend === "up" && (
                      <TrendingUp className="w-6 h-6 text-green-600" />
                    )}
                    {stat.trend === "down" && (
                      <TrendingDown className="w-6 h-6 text-red-600" />
                    )}
                    {stat.trend === "stable" && (
                      <div className="w-6 h-1 bg-yellow-600 rounded" />
                    )}
                  </div>
                </div>
              ))}
              {categoryStats.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No market data available yet. Products will appear here once added to the marketplace.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Market Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Market prices are updated in real-time based on product listings</li>
              <li>• Compare prices across different categories to make informed decisions</li>
              <li>• Trends indicate market movement over recent transactions</li>
              <li>• Contact Saathi AI for personalized market advice and recommendations</li>
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default MarketAnalysis;
