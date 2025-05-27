"use client";
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import axios from 'axios';
// Import der neuen modernen Komponenten
import ModernButton from './ModernButton';
import ModernInput from './ModernInput';
// Import des Logos
import logo from '@/assets/images/logo.png';

// Move schema outside component to prevent recreation on each render
const schema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
  password: z.string().min(8, 'Das Passwort muss mindestens 8 Zeichen lang sein')
    .regex(/[A-Za-z]/, 'Das Passwort muss mindestens einen Buchstaben enthalten')
    .regex(/\d/, 'Das Passwort muss mindestens eine Zahl enthalten')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Das Passwort muss mindestens ein Sonderzeichen enthalten'),
});

// Create axios instance with default config
const api = axios.create({
  baseURL: 'https://solasolution.ecomtask.de',
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

const LoginForm = () => {
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm({
    resolver: zodResolver(schema),
    mode: 'onChange'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const router = useRouter();

  // Watch form values
  const emailValue = watch('email', '');
  const passwordValue = watch('password', '');

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('username', data.email);
      formData.append('password', data.password);

      const response = await api.post('/login', formData);

      if (response.data.access_token) {
        localStorage.setItem('access_token', response.data.access_token);
        router.prefetch('/dashboard');
        toast.success('Anmeldung erfolgreich!');
        router.push('/dashboard');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 
        (error.request ? 'Keine Antwort vom Server. Bitte überprüfen Sie Ihre Verbindung.' : 'Fehler bei der Anfrage. Bitte versuchen Sie es erneut.');
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen py-12 px-2 bg-[#E6E2DF]/10">
      <Toaster />
      
      <div className="w-full max-w-md">
        {/* Logo Section - außerhalb der Card */}
        <div className="text-center mb-8">
          <div className="flex justify-center">
            <img 
              src={logo.src} 
              alt="Sola Solution Logo" 
              className="w-auto h-4 md:h-6" 
            />
          </div>
        </div>

        {/* Modernized Login Card */}
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-[#E6E2DF]/30 backdrop-blur-sm">
          
          {/* Titel Section */}
          <div className="text-center mb-8">
            <h2 className="text-[32px] leading-[44px] font-nexa-black text-[#001E4A] mb-2">
              Willkommen zurück
            </h2>
          </div>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Modern Email Input - Fixed with proper react-hook-form integration */}
            <ModernInput
              label="E-Mail"
              type="email"
              placeholder="ihre.email@beispiel.de"
              value={emailValue}
              onChange={(e) => setValue('email', e.target.value)}
              error={errors.email?.message}
              disabled={isLoading}
              icon={<Mail className="w-5 h-5" />}
              required
            />

            {/* Modern Password Input - Fixed with proper react-hook-form integration */}
            <ModernInput
              label="Passwort"
              type="password"
              placeholder="********"
              value={passwordValue}
              onChange={(e) => setValue('password', e.target.value)}
              error={errors.password?.message}
              disabled={isLoading}
              icon={<Lock className="w-5 h-5" />}
              required
            />

            {/* Modern Checkbox and Forgot Password */}
            <div className="flex items-center justify-between text-[17px] leading-[27px]">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="
                    h-4 w-4 rounded border-2 border-[#E6E2DF] 
                    text-[#F0B72F] focus:ring-[#F0B72F]/30 focus:ring-2
                    transition-all duration-200
                  "
                  disabled={isLoading}
                />
                <label htmlFor="remember-me" className="ml-3 block font-nexa-book text-[#001E4A]">
                  Angemeldet bleiben
                </label>
              </div>
              <div>
                <a 
                  href="/reset-password" 
                  className="
                    font-nexa-black text-[#001E4A] hover:text-[#F0B72F] 
                    transition-colors duration-200 underline-offset-4 hover:underline
                  "
                >
                  Passwort vergessen?
                </a>
              </div>
            </div>

            {/* Modern Submit Button */}
            <div className="pt-2">
              <ModernButton
                type="submit"
                variant="primary"
                size="large"
                disabled={isLoading}
                loading={isLoading}
                className="w-full"
              >
                {isLoading ? 'Anmeldung läuft...' : 'Anmelden'}
              </ModernButton>
            </div>
          </form>

          {/* Modern Registration Link */}
          <div className="mt-8 pt-6 border-t border-[#E6E2DF]/30 text-center">
            <p className="text-[13px] leading-[10px] font-nexa-book text-[#001E4A]">
              Noch kein Konto?{' '}
              <a 
                href="/register" 
                className="
                  font-nexa-black text-[#001E4A] hover:text-[#F0B72F] 
                  transition-colors duration-200 underline-offset-4 hover:underline
                "
              >
                Jetzt registrieren
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;