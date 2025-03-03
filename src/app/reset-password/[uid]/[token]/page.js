"use client";
import React, { useState, useEffect } from 'react';
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

const formSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Die Passwörter stimmen nicht überein",
  path: ["confirmPassword"],
});

const ResetPasswordFormPage = ({ params }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState('');
  const router = useRouter();

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(formSchema)
  });

  useEffect(() => {
    if (params?.token) {
      setToken(params.token);
    } else {
      toast.error('Ungültiger Reset-Token');
      router.push('/');
    }
  }, [params, router]);

  const onSubmit = async (data) => {
    if (!token) {
      toast.error('Ungültiger Reset-Token');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post('https://solasolution.ecomtask.de/auth/reset-password/', {
        token: token,
        new_password: data.password,
        confirm_password: data.confirmPassword
      });

      toast.success(response.data.message || 'Passwort erfolgreich zurückgesetzt!');
      
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (error) {
      let errorMessage = 'Passwort konnte nicht zurückgesetzt werden. Bitte versuchen Sie es erneut.';
      
      if (error.response?.status === 400) {
        errorMessage = error.response.data.detail;
      } else if (error.response?.status === 404) {
        errorMessage = "Der Reset-Token ist ungültig oder abgelaufen.";
        setTimeout(() => {
          router.push('/reset-password');
        }, 2000);
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = `
  mt-1 block w-full px-3 py-2 bg-white 
  border rounded-md shadow-sm 
  font-nexa-book text-[17px] leading-[27px] text-[#001E4A]
  border-[#F0B72F] 
  placeholder-gray-400 
  focus:outline-none focus:border-[#F0B72F] focus:ring-1 focus:ring-[#F0B72F] 
  hover:border-[#E6E2DF] 
  transition-all duration-200
`;

const buttonClass = `
  w-full px-4 py-2 
  font-nexa-black text-[17px] leading-[27px] text-[#001E4A]
  bg-[#F0B72F] 
  border border-transparent rounded-md shadow-sm 
  hover:bg-[#F0B72F]/90 
  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#001E4A] 
  transition-colors duration-200 
  disabled:opacity-50 disabled:cursor-not-allowed
`;

return (
  <div className="flex justify-center items-center min-h-screen bg-[#E6E2DF]/10">
    <Toaster />
    <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
      <h2 className="text-[42px] leading-[54px] font-nexa-black mb-6 text-center text-[#001E4A]">
        Passwort zurücksetzen
      </h2>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="password" className="block text-[17px] leading-[27px] font-nexa-black text-[#001E4A] mb-1">
            Neues Passwort
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              className={`${inputClass} ${errors.password ? 'border-red-500' : ''}`}
              {...register('password')}
              disabled={isLoading}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#001E4A]/50 hover:text-[#001E4A]"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-xs text-red-500 font-nexa-book">{errors.password.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-[17px] leading-[27px] font-nexa-black text-[#001E4A] mb-1">
            Neues Passwort bestätigen
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              className={`${inputClass} ${errors.confirmPassword ? 'border-red-500' : ''}`}
              {...register('confirmPassword')}
              disabled={isLoading}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#001E4A]/50 hover:text-[#001E4A]"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-1 text-xs text-red-500 font-nexa-book">{errors.confirmPassword.message}</p>
          )}
        </div>

        <div className="pt-4">
          <button
            type="submit"
            className={buttonClass}
            disabled={isLoading}
          >
            {isLoading ? 'Wird zurückgesetzt...' : 'Passwort zurücksetzen'}
          </button>
        </div>
      </form>

      <p className="mt-4 text-center text-[17px] leading-[27px] font-nexa-book text-[#001E4A]">
        Erinnern Sie sich an Ihr Passwort?{' '}
        <a href="/" className="font-nexa-black text-[#001E4A] hover:text-[#F0B72F] transition-colors">
          Anmelden
        </a>
      </p>
    </div>
  </div>
);
};

export default ResetPasswordFormPage;