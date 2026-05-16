/**
 * @description
 * The plugin can be configured using the following options:
 */
export interface PluginInitOptions {
  apiUrl: string;
  apiKey: string;
  accountId: string;
  webhookSecret?: string;
}
