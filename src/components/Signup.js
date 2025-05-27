// SignupForm.tsx
"use client";
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Mail, Lock } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import axios from 'axios';
// Import der neuen modernen Komponenten
import ModernButton from './ModernButton';
import ModernInput from './ModernInput';
// Import des Logos
import logo from '@/assets/images/logo.png';

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
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm({
    resolver: zodResolver(schema)
  });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Watch form values
  const usernameValue = watch('username', '');
  const emailValue = watch('email', '');
  const passwordValue = watch('password', '');
  const confirmPasswordValue = watch('confirmPassword', '');

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const response = await axios.post('https://solasolution.ecomtask.de/auth/register', {
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

        {/* Modernized Signup Card */}
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-[#E6E2DF]/30 backdrop-blur-sm">
          
          {/* Titel Section */}
          <div className="text-center mb-8">
            <h2 className="text-[32px] leading-[44px] font-nexa-black text-[#001E4A] mb-2">
              Konto erstellen
            </h2>
            <p className="text-[15px] leading-[24px] font-nexa-book text-[#001E4A]/70">
              Erhalten Sie Zugang zum Solasolution-Dashboard
            </p>
          </div>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Modern Username Input */}
            <ModernInput
              label="Benutzername"
              type="text"
              placeholder="maxmustermann123"
              value={usernameValue}
              onChange={(e) => setValue('username', e.target.value)}
              error={errors.username?.message}
              disabled={isLoading}
              icon={<User className="w-5 h-5" />}
              required
            />

            {/* Modern Email Input */}
            <ModernInput
              label="E-Mail"
              type="email"
              placeholder="max.mustermann@beispiel.de"
              value={emailValue}
              onChange={(e) => setValue('email', e.target.value)}
              error={errors.email?.message}
              disabled={isLoading}
              icon={<Mail className="w-5 h-5" />}
              required
            />

            {/* Modern Password Input */}
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

            {/* Modern Confirm Password Input */}
            <ModernInput
              label="Passwort bestätigen"
              type="password"
              placeholder="********"
              value={confirmPasswordValue}
              onChange={(e) => setValue('confirmPassword', e.target.value)}
              error={errors.confirmPassword?.message}
              disabled={isLoading}
              icon={<Lock className="w-5 h-5" />}
              required
            />

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
                {isLoading ? 'Konto wird erstellt...' : 'Registrieren'}
              </ModernButton>
            </div>
          </form>
          
          {/* Modern Login Link */}
          <div className="mt-8 pt-6 border-t border-[#E6E2DF]/30 text-center">
            <p className="text-[13px] leading-[10px] font-nexa-book text-[#001E4A]">
              Haben Sie bereits ein Konto?{' '}
              <a 
                href="/" 
                className="
                  font-nexa-black text-[#001E4A] hover:text-[#F0B72F] 
                  transition-colors duration-200 underline-offset-4 hover:underline
                "
              >
                einloggen
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupForm;