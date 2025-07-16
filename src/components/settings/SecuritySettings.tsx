import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Lock, Shield, Key, LogOut, AlertTriangle } from "lucide-react";

export const SecuritySettings = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const handlePasswordChange = async () => {
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast({
        title: "Error",
        description: "New passwords don't match",
        variant: "destructive",
      });
      return;
    }

    if (passwordForm.new_password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.new_password
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Password updated successfully",
      });

      setPasswordForm({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
    } catch (error) {
      console.error("Error updating password:", error);
      toast({
        title: "Error",
        description: "Failed to update password",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOutAllSessions = async () => {
    try {
      await supabase.auth.signOut({ scope: 'global' });
      toast({
        title: "Success",
        description: "Signed out from all devices",
      });
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        title: "Error",
        description: "Failed to sign out from all devices",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Change Password
          </CardTitle>
          <CardDescription>
            Update your account password
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current_password">Current Password</Label>
            <Input
              id="current_password"
              type="password"
              value={passwordForm.current_password}
              onChange={(e) => setPasswordForm(prev => ({ ...prev, current_password: e.target.value }))}
              placeholder="Enter current password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new_password">New Password</Label>
            <Input
              id="new_password"
              type="password"
              value={passwordForm.new_password}
              onChange={(e) => setPasswordForm(prev => ({ ...prev, new_password: e.target.value }))}
              placeholder="Enter new password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm_password">Confirm New Password</Label>
            <Input
              id="confirm_password"
              type="password"
              value={passwordForm.confirm_password}
              onChange={(e) => setPasswordForm(prev => ({ ...prev, confirm_password: e.target.value }))}
              placeholder="Confirm new password"
            />
          </div>
          <Button 
            onClick={handlePasswordChange} 
            disabled={loading || !passwordForm.new_password || !passwordForm.confirm_password}
          >
            <Lock className="h-4 w-4 mr-2" />
            {loading ? "Updating..." : "Update Password"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Account Security
          </CardTitle>
          <CardDescription>
            Manage your account security settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Two-Factor Authentication</Label>
                <p className="text-sm text-muted-foreground">
                  Add an extra layer of security to your account
                </p>
              </div>
              <Switch disabled />
            </div>
            <p className="text-xs text-muted-foreground">
              Two-factor authentication will be available in future updates
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LogOut className="h-5 w-5" />
            Session Management
          </CardTitle>
          <CardDescription>
            Manage your active sessions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Current Session</Label>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">This Device</p>
                <p className="text-sm text-muted-foreground">
                  Last active: Now • {user?.email}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={signOut}>
                Sign Out
              </Button>
            </div>
          </div>
          <Button 
            variant="destructive" 
            onClick={handleSignOutAllSessions}
            className="w-full"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out From All Devices
          </Button>
        </CardContent>
      </Card>

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible actions that affect your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border border-destructive rounded-lg">
              <h4 className="font-medium text-destructive mb-2">Delete Account</h4>
              <p className="text-sm text-muted-foreground mb-3">
                This action cannot be undone. This will permanently delete your account and all associated data.
              </p>
              <Button variant="destructive" disabled>
                Delete Account
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Account deletion will be available in future updates
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};