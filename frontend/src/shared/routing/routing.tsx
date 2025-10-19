// @ts-nocheck
import { createBrowserRouter } from "react-router-dom";

import { Authorization, Components, Home, Registration, Wrapper } from "../../pages";
import { System } from "../../pages/system/system";
import { CTPDetailsPage } from "../../pages/ctp-details/ctp-details";
import { ProtectedRoute } from "../components/protected-route";

export const router = createBrowserRouter([
  {
    path: "",
    element: (
      <ProtectedRoute requireAuth={true}>
        <Wrapper />
      </ProtectedRoute>
    ),
    children: [
      {
        path: "/",
        element: <System />
      }
    ]
  },
  {
    path: "/registration",
    element: (
      <ProtectedRoute requireAuth={false}>
        <Registration />
      </ProtectedRoute>
    )
  },
  {
    path: "/authorization",
    element: (
      <ProtectedRoute requireAuth={false}>
        <Authorization />
      </ProtectedRoute>
    )
  },
  {
    path: "/components",
    element: (
      <ProtectedRoute requireAuth={true}>
        <Components />
      </ProtectedRoute>
    )
  },
  {
    path: "/system",
    element: (
      <ProtectedRoute requireAuth={true}>
        <System />
      </ProtectedRoute>
    )
  }, 
  {
    path: '/ctp/:ctpId',
    element: (
      <ProtectedRoute requireAuth={true}>
        <CTPDetailsPage />
      </ProtectedRoute>
    ),
  },
]);
