
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";

const AuthPage = () => {
  const [view, setView] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  // Listen to auth changes and redirect if logged in
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          toast({ title: "Signed in successfully", variant: "default" });
          navigate("/");
        }
      }
    );
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) navigate("/");
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (view === "sign-in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast({ title: "Error signing in", description: error.message, variant: "destructive" });
      }
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        toast({ title: "Error signing up", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Signed up successfully! Check your email for verification." });
        setView("sign-in");
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{view === "sign-in" ? "Sign In" : "Sign Up"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              type="email"
              placeholder="Email"
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              disabled={loading}
            />
            <Input
              type="password"
              placeholder="Password"
              autoComplete={view === "sign-in" ? "current-password" : "new-password"}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              disabled={loading}
            />
            <Button type="submit" disabled={loading}>
              {loading
                ? view === "sign-in" ? "Signing in..." : "Signing up..."
                : view === "sign-in" ? "Sign In" : "Sign Up"}
            </Button>
          </form>
          <div className="mt-4 text-center">
            {view === "sign-in" ? (
              <>
                <span>Don't have an account? </span>
                <button
                  type="button"
                  className="text-blue-500 hover:underline"
                  onClick={() => setView("sign-up")}
                  disabled={loading}
                >
                  Sign Up
                </button>
              </>
            ) : (
              <>
                <span>Already have an account? </span>
                <button
                  type="button"
                  className="text-blue-500 hover:underline"
                  onClick={() => setView("sign-in")}
                  disabled={loading}
                >
                  Sign In
                </button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;
