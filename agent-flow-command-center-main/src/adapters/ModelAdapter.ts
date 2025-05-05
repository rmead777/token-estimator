
export interface ModelAdapter {
  modelName: string;
  providerName: string;
  supportedFeatures: string[];
  
  /**
   * Build a provider-specific request from standardized input
   */
  buildRequest(input: any, config: any): object;
  
  /**
   * Parse provider-specific response into standardized output
   */
  parseResponse(response: any): any;
  
  /**
   * Validate configuration parameters for this model
   */
  validateConfig(config: any): boolean;
  
  /**
   * Get default configuration parameters for this model
   */
  getDefaultConfig(): object;
}
