import React, { useState } from 'react';
import {
  X,
  Mail,
  Phone,
  ShieldCheck,
  Camera,
  Check,
  User,
  LogIn,
  UserPlus,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CameraModal } from './CameraModal';
import { generateNameAvatar } from '../utils/avatar';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    closeAuthModal,
    login,
    register,
    allUsers,
    switchAccount,
    currentUser,
    authIntentMessage,
  } = useAuth();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [identifierType, setIdentifierType] = useState<'email' | 'phone'>('email');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [branch, setBranch] = useState('B.Tech CSE');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [upiId, setUpiId] = useState('');
  const [upiApp, setUpiApp] = useState<'googlepay' | 'phonepe' | 'paytm' | 'other'>('phonepe');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedIdentifier = identifier.trim();

    if (mode === 'login') {
      if (!trimmedIdentifier) {
        setErrorMessage(
          identifierType === 'email'
            ? 'Please enter your campus email (e.g. name@lpu.in).'
            : 'Please enter your 10-digit mobile number.'
        );
        return;
      }
      const res = login(trimmedIdentifier, password);
      if (!res.success) {
        setErrorMessage(res.error || 'Failed to log in. Please check credentials.');
      }
    } else {
      const trimmedName = name.trim();
      if (!trimmedName) {
        setErrorMessage('Please enter your full name.');
        return;
      }

      if (!trimmedIdentifier) {
        setErrorMessage(
          identifierType === 'email'
            ? 'Please enter your campus email (e.g. name@lpu.in).'
            : 'Please enter your 10-digit mobile number.'
        );
        return;
      }

      if (identifierType === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedIdentifier)) {
          setErrorMessage('Please enter a valid email format (e.g. name@lpu.in or name@gmail.com).');
          return;
        }
      } else {
        const digits = trimmedIdentifier.replace(/\D/g, '');
        if (digits.length < 10 || digits.length > 13) {
          setErrorMessage('Please enter a valid 10-digit mobile phone number.');
          return;
        }
      }

      const res = register({
        name: trimmedName,
        identifier: trimmedIdentifier,
        regNumber: regNumber.trim() || undefined,
        branch: branch.trim() || 'LPU Student',
        avatarUrl: avatarUrl || generateNameAvatar(trimmedName),
        upiId: upiId.trim() || undefined,
        upiApp,
      });
      if (!res.success) {
        setErrorMessage(res.error || 'Failed to create student account.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto no-scrollbar flex flex-col shadow-2xl relative"
        role="dialog"
        aria-modal="true"
        aria-label="Student Authentication & Profile"
      >
        {/* Top Header */}
        <div className="p-4 bg-[#0b242a] text-white flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="border border-[#fbbf24] rounded-md px-1.5 py-0.5 bg-[#fbbf24] text-slate-950 font-black text-xs">
              PLUG
            </div>
            <div>
              <h3 className="text-xs font-black text-white flex items-center gap-1.5">
                <span>LPU Student Gateway</span>
                <span className="text-[9px] bg-emerald-500 text-white px-1.5 py-0.2 rounded-xs font-bold">
                  UMS VERIFIED
                </span>
              </h3>
              <p className="text-[10px] text-slate-300">
                Peer exchange for hostelites & campus day-scholars
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeAuthModal}
            className="w-8 h-8 rounded-full bg-slate-800 text-gray-300 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Intent Message Banner */}
        {authIntentMessage && (
          <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{authIntentMessage}</span>
          </div>
        )}

        {/* Tabs: Login vs Register */}
        <div className="flex border-b border-gray-200 text-xs font-bold bg-gray-50">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMessage(null);
            }}
            className={`flex-1 py-3 text-center border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
              mode === 'login'
                ? 'border-slate-950 text-slate-950 bg-white'
                : 'border-transparent text-gray-500 hover:text-slate-800'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Log In</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMessage(null);
            }}
            className={`flex-1 py-3 text-center border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
              mode === 'signup'
                ? 'border-slate-950 text-slate-950 bg-white'
                : 'border-transparent text-gray-500 hover:text-slate-800'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Create Account</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} autoComplete="off" className="p-4 space-y-3.5 text-xs">
          {/* Identifier Type Switcher: Email vs Phone */}
          <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setIdentifierType('email')}
              className={`flex-1 py-1.5 rounded-md font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                identifierType === 'email'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-gray-500 hover:text-slate-900'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Campus Email</span>
            </button>
            <button
              type="button"
              onClick={() => setIdentifierType('phone')}
              className={`flex-1 py-1.5 rounded-md font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                identifierType === 'phone'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-gray-500 hover:text-slate-900'
              }`}
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Phone Number</span>
            </button>
          </div>

          {/* Profile Picture Option in Sign Up */}
          {mode === 'signup' && (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-full overflow-hidden bg-slate-900 border-2 border-[#fbbf24] shrink-0 flex items-center justify-center">
                  {avatarUrl || name.trim() ? (
                    <img
                      src={avatarUrl || generateNameAvatar(name.trim())}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-6 h-6 text-white" />
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">Student Profile Photo</h4>
                  <p className="text-[10px] text-gray-500">
                    Snap a selfie or upload student ID photo
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCameraOpen(true)}
                className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg flex items-center gap-1 shadow-xs cursor-pointer shrink-0"
              >
                <Camera className="w-3.5 h-3.5 text-[#fbbf24]" />
                <span>Snap Camera</span>
              </button>
            </div>
          )}

          {/* Full Name in Signup */}
          {mode === 'signup' && (
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Student Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                autoComplete="off"
                spellCheck="false"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-slate-900 text-xs"
              />
            </div>
          )}

          {/* Email or Phone Input */}
          <div>
            <label className="block font-bold text-slate-800 mb-1">
              {identifierType === 'email' ? 'Student Email' : 'Mobile Phone Number'}{' '}
              <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              {identifierType === 'email' ? (
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              ) : (
                <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              )}
              <input
                type={identifierType === 'email' ? 'email' : 'tel'}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={
                  identifierType === 'email'
                    ? 'Enter your campus email (e.g. name@lpu.in)'
                    : 'Enter your 10-digit mobile number'
                }
                autoComplete="off"
                spellCheck="false"
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-slate-900 text-xs"
              />
            </div>
          </div>

          {/* Registration Number & Branch in Sign Up */}
          {mode === 'signup' && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  UMS Reg # (Optional)
                </label>
                <input
                  type="text"
                  value={regNumber}
                  onChange={(e) => setRegNumber(e.target.value)}
                  placeholder="Enter your UMS registration number"
                  autoComplete="off"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-slate-900 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Branch / Degree
                </label>
                <input
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder="B.Tech CSE"
                  autoComplete="off"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-slate-900 text-xs"
                />
              </div>
            </div>
          )}

          {/* UPI ID for PhonePe / Google Pay in Signup */}
          {mode === 'signup' && (
            <div className="p-3 bg-amber-50/70 border border-amber-200/90 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-amber-950 text-xs flex items-center gap-1.5">
                  <span>PhonePe / Google Pay UPI ID</span>
                  <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded-xs font-bold">
                    For Instant Payouts
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => setUpiApp('phonepe')}
                  className={`py-1.5 px-2 rounded-lg font-bold border text-center transition-all ${
                    upiApp === 'phonepe'
                      ? 'bg-purple-700 text-white border-purple-700'
                      : 'bg-white text-slate-700 border-gray-200'
                  }`}
                >
                  PhonePe
                </button>
                <button
                  type="button"
                  onClick={() => setUpiApp('googlepay')}
                  className={`py-1.5 px-2 rounded-lg font-bold border text-center transition-all ${
                    upiApp === 'googlepay'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-700 border-gray-200'
                  }`}
                >
                  Google Pay
                </button>
                <button
                  type="button"
                  onClick={() => setUpiApp('paytm')}
                  className={`py-1.5 px-2 rounded-lg font-bold border text-center transition-all ${
                    upiApp === 'paytm'
                      ? 'bg-cyan-600 text-white border-cyan-600'
                      : 'bg-white text-slate-700 border-gray-200'
                  }`}
                >
                  Paytm / BHIM
                </button>
              </div>

              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="Enter your UPI ID (e.g. yourname@upi)"
                autoComplete="off"
                className="w-full px-3 py-2 bg-white border border-amber-200 rounded-lg text-slate-900 placeholder:text-gray-400 focus:outline-hidden focus:ring-1 focus:ring-slate-900 text-xs font-mono"
              />
              <p className="text-[10px] text-amber-800">
                You can also snap your payment QR code scanner anytime in your ID profile.
              </p>
            </div>
          )}

          {/* Password / Security PIN */}
          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Password or 4-Digit PIN <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-slate-900 text-xs"
            />
          </div>

          {errorMessage && (
            <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-[11px] font-medium">
              {errorMessage}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3 bg-[#fbbf24] hover:bg-[#f59e0b] text-slate-950 font-black text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>{mode === 'login' ? 'Log In to Campus Hub' : 'Register & Verify UMS ID'}</span>
            <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
          </button>

          {/* Multi-Student Quick Switcher (Multiple Logins) */}
          <div className="pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-800 text-[11px]">
                Switch Active Student Account:
              </span>
              <span className="text-[10px] text-gray-500">Multi-user active</span>
            </div>

            <div className="space-y-1.5">
              {allUsers.map((u) => {
                const isActive = currentUser?.id === u.id;
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      switchAccount(u.id);
                      closeAuthModal();
                    }}
                    className={`w-full p-2 rounded-lg border text-left flex items-center justify-between transition-all ${
                      isActive
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-gray-50 hover:bg-gray-100 text-slate-800 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <img
                        src={u.avatarUrl}
                        alt={u.name}
                        className="w-6 h-6 rounded-full object-cover shrink-0 border border-white"
                      />
                      <div className="truncate">
                        <span className="font-bold block text-[11px] truncate leading-tight">
                          {u.name}
                        </span>
                        <span
                          className={`text-[9px] block truncate ${
                            isActive ? 'text-slate-300' : 'text-gray-500'
                          }`}
                        >
                          {u.identifier} • {u.branch}
                        </span>
                      </div>
                    </div>
                    {isActive && (
                      <span className="text-[10px] font-bold text-[#fbbf24] flex items-center gap-0.5">
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span>Active</span>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </form>

        {/* Live Camera Modal for Profile Photo */}
        <CameraModal
          isOpen={isCameraOpen}
          onClose={() => setIsCameraOpen(false)}
          onCapture={(capturedDataUrl) => {
            setAvatarUrl(capturedDataUrl);
          }}
          title="Snap Student Profile Selfie"
          facingModeDefault="user"
        />
      </div>
    </div>
  );
};
