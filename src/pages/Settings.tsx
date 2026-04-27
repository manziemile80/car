import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Bell, Shield, Database, MessageSquare } from 'lucide-react';

export default function Settings() {
  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Settings</h1>
          <p className="mt-1 text-sm sm:text-base text-muted-foreground">
            Configure system preferences and notifications
          </p>
        </div>

        {/* Settings Sections */}
        <div className="grid gap-6">
          {/* Notifications */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Bell className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Notifications</CardTitle>
                  <CardDescription>Configure SMS and email notification settings</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="sms-notifications">SMS Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Send SMS to parents when scores are updated
                  </p>
                </div>
                <Switch id="sms-notifications" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email-notifications">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Send email summaries to parents weekly
                  </p>
                </div>
                <Switch id="email-notifications" />
              </div>
            </CardContent>
          </Card>

          {/* SMS Gateway */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10">
                  <MessageSquare className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  <CardTitle>SMS Gateway</CardTitle>
                  <CardDescription>Configure your SMS provider (Twilio / Africa's Talking)</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
                <p>
                  SMS gateway integration requires API keys. Please configure your SMS provider
                  credentials to enable parent notifications.
                </p>
                <p className="mt-2">
                  Supported providers: <strong>Twilio</strong>, <strong>Africa's Talking</strong>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                  <Shield className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <CardTitle>Security</CardTitle>
                  <CardDescription>Manage security and access settings</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="two-factor">Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">
                    Require 2FA for admin accounts
                  </p>
                </div>
                <Switch id="two-factor" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="session-timeout">Session Timeout</Label>
                  <p className="text-sm text-muted-foreground">
                    Auto-logout after 30 minutes of inactivity
                  </p>
                </div>
                <Switch id="session-timeout" defaultChecked />
              </div>
            </CardContent>
          </Card>

          {/* Database */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10">
                  <Database className="h-5 w-5 text-info" />
                </div>
                <div>
                  <CardTitle>Database</CardTitle>
                  <CardDescription>Database information and maintenance</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Database Name</span>
                  <span className="font-medium">conduct</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span className="inline-flex items-center gap-1 text-success font-medium">
                    <span className="h-2 w-2 rounded-full bg-success" />
                    Connected
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Provider</span>
                  <span className="font-medium">Lovable Cloud</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
