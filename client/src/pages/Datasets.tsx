import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, Trash2, Eye, Plus, Cloud, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface DatasetWithPreview {
  id: number;
  name: string;
  fileName: string;
  rowCount: number | null;
  columnCount: number | null;
  createdAt: Date;
  preview?: any[];
  columns?: any[];
}

export default function Datasets() {
  const [datasetName, setDatasetName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState<DatasetWithPreview | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: datasets, isLoading, refetch } = trpc.dataset.list.useQuery();
  const uploadMutation = trpc.file.upload.useMutation();
  const deleteMutation = trpc.dataset.delete.useMutation();
  const columnsMutation = trpc.column.list.useQuery(
    selectedDataset?.id ? { datasetId: selectedDataset.id } : { datasetId: 0 },
    { enabled: !!selectedDataset }
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file: File) => {
    const validExtensions = [".csv", ".xlsx", ".xls"];
    const isValid = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    
    if (!isValid) {
      toast.error("Please upload a CSV or Excel file");
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error("File size must be less than 50MB");
      return;
    }

    setSelectedFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !datasetName.trim()) {
      toast.error("Please select a file and enter a dataset name");
      return;
    }

    setIsUploading(true);
    try {
      await uploadMutation.mutateAsync({
        file: selectedFile,
        datasetName: datasetName.trim(),
      });
      toast.success("Dataset uploaded and cleaned successfully!");
      setDatasetName("");
      setSelectedFile(null);
      setIsOpen(false);
      refetch();
    } catch (error) {
      toast.error("Failed to upload dataset");
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this dataset? This action cannot be undone.")) {
      try {
        await deleteMutation.mutateAsync({ id });
        toast.success("Dataset deleted");
        refetch();
      } catch (error) {
        toast.error("Failed to delete dataset");
      }
    }
  };

  const handleViewPreview = (dataset: DatasetWithPreview) => {
    setSelectedDataset(dataset);
    setShowPreview(true);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-heading text-foreground">Your Datasets</h3>
          <p className="text-caption mt-2">Upload, manage, and explore your data files</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-lg hover:shadow-xl transition-shadow">
              <Plus className="w-4 h-4" />
              Upload Dataset
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Upload New Dataset</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">Dataset Name</label>
                <Input
                  placeholder="e.g., Sales Data Q3 2026"
                  value={datasetName}
                  onChange={(e) => setDatasetName(e.target.value)}
                  className="transition-all duration-200"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">Select File</label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer ${
                    isDragging
                      ? "border-accent bg-accent/5"
                      : "border-border hover:border-accent hover:bg-accent/2"
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Cloud className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm font-medium text-foreground">
                    {selectedFile ? selectedFile.name : "Click to upload or drag and drop"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">CSV or Excel files only (max 50MB)</p>
                </div>
              </div>
              <Button
                onClick={handleUpload}
                disabled={isUploading || !selectedFile || !datasetName}
                className="w-full"
              >
                {isUploading ? "Uploading & Cleaning..." : "Upload Dataset"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Datasets Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-4 animate-shimmer">
              <div className="h-32 bg-muted rounded"></div>
            </Card>
          ))}
        </div>
      ) : datasets && datasets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {datasets.map((dataset, index) => (
            <Card
              key={dataset.id}
              className="p-5 hover:shadow-lg transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 border border-border animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground truncate">{dataset.name}</h4>
                    <p className="text-xs text-muted-foreground truncate">{dataset.fileName}</p>
                  </div>
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 ml-2" />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-accent/5 p-3 rounded-lg border border-accent/10">
                    <p className="text-xs text-muted-foreground font-medium">Rows</p>
                    <p className="text-lg font-bold text-foreground">{dataset.rowCount}</p>
                  </div>
                  <div className="bg-accent/5 p-3 rounded-lg border border-accent/10">
                    <p className="text-xs text-muted-foreground font-medium">Columns</p>
                    <p className="text-lg font-bold text-foreground">{dataset.columnCount}</p>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  {new Date(dataset.createdAt).toLocaleDateString()} at {new Date(dataset.createdAt).toLocaleTimeString()}
                </p>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-2"
                    onClick={() => handleViewPreview(dataset)}
                  >
                    <Eye className="w-4 h-4" />
                    Preview
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(dataset.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center border-2 border-dashed border-border">
          <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
          <h4 className="font-semibold text-foreground mb-2">No datasets yet</h4>
          <p className="text-sm text-muted-foreground mb-6">
            Upload your first CSV or Excel file to start exploring your data
          </p>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Upload Dataset
              </Button>
            </DialogTrigger>
          </Dialog>
        </Card>
      )}

      {/* Data Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-96 overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedDataset?.name} - Data Preview</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Column Profiling */}
            {columnsMutation.data && columnsMutation.data.length > 0 && (
              <div>
                <h4 className="font-semibold text-foreground mb-3">Column Profiling</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto">
                  {columnsMutation.data.map((col: any) => (
                    <Card key={col.id} className="p-3 bg-muted/50">
                      <p className="font-medium text-foreground text-sm">{col.name}</p>
                      <div className="text-xs text-muted-foreground space-y-1 mt-2">
                        <p>Type: <span className="font-mono">{col.dataType}</span></p>
                        <p>Nulls: {col.nullCount}</p>
                        <p>Unique: {col.uniqueCount}</p>
                        {col.minValue && <p>Min: {col.minValue}</p>}
                        {col.maxValue && <p>Max: {col.maxValue}</p>}
                        {col.avgValue && <p>Avg: {col.avgValue}</p>}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Sample Data Table */}
            {selectedDataset?.preview && selectedDataset.preview.length > 0 && (
              <div>
                <h4 className="font-semibold text-foreground mb-3">Sample Data (First 5 Rows)</h4>
                <div className="border border-border rounded-lg overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {Object.keys(selectedDataset.preview[0]).map((key) => (
                          <TableHead key={key} className="text-xs">{key}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedDataset.preview.map((row: any, idx: number) => (
                        <TableRow key={idx}>
                          {Object.values(row).map((val: any, i: number) => (
                            <TableCell key={i} className="text-xs">
                              {String(val).substring(0, 50)}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
