
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface APIKey {
  id: string;
  provider: string;
  model: string;
  created_at: string;
}

interface Props {
  apiKeys: APIKey[];
  loading: boolean;
  onDelete: (provider: string, model: string) => void;
}

const APIKeyList: React.FC<Props> = ({ apiKeys, loading, onDelete }) => {
  console.log("Rendering API Keys list:", apiKeys);
  
  if (loading) {
    return (
      <div className="text-center mt-4 p-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
        <p>Loading your API keys...</p>
      </div>
    );
  }
  
  if (apiKeys.length === 0) {
    return (
      <div className="text-gray-500 text-center mt-4 p-4 border border-dashed rounded-lg border-gray-600">
        <p className="mb-1">No API keys added yet</p>
        <p className="text-sm">Add an API key above to connect to AI providers</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-4">
      <h2 className="text-xl font-semibold mb-2">Your API Keys</h2>
      {apiKeys.map((key) => (
        <Card key={key.id} className="flex justify-between items-center p-4">
          <div>
            <CardHeader className="p-0 pb-2">
              <CardTitle className="text-lg">
                {key.provider} - {key.model}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 text-sm text-gray-500">
              Key added on {new Date(key.created_at).toLocaleString()}
            </CardContent>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(key.provider, key.model)}
            disabled={loading}
          >
            Delete
          </Button>
        </Card>
      ))}
    </div>
  );
};

export default APIKeyList;
