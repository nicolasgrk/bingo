// lib/supabase/server.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createSupabaseServerClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            // Avec Next.js 14, TypeScript devrait correctement reconnaître .set()
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Gérer les erreurs si les cookies ne peuvent pas être définis (par exemple, en dehors d'une requête HTTP)
            // console.warn(`Failed to set cookie: ${name}`, error);
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            // Avec Next.js 14, TypeScript devrait correctement reconnaître .set() pour la suppression
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // Gérer les erreurs
            // console.warn(`Failed to remove cookie: ${name}`, error);
          }
        },
      },
    }
  )
}
