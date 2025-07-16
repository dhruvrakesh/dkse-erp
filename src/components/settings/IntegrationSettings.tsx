import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Key, Settings, ExternalLink, Check, X, RefreshCw, AlertCircle } from "lucide-react";

export const IntegrationSettings = () => {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [integrations, setIntegrations] = useState([
    {
      id: "openai",
      name: "OpenAI",
      description: "AI-powered features and analytics",
      enabled: false,
      configured: false,
      lastTested: null as Date | null,
      connectionStatus: null as boolean | null,
    },
    {
      id: "email",
      name: "Email Service", 
      description: "Send notifications and reports via email",
      enabled: false,
      configured: false,
      lastTested: null as Date | null,
      connectionStatus: null as boolean | null,
    },
  ]);

  useEffect(() => {
    checkApiStatus();
  }, []);

  const checkApiStatus = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('check-api-status');
      if (error) throw error;
      
      setIntegrations(prev => prev.map(integration => ({
        ...integration,
        configured: data[integration.id]?.configured || false,
      })));
    } catch (error) {
      console.error('Error checking API status:', error);
    }
  };

  if (!isAdmin) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>You don't have permission to manage integrations</p>
      </div>
    );
  }

  const handleToggleIntegration = async (index: number) => {
    const integration = integrations[index];
    
    if (!integration.configured && !integration.enabled) {
      toast({
        title: "Configuration Required",
        description: `${integration.name} API is not configured in the system`,
        variant: "destructive",
      });
      return;
    }

    setIntegrations(prev => 
      prev.map((item, i) => 
        i === index ? { ...item, enabled: !item.enabled } : item
      )
    );

    toast({
      title: "Success",
      description: `${integration.name} integration ${integration.enabled ? "disabled" : "enabled"}`,
    });
  };

  const handleTestConnection = async (index: number) => {
    const integration = integrations[index];
    setTesting(integration.id);
    
    try {
      const { data, error } = await supabase.functions.invoke('test-api-connection', {
        body: { service: integration.id }
      });
      
      if (error) throw error;

      setIntegrations(prev => 
        prev.map((item, i) => 
          i === index ? { 
            ...item, 
            connectionStatus: data.success,
            lastTested: new Date()
          } : item
        )
      );

      toast({
        title: data.success ? "Success" : "Connection Failed",
        description: data.message,
        variant: data.success ? "default" : "destructive",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to test connection",
        variant: "destructive",
      });
    } finally {
      setTesting(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            API Integrations
          </CardTitle>
          <CardDescription>
            Configure external service integrations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {integrations.map((integration, index) => (
            <div key={integration.name} className="space-y-4 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{integration.name}</h4>
                      <Badge variant={integration.configured ? "default" : "secondary"}>
                        {integration.configured ? "Configured" : "Not Configured"}
                      </Badge>
                       {integration.connectionStatus === true && (
                         <Badge variant="outline" className="text-green-600">
                           <Check className="h-3 w-3 mr-1" />
                           Connected
                         </Badge>
                       )}
                       {integration.connectionStatus === false && (
                         <Badge variant="outline" className="text-red-600">
                           <X className="h-3 w-3 mr-1" />
                           Failed
                         </Badge>
                       )}
                    </div>
                     <p className="text-sm text-muted-foreground">
                       {integration.description}
                     </p>
                     {integration.lastTested && (
                       <p className="text-xs text-muted-foreground">
                         Last tested: {integration.lastTested.toLocaleString()}
                       </p>
                     )}
                   </div>
                 </div>
                 <Switch
                   checked={integration.enabled}
                   onCheckedChange={() => handleToggleIntegration(index)}
                 />
               </div>

               <div className="space-y-3">
                 {!integration.configured && (
                   <div className="flex items-center gap-2 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                     <AlertCircle className="h-4 w-4 text-orange-600" />
                     <p className="text-sm text-orange-800 dark:text-orange-200">
                       This integration is not configured in the system. Contact an administrator to set up the API key.
                     </p>
                   </div>
                 )}
                 
                 <div className="flex gap-2">
                   <Button 
                     variant="outline" 
                     size="sm"
                     onClick={() => handleTestConnection(index)}
                     disabled={!integration.configured || testing === integration.id}
                   >
                     <RefreshCw className={`h-4 w-4 mr-2 ${testing === integration.id ? 'animate-spin' : ''}`} />
                     Test Connection
                   </Button>
                   <Button 
                     variant="outline" 
                     size="sm"
                     onClick={() => window.open(`https://docs.${integration.name.toLowerCase()}.com`, '_blank')}
                   >
                     <ExternalLink className="h-4 w-4 mr-2" />
                     Documentation
                   </Button>
                 </div>
               </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Integration Settings
          </CardTitle>
          <CardDescription>
            Configure how integrations work with your system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable API Rate Limiting</Label>
              <p className="text-sm text-muted-foreground">
                Automatically limit API calls to prevent quota exceeded errors
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Log API Requests</Label>
              <p className="text-sm text-muted-foreground">
                Keep logs of API requests for debugging purposes
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Webhook Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Send notifications when integrations fail or succeed
              </p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};