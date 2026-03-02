import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info, Settings } from "lucide-react";

export function AdminSettings() {
  return (
    <div>
      <PageHeader title="Settings" description="Application configuration" />
      <div className="max-w-2xl space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-base flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Application Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-800">
              <Info className="w-4 h-4 mt-0.5 shrink-0" />
              <div>
                <strong>Demo Mode Active</strong>
                <p className="mt-1 text-blue-700">
                  This application is running in demo mode with local state. All
                  data is pre-loaded and resets on page refresh (except current
                  login session).
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-base">
              Demo Accounts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {[
                {
                  role: "Admin",
                  email: "admin@storage.com",
                  password: "Admin1234!",
                },
                {
                  role: "Customer",
                  email: "alice@example.com",
                  password: "Customer1!",
                },
                {
                  role: "Customer",
                  email: "bob@example.com",
                  password: "Customer1!",
                },
                {
                  role: "Customer",
                  email: "carol@example.com",
                  password: "Customer1!",
                },
              ].map((u) => (
                <div
                  key={u.email}
                  className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 border"
                >
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded ${u.role === "Admin" ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"}`}
                  >
                    {u.role}
                  </span>
                  <div className="flex-1">
                    <div className="font-medium">{u.email}</div>
                    <div className="text-muted-foreground text-xs">
                      Password: {u.password}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
