import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MessageSquare, Mic, Send, Loader2, Volume2, Copy, Download, Sparkles, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { BarChart, LineChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, ScatterChart, Scatter } from "recharts";
import { Streamdown } from "streamdown";

interface QueryResult {
  id: number;
  question: string;
  sqlQuery: string;
  results: any[];
  chartType?: string;
  insights?: string;
  createdAt: Date;
}

export default function Query() {
  const [question, setQuestion] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [queryResults, setQueryResults] = useState<QueryResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<QueryResult | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<any>(null);

  const { data: datasets } = trpc.dataset.list.useQuery();
  const queryMutation = trpc.query.ask.useMutation();

  useEffect(() => {
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      recognitionRef.current = new (window as any).webkitSpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join("");
        setQuestion(transcript);
      };

      recognitionRef.current.onerror = () => {
        toast.error("Voice recognition failed");
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const handleVoiceInput = () => {
    if (!recognitionRef.current) {
      toast.error("Voice recognition not supported in your browser");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleTextToSpeech = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSubmitQuery = async () => {
    if (!question.trim() || !datasets || datasets.length === 0) {
      toast.error("Please enter a question and upload a dataset first");
      return;
    }

    setIsLoading(true);
    try {
      const result = await queryMutation.mutateAsync({
        datasetId: datasets[0].id,
        question: question.trim(),
      });

      // Parse results
      let parsedResults: any[] = result.results || [];

      const newResult: QueryResult = {
        id: Date.now(),
        question: question.trim(),
        sqlQuery: result.sqlQuery || "",
        results: parsedResults,
        chartType: result.chartType || "bar",
        insights: result.insights || "",
        createdAt: new Date(),
      };

      setQueryResults([newResult, ...queryResults]);
      setSelectedResult(newResult);
      setQuestion("");
      toast.success("Query executed successfully!");
    } catch (error: any) {
      toast.error(error?.message || "Failed to execute query");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderChart = (result: QueryResult) => {
    if (!result.results || result.results.length === 0) return null;

    const chartType = result.chartType || "bar";
    const COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"];

    try {
      switch (chartType) {
        case "line":
          return (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={result.results}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                <XAxis dataKey={Object.keys(result.results[0])[0]} />
                <YAxis />
                <Tooltip contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", border: "none", borderRadius: "8px" }} />
                <Legend />
                {Object.keys(result.results[0]).slice(1).map((key, idx) => (
                  <Line key={key} type="monotone" dataKey={key} stroke={COLORS[idx % COLORS.length]} strokeWidth={2} dot={{ fill: COLORS[idx % COLORS.length], r: 4 }} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          );
        case "pie":
          return (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={result.results}
                  dataKey={Object.keys(result.results[0])[1]}
                  nameKey={Object.keys(result.results[0])[0]}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {result.results.map((_, idx) => (
                    <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          );
        case "scatter":
          return (
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={Object.keys(result.results[0])[0]} />
                <YAxis dataKey={Object.keys(result.results[0])[1]} />
                <Tooltip />
                <Scatter name="Data" data={result.results} fill="#3b82f6" />
              </ScatterChart>
            </ResponsiveContainer>
          );
        default:
          return (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={result.results}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                <XAxis dataKey={Object.keys(result.results[0])[0]} />
                <YAxis />
                <Tooltip contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", border: "none", borderRadius: "8px" }} />
                <Legend />
                {Object.keys(result.results[0]).slice(1).map((key, idx) => (
                  <Bar key={key} dataKey={key} fill={COLORS[idx % COLORS.length]} radius={[8, 8, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          );
      }
    } catch (error) {
      console.error("Chart rendering error:", error);
      return null;
    }
  };

  if (!datasets || datasets.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h3 className="text-heading text-foreground">Natural Language Query</h3>
          <p className="text-caption mt-2">Ask questions about your data in plain English</p>
        </div>
        <Card className="p-12 text-center">
          <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
          <h4 className="font-semibold text-foreground mb-2">No datasets available</h4>
          <p className="text-sm text-muted-foreground">
            Upload a dataset first to start asking questions
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h3 className="text-heading text-foreground">Natural Language Query</h3>
        <p className="text-caption mt-2">Ask questions about your data using natural language or voice commands</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Query Input */}
        <div className="lg:col-span-1 space-y-4 animate-slide-up">
          <Card className="p-4 space-y-4 border-2 border-accent/20 hover:border-accent/40 transition-all duration-300 shadow-lg hover:shadow-xl">
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">Your Question</label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., Show total sales by month"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSubmitQuery()}
                  disabled={isLoading}
                  className="transition-all duration-200 focus:ring-2 focus:ring-accent"
                />
                <Button
                  size="icon"
                  variant={isListening ? "default" : "outline"}
                  onClick={handleVoiceInput}
                  disabled={isLoading}
                  className={`transition-all duration-300 ${isListening ? "animate-pulse" : ""}`}
                >
                  <Mic className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <Button
              onClick={handleSubmitQuery}
              disabled={isLoading || !question.trim()}
              className="w-full gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Executing...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Execute Query
                </>
              )}
            </Button>

            {/* Query History */}
            {queryResults.length > 0 && (
              <div className="space-y-2 pt-4 border-t border-border">
                <h4 className="text-sm font-semibold text-foreground">Recent Queries</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {queryResults.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => setSelectedResult(result)}
                      className={`w-full text-left p-3 rounded-lg text-sm transition-all duration-200 transform hover:scale-105 ${
                        selectedResult?.id === result.id
                          ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg"
                          : "bg-muted hover:bg-muted/80"
                      }`}
                    >
                      <p className="font-medium truncate">{result.question}</p>
                      <p className="text-xs opacity-70">{new Date(result.createdAt).toLocaleTimeString()}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Results Display */}
        <div className="lg:col-span-2 space-y-4 animate-slide-up" style={{ animationDelay: "100ms" }}>
          {selectedResult ? (
            <>
              {/* SQL Query */}
              <Card className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-2 border-accent/20 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-accent" />
                    Generated SQL
                  </h4>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedResult.sqlQuery);
                      toast.success("Copied to clipboard");
                    }}
                    className="hover:bg-accent/20"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <code className="text-xs text-muted-foreground block p-3 bg-background rounded border border-border overflow-x-auto font-mono">
                  {selectedResult.sqlQuery}
                </code>
              </Card>

              {/* Chart */}
              {selectedResult.results.length > 0 && (
                <Card className="p-4 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-accent/20">
                  <h4 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-accent" />
                    Visualization
                  </h4>
                  <div className="bg-background rounded-lg p-4 border border-border/50">
                    {renderChart(selectedResult)}
                  </div>
                </Card>
              )}

              {/* AI Insights */}
              {selectedResult.insights && (
                <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-800 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-blue-600" />
                      AI Insights
                    </h4>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleTextToSpeech(selectedResult.insights!)}
                      className={`hover:bg-blue-100 dark:hover:bg-blue-900/30 ${isSpeaking ? "bg-blue-100 dark:bg-blue-900/30" : ""}`}
                    >
                      <Volume2 className={`w-4 h-4 ${isSpeaking ? "animate-pulse" : ""}`} />
                    </Button>
                  </div>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <Streamdown>{selectedResult.insights}</Streamdown>
                  </div>
                </Card>
              )}

              {/* Results Table */}
              {selectedResult.results.length > 0 && (
                <Card className="p-4 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-accent/20">
                  <h4 className="text-sm font-semibold text-foreground mb-4">Query Results ({selectedResult.results.length} rows)</h4>
                  <div className="overflow-x-auto rounded-lg border border-border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/50 border-b border-border">
                          {Object.keys(selectedResult.results[0]).map((key) => (
                            <th key={key} className="text-left p-3 font-medium text-foreground">
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {selectedResult.results.slice(0, 10).map((row, idx) => (
                          <tr key={idx} className="border-b border-border hover:bg-muted/50 transition-colors">
                            {Object.values(row).map((val, i) => (
                              <td key={i} className="p-3 text-muted-foreground">
                                {String(val).substring(0, 50)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {selectedResult.results.length > 10 && (
                    <p className="text-xs text-muted-foreground mt-2">Showing 10 of {selectedResult.results.length} rows</p>
                  )}
                </Card>
              )}
            </>
          ) : (
            <Card className="p-12 text-center h-full flex items-center justify-center shadow-lg border-2 border-dashed border-accent/20">
              <div className="animate-fade-in">
                <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                <h4 className="font-semibold text-foreground mb-2">No query results yet</h4>
                <p className="text-sm text-muted-foreground">
                  Ask a question to see results, visualizations, and AI insights
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
