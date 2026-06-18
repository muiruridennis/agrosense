// app/dashboard/farms/[farmId]/poultry/components/FlockSalesTab.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, TrendingUp, Package, Users, Calendar, DollarSign, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Flock } from "../types";

interface FlockSalesTabProps {
  flock: Flock;
}

export function FlockSalesTab({ flock }: FlockSalesTabProps) {
  const [showSaleForm, setShowSaleForm] = useState(false);

  const totalRevenue = flock.revenueTotal || 0;
  const totalBirdsSold = flock.sales?.reduce((sum, s) => sum + s.quantity, 0) || 0;
  const avgPricePerBird = totalBirdsSold > 0 ? totalRevenue / totalBirdsSold : 0;

  return (
    <div className="space-y-5">
      {/* Sales Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-4 text-center">
          <DollarSign className="mx-auto h-5 w-5 text-emerald-500 mb-2" />
          <p className="text-2xl font-bold">KES {totalRevenue.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Total Revenue</p>
        </Card>
        <Card className="p-4 text-center">
          <Package className="mx-auto h-5 w-5 text-blue-500 mb-2" />
          <p className="text-2xl font-bold">{totalBirdsSold.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Birds Sold</p>
        </Card>
        <Card className="p-4 text-center">
          <TrendingUp className="mx-auto h-5 w-5 text-amber-500 mb-2" />
          <p className="text-2xl font-bold">KES {avgPricePerBird.toFixed(0)}</p>
          <p className="text-xs text-muted-foreground">Avg Price/Bird</p>
        </Card>
      </div>

      {/* Add Sale Button */}
      <div className="flex justify-end">
        <Button onClick={() => setShowSaleForm(true)} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Record Sale
        </Button>
      </div>

      {/* Sales History */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="text-sm font-semibold">Sales History</h3>
        </div>
        {flock.sales && flock.sales.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="border-b">
                  <th className="px-4 py-3 text-left font-medium">Date</th>
                  <th className="px-4 py-3 text-left font-medium">Buyer</th>
                  <th className="px-4 py-3 text-left font-medium">Quantity</th>
                  <th className="px-4 py-3 text-left font-medium">Price/Bird</th>
                  <th className="px-4 py-3 text-left font-medium">Total</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {flock.sales.map((sale, idx) => (
                  <tr key={idx} className="border-b hover:bg-muted/30">
                    <td className="px-4 py-2.5">
                      {new Date(sale.saleDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2.5 font-medium">{sale.buyer}</td>
                    <td className="px-4 py-2.5">{sale.quantity}</td>
                    <td className="px-4 py-2.5">KES {sale.pricePerBird}</td>
                    <td className="px-4 py-2.5 font-semibold">KES {sale.totalAmount.toLocaleString()}</td>
                    <td className="px-4 py-2.5">
                      <Badge variant={
                        sale.paymentStatus === "paid" ? "default" :
                        sale.paymentStatus === "partial" ? "secondary" : "destructive"
                      } className="text-[9px]">
                        {sale.paymentStatus || "pending"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No sales recorded yet</p>
            <Button
              variant="link"
              size="sm"
              onClick={() => setShowSaleForm(true)}
              className="mt-2"
            >
              Record your first sale →
            </Button>
          </div>
        )}
      </Card>

      {/* Sales Insights */}
      {totalBirdsSold > 0 && (
        <Card className="p-4 bg-muted/20">
          <div className="flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-emerald-500 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold">Sales Insight</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Total of {totalBirdsSold.toLocaleString()} birds sold across {flock.sales?.length || 0} transaction(s).
                {flock.currentCount > 0 && ` ${flock.currentCount.toLocaleString()} birds remaining.`}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Sale Form Dialog would go here */}
    </div>
  );
}