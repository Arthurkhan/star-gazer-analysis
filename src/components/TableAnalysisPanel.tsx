
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TableAnalysisManager } from "@/components/TableAnalysisManager";
import { AlertCircle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { ApiKeyStatus } from "@/components/ApiKeyStatus";

export function TableAnalysisPanel() {
  const [activeTab, setActiveTab] = useState("lenvol");
  
  return (
    <Card className="shadow-md dark:bg-gray-800 border-0">
      <CardHeader>
        <CardTitle>AI Review Table Analysis</CardTitle>
        <CardDescription>
          Fill sentiment, staff mentions, and main themes columns with AI analysis
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ApiKeyStatus />
        
        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>About this feature</AlertTitle>
          <AlertDescription>
            This tool will analyze all reviews in the selected table and fill in the new sentiment, staffMentioned, and 
            mainThemes columns. The process may take several minutes depending on the number of reviews.
          </AlertDescription>
        </Alert>
        
        <Tabs defaultValue="lenvol" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="lenvol">L'Envol Art Space</TabsTrigger>
            <TabsTrigger value="prince">The Little Prince Cafe</TabsTrigger>
            <TabsTrigger value="voldenuit">Vol de Nuit, The Hidden Bar</TabsTrigger>
          </TabsList>
          
          <TabsContent value="lenvol">
            <TableAnalysisManager tableName="L'Envol Art Space" />
          </TabsContent>
          
          <TabsContent value="prince">
            <TableAnalysisManager tableName="The Little Prince Cafe" />
          </TabsContent>
          
          <TabsContent value="voldenuit">
            <TableAnalysisManager tableName="Vol de Nuit, The Hidden Bar" />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
