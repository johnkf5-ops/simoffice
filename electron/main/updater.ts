/**
 * Auto-Updater Module
 * Handles automatic application updates using electron-updater.
 *
 * On macOS, Squirrel.Mac (ShipIt) is unreliable — it hangs silently during
 * extraction with no error or callback. Instead, we download the DMG directly
 * with progress tracking, verify its SHA512 hash, and open it for the user
 * to drag-and-drop install.
 *
 * On Windows/Linux, the standard electron-updater flow (NSIS / AppImage) is
 * used unchanged.
 */
import { autoUpdater, UpdateInfo, ProgressInfo } from 'electron-updater';
import { BrowserWindow, app, ipcMain, net, shell } from 'electron';
import { logger } from '../utils/logger';
import { EventEmitter } from 'events';
import { setQuitting } from './app-state';
import { createHash } from 'crypto';
import { createReadStream, createWriteStream, existsSync, mkdirSync, unlinkSync } from 'fs';
import { join } from 'path';


export interface UpdateStatus {
  status: 'idle' | 'checking' | 'available' | 'not-available' | 'downloading' | 'extracting' | 'downloaded' | 'error';
  info?: UpdateInfo;
  progress?: ProgressInfo;
  error?: string;
}

export interface UpdaterEvents {
  'status-changed': (status: UpdateStatus) => void;
  'checking-for-update': () => void;
  'update-available': (info: UpdateInfo) => void;
  'update-not-available': (info: UpdateInfo) => void;
  'download-progress': (progress: ProgressInfo) => void;
  'error': (error: Error) => void;
}

/**
 * Detect the update channel from a semver version string.
 * e.g. "0.1.8-alpha.0" → "alpha", "1.0.0-beta.1" → "beta", "1.0.0" → "latest"
 */
function detectChannel(version: string): string {
  const match = version.match(/-([a-zA-Z]+)/);
  return match ? match[1] : 'latest';
}

export class AppUpdater extends EventEmitter {
  private mainWindow: BrowserWindow | null = null;
  private status: UpdateStatus = { status: 'idle' };

  /** Path to the downloaded DMG (macOS only). */
  private dmgPath: string | null = null;

  constructor() {
    super();

    // EventEmitter treats an unhandled 'error' event as fatal. Keep a default
    // listener so updater failures surface in logs/UI without terminating main.
    this.on('error', (error: Error) => {
      logger.error('[Updater] AppUpdater emitted error:', error);
    });

    autoUpdater.autoDownload = false;

    // On macOS, disable Squirrel auto-install — we download the DMG directly.
    // On Windows/Linux, keep it enabled for the standard NSIS/AppImage flow.
    autoUpdater.autoInstallOnAppQuit = process.platform !== 'darwin';

    autoUpdater.logger = {
      info: (msg: string) => logger.info('[Updater]', msg),
      warn: (msg: string) => logger.warn('[Updater]', msg),
      error: (msg: string) => logger.error('[Updater]', msg),
      debug: (msg: string) => logger.debug('[Updater]', msg),
    };

    const version = app.getVersion();
    const channel = detectChannel(version);

    logger.info(`[Updater] Version: ${version}, channel: ${channel}, platform: ${process.platform}`);

    autoUpdater.channel = channel;

    // Use GitHub Releases for updates
    autoUpdater.setFeedURL({
      provider: 'github',
      owner: 'johnkf5-ops',
      repo: 'simoffice',
    });

    this.setupListeners();
  }

  /**
   * Set the main window for sending update events
   */
  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window;
  }

  /**
   * Get current update status
   */
  getStatus(): UpdateStatus {
    return this.status;
  }

  /**
   * Setup auto-updater event listeners.
   *
   * On macOS we only listen for version-check events. Download progress and
   * completion are managed by our own DMG download pipeline.
   *
   * On Windows/Linux the standard electron-updater download events are used.
   */
  private setupListeners(): void {
    // Version-check events — used on all platforms.
    autoUpdater.on('checking-for-update', () => {
      this.updateStatus({ status: 'checking' });
      this.emit('checking-for-update');
    });

    autoUpdater.on('update-available', (info: UpdateInfo) => {
      this.updateStatus({ status: 'available', info });
      this.emit('update-available', info);
    });

    autoUpdater.on('update-not-available', (info: UpdateInfo) => {
      this.updateStatus({ status: 'not-available', info });
      this.emit('update-not-available', info);
    });

    autoUpdater.on('error', (error: Error) => {
      this.updateStatus({ status: 'error', error: error.message });
      this.emit('error', error);
    });

    // Download events — only relevant on Windows/Linux where electron-updater
    // handles the full download-and-install cycle.
    if (process.platform !== 'darwin') {
      autoUpdater.on('download-progress', (progress: ProgressInfo) => {
        this.updateStatus({ status: 'downloading', progress });
        this.emit('download-progress', progress);
      });

      autoUpdater.on('update-downloaded', () => {
        this.updateStatus({ status: 'downloaded' });
      });
    }
  }

  /**
   * Update status and notify renderer.
   * Merges `info` so that it is not wiped by progress-only updates.
   */
  private updateStatus(newStatus: Partial<UpdateStatus>): void {
    this.status = {
      status: newStatus.status ?? this.status.status,
      info: newStatus.info ?? this.status.info,
      progress: newStatus.progress,
      error: newStatus.error,
    };
    this.sendToRenderer('update:status-changed', this.status);
  }

  /**
   * Send event to renderer process
   */
  private sendToRenderer(channel: string, data: unknown): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(channel, data);
    }
  }

  /**
   * Check for updates.
   * electron-updater automatically tries providers defined in electron-builder.yml in order.
   *
   * In dev mode (not packed), autoUpdater.checkForUpdates() silently returns
   * null without emitting any events, so we must detect this and force a
   * final status so the UI never gets stuck in 'checking'.
   */
  async checkForUpdates(): Promise<UpdateInfo | null> {
    try {
      const result = await autoUpdater.checkForUpdates();

      // In dev mode (app not packaged), autoUpdater silently returns null
      // without emitting ANY events (not even checking-for-update).
      // Detect this and force an error so the UI never stays silent.
      if (result == null) {
        this.updateStatus({
          status: 'error',
          error: 'Update check skipped (dev mode – app is not packaged)',
        });
        return null;
      }

      // Give async events time to settle before applying safety net.
      // electron-updater emits update-available/not-available asynchronously;
      // without this delay the safety net can stomp a valid 'available' status.
      await new Promise((r) => setTimeout(r, 2000));

      // Safety net: if events STILL didn't fire, force a final state.
      if (this.status.status === 'checking' || this.status.status === 'idle') {
        this.updateStatus({ status: 'not-available' });
      }

      return result.updateInfo || null;
    } catch (error) {
      logger.error('[Updater] Check for updates failed:', error);
      this.updateStatus({ status: 'error', error: (error as Error).message || String(error) });
      throw error;
    }
  }

  // ── Download ───────────────────────────────────────────────────────────

  /**
   * Download the available update.
   *
   * macOS: downloads the DMG directly (bypasses Squirrel.Mac entirely).
   * Windows/Linux: delegates to electron-updater's built-in download.
   */
  async downloadUpdate(): Promise<void> {
    if (process.platform === 'darwin') {
      return this.downloadDmgDirect();
    }

    // Windows / Linux — use the standard electron-updater flow.
    await autoUpdater.downloadUpdate();
  }

  /**
   * Find the DMG file entry in UpdateInfo.files that matches the current arch.
   */
  private getDmgFileInfo(info: UpdateInfo): { url: string; sha512: string; size: number } | null {
    const arch = process.arch === 'arm64' ? 'arm64' : 'x64';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const files = (info as any).files as Array<{ url: string; sha512: string; size?: number }> | undefined;
    if (!files) return null;

    // Find the DMG matching this architecture.
    const dmgEntry = files.find(
      (f) => f.url.endsWith('.dmg') && f.url.includes(arch),
    );
    if (!dmgEntry) return null;

    return { url: dmgEntry.url, sha512: dmgEntry.sha512, size: dmgEntry.size ?? 0 };
  }

  /**
   * Download the DMG directly from GitHub Releases with progress tracking.
   * Verifies the SHA512 hash after download. Opens the DMG on completion.
   */
  private async downloadDmgDirect(): Promise<void> {
    const info = this.status.info;
    if (!info?.version) {
      throw new Error('No update version available');
    }

    const arch = process.arch === 'arm64' ? 'arm64' : 'x64';
    const dmgFileInfo = this.getDmgFileInfo(info);

    // Build filename and URL. Prefer info from latest-mac.yml, fall back to convention.
    const filename = dmgFileInfo?.url ?? `SimOffice-${info.version}-mac-${arch}.dmg`;
    const url = `https://github.com/johnkf5-ops/simoffice/releases/download/v${info.version}/${filename}`;
    const expectedSha512 = dmgFileInfo?.sha512 ?? null;
    const expectedSize = dmgFileInfo?.size ?? 0;

    // Prepare destination directory.
    const destDir = join(app.getPath('temp'), 'simoffice-update');
    if (!existsSync(destDir)) {
      mkdirSync(destDir, { recursive: true });
    }
    const destPath = join(destDir, filename);

    logger.info(`[Updater] Downloading DMG: ${url} → ${destPath}`);
    this.updateStatus({ status: 'downloading' });

    // Download with progress tracking.
    await this.downloadFileWithProgress(url, destPath, expectedSize);

    // Verify SHA512 hash.
    if (expectedSha512) {
      logger.info('[Updater] Verifying SHA512 hash...');
      this.updateStatus({ status: 'extracting' }); // repurpose 'extracting' for verification
      const valid = await this.verifySha512(destPath, expectedSha512);
      if (!valid) {
        logger.error('[Updater] SHA512 verification failed — deleting corrupt download');
        try { unlinkSync(destPath); } catch { /* ignore */ }
        throw new Error('Download verification failed — SHA512 mismatch. Please retry.');
      }
      logger.info('[Updater] SHA512 verification passed');
    }

    this.dmgPath = destPath;
    this.updateStatus({ status: 'downloaded' });
    logger.info('[Updater] DMG download complete and verified');
  }

  /**
   * Download a file using electron.net with progress tracking.
   */
  private downloadFileWithProgress(
    url: string,
    destPath: string,
    fallbackTotalBytes: number,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = net.request(url);

      request.on('response', (response) => {
        if (response.statusCode && response.statusCode >= 300) {
          reject(new Error(`Download failed: HTTP ${response.statusCode}`));
          return;
        }

        // Determine total size from content-length, or fall back to UpdateInfo size.
        const contentLength = response.headers['content-length'];
        const clValue = Array.isArray(contentLength) ? contentLength[0] : contentLength;
        const totalBytes = clValue ? parseInt(clValue, 10) : fallbackTotalBytes;

        let transferred = 0;
        let lastEmitTime = 0;
        const startTime = Date.now();
        const fileStream = createWriteStream(destPath);

        response.on('data', (chunk: Buffer) => {
          fileStream.write(chunk);
          transferred += chunk.length;

          const now = Date.now();
          // Throttle progress updates to ~500ms intervals, always emit on completion.
          if (now - lastEmitTime >= 500 || transferred >= totalBytes) {
            const elapsed = (now - startTime) / 1000;
            const progress: ProgressInfo = {
              total: totalBytes,
              delta: chunk.length,
              transferred,
              percent: totalBytes > 0 ? (transferred / totalBytes) * 100 : 0,
              bytesPerSecond: elapsed > 0 ? transferred / elapsed : 0,
            };
            this.updateStatus({ status: 'downloading', progress });
            this.emit('download-progress', progress);
            lastEmitTime = now;
          }
        });

        response.on('end', () => {
          fileStream.end(() => resolve());
        });

        response.on('error', (error) => {
          fileStream.destroy();
          try { unlinkSync(destPath); } catch { /* ignore */ }
          reject(error);
        });

        fileStream.on('error', (error) => {
          request.abort();
          try { unlinkSync(destPath); } catch { /* ignore */ }
          reject(error);
        });
      });

      request.on('error', (error) => {
        try { unlinkSync(destPath); } catch { /* ignore */ }
        reject(error);
      });

      request.end();
    });
  }

  /**
   * Verify a file's SHA512 hash against an expected base64-encoded value.
   */
  private verifySha512(filePath: string, expectedBase64: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const hash = createHash('sha512');
      const stream = createReadStream(filePath);
      stream.on('data', (chunk) => hash.update(chunk));
      stream.on('end', () => resolve(hash.digest('base64') === expectedBase64));
      stream.on('error', reject);
    });
  }

  // ── Install ────────────────────────────────────────────────────────────

  /**
   * Install the downloaded update.
   *
   * macOS: opens the downloaded DMG in Finder for drag-and-drop install.
   * Windows/Linux: quits the app and lets electron-updater install the update.
   */
  async installUpdate(): Promise<void> {
    if (process.platform === 'darwin') {
      if (!this.dmgPath || !existsSync(this.dmgPath)) {
        throw new Error('No downloaded DMG available');
      }
      logger.info(`[Updater] Opening DMG: ${this.dmgPath}`);
      const result = await shell.openPath(this.dmgPath);
      if (result) {
        throw new Error(`Failed to open DMG: ${result}`);
      }
      return;
    }

    // Windows / Linux — standard quit-and-install flow.
    logger.info('[Updater] quitAndInstall called');
    setQuitting();
    autoUpdater.quitAndInstall();
  }

  /**
   * Set update channel (stable, beta, dev)
   */
  setChannel(channel: 'stable' | 'beta' | 'dev'): void {
    autoUpdater.channel = channel;
  }

  /**
   * Set auto-download preference
   */
  setAutoDownload(enable: boolean): void {
    autoUpdater.autoDownload = enable;
  }

  /**
   * Get current version
   */
  getCurrentVersion(): string {
    return app.getVersion();
  }
}

/**
 * Register IPC handlers for update operations
 */
export function registerUpdateHandlers(
  updater: AppUpdater,
  mainWindow: BrowserWindow
): void {
  updater.setMainWindow(mainWindow);

  // Get current update status
  ipcMain.handle('update:status', () => {
    return updater.getStatus();
  });

  // Get current version
  ipcMain.handle('update:version', () => {
    return updater.getCurrentVersion();
  });

  // Check for updates – always return final status so the renderer
  // never gets stuck in 'checking' waiting for a push event.
  ipcMain.handle('update:check', async () => {
    try {
      await updater.checkForUpdates();
      return { success: true, status: updater.getStatus() };
    } catch (error) {
      return { success: false, error: String(error), status: updater.getStatus() };
    }
  });

  // Download update
  ipcMain.handle('update:download', async () => {
    try {
      await updater.downloadUpdate();
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  // Install update (macOS: open DMG, Windows/Linux: quit and install)
  ipcMain.handle('update:install', async () => {
    try {
      await updater.installUpdate();
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  // Set update channel
  ipcMain.handle('update:setChannel', (_, channel: 'stable' | 'beta' | 'dev') => {
    updater.setChannel(channel);
    return { success: true };
  });

  // Set auto-download preference
  ipcMain.handle('update:setAutoDownload', (_, enable: boolean) => {
    updater.setAutoDownload(enable);
    return { success: true };
  });

}

// Export singleton instance
export const appUpdater = new AppUpdater();
