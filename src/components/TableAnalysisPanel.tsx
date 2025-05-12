
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TableAnalysisManager } from "@/components/TableAnalysisManager";
import { AlertCircle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { ApiKeyStatus } from "@/components/ApiKeyStatus";

// Define types for table names to ensure type safety
export type TableName = "L'Envol Art Space" | "The Little Prince Cafe" | "Vol de Nuit, The Hidden Bar";

export function TableAnalysisPanel() {
  const [activeTab, setActiveTab] = useState<TableName>("L'Envol Art Space");
  
  return (
    <Card className="shadow-md dark:bg-gray-800 border-0">
      <CardHeader>
        <CardTitle>AI Review Analysis</CardTitle>
        <CardDescription>
          Analyze sentiment, staff mentions, and main themes from existing columns
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ApiKeyStatus />
        
        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>About this feature</AlertTitle>
          <AlertDescription>
            This tool analyzes the reviews from the selected table using the data already filled in the 
            sentiment, staffMentioned, and mainThemes columns. It provides insights and visualizations 
            based on the existing data.
          </AlertDescription>
        </Alert>
        
        <Tabs defaultValue="lenvol" value={activeTab} onValueChange={(value) => setActiveTab(value as TableName)}>
          <TabsList className="mb-4">
            <TabsTrigger value="L'Envol Art Space">L'Envol Art Space</TabsTrigger>
            <TabsTrigger value="The Little Prince Cafe">The Little Prince Cafe</TabsTrigger>
            <TabsTrigger value="Vol de Nuit, The Hidden Bar">Vol de Nuit, The Hidden Bar</TabsTrigger>
          </TabsList>
          
          <TabsContent value="L'Envol Art Space">
            <TableAnalysisManager tableName="L'Envol Art Space" />
          </TabsContent>
          
          <TabsContent value="The Little Prince Cafe">
            <TableAnalysisManager tableName="The Little Prince Cafe" />
          </TabsContent>
          
          <TabsContent value="Vol de Nuit, The Hidden Bar">
            <TableAnalysisManager tableName="Vol de Nuit, The Hidden Bar" />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
