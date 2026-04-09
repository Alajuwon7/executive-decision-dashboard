"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { login, signUp } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }
    setIsLoading(true);
    try {
      if (mode === "signup") {
        await signUp(email, password);
        toast.success("Account created! Check your email to confirm, then sign in.");
        setMode("login");
      } else {
        await login(email, password);
        router.push("/dashboard");
      }
    } catch (err: any) {
      toast.error(err.message ?? "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-accent to-accent-hover rounded-[12px] flex items-center justify-center mx-auto mb-4">
            <span className="text-bg font-bold text-lg">ED</span>
          </div>
          <h1 className="text-xl font-bold text-text-primary">
            Executive Decision Intelligence
          </h1>
          <p className="text-sm text-text-muted mt-1">
            {mode === "login" ? "Sign in to your dashboard" : "Create your account"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-card p-6 space-y-4">
          <Input
            label="Email"
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Password"
            type="password"
            placeholder={mode === "signup" ? "Create a password (min 6 chars)" : "Enter password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit" className="w-full" isLoading={isLoading}>
            {mode === "login" ? "Sign In" : "Create Account"}
          </Button>
        </form>

        <p className="text-xs text-text-muted text-center mt-4">
          {mode === "login" ? (
            <>
              Don&apos;t have an account?{" "}
              <button onClick={() => setMode("signup")} className="text-accent hover:underline">
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button onClick={() => setMode("login")} className="text-accent hover:underline">
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
