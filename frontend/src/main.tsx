import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import {
  RouterProvider,
} from "react-router";

import { router } from './shared/routing/routing';
import './shared/styles/index.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { store } from './shared/store';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router}/>
      </QueryClientProvider>
    </Provider>
  </StrictMode>,
)
