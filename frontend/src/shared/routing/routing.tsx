// @ts-nocheck
import { createBrowserRouter } from "react-router-dom";

import { Authorization, Components, Home, Registration, Wrapper } from "../../pages";
import { System } from "../../pages/system/system";
import { CTPDetailsPage } from "../../pages/ctp-details/ctp-details";

export const router = createBrowserRouter([
  {
    path: "",
    element: <Wrapper/>,
    children: [
      {
        path: "/",
        element: <System/>
      }
    ]
  },
  {
    path: "/registration",
    element: <Registration/>
  },
  {
    path: "/authorization",
    element: <Authorization/>
  },
  {
    path: "/components",
    element: <Components/>
  },
  {
    path: "/system",
    element: <System/>
  }, 
  {
    path: '/ctp/:ctpId',
    element: <CTPDetailsPage />,
  },
]);
