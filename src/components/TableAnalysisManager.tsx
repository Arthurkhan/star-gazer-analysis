
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { analyzeAndUpdateTable } from "@/utils/ai/tableUpdater";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

// Define a union type for valid table names
type TableName = "L'Envol Art Space" | "The Little Prince Cafe" | "Vol de Nuit, The Hidden Bar";

interface TableAnalysisManagerProps {
  tableName: TableName;
  onComplete?: () => void;
}

export function TableAnalysisManager({ tableName, onComplete }: TableAnalysisManagerProps) {
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [totalReviews, setTotalReviews] = useState(0);
  const [processedReviews, setProcessedReviews] = useState(0);
  
  // Start the analysis process
  const startAnalysis = async () => {
    try {
      setIsAnalyzing(true);
      setStatus("loading");
      setProgress(0);
      setMessage("Loading reviews...");
      
      // Get the total count of reviews
      const { count, error: countError } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        throw new Error(`Error getting review count: ${countError.message}`);
      }
      
      const totalCount = count || 0;
      setTotalReviews(totalCount);
      
      if (totalCount === 0) {
        setMessage("No reviews found to analyze");
        setStatus("idle");
        setIsAnalyzing(false);
        return;
      }
      
      // Process in batches
      let processedCount = 0;
      let page = 0;
      
      while (processedCount < totalCount) {
        setMessage(`Fetching batch ${page + 1}...`);
        
        // Fetch a batch of reviews
        const { data: reviews, error } = await supabase
          .from(tableName)
          .select('*')
          .range(page * BATCH_SIZE, (page + 1) * BATCH_SIZE - 1);
        
        if (error) {
          throw new Error(`Error fetching reviews: ${error.message}`);
        }
        
        if (!reviews || reviews.length === 0) {
          break;
        }
        
        setMessage(`Analyzing batch ${page + 1} (${reviews.length} reviews)...`);
        
        // Analyze and update this batch
        const result = await analyzeAndUpdateTable(tableName, reviews);
        
        if (!result.success) {
          toast({
            title: "Warning",
            description: `Some reviews could not be analyzed: ${result.errors.join(", ")}`,
            variant: "destructive",
          });
        }
        
        // Update progress
        processedCount += reviews.length;
        setProcessedReviews(processedCount);
        setProgress(Math.floor((processedCount / totalCount) * 100));
        
        page++;
      }
      
      setMessage(`Analysis complete. Processed ${processedCount} reviews.`);
      setStatus("success");
      
      toast({
        title: "Analysis Complete",
        description: `Successfully analyzed and updated ${processedCount} reviews in "${tableName}"`,
      });
      
      // Call onComplete callback if provided
      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error("Error during analysis:", error);
      setStatus("error");
      setMessage(`Error: ${error.message}`);
      
      toast({
        title: "Analysis Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // Add the missing constant
  const BATCH_SIZE = 50;
  
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>AI Analysis for {tableName}</CardTitle>
        <CardDescription>
          Analyze reviews to fill sentiment, staff mentions, and main themes columns
        </CardDescription>
      </CardHeader>
      <CardContent>
        {status === "loading" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{message}</span>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-gray-500">
              Processed {processedReviews} of {totalReviews} reviews ({progress}%)
            </p>
          </div>
        )}
        
        {status === "success" && (
          <div className="flex items-start gap-2 text-green-600">
            <CheckCircle className="h-5 w-5 mt-0.5" />
            <div>
              <p className="font-medium">Analysis Complete</p>
              <p className="text-sm text-gray-600">{message}</p>
            </div>
          </div>
        )}
        
        {status === "error" && (
          <div className="flex items-start gap-2 text-red-600">
            <AlertCircle className="h-5 w-5 mt-0.5" />
            <div>
              <p className="font-medium">Analysis Failed</p>
              <p className="text-sm text-gray-600">{message}</p>
            </div>
          </div>
        )}
        
        {status === "idle" && (
          <p className="text-sm text-gray-500">
            This will analyze all reviews in the "{tableName}" table and update the sentiment, 
            staffMentioned, and mainThemes columns. This process uses AI and may take several minutes.
          </p>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={startAnalysis} 
          disabled={isAnalyzing}
          className="w-full"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            "Start Analysis"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
