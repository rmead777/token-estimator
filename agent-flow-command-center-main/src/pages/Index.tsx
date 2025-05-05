
// Update this page (the content is just a fallback if you fail to update the page)
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => setUser(session?.user ?? null)
    );
    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to Your Blank App</h1>
        <p className="text-xl text-gray-600 mb-8">Start building your amazing project here!</p>
        {!user && (
          <Button onClick={() => navigate("/auth")}>Sign In / Sign Up</Button>
        )}
        {user && (
          <Button
            variant="destructive"
            onClick={async () => {
              await supabase.auth.signOut();
              setUser(null);
            }}
          >
            Sign Out
          </Button>
        )}
      </div>
    </div>
  );
};

export default Index;
