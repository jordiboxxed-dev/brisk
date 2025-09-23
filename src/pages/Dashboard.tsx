import { Button } from "@/components/ui/button"
import { supabase } from "@/integrations/supabase/client"
import { useNavigate } from "react-router-dom"
import { useSession } from "@/contexts/SessionProvider"

const Dashboard = () => {
  const navigate = useNavigate()
  const { session } = useSession()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Button onClick={handleLogout}>Cerrar Sesión</Button>
      </div>
      <p>Bienvenido, {session?.user?.email}</p>
      {/* El contenido del dashboard irá aquí */}
    </div>
  )
}

export default Dashboard