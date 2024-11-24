"use client";
import React, { useState, useEffect, useRef } from 'react';
import { toast, Toaster } from 'react-hot-toast';
import { ArrowRight } from 'lucide-react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

const OTPVerificationPage = () => {
  const [otp, setOTP] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const inputRefs = useRef([]);
  const router = useRouter();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const emailParam = urlParams.get('email');
    if (emailParam) {
      setUserEmail(emailParam);
      const masked = emailParam.replace(/(.{2})(.*)(@.*)/, '$1***$3');
      setMaskedEmail(masked);
    } else {
      // If no email in URL, redirect to registration
      router.push('/register');
    }
    
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [router]);

  const handleChange = (element, index) => {
    if (isNaN(element.value)) return false;

    setOTP(prevOTP => {
      const newOTP = [...prevOTP];
      newOTP[index] = element.value;
      return newOTP;
    });

    if (element.value !== '' && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    switch (e.key) {
      case 'Backspace':
        e.preventDefault();
        setOTP(prevOTP => {
          const newOTP = [...prevOTP];
          newOTP[index] = '';
          return newOTP;
        });
        if (index > 0) {
          inputRefs.current[index - 1].focus();
        }
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (index > 0) {
          inputRefs.current[index - 1].focus();
        }
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (index < 5) {
          inputRefs.current[index + 1].focus();
        }
        break;
      default:
        break;
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6).split('');
    const newOTP = [...otp];
    pastedData.forEach((value, index) => {
      if (index < 6 && !isNaN(value)) {
        newOTP[index] = value;
      }
    });
    setOTP(newOTP);
    const nextEmptyIndex = newOTP.findIndex(val => val === '');
    const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex;
    inputRefs.current[focusIndex].focus();
  };

  const handleSubmit = async () => {
    if (!userEmail) {
      toast.error('Email is missing. Please try registering again.');
      return;
    }

    if (otp.some(digit => digit === '')) {
      toast.error('Please enter the complete verification code.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post('http://http://35.156.80.11:8080/auth/verify-otp', {
        email: userEmail,
        otp: otp.join(''),
      });

      toast.success(response.data.message || 'Account verified successfully!');
      // Redirect to login page after successful verification
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Verification failed. Please try again.';
      toast.error(errorMessage);
      setOTP(['', '', '', '', '', '']);
      inputRefs.current[0].focus();
    } finally {
      setIsLoading(false);
    }
  };

    const handleResendOTP = async () => {
      if (!userEmail) {
        toast.error('Email is missing. Please try registering again.');
        return;
      }
    
      try {
        // Show loading state for better UX
        toast.loading('Sending new code...');
    
        const response = await axios.post('http://http://35.156.80.11:8080/auth/resend-otp', {
          email: userEmail,
          otp: '000000' // Sending a dummy OTP since the schema requires it
        }, {
          // Adding timeout to handle slow responses
          timeout: 10000
        });
    
        // Dismiss loading toast before showing success
        toast.dismiss();
        toast.success(response.data.message);
        
        // Reset OTP input fields
        setOTP(['', '', '', '', '', '']);
        inputRefs.current[0].focus();
      } catch (error) {
        // Dismiss loading toast before showing error
        toast.dismiss();
        
        let errorMessage = 'Failed to resend code. Please try again.';
        
        if (error.response) {
          // Handle specific error responses
          switch (error.response.status) {
            case 404:
              errorMessage = "No registration process found for this email. Please register again.";
              // Redirect to registration after showing error
              setTimeout(() => {
                router.push('/register');
              }, 2000);
              break;
            case 500:
              errorMessage = "Server error. Please try again later.";
              break;
            default:
              errorMessage = error.response.data.detail || errorMessage;
          }
        } else if (error.code === 'ECONNABORTED') {
          errorMessage = 'Request timed out. Please check your connection and try again.';
        } else if (!error.response) {
          errorMessage = 'Network error. Please check your connection.';
        }
        
        toast.error(errorMessage);
    
        // Only reset OTP for certain errors
        if (error.response?.status === 400) {
          setOTP(['', '', '', '', '', '']);
          inputRefs.current[0].focus();
        }
      }
    };
  const inputClass = "w-12 h-12 text-center text-xl font-semibold rounded-md border border-yellow-400 shadow-sm focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 hover:border-gray-400 transition-all duration-200";
  const buttonClass = "w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-yellow-400 hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <Toaster />
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <div className="text-center space-y-2 mb-8">
          <h2 className="text-4xl font-extrabold text-gray-800">Verification Code</h2>
          <p className="text-gray-500">
            We've sent a code to your email
          </p>
          {maskedEmail && (
            <p className="text-gray-900 font-medium">
              {maskedEmail}
            </p>
          )}
        </div>

        <div className="flex justify-between mb-8">
          {otp.map((digit, index) => (
            <input
              key={index}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="\d{1}"
              maxLength="1"
              ref={el => inputRefs.current[index] = el}
              value={digit}
              onChange={e => handleChange(e.target, index)}
              onKeyDown={e => handleKeyDown(e, index)}
              onPaste={handlePaste}
              className={inputClass}
            />
          ))}
        </div>

        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className={buttonClass}
        >
          {isLoading ? 'Verifying...' : (
            <>
              <span>Verify</span>
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </button>

        <div className="mt-4 text-center text-sm">
          <span className="text-gray-600">Didn't receive the code? </span>
          <button 
            onClick={handleResendOTP}
            className="font-medium text-black hover:underline focus:outline-none"
          >
            Resend
          </button>
        </div>
      </div>
    </div>
  );
};

export default OTPVerificationPage;