import { useEffect } from 'react'
import { createRootRoute, Outlet } from '@tanstack/react-router'
import { connect } from '../lib/websocket'
import '../App.css'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  useEffect(() => {
    // Enable dark mode
    document.documentElement.classList.add('dark');
    
    // Initialize websocket connection on mount
    connect();
    
    // Cleanup on unmount
    return () => {
      // Connection cleanup handled by WebSocketManager
    };
  }, []);

  return <Outlet />;
}

