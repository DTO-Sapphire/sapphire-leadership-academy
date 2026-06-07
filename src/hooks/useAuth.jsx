import { useState, useEffect, createContext, useContext } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [participant, setParticipant] = useState(null)
  const [facilitator, setFacilitator] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) loadProfile(session.user)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) loadProfile(session.user)
      else { setParticipant(null); setFacilitator(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function loadProfile(user) {
    const [{ data: p }, { data: f }] = await Promise.all([
      supabase.from('participants').select('*').eq('user_id', user.id).single(),
      supabase.from('facilitators').select('*').eq('user_id', user.id).single(),
    ])
    setParticipant(p)
    setFacilitator(f)
    setLoading(false)
    return { participant: p, facilitator: f }
  }

  async function signOut() {
    await supabase.auth.signOut()
    setParticipant(null)
    setFacilitator(null)
  }

  return (
    <AuthContext.Provider value={{ user, participant, facilitator, loading, signOut, loadProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
