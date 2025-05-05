
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { validateModelSystem } from "@/utils/modelValidation";

const ModelSystemValidator: React.FC = () => {
  const [validationResults, setValidationResults] = useState<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } | null>(null);
  
  const [loading, setLoading] = useState(false);
  
  const runValidation = () => {
    setLoading(true);
    try {
      // Run validation
      const results = validateModelSystem();
      setValidationResults(results);
    } catch (error) {
      console.error("Error running validation:", error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    // Run validation on mount
    runValidation();
  }, []);
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Model System Validation</span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={runValidation}
            disabled={loading}
          >
            {loading ? "Running..." : "Run Validation"}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {validationResults ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span>System Status:</span>
              {validationResults.isValid ? (
                <span className="flex items-center text-green-500">
                  <CheckCircle className="h-5 w-5 mr-1" /> Valid
                </span>
              ) : (
                <span className="flex items-center text-red-500">
                  <XCircle className="h-5 w-5 mr-1" /> Invalid
                </span>
              )}
            </div>
            
            {validationResults.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertTitle>Validation Errors</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    {validationResults.errors.map((error, i) => (
                      <li key={i}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            
            {validationResults.warnings.length > 0 && (
              <Alert variant="default" className="bg-yellow-50 border-yellow-200">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertTitle className="text-yellow-800">Warnings</AlertTitle>
                <AlertDescription className="text-yellow-700">
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    {validationResults.warnings.map((warning, i) => (
                      <li key={i}>{warning}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            
            {validationResults.isValid && validationResults.warnings.length === 0 && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">All Good!</AlertTitle>
                <AlertDescription className="text-green-700">
                  The model system is properly configured and consistent.
                </AlertDescription>
              </Alert>
            )}
          </div>
        ) : (
          <div className="flex justify-center">
            <span>Run validation to see results</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ModelSystemValidator;
