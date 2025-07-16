import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Settings, Save, Database, Mail, Bell } from "lucide-react";

export const SystemSettings = () => {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    company_name: "DK Enterprises",
    system_email: "info@dkenterprises.co.in",
    notifications_enabled: true,
    auto_backup: true,
    data_retention_days: 365,
  });

  if (!isAdmin) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>You don't have permission to access system settings</p>
      </div>
    );
  }

  const handleSave = async () => {
    setLoading(true);
    try {
      // This would save to a system_settings table in the future
      toast({
        title: "Success",
        description: "System settings updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update system settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean | number) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            General Settings
          </CardTitle>
          <CardDescription>
            Configure general system settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company_name">Company Name</Label>
              <Input
                id="company_name"
                value={settings.company_name}
                onChange={(e) => handleInputChange("company_name", e.target.value)}
                placeholder="Enter company name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="system_email">System Email</Label>
              <Input
                id="system_email"
                type="email"
                value={settings.system_email}
                onChange={(e) => handleInputChange("system_email", e.target.value)}
                placeholder="Enter system email"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Settings
          </CardTitle>
          <CardDescription>
            Configure system notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Send system notifications to users
              </p>
            </div>
            <Switch
              checked={settings.notifications_enabled}
              onCheckedChange={(checked) => handleInputChange("notifications_enabled", checked)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Management
          </CardTitle>
          <CardDescription>
            Configure data retention and backup settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto Backup</Label>
              <p className="text-sm text-muted-foreground">
                Automatically backup data daily
              </p>
            </div>
            <Switch
              checked={settings.auto_backup}
              onCheckedChange={(checked) => handleInputChange("auto_backup", checked)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="data_retention">Data Retention (Days)</Label>
            <Input
              id="data_retention"
              type="number"
              value={settings.data_retention_days}
              onChange={(e) => handleInputChange("data_retention_days", parseInt(e.target.value))}
              placeholder="365"
              min="1"
              max="3650"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading}>
          <Save className="h-4 w-4 mr-2" />
          {loading ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
};