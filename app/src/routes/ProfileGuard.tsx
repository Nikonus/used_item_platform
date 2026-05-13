import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'

type Profile = {
  full_name: string | null
  phone: string | null
  building_number: string | null
  street: string | null
  city: string | null
  state: string | null
  pincode: string | null
}

export const ProfileGuard = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [profileComplete, setProfileComplete] = useState(false)

  const location = useLocation()

  useEffect(() => {
    const checkProfile = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      const { data } = await supabase
        .from('profiles')
        .select(`
          full_name,
          phone,
          building_number,
          street,
          city,
          state,
          pincode
        `)
        .eq('id', user.id)
        .single()

      const profile = data as Profile | null

      const complete = Boolean(
        profile?.full_name &&
        profile?.phone &&
        profile?.building_number &&
        profile?.street &&
        profile?.city &&
        profile?.state &&
        profile?.pincode,
      )

      setProfileComplete(complete)
      setLoading(false)
    }

    void checkProfile()
  }, [user])

  if (loading) {
    return <div>Loading...</div>
  }

  if (
    user &&
    !profileComplete &&
    location.pathname !== '/profile'
  ) {
    return <Navigate to="/profile" replace />
  }

  return <Outlet />
}