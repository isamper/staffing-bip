import { useSearchParams, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

/**
 * Intermediate page that sits between the confirmation email link and the
 * actual Supabase verify URL. Prevents corporate email scanners from consuming
 * the one-time confirmation token automatically.
 *
 * Flow: email link → /confirm?go=SUPABASE_CONFIRM_URL → user clicks button
 *       → Supabase confirms email → redirects to app → pending approval screen
 */
export default function ConfirmEmail() {
  const [params] = useSearchParams()
  const go = params.get('go')

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link to="/">
            <span className="font-display text-4xl font-bold text-navy-800">
              bench<span className="text-bip-red">.</span>
            </span>
          </Link>
          <p className="mt-1 text-sm text-slate-500">Smart Staffing by Bip Consulting</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Confirma tu correo</CardTitle>
            <CardDescription>
              Haz clic en el botón para verificar tu dirección de correo y activar tu cuenta.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {go ? (
              <a href={go} className="block w-full">
                <Button className="w-full">Confirmar correo →</Button>
              </a>
            ) : (
              <div className="text-center">
                <p className="text-sm text-slate-500 mb-4">
                  Este enlace no es válido o ha expirado.
                </p>
                <Link to="/login">
                  <Button variant="outline" className="w-full">Volver al inicio de sesión</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
