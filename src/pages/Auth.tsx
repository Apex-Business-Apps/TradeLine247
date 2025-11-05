import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { paths } from '@/routes/paths';
import { supabase, isSupabaseEnabled } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { Session, User } from '@supabase/supabase-js';
import { Footer } from '@/components/layout/Footer';
import { usePasswordSecurity } from '@/hooks/usePasswordSecurity';
import { flags } from '@/config/flags';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [passwordStrength, setPasswordStrength] = useState<string>('');
  const [passwordCheckLoading, setPasswordCheckLoading] = useState(false);
  const [passwordBreached, setPasswordBreached] = useState(false);
  const navigate = useNavigate();
  const { validatePassword: secureValidatePassword } = usePasswordSecurity();

  useEffect(() => {
    if (!isSupabaseEnabled) {
      setLoading(false);
      return () => undefined;
    }

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Redirect authenticated users to dashboard
        if (session?.user) {
          navigate(paths.dashboard);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      // If there's a JWT error, clear the corrupted session
      if (error?.message?.includes('malformed') || error?.message?.includes('invalid')) {
        console.warn('[Auth] Detected malformed token, clearing session:', error.message);
        supabase.auth.signOut().catch(() => {/* ignore errors during cleanup */});
        setSession(null);
        setUser(null);
        return;
      }

      setSession(session);
      setUser(session?.user ?? null);
      
      // Pre-fill email from session if available and conversionV1 is enabled
      if (flags.conversionV1 && session?.user?.email) {
        setEmail(session.user.email);
      }

      // Redirect if already logged in
      if (session?.user) {
        navigate(paths.dashboard);
      }
    }).catch((err) => {
      // Catch any unhandled JWT errors
      console.error('[Auth] Session check failed:', err);
      supabase.auth.signOut().catch(() => {/* ignore */});
      setSession(null);
      setUser(null);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const validatePassword = (password: string): { isValid: boolean; strength: string; message?: string } => {
    if (password.length < 8) {
      return { isValid: false, strength: 'Too short', message: 'Password must be at least 8 characters long' };
    }
    
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    const criteriaCount = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
    
    if (criteriaCount < 3) {
      return { 
        isValid: false, 
        strength: 'Weak', 
        message: 'Password must contain at least 3 of: lowercase, uppercase, number, special character' 
      };
    }
    
    const strength = criteriaCount === 4 ? 'Strong' : 'Good';
    return { isValid: true, strength };
  };

  const handlePasswordChange = async (newPassword: string) => {
    setPassword(newPassword);
    setPasswordCheckLoading(true);
    setPasswordBreached(false);
    
    try {
      // Quick client-side validation first
      const basicValidation = validatePassword(newPassword);
      setPasswordStrength(basicValidation.strength);
      
      // If password meets basic requirements, check for breaches
      if (basicValidation.isValid && newPassword.length >= 8) {
        const secureValidation = await secureValidatePassword(newPassword);
        setPasswordStrength(secureValidation.strength);
        setPasswordBreached(secureValidation.isBreached);
        
        if (secureValidation.isBreached) {
          setError(secureValidation.message || 'This password appears in known data breaches');
        } else {
          setError(null);
        }
      }
    } catch (error) {
      console.error('Password validation error:', error);
      // Don't block user if validation fails
    } finally {
      setPasswordCheckLoading(false);
    }
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    // Check password security (both strength and breach status)
    const secureValidation = await secureValidatePassword(password);
    
    if (!secureValidation.isValid) {
      throw new Error(secureValidation.message || 'Password does not meet security requirements');
    }
    
    if (secureValidation.isBreached) {
      throw new Error('This password appears in known data breaches. Please choose a different password.');
    }

    const redirectUrl = `${window.location.origin}/`;
    
    if (!isSupabaseEnabled) {
      throw new Error('Supabase is disabled in this environment.');
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          display_name: displayName,
        }
      }
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseEnabled) {
      throw new Error('Supabase is disabled in this environment.');
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !displayName) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const { error } = await signUp(email, password, displayName);
      
      if (error) {
        if (error.message.includes('already registered')) {
          setError('This email is already registered. Please sign in instead.');
        } else {
          setError(error.message);
        }
        setLoading(false);
      } else {
        setMessage('Account created successfully! Please check your email to verify your account.');
        setLoading(false);
        // Clear form
        setEmail('');
        setPassword('');
        setDisplayName('');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during sign up');
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please check your credentials.');
        } else {
          setError(error.message);
        }
        setLoading(false);
      } else {
        // Success - redirect will happen via onAuthStateChange listener
        // But also do explicit navigation as backup
        navigate(paths.dashboard);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during sign in');
      setLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: 'google' | 'apple') => {
    if (!isSupabaseEnabled) {
      setError('Authentication is disabled in this environment.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const redirectUrl = `${window.location.origin}/auth/callback`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) {
        setError(error.message);
        setLoading(false);
      }
      // OAuth redirect will happen automatically, so we don't need to navigate
    } catch (err: any) {
      setError(err.message || `An error occurred during ${provider} sign in`);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">

      <main className="flex-1 container py-8 px-4 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome to TradeLine 24/7</CardTitle>
            <CardDescription>Sign in to your account or create a new one</CardDescription>
          </CardHeader>
          
          <CardContent>
            <Tabs defaultValue="signin" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {message && (
                <Alert>
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
              )}
              
              <TabsContent value="signin">
                <div className="space-y-4">
                  {/* SSO Buttons - Show first on mobile when conversionV1 is enabled */}
                  {flags.conversionV1 && (
                    <div className="space-y-2 order-1 md:order-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => handleOAuthSignIn('apple')}
                        disabled={loading}
                      >
                        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                        </svg>
                        Continue with Apple
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => handleOAuthSignIn('google')}
                        disabled={loading}
                      >
                        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Continue with Google
                      </Button>
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-background px-2 text-muted-foreground">Or use your email to continue</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <form onSubmit={handleSignIn} className={`space-y-4 ${flags.conversionV1 ? 'order-2 md:order-1' : ''}`}>
                    <div className="space-y-2">
                      <Label htmlFor="signin-email">Email</Label>
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signin-password">Password</Label>
                      <Input
                        id="signin-password"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={loading}
                    >
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Sign In
                    </Button>
                  </form>
                </div>
              </TabsContent>
              
              <TabsContent value="signup">
                <div className="space-y-4">
                  {/* SSO Buttons - Show first on mobile when conversionV1 is enabled */}
                  {flags.conversionV1 && (
                    <div className="space-y-2 order-1 md:order-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => handleOAuthSignIn('apple')}
                        disabled={loading}
                      >
                        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                        </svg>
                        Continue with Apple
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => handleOAuthSignIn('google')}
                        disabled={loading}
                      >
                        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Continue with Google
                      </Button>
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-background px-2 text-muted-foreground">Or use your email to continue</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {flags.conversionV1 && (
                    <p className="text-sm text-center text-muted-foreground md:order-0">
                      We'll personalize TL247 for your trade. 2 minutes, tops.
                    </p>
                  )}
                  
                  <form onSubmit={handleSignUp} className={`space-y-4 ${flags.conversionV1 ? 'order-2 md:order-1' : ''}`}>
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Display Name</Label>
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Enter your name"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    
                     <div className="space-y-2">
                       <Label htmlFor="signup-password">Password</Label>
                       <Input
                         id="signup-password"
                         type="password"
                         placeholder="Create a strong password"
                         value={password}
                         onChange={(e) => handlePasswordChange(e.target.value)}
                         required
                         minLength={8}
                       />
                        {password && (
                          <div className="text-sm space-y-2">
                            <div>
                              <span className="text-muted-foreground">Strength: </span>
                              <span className={`font-medium ${
                                passwordStrength === 'Very strong' || passwordStrength === 'Strong' ? 'text-green-600' :
                                passwordStrength === 'Good' ? 'text-yellow-600' :
                                'text-red-600'
                              }`}>
                                {passwordStrength}
                                {passwordCheckLoading && <Loader2 className="inline w-3 h-3 ml-1 animate-spin" />}
                              </span>
                            </div>
                            
                            {passwordBreached && (
                              <div className="text-xs text-red-600 font-medium">
                                ⚠️ This password appears in known data breaches. Please choose a different password.
                              </div>
                            )}
                            
                            {password.length >= 8 && !passwordBreached && passwordStrength !== 'Too short' && (
                              <div className="text-xs text-green-600">
                                ✓ Password meets security requirements
                              </div>
                            )}
                            
                            {(passwordStrength === 'Too short' || passwordStrength === 'Weak' || passwordStrength === 'Too weak') && (
                              <div className="text-xs text-muted-foreground mt-1">
                                Use 8+ characters with uppercase, lowercase, numbers, and symbols
                              </div>
                            )}
                          </div>
                        )}
                     </div>
                    
                    <Button 
                      type="submit" 
                      variant="success"
                      className="w-full"
                      disabled={loading}
                    >
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {flags.conversionV1 ? 'Start free in 60 seconds.' : 'Create Account'}
                    </Button>
                  </form>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
      
      <Footer />
    </div>
  );
};

export default Auth;
