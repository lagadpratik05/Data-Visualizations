import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Zap, Plus, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

const SAMPLE_KPI_DATA = [
  { name: "Total Sales", value: "$245,680", change: "+12.5%", trend: "up", target: "$250,000", current: "$245,680", status: "on-track" },
  { name: "Revenue", value: "$89,234", change: "+8.2%", trend: "up", target: "$100,000", current: "$89,234", status: "on-track" },
  { name: "Conversion Rate", value: "3.24%", change: "-0.5%", trend: "down", target: "4.0%", current: "3.24%", status: "below-target" },
  { name: "Avg Order Value", value: "$156.80", change: "+5.1%", trend: "up", target: "$150", current: "$156.80", status: "exceeding" },
];

const TREND_DATA = [
  { month: "Jan", value: 4000 },
  { month: "Feb", value: 3000 },
  { month: "Mar", value: 2000 },
  { month: "Apr", value: 2780 },
  { month: "May", value: 1890 },
  { month: "Jun", value: 2390 },
];

export default function KPIs() {
  const [selectedKPI, setSelectedKPI] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "exceeding":
        return "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800";
      case "on-track":
        return "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800";
      case "below-target":
        return "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800";
      default:
        return "bg-muted";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "exceeding":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
      case "on-track":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100";
      case "below-target":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100";
      default:
        return "bg-muted";
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-heading text-foreground">KPI Monitoring</h3>
          <p className="text-caption mt-2">Track and monitor your key performance indicators</p>
        </div>
        <Button className="gap-2 shadow-lg hover:shadow-xl transition-shadow">
          <Plus className="w-4 h-4" />
          Add KPI
        </Button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {SAMPLE_KPI_DATA.map((kpi, index) => (
          <Card
            key={index}
            onClick={() => setSelectedKPI(kpi.name)}
            className={`p-5 cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-lg border-2 animate-slide-up ${
              selectedKPI === kpi.name ? "border-accent" : "border-border"
            } ${getStatusColor(kpi.status)}`}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <h4 className="font-semibold text-foreground text-sm">{kpi.name}</h4>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusBadgeColor(kpi.status)}`}>
                  {kpi.status === "exceeding" && "Exceeding"}
                  {kpi.status === "on-track" && "On Track"}
                  {kpi.status === "below-target" && "Below Target"}
                </span>
              </div>

              <div>
                <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
                <div className="flex items-center gap-1 mt-1">
                  {kpi.trend === "up" ? (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  )}
                  <span className={`text-sm font-medium ${kpi.trend === "up" ? "text-green-600" : "text-red-600"}`}>
                    {kpi.change}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-border/50">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Target: {kpi.target}</span>
                  <span>Current: {kpi.current}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-accent h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min((parseFloat(kpi.current.replace(/[^0-9.-]/g, "")) / parseFloat(kpi.target.replace(/[^0-9.-]/g, ""))) * 100, 100)}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Selected KPI Detail */}
      {selectedKPI && (
        <Card className="p-6 shadow-lg animate-slide-up">
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold text-foreground mb-4">{selectedKPI} - Trend Analysis</h4>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={TREND_DATA}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={{ fill: "#3b82f6", r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Average</p>
                <p className="text-2xl font-bold text-foreground">$2,510</p>
              </div>
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Peak</p>
                <p className="text-2xl font-bold text-green-600">$4,000</p>
              </div>
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Low</p>
                <p className="text-2xl font-bold text-amber-600">$1,890</p>
              </div>
            </div>

            {/* Alerts */}
            <div className="space-y-3">
              <h5 className="font-semibold text-foreground">Alerts & Notifications</h5>
              <div className="space-y-2">
                <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-900 dark:text-amber-100 text-sm">Below Target</p>
                    <p className="text-xs text-amber-800 dark:text-amber-200">Current value is 5% below target</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* KPI Management */}
      <Card className="p-6">
        <h4 className="font-semibold text-foreground mb-4">KPI Management</h4>
        <div className="space-y-3">
          {SAMPLE_KPI_DATA.map((kpi, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-accent" />
                <div>
                  <p className="font-medium text-foreground text-sm">{kpi.name}</p>
                  <p className="text-xs text-muted-foreground">Target: {kpi.target}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">Edit</Button>
                <Button size="sm" variant="outline" className="text-destructive">Delete</Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
