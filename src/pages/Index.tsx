
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [supabaseUrl, setSupabaseUrl] = useState("");
  const [supabaseKey, setSupabaseKey] = useState("");
  const [loading, setLoading] = useState(false);

  // Check if credentials already exist
  useEffect(() => {
    const savedUrl = localStorage.getItem("supabaseUrl");
    const savedKey = localStorage.getItem("supabaseKey");
    
    if (savedUrl && savedKey) {
      setSupabaseUrl(savedUrl);
      setSupabaseKey(savedKey);
      
      // Auto-redirect if credentials are saved
      if (localStorage.getItem("autoRedirect") !== "false") {
        navigate("/dashboard");
      }
    }
  }, [navigate]);

  const handleConnect = () => {
    if (!supabaseUrl || !supabaseKey) {
      toast({
        title: "Missing credentials",
        description: "Please enter both Supabase URL and API key",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    // For this demo, we'll just save the credentials to localStorage
    // In a real app, you would validate the connection first
    localStorage.setItem("supabaseUrl", supabaseUrl);
    localStorage.setItem("supabaseKey", supabaseKey);
    localStorage.setItem("autoRedirect", "true");

    // Simulate connection check
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Connected successfully",
        description: "Redirecting to dashboard...",
      });
      navigate("/dashboard");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-center p-4 animate-fade-in">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Google Maps Review Analyzer
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Connect to your Supabase database to analyze your business reviews
          </p>
        </div>

        <Card className="border-0 shadow-lg dark:bg-gray-800">
          <CardContent className="pt-6">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleConnect();
              }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <Label htmlFor="url">Supabase URL</Label>
                <Input
                  id="url"
                  type="text"
                  placeholder="https://your-project-id.supabase.co"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  className="dark:bg-gray-700"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="key">Supabase API Key</Label>
                <Input
                  id="key"
                  type="password"
                  placeholder="Your Supabase API key"
                  value={supabaseKey}
                  onChange={(e) => setSupabaseKey(e.target.value)}
                  className="dark:bg-gray-700"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Use your project's anon/public key
                </p>
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? "Connecting..." : "Connect to Supabase"}
              </Button>
            </form>
          </CardContent>
        </Card>
        
        <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-6">
          Your credentials are stored locally in your browser
        </p>
      </div>
    </div>
  );
};

export default Index;
