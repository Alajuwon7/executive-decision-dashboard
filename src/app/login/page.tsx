"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    login(email);
    router.push("/dashboard");
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
          <p className="text-sm text-text-muted mt-1">Sign in to your dashboard</p>
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
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit" className="w-full" isLoading={isLoading}>
            Sign In
          </Button>
        </form>

        <p className="text-xs text-text-faint text-center mt-4">
          Phase 1: Mock auth — any credentials accepted
        </p>
      </div>
    </div>
  );
}
