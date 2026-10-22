import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LogOut, Database, MessageSquare, BarChart3, Zap, FileText } from "lucide-react";
import { trpc } from "@/lib/trpc";
import Datasets from "./Datasets";
import Query from "./Query";
import Visualizations from "./Visualizations";
import KPIs from "./KPIs";
import Reports from "./Reports";

type NavItem = "datasets" | "query" | "visualizations" | "kpis" | "reports";

const navItems: Array<{ id: NavItem; label: string; icon: React.ReactNode }> = [
  { id: "datasets", label: "Datasets", icon: <Database className="w-5 h-5" /> },
  { id: "query", label: "Query", icon: <MessageSquare className="w-5 h-5" /> },
  { id: "visualizations", label: "Visualizations", icon: <BarChart3 className="w-5 h-5" /> },
  { id: "kpis", label: "KPIs", icon: <Zap className="w-5 h-5" /> },
  { id: "reports", label: "Reports", icon: <FileText className="w-5 h-5" /> },
];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [activeNav, setActiveNav] = useState<NavItem>("datasets");
  const [, navigate] = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const renderContent = () => {
    switch (activeNav) {
      case "datasets":
        return <Datasets />;
      case "query":
        return <Query />;
      case "visualizations":
        return <Visualizations />;
      case "kpis":
        return <KPIs />;
      case "reports":
        return <Reports />;
      default:
        return <Datasets />;
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 bg-card border-r border-border flex flex-col shadow-sm">
        {/* Logo/Header */}
        <div className="p-6 border-b border-border">
          <h1 className="text-2xl font-bold text-foreground">InsightAI</h1>
          <p className="text-sm text-muted-foreground mt-1">Data Analytics Platform</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                activeNav === item.id
                  ? "bg-accent text-accent-foreground shadow-sm"
                  : "text-foreground hover:bg-muted"
              }`}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* User Profile & Logout */}
        <div className="p-4 border-t border-border space-y-3">
          <div className="px-4 py-2">
            <p className="text-sm font-medium text-foreground truncate">{user?.name || "User"}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b border-border bg-card shadow-sm">
          <div className="px-8 py-4">
            <h2 className="text-xl font-semibold text-foreground capitalize">
              {navItems.find((item) => item.id === activeNav)?.label}
            </h2>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          <div className="p-8">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
