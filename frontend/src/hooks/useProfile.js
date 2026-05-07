import { useState } from 'react'

export function useProfile() {
  const [profile, setProfileState] = useState(() => localStorage.getItem('profile') || 'gestor')

  const setProfile = (p) => {
    localStorage.setItem('profile', p)
    setProfileState(p)
  }

  return [profile, setProfile]
}
