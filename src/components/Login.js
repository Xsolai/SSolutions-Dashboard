"use client";
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const signupSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Confirm password must be at least 8 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords must match',
  path: ['confirmPassword'],
});

const LoginSignupPages = () => {
  const [isLogin, setIsLogin] = useState(true);
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(isLogin ? loginSchema : signupSchema),
  });
  const router = useRouter();

  const onSubmit = (data) => {
    // Simulating login/signup
    router.push('/dashboard');
  };

  return (
    <div className="flex items-center justify-center h-full py-24 bg-gray-900">
      <div className="w-full max-w-md bg-gray-800 p-8 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-white mb-8">
          {isLogin ? 'Welcome Back' : 'Create an Account'}
        </h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {!isLogin && (
            <div>
              <label htmlFor="name" className="block font-medium mb-2 text-gray-300">
                Name
              </label>
              <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </span>
              <input
                id="name"
                type="text"
                placeholder="Enter your name"
                className="block w-full pl-12 pr-4 py-3 rounded-md bg-gray-700 border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...register('name')}
              />
              {errors.name && (
                <p className="text-red-500 mt-2">{errors.name.message}</p>
              )}
            </div>
            </div>
          )}
          <div>
            <label htmlFor="email" className="block font-medium mb-2 text-gray-300">
              Email
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </span>
              <input
                id="email"
                type="email"
                placeholder="name@example.com"
                className="block w-full pl-12 pr-4 py-3 rounded-md bg-gray-700 border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...register('email')}
              />
            </div>
            {errors.email && (
              <p className="text-red-500 mt-2">{errors.email.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="password" className="block font-medium mb-2 text-gray-300">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </span>
              <input
                id="password"
                type="password"
                placeholder="Password"
                className="block w-full pl-12 pr-4 py-3 rounded-md bg-gray-700 border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...register('password')}
              />
            </div>
            {errors.password && (
              <p className="text-red-500 mt-2">{errors.password.message}</p>
            )}
          </div>
          {!isLogin && (
            <div>
              <label htmlFor="confirmPassword" className="block font-medium mb-2 text-gray-300">
                Confirm Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </span>
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm Password"
                  className="block w-full pl-12 pr-4 py-3 rounded-md bg-gray-700 border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  {...register('confirmPassword')}
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 mt-2">{errors.confirmPassword.message}</p>
              )}
            </div>
          )}
          <button
            type="submit"
            className="w-full py-3 px-4 rounded-md bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white font-medium"
          >
            {isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>
        <div className="mt-6 text-center text-gray-300">
          <span className="mr-2">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}
          </span>
          <Link
            href="#"
            className="text-blue-500 hover:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? 'Sign Up' : 'Sign In'}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginSignupPages;