import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0F52BA] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8 text-center">
        <div className="flex justify-center mb-4">
          <svg width="44" height="42" viewBox="0 0 52 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polygon points="4,2 38,2 34,20 0,20" fill="#0F52BA"/>
            <polygon points="14,24 44,24 40,44 10,44" fill="#00C2CB"/>
            <circle cx="47" cy="44" r="5.5" fill="#FFAF46"/>
          </svg>
        </div>
        <p className="text-5xl font-bold text-[#0F52BA] mb-2">404</p>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Page not found</h1>
        <p className="text-gray-500 text-sm mb-6">The page you're looking for doesn't exist or has been moved.</p>
        <div className="flex flex-col gap-2">
          <Link to="/dashboard" className="btn-primary w-full text-center">Go to Dashboard</Link>
          <Link to="/" className="btn-secondary w-full text-center">Back to Home</Link>
        </div>
      </div>
    </div>
  )
}
