'use client'
import { useState } from 'react'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { Home } from 'lucide-react'

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password)
      } else {
        await createUserWithEmailAndPassword(auth, email, password)
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleGoogle = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider())
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="flex items-center gap-2 mb-6 justify-center">
          <Home className="text-blue-600" size={32} />
          <h1 className="text-2xl font-bold text-gray-800">PropertySearch</h1>
        </div>
        <h2 className="text-center text-gray-600 mb-6">{isLogin ? 'Sign in to your account' : 'Create your account'}</h2>
        
        {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="Email" required
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="Password" required
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition">
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="my-4 flex items-center gap-2">
          <hr className="flex-1" /><span className="text-gray-400 text-sm">or</span><hr className="flex-1" />
        </div>

        <button onClick={handleGoogle} className="w-full border border-gray-300 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-50 transition flex items-center justify-center gap-2">
          <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="G" />
          Continue with Google
        </button>

        <p className="text-center text-sm text-gray-500 mt-4">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={() => setIsLogin(!isLogin)} className="text-blue-600 font-medium">
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  )
}
