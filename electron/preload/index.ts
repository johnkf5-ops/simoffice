/**
 * Preload Script
 * Exposes safe APIs to the renderer process via contextBridge
 */
import { contextBridge, ipcRenderer } from 'electron';

/**
 * IPC renderer methods exposed to the renderer process
 */
const electronAPI = {
  /**
   * IPC invoke (request-response pattern)
   */
  ipcRenderer: {
    invoke: (channel: string, ...args: unknown[]) => {
      const validChannels = [
        // Gateway
        'gateway:status',
        'gateway:isConnected',
        'gateway:start',
        'gateway:stop',
        'gateway:restart',
        'gateway:rpc',
        'gateway:httpProxy',
        'hostapi:fetch',
        'gateway:health',
        'gateway:getControlUiUrl',
        // OpenClaw
        'openclaw:status',
        'openclaw:isReady',
        // Shell
        'shell:openExternal',
        // Dialog
        'dialog:open',
        // App
        'app:version',
        'app:name',
        'app:platform',
        'app:quit',
        'app:relaunch',
        'app:request',
        // Notifications
        'notification:show',
        // Window controls
        'window:minimize',
        'window:maximize',
        'window:close',
        'window:isMaximized',
        // Settings
        'settings:get',
        'settings:set',
        'settings:setMany',
        'settings:getAll',
        'settings:reset',
        'usage:recentTokenHistory',
        // Update
        'update:status',
        'update:version',
        'update:check',
        'update:download',
        'update:install',
        'update:setChannel',
        'update:setAutoDownload',
        // Provider
        'provider:list',
        'provider:get',
        'provider:save',
        'provider:delete',
        'provider:setApiKey',
        'provider:updateWithKey',
        'provider:deleteApiKey',
        'provider:hasApiKey',
        'provider:getApiKey',
        'provider:setDefault',
        'provider:getDefault',
        'provider:validateKey',
        'provider:requestOAuth',
        'provider:cancelOAuth',
        // Cron
        'cron:list',
        'cron:create',
        'cron:update',
        'cron:delete',
        'cron:toggle',
        'cron:trigger',
        // OpenClaw Controls
        'openclawControls:getSnapshot',
        'openclawControls:applyGlobalPatch',
        // Channel Config
        'channel:saveConfig',
        'channel:getConfig',
        'channel:getFormValues',
        'channel:deleteConfig',
        'channel:listConfigured',
        'channel:setEnabled',
        'channel:validate',
        'channel:validateCredentials',
        // WhatsApp
        'channel:requestWhatsAppQr',
        'channel:cancelWhatsAppQr',
        // MoonPay
        'moonpay:login',
        'moonpay:verify',
        'moonpay:check-auth',
        'moonpay:open-url',
        'moonpay:wallet-list',
        'moonpay:wallet-create',
        'moonpay:configure-mcp',
        // ClawHub
        'clawhub:search',
        'clawhub:install',
        'clawhub:uninstall',
        'clawhub:list',
        'clawhub:openSkillReadme',
        // UV
        'uv:check',
        'uv:install-all',
        // Skill config (direct file access)
        'skill:updateConfig',
        'skill:getConfig',
        'skill:getAllConfigs',
        // Logs
        'log:getRecent',
        // File staging & media
        'file:stage',
        'media:getThumbnails',
        // Session management
        'session:delete',
        // License
        'license:get',
        'license:store',
        'license:clear',
        'license:validate',
        'license:portal',
        // Ollama local AI
        'ollama:detect-hardware',
        'ollama:check-status',
        'ollama:get-recommendation',
        'ollama:get-compatible-models',
        'ollama:install',
        'ollama:wait-for-install',
        'ollama:start',
        'ollama:list-models',
        'ollama:pull-model',
        'ollama:delete-model',
        'ollama:show-model',
        'ollama:configure',
        'ollama:preload-model',
        'ollama:check-version',
        'ollama:check-disk-space',
        // Business integrations
        'integration:configure',
        'integration:remove',
        'integration:status',
        'integration:status-all',
        'integration:email-details',
        // Memory plugin
        'memory:status',
        'memory:enable',
        'memory:disable',
      ];

      if (validChannels.includes(channel)) {
        return ipcRenderer.invoke(channel, ...args);
      }

      throw new Error(`Invalid IPC channel: ${channel}`);
    },

    /**
     * Listen for events from main process
     */
    on: (channel: string, callback: (...args: unknown[]) => void) => {
      const validChannels = [
        'gateway:status-changed',
        'gateway:message',
        'gateway:notification',
        'gateway:channel-status',
        'gateway:chat-message',
        'channel:whatsapp-qr',
        'channel:whatsapp-success',
        'channel:whatsapp-error',
        'gateway:exit',
        'gateway:error',
        'navigate',
        'update:status-changed',
        'update:checking',
        'update:available',
        'update:not-available',
        'update:progress',
        'update:downloaded',
        'update:error',
        'cron:updated',
        'oauth:code',
        'oauth:success',
        'oauth:error',
        'openclaw:cli-installed',
        'ollama:pull-progress',
      ];

      if (validChannels.includes(channel)) {
        // Wrap the callback to strip the event
        const subscription = (_event: Electron.IpcRendererEvent, ...args: unknown[]) => {
          callback(...args);
        };
        ipcRenderer.on(channel, subscription);

        // Return unsubscribe function
        return () => {
          ipcRenderer.removeListener(channel, subscription);
        };
      }

      throw new Error(`Invalid IPC channel: ${channel}`);
    },

    /**
     * Listen for a single event from main process
     */
    once: (channel: string, callback: (...args: unknown[]) => void) => {
      const validChannels = [
        'gateway:status-changed',
        'gateway:message',
        'gateway:notification',
        'gateway:channel-status',
        'gateway:chat-message',
        'gateway:exit',
        'gateway:error',
        'navigate',
        'update:status-changed',
        'update:checking',
        'update:available',
        'update:not-available',
        'update:progress',
        'update:downloaded',
        'update:error',
        'oauth:code',
        'oauth:success',
        'oauth:error',
      ];

      if (validChannels.includes(channel)) {
        ipcRenderer.once(channel, (_event, ...args) => callback(...args));
        return;
      }

      throw new Error(`Invalid IPC channel: ${channel}`);
    },

    /**
     * Remove all listeners for a channel
     */
    off: (channel: string, callback?: (...args: unknown[]) => void) => {
      if (callback) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ipcRenderer.removeListener(channel, callback as any);
      } else {
        ipcRenderer.removeAllListeners(channel);
      }
    },
  },

  /**
   * Open external URL in default browser
   */
  openExternal: (url: string) => {
    return ipcRenderer.invoke('shell:openExternal', url);
  },

  /**
   * Get current platform
   */
  platform: process.platform,

  /**
   * Check if running in development
   */
  isDev: process.env.NODE_ENV === 'development' || !!process.env.VITE_DEV_SERVER_URL,
};

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('electron', electronAPI);

// Type declarations for the renderer process
export type ElectronAPI = typeof electronAPI;
