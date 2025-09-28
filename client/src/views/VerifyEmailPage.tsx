import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { verifyEmail } from '../api/auth';

const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    async function run() {
      if (!token) {
        setStatus('error');
        setMessage('Thiếu token xác minh');
        return;
      }
      setStatus('loading');
      try {
        const res = await verifyEmail(token);
        setStatus('success');
        setMessage(res.msg || 'Xác minh email thành công');
      } catch (e: unknown) {
        const err = e instanceof Error ? e.message : 'Xác minh thất bại';
        setStatus('error');
        setMessage(err);
      }
    }
    run();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Xác minh email</h1>
        {status === 'loading' && (
          <div className="text-gray-600">Đang xác minh...</div>
        )}
        {status !== 'loading' && (
          <div className={status === 'success' ? 'text-emerald-600' : 'text-rose-600'}>
            {message}
          </div>
        )}
        <div className="mt-6">
          <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-semibold">
            Quay lại đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;


