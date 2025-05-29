// src/utils/network/connectionManager.ts
// Network connection monitoring and handling

import { handleError, logError, AppError, ErrorType } from '@/utils/errorHandling';
import { toast } from '@/hooks/use-toast';
import React from 'react';

// Event types
export enum ConnectionEventType {
  ONLINE = 'online',
  OFFLINE = 'offline',
  SLOW_CONNECTION = 'slow-connection',
  CONNECTION_RECOVERED = 'connection-recovered'
}

// Connection state
export interface ConnectionState {
  online: boolean;
  connectionType: string | null;
  downlink: number | null;
  downlinkMax: number | null;
  effectiveType: string | null;
  rtt: number | null;
  saveData: boolean | null;
  lastChecked: number;
  isSlowConnection: boolean;
}

// Listener callback
type ConnectionListener = (state: ConnectionState, eventType: ConnectionEventType) => void;

/**
 * Network connection manager
 * Monitors network status and provides utilities for handling network issues
 */
class ConnectionManager {
  private static instance: ConnectionManager;
  private listeners: ConnectionListener[] = [];
  private checkInterval: number | null = null;
  private connectionState: ConnectionState = {
    online: navigator.onLine,
    connectionType: null,
    downlink: null,
    downlinkMax: null,
    effectiveType: null,
    rtt: null,
    saveData: null,
    lastChecked: Date.now(),
    isSlowConnection: false
  };

  private constructor() {
    this.initializeConnectionMonitoring();
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): ConnectionManager {
    if (!ConnectionManager.instance) {
      ConnectionManager.instance = new ConnectionManager();
    }
    return ConnectionManager.instance;
  }

  /**
   * Set up connection monitoring
   */
  private initializeConnectionMonitoring(): void {
    // Listen for browser online/offline events
    window.addEventListener('online', this.handleOnlineStatus.bind(this));
    window.addEventListener('offline', this.handleOnlineStatus.bind(this));

    // Use Network Information API if available
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      
      // Update initial state
      this.updateConnectionInfo(connection);
      
      // Listen for connection changes
      connection.addEventListener('change', () => {
        this.updateConnectionInfo(connection);
      });
    }

    // Removed regular connection checks that were causing the ping errors
    // We'll rely on the browser's built-in connection monitoring instead
  }

  /**
   * Handle online/offline status changes
   */
  private handleOnlineStatus(): void {
    const wasOnline = this.connectionState.online;
    const isOnline = navigator.onLine;
    
    this.connectionState.online = isOnline;
    this.connectionState.lastChecked = Date.now();
    
    // Fire appropriate event
    if (wasOnline && !isOnline) {
      this.notifyListeners(ConnectionEventType.OFFLINE);
      
      // Show toast notification
      toast({
        title: 'Connection Lost',
        description: 'You are currently offline. Some features may not work properly.',
        variant: 'destructive'
      });
    } else if (!wasOnline && isOnline) {
      this.notifyListeners(ConnectionEventType.ONLINE);
      
      // Show toast notification
      toast({
        title: 'Connection Restored',
        description: 'You are back online.',
      });
    }
  }

  /**
   * Update connection info from Network Information API
   */
  private updateConnectionInfo(connection: any): void {
    // Update connection state
    this.connectionState.connectionType = connection.type || null;
    this.connectionState.effectiveType = connection.effectiveType || null;
    this.connectionState.downlink = connection.downlink || null;
    this.connectionState.downlinkMax = connection.downlinkMax || null;
    this.connectionState.rtt = connection.rtt || null;
    this.connectionState.saveData = connection.saveData || null;
    this.connectionState.lastChecked = Date.now();
    
    // Detect slow connection
    const wasSlowConnection = this.connectionState.isSlowConnection;
    const isSlowConnection = this.detectSlowConnection();
    this.connectionState.isSlowConnection = isSlowConnection;
    
    // Fire appropriate event for connection quality change
    if (!wasSlowConnection && isSlowConnection) {
      this.notifyListeners(ConnectionEventType.SLOW_CONNECTION);
      
      // Show toast notification
      toast({
        title: 'Slow Connection Detected',
        description: 'You may experience slower loading times.',
      });
    } else if (wasSlowConnection && !isSlowConnection) {
      this.notifyListeners(ConnectionEventType.CONNECTION_RECOVERED);
      
      // Show toast notification
      toast({
        title: 'Connection Improved',
        description: 'Your connection speed has improved.',
      });
    }
  }

  /**
   * Detect if the connection is slow
   */
  private detectSlowConnection(): boolean {
    // Check effective type if available
    if (this.connectionState.effectiveType) {
      return ['slow-2g', '2g', '3g'].includes(this.connectionState.effectiveType);
    }
    
    // Check downlink if available
    if (this.connectionState.downlink !== null) {
      return this.connectionState.downlink < 1; // Less than 1 Mbps
    }
    
    // Check RTT if available
    if (this.connectionState.rtt !== null) {
      return this.connectionState.rtt > 500; // Greater than 500ms
    }
    
    return false;
  }

  /**
   * Notify all listeners of connection events
   */
  private notifyListeners(eventType: ConnectionEventType): void {
    for (const listener of this.listeners) {
      try {
        listener({ ...this.connectionState }, eventType);
      } catch (error) {
        logError(error as Error, 'ConnectionManager.notifyListeners');
      }
    }
  }

  /**
   * Add a connection listener
   */
  public addListener(listener: ConnectionListener): void {
    this.listeners.push(listener);
  }

  /**
   * Remove a connection listener
   */
  public removeListener(listener: ConnectionListener): void {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  /**
   * Get current connection state
   */
  public getConnectionState(): ConnectionState {
    return { ...this.connectionState };
  }

  /**
   * Check if the device is online
   */
  public isOnline(): boolean {
    return this.connectionState.online;
  }

  /**
   * Check if the connection is slow
   */
  public isSlowConnection(): boolean {
    return this.connectionState.isSlowConnection;
  }

  /**
   * Get connection quality as a percentage (0-100)
   */
  public getConnectionQuality(): number {
    // If offline, quality is 0
    if (!this.connectionState.online) {
      return 0;
    }
    
    // If we have downlink information, use that
    if (this.connectionState.downlink !== null) {
      // Map downlink to a percentage (0-10 Mbps -> 0-100%)
      return Math.min(100, this.connectionState.downlink * 10);
    }
    
    // If we have RTT information, use that (inverse relationship)
    if (this.connectionState.rtt !== null) {
      // Map RTT to a percentage (0-1000ms -> 100-0%)
      return Math.max(0, 100 - (this.connectionState.rtt / 10));
    }
    
    // If we have effective type, use a rough mapping
    if (this.connectionState.effectiveType) {
      switch (this.connectionState.effectiveType) {
        case 'slow-2g': return 10;
        case '2g': return 30;
        case '3g': return 60;
        case '4g': return 90;
        default: return 50;
      }
    }
    
    // Default to 50% if we can't determine
    return 50;
  }

  /**
   * Get a recommended timeout for network requests based on connection quality
   */
  public getRecommendedTimeout(): number {
    const quality = this.getConnectionQuality();
    
    // Scale timeout inversely with connection quality
    if (quality < 20) {
      return 60000; // 60 seconds for very poor connections
    } else if (quality < 40) {
      return 30000; // 30 seconds for poor connections
    } else if (quality < 70) {
      return 15000; // 15 seconds for average connections
    } else {
      return 10000; // 10 seconds for good connections
    }
  }

  /**
   * Clean up resources
   */
  public dispose(): void {
    // Remove event listeners
    window.removeEventListener('online', this.handleOnlineStatus);
    window.removeEventListener('offline', this.handleOnlineStatus);
    
    // Clear interval
    if (this.checkInterval !== null) {
      clearInterval(this.checkInterval);
    }
    
    // Clear listeners
    this.listeners = [];
  }
}

// Export singleton instance
export const connectionManager = ConnectionManager.getInstance();
export default connectionManager;

// React hook for connection state
export function useConnectionState(): [ConnectionState, boolean, boolean] {
  const [state, setState] = React.useState<ConnectionState>(
    connectionManager.getConnectionState()
  );
  
  React.useEffect(() => {
    const listener = (newState: ConnectionState) => {
      setState(newState);
    };
    
    connectionManager.addListener(listener);
    
    return () => {
      connectionManager.removeListener(listener);
    };
  }, []);
  
  return [state, state.online, state.isSlowConnection];
}
