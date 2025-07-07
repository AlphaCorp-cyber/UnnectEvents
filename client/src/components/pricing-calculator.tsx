import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calculator, DollarSign, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface PricingBreakdown {
  packageName: string;
  quantity: number;
  price: number;
}

interface PricingResult {
  totalPrice: number;
  breakdown: PricingBreakdown[];
}

export default function PricingCalculator() {
  const [days, setDays] = useState<number>(1);
  const [calculation, setCalculation] = useState<PricingResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Fetch listing packages for display
  const { data: packages } = useQuery({
    queryKey: ['/api/listing-packages'],
  });

  const calculatePrice = async () => {
    if (days < 1) return;
    
    setIsCalculating(true);
    try {
      const response = await fetch('/api/calculate-price', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ days }),
      });
      
      if (response.ok) {
        const result = await response.json();
        setCalculation(result);
      }
    } catch (error) {
      console.error('Error calculating price:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  // Auto-calculate when days change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (days >= 1) {
        calculatePrice();
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [days]);

  return (
    <div className="space-y-6">
      {/* Available Packages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Available Listing Packages
          </CardTitle>
          <CardDescription>
            Choose from our flexible pricing options
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {packages?.map((pkg: any) => (
              <div key={pkg.id} className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 p-4 rounded-lg border">
                <div className="text-2xl font-bold text-blue-600">${pkg.price}</div>
                <div className="text-sm font-medium">{pkg.name}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {pkg.duration} {pkg.duration === 1 ? 'day' : 'days'}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Price Calculator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Pricing Calculator
          </CardTitle>
          <CardDescription>
            Enter the number of days to see the optimized pricing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="days">Number of Days</Label>
              <Input
                id="days"
                type="number"
                min="1"
                max="365"
                value={days}
                onChange={(e) => setDays(parseInt(e.target.value) || 1)}
                placeholder="Enter days"
              />
            </div>
            
            {calculation && (
              <div className="space-y-4">
                <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Cost:</span>
                    <span className="text-2xl font-bold text-green-600">
                      ${calculation.totalPrice.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-xs text-green-700 dark:text-green-300">
                    <Clock className="w-3 h-3" />
                    {days} {days === 1 ? 'day' : 'days'} listing
                  </div>
                </div>
              </div>
            )}
          </div>

          {calculation && calculation.breakdown.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Package Breakdown:</h3>
              <div className="space-y-2">
                {calculation.breakdown.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border"
                  >
                    <div>
                      <span className="font-medium">{item.quantity}× {item.packageName}</span>
                    </div>
                    <span className="font-semibold text-blue-600">
                      ${item.price.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mt-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  💡 Our system automatically finds the most cost-effective combination of packages for your desired duration.
                </p>
              </div>
            </div>
          )}

          {/* Examples */}
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border">
            <h3 className="font-semibold mb-3">Quick Examples:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between">
                <span>3 days:</span>
                <span className="font-medium">3 × 1-Day = $3.00</span>
              </div>
              <div className="flex justify-between">
                <span>9 days:</span>
                <span className="font-medium">7-Day + 2 × 1-Day = $7.00</span>
              </div>
              <div className="flex justify-between">
                <span>16 days:</span>
                <span className="font-medium">14-Day + 2 × 1-Day = $10.00</span>
              </div>
              <div className="flex justify-between">
                <span>35 days:</span>
                <span className="font-medium">30-Day + 5 × 1-Day = $20.00</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}