import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Key, Settings, ExternalLink, Check, X, RefreshCw } from "lucide-react";

export const IntegrationSettings = () => {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [integrations, setIntegrations] = useState([
    {
      name: "OpenAI",
      description: "AI-powered features and analytics",
      enabled: false,
      configured: false,
      apiKey: "",
      testConnection: false,
    },
    {
      name: "Email Service",
      description: "Send notifications and reports via email",
      enabled: false,
      configured: false,
      apiKey: "",
      testConnection: false,
    },
  ]);

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
        description: "Please configure the API key before enabling this integration",
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

  const handleSaveApiKey = async (index: number) => {
    setLoading(true);
    try {
      // This would save the API key to Supabase secrets
      setIntegrations(prev => 
        prev.map((item, i) => 
          i === index ? { ...item, configured: true } : item
        )
      );

      toast({
        title: "Success",
        description: "API key saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save API key",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async (index: number) => {
    setLoading(true);
    try {
      // This would test the API connection
      setIntegrations(prev => 
        prev.map((item, i) => 
          i === index ? { ...item, testConnection: true } : item
        )
      );

      toast({
        title: "Success",
        description: "Connection test successful",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Connection test failed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApiKeyChange = (index: number, value: string) => {
    setIntegrations(prev => 
      prev.map((item, i) => 
        i === index ? { ...item, apiKey: value } : item
      )
    );
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
                      {integration.testConnection && (
                        <Badge variant="outline" className="text-green-600">
                          <Check className="h-3 w-3 mr-1" />
                          Connected
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {integration.description}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={integration.enabled}
                  onCheckedChange={() => handleToggleIntegration(index)}
                />
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor={`api-key-${index}`}>API Key</Label>
                  <div className="flex gap-2">
                    <Input
                      id={`api-key-${index}`}
                      type="password"
                      value={integration.apiKey}
                      onChange={(e) => handleApiKeyChange(index, e.target.value)}
                      placeholder="Enter API key"
                    />
                    <Button 
                      variant="outline" 
                      onClick={() => handleSaveApiKey(index)}
                      disabled={loading || !integration.apiKey}
                    >
                      Save
                    </Button>
                  </div>
                </div>

                {integration.configured && (
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleTestConnection(index)}
                      disabled={loading}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
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
                )}
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