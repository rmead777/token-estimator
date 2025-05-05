
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import APIKeyForm from "./api-keys/APIKeyForm";
import APIKeyList from "./api-keys/APIKeyList";

interface APIKey {
  id: string;
  provider: string;
  model: string;
  created_at: string;
}

const APIKeysPage = () => {
  const [apiKeys, setAPIKeys] = useState<APIKey[]>([]);
  const [loading, setLoading] = useState(true); // Start with loading true
  const [userId, setUserId] = useState<string | null>(null);

  // Get current user on component mount
  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUserId = session?.user?.id;
      setUserId(currentUserId);

      if (currentUserId) {
        fetchAPIKeys(currentUserId);
      } else {
        setLoading(false); // No authenticated user, so stop loading
        toast({
          title: "Authentication Required",
          description: "Please sign in to manage your API keys",
          variant: "destructive",
        });
      }
    };
    getUser();
  }, []);

  // Set up auth state listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const newUserId = session?.user?.id;
        setUserId(newUserId);

        if (newUserId) {
          fetchAPIKeys(newUserId);
        } else {
          setAPIKeys([]);
          setLoading(false); // No user after auth change, stop loading
        }
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  // Fetch existing API keys with model information
  const fetchAPIKeys = async (uid?: string) => {
    const user = uid ?? userId;
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      console.log(`Fetching API keys for user: ${user}`);
      const { data, error } = await supabase
        .from("api_keys")
        .select("id, provider, model, created_at")
        .eq("user_id", user);

      if (error) throw error;
      console.log(`Retrieved ${data?.length || 0} API keys:`, data);
      setAPIKeys(data || []);
    } catch (error: any) {
      console.error("Error fetching API keys:", error);
      toast({
        title: "Error fetching API keys",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Add API key with model support
  const handleAddAPIKey = async (
    provider: string,
    model: string,
    apiKey: string
  ) => {
    if (!userId) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to add API keys",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("api_keys").upsert(
        {
          user_id: userId,
          provider: provider,
          model: model,
          api_key: apiKey,
          model_config: {},
        },
        {
          onConflict: "user_id,provider,model",
        }
      );

      if (error) throw error;

      toast({
        title: "API Key Saved",
        description: `API key for ${provider} - ${model} saved.`,
      });
      fetchAPIKeys(); // Refresh the list after adding
    } catch (error: any) {
      toast({
        title: "Error Saving API Key",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Enhance delete to support model-specific keys
  const handleDeleteAPIKey = async (provider: string, model: string) => {
    if (!userId) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("api_keys")
        .delete()
        .eq("user_id", userId)
        .eq("provider", provider)
        .eq("model", model);

      if (error) throw error;

      toast({
        title: "API Key Deleted",
        description: `${provider} - ${model} API key removed.`,
      });
      fetchAPIKeys(); // Refresh the list after deletion
    } catch (error: any) {
      toast({
        title: "Error Deleting API Key",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!userId) {
    return (
      <div className="max-w-2xl mx-auto mt-10 px-4 text-center">
        <h1 className="text-3xl font-bold mb-6">Manage API Keys</h1>
        <Card>
          <CardContent className="pt-6">
            <p className="text-lg mb-4">
              You need to be signed in to manage your API keys.
            </p>
            <button
              className="bg-primary text-white rounded px-4 py-2 mt-2"
              onClick={() => (window.location.href = "/auth")}
            >
              Sign In
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto mt-10 px-4">
      <h1 className="text-3xl font-bold mb-6">Manage API Keys</h1>

      <APIKeyForm
        loading={loading}
        apiKeys={apiKeys}
        onSubmit={handleAddAPIKey}
      />

      <APIKeyList
        apiKeys={apiKeys}
        loading={loading}
        onDelete={handleDeleteAPIKey}
      />
    </div>
  );
};

export default APIKeysPage;
