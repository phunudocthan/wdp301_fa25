import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { requestEmailVerification } from '../api/auth';

const ResendVerificationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const prefill = searchParams.get('email');
    if (prefill) setEmail(prefill);
  }, [searchParams]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');
    try {
      const res = await requestEmailVerification(email);
      setStatus('success');
      setMessage(res.msg || 'Đã gửi email xác minh');
    } catch (e: unknown) {
      const err = e instanceof Error ? e.message : 'Gửi email thất bại';
      setStatus('error');
      setMessage(err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <h1 className="text-2xl font-bold mb-4 text-center">Gửi lại email xác minh</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="example@email.com"
              required
            />
          </div>
          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50"
          >
            {status === 'loading' ? 'Đang gửi...' : 'Gửi lại email'}
          </button>
        </form>
        {status !== 'idle' && message && (
          <div className={`mt-4 text-center ${status === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResendVerificationPage;


