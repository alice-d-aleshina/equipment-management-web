import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { Badge } from "../../components/ui/badge";
import { Separator } from "../../components/ui/separator";
import { ScrollArea } from "../../components/ui/scroll-area";
import { RotateCw, RefreshCw, Play, Square, Plug, Send } from 'lucide-react';

const CardReaderMonitor = () => {
  const [connected, setConnected] = useState(false);
  const [cardDetected, setCardDetected] = useState(false);
  const [cardId, setCardId] = useState('');
  const [cardType, setCardType] = useState('');
  const [status, setStatus] = useState('Disconnected');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [availablePorts, setAvailablePorts] = useState([]);
  const [selectedPort, setSelectedPort] = useState('');
  const [manualCardId, setManualCardId] = useState('');
  const [arduinoServerAvailable, setArduinoServerAvailable] = useState(false);
  
  // Always use the Next.js API routes
  const getApiUrl = (endpoint) => {
    return `/api/card-reader/${endpoint}`;
  };

  // Get initial status
  useEffect(() => {
    fetchStatus();
    fetchAvailablePorts();
    
    // Set up polling for status updates
    const interval = setInterval(() => {
      fetchStatus();
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await axios.get(getApiUrl('status'));
      setConnected(response.data.connected);
      setStatus(response.data.status);
      setCardDetected(response.data.cardPresent || false);
      
      // Check if we're getting data from Arduino server or fallback
      const serverStatus = response.headers['x-arduino-server-status'];
      setArduinoServerAvailable(serverStatus !== 'unavailable');
      
      if (response.data.cardPresent) {
        setCardId(response.data.cardId || '');
        setCardType(response.data.cardType || '');
      }
    } catch (err) {
      console.error('Error fetching card reader status:', err);
      setError('Failed to fetch card reader status');
      setArduinoServerAvailable(false);
    }
  };

  // Add a polling for card reading when connected
  useEffect(() => {
    let cardPollInterval;
    
    if (connected) {
      // Poll for card reading every 1 second
      cardPollInterval = setInterval(async () => {
        try {
          const response = await axios.get(getApiUrl('read-card'));
          
          if (response.data.cardPresent) {
            // Card detected
            setCardDetected(true);
            setCardId(response.data.cardId || '');
            setCardType(response.data.cardType || '');
            
            // Log event
            addEvent(`Card detected: ${response.data.cardId} (${response.data.cardType})`);
          }
        } catch (err) {
          console.error('Error polling for card:', err);
        }
      }, 1000);
    }
    
    return () => {
      if (cardPollInterval) clearInterval(cardPollInterval);
    };
  }, [connected]);

  const fetchAvailablePorts = async () => {
    try {
      const response = await axios.get(getApiUrl('ports'));
      setAvailablePorts(response.data);
      
      // If we have a port and none is selected, select the first one
      if (response.data.length > 0 && !selectedPort) {
        setSelectedPort(response.data[0].path);
      }
      
      // Check if we're getting data from Arduino server or fallback
      const serverStatus = response.headers['x-arduino-server-status'];
      if (serverStatus === 'unavailable') {
        addEvent('Using fallback ports - Arduino server not available');
      }
    } catch (err) {
      console.error('Error fetching available ports:', err);
      setError('Failed to fetch available serial ports');
    }
  };

  const connectToReader = async () => {
    if (!selectedPort) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(getApiUrl('connect'), { port: selectedPort });
      setConnected(response.data.connected);
      setStatus(response.data.status);
      addEvent(`Connected to ${selectedPort}`);
    } catch (err) {
      console.error('Error connecting to card reader:', err);
      
      // Handle 503 error specifically (Arduino server unavailable)
      if (err.response?.status === 503) {
        setError(`Arduino server not available: ${err.response.data.error}`);
        addEvent(`Connection failed: Arduino server not available at ${err.response.data.serverUrl}`);
      } else {
        setError('Failed to connect to card reader');
        addEvent(`Connection failed: ${err.message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const disconnectFromReader = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(getApiUrl('disconnect'));
      setConnected(false);
      setStatus('Disconnected');
      setCardDetected(false);
      addEvent('Disconnected from card reader');
    } catch (err) {
      console.error('Error disconnecting from card reader:', err);
      setError('Failed to disconnect from card reader');
    } finally {
      setLoading(false);
    }
  };

  const resetReader = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await axios.post(getApiUrl('reset'));
      addEvent('Card reader reset initiated');
      await fetchStatus();
    } catch (err) {
      console.error('Error resetting card reader:', err);
      setError('Failed to reset card reader');
    } finally {
      setLoading(false);
    }
  };

  const simulateScan = async () => {
    if (!manualCardId.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(getApiUrl('simulate-scan'), { 
        cardId: manualCardId.trim() 
      });
      
      if (response.data.success) {
        setCardDetected(true);
        setCardId(response.data.cardId);
        setCardType(response.data.cardType);
        
        const serverMode = response.data.serverAvailable ? 'Arduino Server' : 'Local Simulation';
        addEvent(`Card simulated (${serverMode}): ${response.data.cardId} (${response.data.cardType})`);
        
        // Clear the input
        setManualCardId('');
      }
    } catch (err) {
      console.error('Error simulating scan:', err);
      setError('Failed to simulate card scan');
      addEvent(`Simulation failed: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const addEvent = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setEvents(prev => [
      { id: Date.now(), message, timestamp },
      ...prev.slice(0, 49) // Keep last 50 events
    ]);
  };

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">Card Reader Monitor</h2>
          <div className="flex items-center gap-2">
            <Badge variant={arduinoServerAvailable ? "success" : "secondary"}>
              {arduinoServerAvailable ? 'Arduino Server' : 'Fallback Mode'}
            </Badge>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchStatus}
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {error && (
          <Alert className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div className="rounded-md border p-4">
              <h3 className="text-lg font-medium mb-3">Reader Status</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Mode:</span>
                  <Badge variant="outline" className="bg-blue-50">
                    {arduinoServerAvailable ? 'Hardware (Arduino Server)' : 'Simulation'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Connection:</span>
                  <Badge variant={connected ? "success" : "destructive"}>
                    {connected ? 'Connected' : 'Disconnected'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status:</span>
                  <span className="text-sm">{status}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Card Present:</span>
                  <Badge variant={cardDetected ? "success" : "secondary"}>
                    {cardDetected ? 'Yes' : 'No'}
                  </Badge>
                </div>
                {cardDetected && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Card ID:</span>
                      <code className="bg-muted px-1 py-0.5 rounded text-sm">{cardId}</code>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Card Type:</span>
                      <span className="text-sm">{cardType}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            <div className="rounded-md border p-4">
              <h3 className="text-lg font-medium mb-3">Port Connection</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Select
                    disabled={connected || loading}
                    value={selectedPort}
                    onValueChange={setSelectedPort}
                  >
                    <SelectTrigger className="w-[260px]">
                      <SelectValue placeholder="Select a port" />
                    </SelectTrigger>
                    <SelectContent>
                      {availablePorts.map((port) => (
                        <SelectItem key={port.path} value={port.path}>
                          {port.path} - {port.manufacturer || 'Unknown'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={fetchAvailablePorts}
                    disabled={loading}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="default"
                    onClick={connectToReader}
                    disabled={!selectedPort || connected || loading}
                  >
                    {loading ? (
                      <RotateCw className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Plug className="mr-2 h-4 w-4" />
                    )}
                    Connect
                  </Button>
                  <Button
                    variant="outline"
                    onClick={disconnectFromReader}
                    disabled={!connected || loading}
                  >
                    <Square className="mr-2 h-4 w-4" />
                    Disconnect
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={resetReader}
                    disabled={!connected || loading}
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Reset Reader
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="rounded-md border p-4">
              <h3 className="text-lg font-medium mb-3">Simulate Card Scan</h3>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Card ID (HEX) e.g. 1A2B3C4D"
                  value={manualCardId}
                  onChange={(e) => setManualCardId(e.target.value)}
                  disabled={loading}
                />
                <Button
                  onClick={simulateScan}
                  disabled={!manualCardId.trim() || loading}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Simulate
                </Button>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="rounded-md border p-4">
              <h3 className="text-lg font-medium mb-3">Event Log</h3>
              <ScrollArea className="h-[400px] w-full">
                <div className="space-y-2">
                  {events.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No events logged yet</p>
                  ) : (
                    events.map((event) => (
                      <div key={event.id} className="text-sm">
                        <span className="text-muted-foreground">[{event.timestamp}]</span>
                        <span className="ml-2">{event.message}</span>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default CardReaderMonitor; 