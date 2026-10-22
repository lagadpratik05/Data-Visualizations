import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Plus, Download } from "lucide-react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";

const SAMPLE_DATA = [
  { month: "Jan", sales: 4000, revenue: 2400, profit: 2400 },
  { month: "Feb", sales: 3000, revenue: 1398, profit: 2210 },
  { month: "Mar", sales: 2000, revenue: 9800, profit: 2290 },
  { month: "Apr", sales: 2780, revenue: 3908, profit: 2000 },
  { month: "May", sales: 1890, revenue: 4800, profit: 2181 },
  { month: "Jun", sales: 2390, revenue: 3800, profit: 2500 },
];

const COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#06b6d4"];

export default function Visualizations() {
  const [selectedChart, setSelectedChart] = useState<string>("bar");

  const chartOptions = [
    { id: "bar", label: "Bar Chart", icon: "📊" },
    { id: "line", label: "Line Chart", icon: "📈" },
    { id: "pie", label: "Pie Chart", icon: "🥧" },
    { id: "scatter", label: "Scatter Plot", icon: "⚡" },
  ];

  const renderChart = () => {
    switch (selectedChart) {
      case "line":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={SAMPLE_DATA}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={2} />
              <Line type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2} />
              <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        );
      case "pie":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={SAMPLE_DATA}
                dataKey="sales"
                nameKey="month"
                cx="50%"
                cy="50%"
                outerRadius={120}
                label
              >
                {SAMPLE_DATA.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );
      case "scatter":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="sales" />
              <YAxis dataKey="revenue" />
              <Tooltip />
              <Scatter name="Data Points" data={SAMPLE_DATA} fill="#3b82f6" />
            </ScatterChart>
          </ResponsiveContainer>
        );
      default:
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={SAMPLE_DATA}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="sales" fill="#3b82f6" />
              <Bar dataKey="revenue" fill="#8b5cf6" />
              <Bar dataKey="profit" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-heading text-foreground">Interactive Visualizations</h3>
        <p className="text-caption mt-2">Create and explore interactive charts from your data</p>
      </div>

      {/* Chart Type Selector */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {chartOptions.map((option) => (
          <button
            key={option.id}
            onClick={() => setSelectedChart(option.id)}
            className={`p-4 rounded-lg border-2 transition-all duration-200 transform hover:scale-105 ${
              selectedChart === option.id
                ? "border-accent bg-accent/10"
                : "border-border hover:border-accent"
            }`}
          >
            <div className="text-2xl mb-2">{option.icon}</div>
            <p className="text-sm font-medium text-foreground">{option.label}</p>
          </button>
        ))}
      </div>

      {/* Main Chart */}
      <Card className="p-6 shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h4 className="font-semibold text-foreground">Sales Performance</h4>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        </div>
        <div className="bg-background rounded-lg p-4">
          {renderChart()}
        </div>
      </Card>

      {/* Chart Controls */}
      <Card className="p-6">
        <h4 className="font-semibold text-foreground mb-4">Chart Settings</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">Data Series</label>
            <div className="space-y-2">
              {["Sales", "Revenue", "Profit"].map((series) => (
                <label key={series} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span className="text-sm text-muted-foreground">{series}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">Time Period</label>
            <select className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm">
              <option>Last 6 Months</option>
              <option>Last Year</option>
              <option>Last 2 Years</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">Aggregation</label>
            <select className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm">
              <option>Monthly</option>
              <option>Quarterly</option>
              <option>Yearly</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Recent Visualizations */}
      <div>
        <h4 className="font-semibold text-foreground mb-4">Recent Visualizations</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-4 hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:scale-105">
              <div className="h-32 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 rounded-lg flex items-center justify-center mb-3">
                <BarChart3 className="w-8 h-8 text-muted-foreground opacity-50" />
              </div>
              <h5 className="font-medium text-foreground text-sm">Chart {i}</h5>
              <p className="text-xs text-muted-foreground">Created 2 hours ago</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
