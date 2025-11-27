import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/storyteller')({
  component: StorytellerLayout,
})

function StorytellerLayout() {
  return <Outlet />
}

