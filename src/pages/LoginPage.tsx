import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

interface LoginPageProps {
  onLogin: () => void
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, signUp } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isSignUp) { await signUp(email, password); setError('注册成功！请查看邮箱确认链接。') }
      else { await signIn(email, password); onLogin() }
    } catch (err: any) { setError(err.message || '操作失败') } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4 transition-colors">
      <div className="bg-bg-secondary rounded-2xl shadow-xl p-8 w-full max-w-md transition-colors">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-text-primary">时间规划</h1>
          <p className="text-text-secondary mt-2">高效管理你的时间</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">邮箱</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-text-primary rounded-lg focus:ring-2 focus:ring-brand focus:border-brand focus:border-transparent outline-none transition-all duration-200" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">密码</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-text-primary rounded-lg focus:ring-2 focus:ring-brand focus:border-brand focus:border-transparent outline-none transition-all duration-200" required minLength={6} />
          </div>
          {error && <div className={`text-sm p-3 rounded-lg ${error.includes('成功') ? 'bg-green-50 dark:bg-green-900/20 text-text-secondary' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'}`}>{error}</div>}
          <button type="submit" disabled={loading} className="w-full bg-brand text-white py-2 rounded-lg hover:bg-brand-hover disabled:opacity-50 transition-all duration-200 font-medium btn-press">{loading ? '处理中...' : isSignUp ? '注册' : '登录'}</button>
        </form>
        <div className="mt-6 text-center">
          <button onClick={() => { setIsSignUp(!isSignUp); setError('') }} className="text-brand dark:text-brand hover:text-indigo-700 dark:hover:text-indigo-300 text-sm transition-colors">{isSignUp ? '已有账号？去登录' : '没有账号？注册'}</button>
        </div>
      </div>
    </div>
  )
}
