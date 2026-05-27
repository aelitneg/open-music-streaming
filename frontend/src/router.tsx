import { createBrowserRouter } from 'react-router';
import Root from './routes/Root';
import Home from './routes/Home';
import SignIn from './routes/SignIn';
import ProtectedRoute from './components/ProtectedRoute';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Root,
    children: [
      {
        Component: ProtectedRoute,
        children: [
          {
            index: true,
            Component: Home,
          },
        ],
      },
      {
        path: 'signin',
        Component: SignIn,
      },
    ],
  },
]);
