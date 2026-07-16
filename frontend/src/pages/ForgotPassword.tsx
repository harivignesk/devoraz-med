import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, ArrowLeft, CheckCircle2 } from 'lucide-react';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await axios.post('http://localhost:8000/api/v1/auth/forgot-password', { email });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-100 blur-[100px] opacity-70"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-100 blur-[100px] opacity-70"></div>
      
      <Card className="w-[400px] shadow-lg border-slate-200 relative z-10">
        <CardHeader className="space-y-3 items-center text-center pb-6">
          <div className="bg-blue-600 p-3 rounded-xl mb-2 shadow-sm">
            <Activity className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-slate-800">
            Reset Password
          </CardTitle>
          <CardDescription className="text-slate-500">
            Enter your email to receive a reset link
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <CheckCircle2 className="h-12 w-12 text-green-500" />
              </div>
              <p className="text-sm text-slate-600">
                If an account with {email} exists, we have sent a password reset link.
              </p>
              <Button asChild variant="outline" className="w-full mt-4">
                <Link to="/login">Return to login</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="admin@medsync.com" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              
              {error && (
                <div className="p-3 rounded-md bg-red-50 text-red-600 text-sm font-medium border border-red-100">
                  {error}
                </div>
              )}
              
              <Button className="w-full bg-blue-600 hover:bg-blue-700 mt-2" type="submit" disabled={isLoading}>
                {isLoading ? 'Sending link...' : 'Send Reset Link'}
              </Button>

              <div className="text-center mt-4">
                <Link to="/login" className="text-sm text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1">
                  <ArrowLeft className="h-4 w-4" /> Back to login
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
