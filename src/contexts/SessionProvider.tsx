import { supabase } from '@/integrations/supabase/client'
import { Session } from '@supabase/supabase-js'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

interface SessionContextType {
  session: Session | null
  loading: boolean
}

const SessionContext = createContext<SessionContextType | undefined>(undefined)

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      setLoading(false)
    }

    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!loading) {
      const publicRoutes = ['/login']; // Add any other public routes here
      const isPublicRoute = publicRoutes.includes(location.pathname);

      if (session && isPublicRoute) {
        navigate('/')
      } else if (!session && !isPublicRoute) {
        navigate('/login')
      }
    }
  }, [session, loading, navigate, location.pathname])

  if (loading) {
    return (
        <div className="flex items-center justify-center h-screen">
            <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
        </div>
    )
  }

  return (
    <SessionContext.Provider value={{ session, loading }}>
      {!loading && children}
    </SessionContext.Provider>
  )
}

export const useSession = () => {
  const context = useContext(SessionContext)
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider')
  }
  return context
}