import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/store/appStore";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Eye, EyeOff, Loader2, Warehouse } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAppStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    general?: string;
  }>({});

  const validate = () => {
    const errs: typeof errors = {};
    if (!email) errs.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = "Enter a valid email";
    if (!password) errs.password = "Password is required";
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setLoading(true);
    // Simulate network delay
    await new Promise((r) => setTimeout(r, 600));
    const result = login(email, password);
    setLoading(false);
    if (!result.success) {
      setErrors({ general: result.error });
      return;
    }
    const user = useAppStore.getState().currentUser;
    toast.success(`Welcome back, ${user?.name}!`);
    if (user?.role === "ADMIN") {
      navigate({ to: "/admin" });
    } else {
      navigate({ to: "/portal" });
    }
  };

  const fillDemo = (type: "admin" | "alice" | "bob" | "carol") => {
    const demos = {
      admin: { email: "admin@storage.com", password: "Admin1234!" },
      alice: { email: "alice@example.com", password: "Customer1!" },
      bob: { email: "bob@example.com", password: "Customer1!" },
      carol: { email: "carol@example.com", password: "Customer1!" },
    };
    setEmail(demos[type].email);
    setPassword(demos[type].password);
    setErrors({});
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 bg-primary flex-col justify-between p-12 relative overflow-hidden">
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 60px, rgba(255,255,255,0.15) 60px, rgba(255,255,255,0.15) 61px), repeating-linear-gradient(90deg, transparent, transparent 60px, rgba(255,255,255,0.15) 60px, rgba(255,255,255,0.15) 61px)",
          }}
        />
        <div className="relative">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
              <Warehouse className="w-5 h-5 text-accent-foreground" />
            </div>
            <span className="font-bold font-display text-primary-foreground text-xl">
              Country Lane Storage
            </span>
          </Link>
        </div>
        <div className="relative">
          <h2 className="text-4xl font-bold font-display text-primary-foreground mb-4 leading-tight">
            Manage your storage,
            <br />
            <span className="text-accent">anywhere.</span>
          </h2>
          <p className="text-primary-foreground/65 text-lg leading-relaxed">
            Access your account, pay invoices, and manage your leases all in one
            place.
          </p>
        </div>
        <div className="relative text-primary-foreground/40 text-sm">
          © {new Date().getFullYear()} Country Lane Storage · Springfield, IL
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 flex flex-col items-center">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mb-3">
              <Warehouse className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-bold font-display text-foreground text-xl">
              Country Lane Storage
            </span>
          </div>

          <Link
            to="/"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>

          <h1 className="text-2xl font-bold font-display text-foreground mb-2">
            Sign in to your account
          </h1>
          <p className="text-muted-foreground text-sm mb-8">
            Enter your credentials to access the portal.
          </p>

          {/* Demo login shortcuts */}
          <div className="bg-muted/50 rounded-xl p-4 mb-6 border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Demo Accounts
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                { label: "Admin", type: "admin" as const },
                { label: "Alice", type: "alice" as const },
                { label: "Bob", type: "bob" as const },
                { label: "Carol", type: "carol" as const },
              ].map((d) => (
                <button
                  type="button"
                  key={d.type}
                  onClick={() => fillDemo(d.type)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-background border hover:bg-accent hover:text-accent-foreground hover:border-accent transition-colors font-medium"
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.general && (
              <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg px-4 py-3 text-sm">
                {errors.general}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={errors.email ? "border-destructive" : ""}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={
                    errors.password ? "border-destructive pr-10" : "pr-10"
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full font-semibold"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in…
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Don't have an account?{" "}
            <button
              type="button"
              className="text-foreground font-medium cursor-pointer hover:underline"
              onClick={() =>
                toast.info("Contact our office to create a new account.")
              }
            >
              Contact us to get started
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
