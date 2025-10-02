import { Outlet } from "react-router"

export const Wrapper = () => {
  
  
  return (
    <div className="wrapper">
        <main>
            <Outlet/>
        </main>
    </div>
  )
}

