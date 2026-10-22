import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Plus, Download, Mail, Trash2, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

const SAMPLE_REPORTS = [
  {
    id: 1,
    name: "Q3 Sales Report",
    description: "Comprehensive sales analysis for Q3 2026",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    charts: 4,
    kpis: 3,
    pages: 8,
    status: "completed",
  },
  {
    id: 2,
    name: "Monthly Performance",
    description: "June performance metrics and insights",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    charts: 6,
    kpis: 5,
    pages: 12,
    status: "completed",
  },
  {
    id: 3,
    name: "Trend Analysis",
    description: "Year-over-year trend analysis",
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    charts: 5,
    kpis: 4,
    pages: 10,
    status: "completed",
  },
];

export default function Reports() {
  const [selectedReport, setSelectedReport] = useState<typeof SAMPLE_REPORTS[0] | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const handleExportPDF = (report: typeof SAMPLE_REPORTS[0]) => {
    toast.success(`Exporting ${report.name} as PDF...`);
    // In real implementation, this would trigger PDF generation
  };

  const handleEmailReport = (report: typeof SAMPLE_REPORTS[0]) => {
    toast.success(`Email options for ${report.name}`);
  };

  const handleDeleteReport = (id: number) => {
    if (confirm("Are you sure you want to delete this report?")) {
      toast.success("Report deleted");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-heading text-foreground">Reports</h3>
          <p className="text-caption mt-2">Generate and manage professional data reports</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-lg hover:shadow-xl transition-shadow">
              <Plus className="w-4 h-4" />
              Create Report
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Report</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">Report Name</label>
                <input
                  type="text"
                  placeholder="e.g., Q4 Analysis"
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">Description</label>
                <textarea
                  placeholder="Add a description for this report"
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm h-24 resize-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">Select Charts & KPIs</label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {["Chart 1", "Chart 2", "KPI 1", "KPI 2", "KPI 3"].map((item) => (
                    <label key={item} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm text-muted-foreground">{item}</span>
                    </label>
                  ))}
                </div>
              </div>
              <Button className="w-full">Create Report</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {SAMPLE_REPORTS.map((report, index) => (
          <Card
            key={report.id}
            className="p-5 hover:shadow-lg transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 cursor-pointer border border-border animate-slide-up"
            style={{ animationDelay: `${index * 50}ms` }}
            onClick={() => {
              setSelectedReport(report);
              setShowPreview(true);
            }}
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground truncate">{report.name}</h4>
                  <p className="text-xs text-muted-foreground truncate mt-1">{report.description}</p>
                </div>
                <FileText className="w-5 h-5 text-accent flex-shrink-0 ml-2" />
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-accent/5 p-2 rounded border border-accent/10">
                  <p className="text-xs text-muted-foreground">Charts</p>
                  <p className="font-bold text-foreground text-sm">{report.charts}</p>
                </div>
                <div className="bg-accent/5 p-2 rounded border border-accent/10">
                  <p className="text-xs text-muted-foreground">KPIs</p>
                  <p className="font-bold text-foreground text-sm">{report.kpis}</p>
                </div>
                <div className="bg-accent/5 p-2 rounded border border-accent/10">
                  <p className="text-xs text-muted-foreground">Pages</p>
                  <p className="font-bold text-foreground text-sm">{report.pages}</p>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                {report.createdAt.toLocaleDateString()} at {report.createdAt.toLocaleTimeString()}
              </p>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleExportPDF(report);
                  }}
                >
                  <Download className="w-4 h-4" />
                  Export
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteReport(report.id);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Report Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl max-h-96 overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedReport?.name}</DialogTitle>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-foreground mb-2">Report Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Description</p>
                    <p className="text-foreground">{selectedReport.description}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Created</p>
                    <p className="text-foreground">{selectedReport.createdAt.toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Charts</p>
                    <p className="text-foreground">{selectedReport.charts}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">KPIs</p>
                    <p className="text-foreground">{selectedReport.kpis}</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-3">Report Preview</h4>
                <div className="bg-muted rounded-lg p-6 space-y-4">
                  <div className="h-40 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 rounded flex items-center justify-center">
                    <p className="text-muted-foreground">Chart Preview</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">Key Insights</p>
                    <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                      <li>Sales increased by 12% compared to previous period</li>
                      <li>Revenue reached all-time high of $89,234</li>
                      <li>Customer acquisition cost decreased by 5%</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => handleExportPDF(selectedReport)}
                  className="flex-1 gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export as PDF
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleEmailReport(selectedReport)}
                  className="flex-1 gap-2"
                >
                  <Mail className="w-4 h-4" />
                  Email Report
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Report Templates */}
      <div>
        <h4 className="font-semibold text-foreground mb-4">Report Templates</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { name: "Executive Summary", icon: "📊", desc: "High-level overview" },
            { name: "Detailed Analysis", icon: "📈", desc: "In-depth metrics" },
            { name: "Custom Report", icon: "✨", desc: "Build your own" },
          ].map((template, idx) => (
            <Card key={idx} className="p-4 hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:scale-105 border border-border">
              <div className="text-3xl mb-2">{template.icon}</div>
              <h5 className="font-medium text-foreground">{template.name}</h5>
              <p className="text-xs text-muted-foreground">{template.desc}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
