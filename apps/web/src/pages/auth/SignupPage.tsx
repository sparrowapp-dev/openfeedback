import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { Button, Input } from '../../components/ui';
import { EnvelopeIcon, LockClosedIcon, UserIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export function SignupPage() {
  const navigate = useNavigate();
  const { signup, isLoading, error } = useAuthStore();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (!agreeToTerms) {
      toast.error('Please agree to the terms of service');
      return;
    }
    
    try {
      await signup({ name, email, password, companyName: companyName || undefined });
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Signup failed');
    }
  };

  const handleGoogleSignup = () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
    window.location.href = `${apiUrl}/auth/google`;
  };

  return (
    <div className="of-min-h-screen of-flex of-items-center of-justify-center of-bg-gray-50 of-py-12 of-px-4 sm:of-px-6 lg:of-px-8">
      <div className="of-max-w-md of-w-full of-space-y-8">
        {/* Header */}
        <div className="of-text-center">
          <div className="of-mx-auto of-w-12 of-h-12 of-bg-primary of-rounded-xl of-flex of-items-center of-justify-center">
            <svg className="of-w-7 of-h-7 of-text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
          </div>
          <h2 className="of-mt-6 of-text-3xl of-font-bold of-text-gray-900">
            Create your account
          </h2>
          <p className="of-mt-2 of-text-sm of-text-gray-600">
            Start collecting feedback in minutes
          </p>
        </div>

        {/* Form */}
        <div className="of-bg-white of-py-8 of-px-6 of-shadow-lg of-rounded-xl sm:of-px-10">
          <form onSubmit={handleSubmit} className="of-space-y-5">
            <Input
              label="Full name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              required
              leftIcon={<UserIcon className="of-w-5 of-h-5" />}
            />

            <Input
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              leftIcon={<EnvelopeIcon className="of-w-5 of-h-5" />}
            />

            <Input
              label="Company name (optional)"
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Acme Inc."
              leftIcon={<BuildingOfficeIcon className="of-w-5 of-h-5" />}
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              leftIcon={<LockClosedIcon className="of-w-5 of-h-5" />}
              helperText="At least 8 characters"
            />

            <Input
              label="Confirm password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              leftIcon={<LockClosedIcon className="of-w-5 of-h-5" />}
              error={confirmPassword && password !== confirmPassword ? 'Passwords do not match' : undefined}
            />

            <label className="of-flex of-items-start of-gap-2">
              <input
                type="checkbox"
                checked={agreeToTerms}
                onChange={(e) => setAgreeToTerms(e.target.checked)}
                className="of-mt-1 of-h-4 of-w-4 of-text-primary of-border-gray-300 of-rounded focus:of-ring-primary"
              />
              <span className="of-text-sm of-text-gray-600">
                I agree to the{' '}
                <a href="#" className="of-text-primary hover:of-underline">Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="of-text-primary hover:of-underline">Privacy Policy</a>
              </span>
            </label>

            {error && (
              <div className="of-text-sm of-text-red-600 of-bg-red-50 of-p-3 of-rounded-lg">
                {error}
              </div>
            )}

            <Button type="submit" fullWidth isLoading={isLoading}>
              Create account
            </Button>
          </form>

          <div className="of-mt-6">
            <div className="of-relative">
              <div className="of-absolute of-inset-0 of-flex of-items-center">
                <div className="of-w-full of-border-t of-border-gray-300" />
              </div>
              <div className="of-relative of-flex of-justify-center of-text-sm">
                <span className="of-px-2 of-bg-white of-text-gray-500">Or continue with</span>
              </div>
            </div>

            <div className="of-mt-6">
              <Button
                type="button"
                variant="outline"
                fullWidth
                onClick={handleGoogleSignup}
                leftIcon={
                  <svg className="of-w-5 of-h-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                }
              >
                Continue with Google
              </Button>
            </div>
          </div>
        </div>

        {/* Login link */}
        <p className="of-text-center of-text-sm of-text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="of-text-primary hover:of-text-primary-dark of-font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
