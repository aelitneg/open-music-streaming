import { createBrowserRouter } from 'react-router';
import Root from './routes/Root';
import Home from './routes/Home';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Root,
    children: [
      {
        index: true,
        Component: Home,
      },
    ],
  },
]);
