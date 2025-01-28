// SignupForm.tsx
"use client";
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import axios from 'axios';


const passwordSchema = z
  .string()
  .min(8, 'Das Passwort muss mindestens 8 Zeichen lang sein')
  .regex(/[A-Z]/, 'Das Passwort muss mindestens einen Großbuchstaben enthalten')
  .regex(/[a-z]/, 'Das Passwort muss mindestens einen Kleinbuchstaben enthalten')
  .regex(/[0-9]/, 'Das Passwort muss mindestens eine Zahl enthalten')
  .regex(/[^A-Za-z0-9]/, 'Das Passwort muss mindestens ein Sonderzeichen enthalten');

const schema = z.object({
  username: z.string()
    .min(3, 'Der Benutzername muss mindestens 3 Zeichen lang sein')
    .max(30, 'Der Benutzername darf nicht länger als 30 Zeichen sein')
    .toLowerCase()
    .regex(/^[a-z0-9][a-z0-9_]*[a-z0-9]$/, 'Der Benutzername darf nur Buchstaben, Zahlen und Unterstriche enthalten')
    .refine((value) => !value.includes(' '), 'Der Benutzername darf keine Leerzeichen enthalten')
    .refine((value) => !/__/.test(value), 'Der Benutzername darf keine aufeinanderfolgenden Unterstriche enthalten')
    .refine((value) => !/[^a-z0-9_]/.test(value), 'Der Benutzername darf nur Buchstaben, Zahlen und einzelne Unterstriche enthalten'),
  email: z.string().email('Ungültige E-Mail-Adresse'),
  password: passwordSchema,
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Die Passwörter stimmen nicht überein",
  path: ["confirmPassword"],
});

const SignupForm = () => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema)
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const response = await axios.post('https://app.saincube.com/app2/auth/register', {
        username: data.username,
        email: data.email,
        password: data.password,
        role: 'customer'
      });

      if (response.data) {
        toast.success('Registrierung erfolgreich! Bitte prüfen Sie Ihre E-Mails für den OTP-Code.');
        router.push(`/verify-otp?email=${encodeURIComponent(data.email)}`);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Tailwind classes with brand colors
  const inputClass = `
    mt-1 block w-full px-3 py-2 
    bg-white border rounded-md text-sm shadow-sm 
    font-nexa-book text-[#001E4A]
    border-[#F0B72F] 
    placeholder-gray-400 
    focus:outline-none focus:border-[#F0B72F] focus:ring-1 focus:ring-[#F0B72F] 
    hover:border-[#E6E2DF] 
    transition-all duration-200
  `;

  const buttonClass = `
    w-full px-4 py-2 
    font-nexa-black text-[#001E4A] 
    bg-[#F0B72F] 
    border border-transparent rounded-md shadow-sm 
    hover:bg-[#F0B72F]/90 
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#001E4A] 
    transition-colors duration-200 
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  return (
    <div className="flex justify-center items-center min-h-screen py-12 px-2 bg-[#E6E2DF]/20">
      <Toaster />
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="font-nexa-black text-[42px] leading-[54px] mb-6 text-center text-[#001E4A]">
          Konto erstellen
        </h2>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="username" className="block font-nexa-black text-[17px] leading-[27px] text-[#001E4A] mb-1">
              Benutzername
            </label>
            <input
              id="username"
              {...register('username')}
              className={`${inputClass} ${errors.username ? 'border-red-500' : ''}`}
              placeholder="maxmustermann123"
            />
            {errors.username && 
              <p className="mt-1 text-xs text-red-500 font-nexa-book">{errors.username.message}</p>
            }
          </div>

          <div>
            <label htmlFor="email" className="block font-nexa-black text-[17px] leading-[27px] text-[#001E4A] mb-1">
              E-Mail
            </label>
            <input
              id="email"
              type="email"
              {...register('email')}
              className={`${inputClass} ${errors.email ? 'border-red-500' : ''}`}
              placeholder="max.mustermann@beispiel.de"
            />
            {errors.email && 
              <p className="mt-1 text-xs text-red-500 font-nexa-book">{errors.email.message}</p>
            }
          </div>

          <div>
            <label htmlFor="password" className="block font-nexa-black text-[17px] leading-[27px] text-[#001E4A] mb-1">
              Passwort
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                {...register('password')}
                className={`${inputClass} ${errors.password ? 'border-red-500' : ''}`}
                placeholder="********"
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

          <div>
            <label htmlFor="confirmPassword" className="block font-nexa-black text-[17px] leading-[27px] text-[#001E4A] mb-1">
              Passwort bestätigen
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                {...register('confirmPassword')}
                className={`${inputClass} ${errors.confirmPassword ? 'border-red-500' : ''}`}
                placeholder="********"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#001E4A]"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.confirmPassword && 
              <p className="mt-1 text-xs text-red-500 font-nexa-book">{errors.confirmPassword.message}</p>
            }
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className={buttonClass}
              disabled={isLoading}
            >
              {isLoading ? 'Konto wird erstellt...' : 'Registrieren'}
            </button>
          </div>
        </form>
        
        <p className="mt-4 text-center font-nexa-book text-[17px] leading-[27px] text-[#001E4A]">
          Haben Sie bereits ein Konto?{' '}
          <a href="/" className="font-nexa-black hover:text-[#F0B72F] transition-colors duration-200">
            einloggen
          </a>
        </p>
      </div>
    </div>
  );
};

export default SignupForm;