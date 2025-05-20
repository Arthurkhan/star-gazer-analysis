import { useState } from 'react';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { AISettingsPanel } from '@/components/AISettingsPanel';
import { DatabaseTableInspector } from '@/components/DatabaseTableInspector';
import { DatabaseMigration } from '@/components/DatabaseMigration';
import { Button } from '@/components/ui/button';
import { 
  Settings, 
  Database, 
  Bot, 
  RefreshCw 
} from 'lucide-react';
import { clearAllCaches } from '@/services/reviewDataService';
import { clearCaches } from '@/utils/reviewDataUtils';
import { useToast } from '@/hooks/use-toast';

export function SettingsPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  const handleClearCache = async () => {
    setIsRefreshing(true);
    try {
      // Clear caches
      clearAllCaches();
      clearCaches();
      
      toast({
        title: 'Caches Cleared',
        description: 'All data caches have been cleared. Reload the dashboard to fetch fresh data.',
        variant: 'default',
      });
    } catch (error) {
      console.error('Error clearing caches:', error);
      toast({
        title: 'Error Clearing Caches',
        description: 'There was an error clearing the caches.',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8" />
          Settings
        </h1>
        <Button 
          onClick={handleClearCache} 
          variant="outline"
          disabled={isRefreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Clear Data Cache
        </Button>
      </div>
      
      <Tabs defaultValue="ai" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="ai" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            AI Settings
          </TabsTrigger>
          <TabsTrigger value="database" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Database
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="ai" className="mt-6">
          <AISettingsPanel />
        </TabsContent>
        
        <TabsContent value="database" className="mt-6 space-y-6">
          <DatabaseMigration />
          <DatabaseTableInspector />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default SettingsPage;