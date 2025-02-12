"use client";
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import axios from 'axios';

// Move schema outside component to prevent recreation on each render
const schema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
  password: z.string().min(8, 'Das Passwort muss mindestens 8 Zeichen lang sein')
    .regex(/[A-Za-z]/, 'Das Passwort muss mindestens einen Buchstaben enthalten')
    .regex(/\d/, 'Das Passwort muss mindestens eine Zahl enthalten')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Das Passwort muss mindestens ein Sonderzeichen enthalten'),
});

// Memoize static classes
const inputClass = "mt-1 block w-full px-3 py-2 bg-white border rounded-md text-[17px] leading-[27px] font-nexa-book text-[#001E4A] border-[#F0B72F] placeholder-gray-400 focus:outline-none focus:border-[#F0B72F] focus:ring-1 focus:ring-[#F0B72F] hover:border-[#E6E2DF] transition-all duration-200";
const buttonClass = "w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-[17px] leading-[27px] font-nexa-black text-[#001E4A] bg-[#F0B72F] hover:bg-[#F0B72F]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#001E4A] transition-colors duration-200 disabled:opacity-50";

// Create axios instance with default config
const api = axios.create({
  baseURL: 'https://solasolution.ecomtask.de',
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

const LoginForm = () => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    mode: 'onChange' // Validate on change instead of submit for faster feedback
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('username', data.email);
      formData.append('password', data.password);

      const response = await api.post('/login', formData);

      if (response.data.access_token) {
        // Store token and redirect simultaneously
        localStorage.setItem('access_token', response.data.access_token);
        
        // Prefetch the dashboard page
        router.prefetch('/dashboard');
        
        toast.success('Anmeldung erfolgreich!');
        
        // Remove the timeout delay and use immediate navigation
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
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-[42px] leading-[54px] font-nexa-black mb-6 text-center text-[#001E4A]">
          einloggen
        </h2>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-[17px] leading-[27px] font-nexa-black text-[#001E4A] mb-1">
              E-Mail
            </label>
            <input
              id="email"
              type="email"
              {...register('email')}
              className={inputClass}
              placeholder="ihre.email@beispiel.de"
              disabled={isLoading}
            />
            {errors.email && 
              <p className="mt-1 text-xs text-red-500 font-nexa-book">{errors.email.message}</p>
            }
          </div>

          <div>
            <label htmlFor="password" className="block text-[17px] leading-[27px] font-nexa-black text-[#001E4A] mb-1">
              Passwort
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                {...register('password')}
                className={inputClass}
                placeholder="********"
                disabled={isLoading}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#001E4A]"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.password && 
              <p className="mt-1 text-xs text-red-500 font-nexa-book">{errors.password.message}</p>
            }
          </div>

          <div className="flex items-center justify-between text-[17px] leading-[27px]">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-[#F0B72F] focus:ring-[#F0B72F] border-[#E6E2DF] rounded"
                disabled={isLoading}
              />
              <label htmlFor="remember-me" className="ml-2 block font-nexa-book text-[#001E4A]">
                Angemeldet bleiben
              </label>
            </div>
            <div>
              <a href="/reset-password" className="font-nexa-black text-[#001E4A] hover:text-[#F0B72F] transition-colors duration-200">
                Passwort vergessen?
              </a>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className={buttonClass}
              disabled={isLoading}
            >
              {isLoading ? 'Anmeldung läuft...' : 'Anmelden'}
            </button>
          </div>
        </form>

        <p className="mt-4 text-center text-[17px] leading-[27px] font-nexa-book text-[#001E4A]">
          Noch kein Konto?{' '}
          <a href="/register" className="font-nexa-black text-[#001E4A] hover:text-[#F0B72F] transition-colors duration-200">
            Registrieren
          </a>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;