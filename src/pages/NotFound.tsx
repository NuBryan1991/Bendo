import { Link } from 'react-router-dom'

export default function NotFound({ message = 'No encontramos esta página.' }: { message?: string }) {
  return (
    <main id="contenido" tabIndex={-1} className="mx-auto max-w-xl p-10 text-center">
      <h1 className="text-xl font-semibold">{message}</h1>
      <Link to="/" className="mt-4 inline-block font-medium text-primary underline">
        Volver al inicio
      </Link>
    </main>
  )
}
