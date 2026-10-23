import { Toaster } from "sonner"
import AppRoutes from "@/app/router/AppRoutes"

export default function App() {
  return (
    <>
      <Toaster position="top-right" richColors expand={false} />
      <AppRoutes />
   
    </>
  )
}
