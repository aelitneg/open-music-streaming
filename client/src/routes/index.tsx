import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({ component: App });

function App() {
  return (
    <div>
      <h1>Open Music Streaming</h1>
    </div>
  );
}
