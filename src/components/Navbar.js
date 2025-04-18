'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function Navbar() {
  const [user, setUser] = useState(null)
  const router = useRouter()
  
  useEffect(() => {
    // Check if user is logged in
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null)
    })
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null)
      }
    )
    
    return () => subscription.unsubscribe()
  }, [])
  
  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/signin')
  }
  
  return (
    <nav className="bg-gray-800 p-4 text-white">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <Link href="/" className="font-bold text-xl">
          TaskMaster
        </Link>
        
        <div className="flex gap-4">
          {user ? (
            <>
              <span className="text-gray-300">Hello, {user.email}</span>
              <button 
                onClick={handleSignOut}
                className="text-white hover:text-gray-300"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link href="/signin" className="hover:text-gray-300">
                Sign In
              </Link>
              <Link href="/signup" className="hover:text-gray-300">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}