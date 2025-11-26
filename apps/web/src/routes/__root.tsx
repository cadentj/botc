import { useEffect } from 'react'
import { createRootRoute, Outlet } from '@tanstack/react-router'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  useEffect(() => {
    // Enable dark mode
    document.documentElement.classList.add('dark');
  }, []);

  return <Outlet />;
}

