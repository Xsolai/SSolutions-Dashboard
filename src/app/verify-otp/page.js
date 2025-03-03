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
      // Redirect to registration if no email
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
      toast.error('E-Mail fehlt. Bitte registrieren Sie sich erneut.');
      return;
    }

    if (otp.some(digit => digit === '')) {
      toast.error('Bitte geben Sie den vollständigen Verifizierungscode ein.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post('https://solasolution.ecomtask.de/dev/auth/verify-otp', {
        email: userEmail,
        otp: otp.join(''),
      });

      toast.success(response.data.message || 'Konto erfolgreich verifiziert!');
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Verifizierung fehlgeschlagen. Bitte versuchen Sie es erneut.';
      toast.error(errorMessage);
      setOTP(['', '', '', '', '', '']);
      inputRefs.current[0].focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!userEmail) {
      toast.error('E-Mail fehlt. Bitte registrieren Sie sich erneut.');
      return;
    }
  
    try {
      toast.loading('Neuer Code wird gesendet...');
  
      const response = await axios.post('https://solasolution.ecomtask.de/dev/auth/resend-otp', {
        email: userEmail,
        otp: '000000'
      }, {
        timeout: 10000
      });
  
      toast.dismiss();
      toast.success(response.data.message);
      
      setOTP(['', '', '', '', '', '']);
      inputRefs.current[0].focus();
    } catch (error) {
      toast.dismiss();
      
      let errorMessage = 'Code konnte nicht erneut gesendet werden. Bitte versuchen Sie es erneut.';
      
      if (error.response) {
        switch (error.response.status) {
          case 404:
            errorMessage = "Kein Registrierungsprozess für diese E-Mail gefunden. Bitte registrieren Sie sich erneut.";
            setTimeout(() => {
              router.push('/register');
            }, 2000);
            break;
          case 500:
            errorMessage = "Serverfehler. Bitte versuchen Sie es später erneut.";
            break;
          default:
            errorMessage = error.response.data.detail || errorMessage;
        }
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Zeitüberschreitung. Bitte überprüfen Sie Ihre Verbindung und versuchen Sie es erneut.';
      } else if (!error.response) {
        errorMessage = 'Netzwerkfehler. Bitte überprüfen Sie Ihre Verbindung.';
      }
      
      toast.error(errorMessage);
  
      if (error.response?.status === 400) {
        setOTP(['', '', '', '', '', '']);
        inputRefs.current[0].focus();
      }
    }
  };

  const inputClass = `
  w-12 h-12 
  text-center text-[17px] font-nexa-book 
  rounded-md border border-[#F0B72F] shadow-sm 
  text-[#001E4A] 
  focus:outline-none focus:border-[#F0B72F] focus:ring-1 focus:ring-[#F0B72F] 
  hover:border-[#E6E2DF] 
  transition-all duration-200
`;

const buttonClass = `
  w-full px-4 py-2 
  border border-transparent rounded-md shadow-sm 
  text-[17px] leading-[27px] font-nexa-black 
  text-[#001E4A] bg-[#F0B72F] 
  hover:bg-[#F0B72F]/90 
  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#001E4A] 
  transition-colors duration-200 
  flex items-center justify-center 
  disabled:opacity-50 disabled:cursor-not-allowed
`;

return (
  <div className="flex justify-center items-center min-h-screen bg-[#E6E2DF]/10">
    <Toaster />
    <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-[42px] leading-[54px] font-nexa-black text-[#001E4A]">
          Bestätigungscode
        </h2>
        <p className="text-[17px] leading-[27px] font-nexa-book text-[#001E4A]/70">
          Wir haben einen Code an Ihre E-Mail gesendet
        </p>
        {maskedEmail && (
          <p className="text-[17px] leading-[27px] font-nexa-black text-[#001E4A]">
            {maskedEmail}
          </p>
        )}
      </div>

      <div className="flex justify-between mb-8 gap-2">
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
        {isLoading ? 'Wird verifiziert...' : (
          <>
            <span>Verifizieren</span>
            <ArrowRight className="ml-2 h-4 w-4" />
          </>
        )}
      </button>

      <div className="mt-4 text-center text-[17px] leading-[27px]">
        <span className="font-nexa-book text-[#001E4A]/70">Keinen Code erhalten? </span>
        <button 
          onClick={handleResendOTP}
          className="font-nexa-black text-[#001E4A] hover:text-[#F0B72F] transition-colors"
        >
          Erneut senden
        </button>
      </div>
    </div>
  </div>
);
};

export default OTPVerificationPage;