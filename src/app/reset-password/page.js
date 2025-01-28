"use client";
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast, Toaster } from 'react-hot-toast';
import axios from 'axios';

const schema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
});

const ResetPasswordPage = () => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema)
  });
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const response = await axios.post('https://app.saincube.com/app2/auth/forget-password/', {
        email: data.email
      });

      toast.success(response.data.message || 'Passwort-Reset-Link gesendet! Überprüfen Sie Ihre E-Mails.', {
        duration: 5000,
      });
    } catch (error) {
      let errorMessage = 'Link konnte nicht gesendet werden. Bitte versuchen Sie es erneut.';
      
      if (error.response?.status === 404) {
        errorMessage = "Kein Benutzer mit dieser E-Mail-Adresse gefunden.";
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }
      
      toast.error(errorMessage, {
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = "mt-1 block w-full px-3 py-2 bg-white border border-[#F0B72F] rounded-md text-[17px] leading-[27px] font-nexa-book text-[#001E4A] shadow-sm placeholder-gray-400 focus:outline-none focus:border-[#F0B72F] focus:ring-1 focus:ring-[#F0B72F] hover:border-[#E6E2DF] transition-all duration-200";
  
  const buttonClass = "w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-[17px] leading-[27px] font-nexa-black text-[#001E4A] bg-[#F0B72F] hover:bg-[#F0B72F]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#001E4A] transition-colors duration-200 disabled:opacity-50";

  return (
    <div className="flex justify-center items-center min-h-screen bg-[#E6E2DF]/10">
      <Toaster />
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-[42px] leading-[54px] font-nexa-black mb-6 text-center text-[#001E4A]">
          Passwort zurücksetzen
        </h2>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-[17px] leading-[27px] font-nexa-black text-[#001E4A] mb-1">
              E-Mail-Adresse
            </label>
            <input
              id="email"
              type="email"
              {...register('email')}
              className={`${inputClass} ${errors.email ? 'border-red-500' : ''}`}
              placeholder="ihre.email@beispiel.de"
              disabled={isLoading}
            />
            {errors.email && <p className="mt-1 text-xs text-red-500 font-nexa-book">{errors.email.message}</p>}
          </div>
          
          <div className="pt-4">
            <button
              type="submit"
              className={buttonClass}
              disabled={isLoading}
            >
              {isLoading ? 'Wird gesendet...' : 'Reset-Link senden'}
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

export default ResetPasswordPage;