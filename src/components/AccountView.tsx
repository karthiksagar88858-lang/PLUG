import React, { useState, useEffect } from 'react';
import {
  User,
  ShieldCheck,
  BadgeCheck,
  CreditCard,
  Camera,
  Users,
  LogOut,
  LogIn,
  Check,
  Sparkles,
  Phone,
  Mail,
  QrCode,
  Upload,
  Edit2,
  Trash2,
  ExternalLink,
  Eye,
  AlertCircle,
  Palette,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CameraModal } from './CameraModal';
import { AvatarCreatorModal } from './AvatarCreatorModal';
import { validateUpiId } from '../utils/auth';

interface AccountViewProps {
  onOpenAiHelp: () => void;
  onOpenScaleDiagnostics?: () => void;
}

export const AccountView: React.FC<AccountViewProps> = ({ onOpenAiHelp, onOpenScaleDiagnostics }) => {
  const {
    currentUser,
    allUsers,
    switchAccount,
    updateAvatar,
    updatePaymentDetails,
    updateProfile,
    deleteAccount,
    logout,
    openAuthModal,
    isAuthenticated,
  } = useAuth();

  // Camera modal state
  const [cameraMode, setCameraMode] = useState<'avatar' | 'qr'>('avatar');
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editRegNumber, setEditRegNumber] = useState('');
  const [editBranch, setEditBranch] = useState('');

  // Payment UPI & QR Scanner state
  const [isEditingPayment, setIsEditingPayment] = useState(false);
  const [upiIdInput, setUpiIdInput] = useState('');
  const [upiAppSelect, setUpiAppSelect] = useState<'googlepay' | 'phonepe' | 'paytm' | 'other'>('phonepe');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [paymentNotice, setPaymentNotice] = useState<string | null>(null);
  const [previewQrModal, setPreviewQrModal] = useState(false);

  // Avatar Creator modal state
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

  // Logout and Delete Account confirmation dialogs
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Sync state when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setEditName(currentUser.name);
      setEditRegNumber(currentUser.regNumber);
      setEditBranch(currentUser.branch);
      setUpiIdInput(currentUser.upiId || '');
      setUpiAppSelect(currentUser.upiApp || 'phonepe');
      setQrCodeDataUrl(currentUser.qrScannerUrl || null);
    }
  }, [currentUser]);

  // Handle saving student profile details
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;
    updateProfile({
      name: editName.trim(),
      regNumber: editRegNumber.trim() || currentUser?.regNumber,
      branch: editBranch.trim() || currentUser?.branch,
    });
    setIsEditingProfile(false);
    setPaymentNotice('Student profile & ID details updated successfully.');
    setTimeout(() => setPaymentNotice(null), 3500);
  };

  // Handle saving payment details
  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (upiIdInput.trim() && !validateUpiId(upiIdInput.trim())) {
      setPaymentNotice('Error: Please enter a valid UPI ID (e.g. yourname@upi or name@bank).');
      return;
    }

    updatePaymentDetails(upiIdInput.trim(), upiAppSelect, qrCodeDataUrl || undefined);
    setIsEditingPayment(false);
    setPaymentNotice('PhonePe / Google Pay UPI & Scanner updated successfully!');
    setTimeout(() => setPaymentNotice(null), 3500);
  };

  // Handle QR image file upload
  const handleQrFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setQrCodeDataUrl(reader.result as string);
        setIsEditingPayment(true);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="p-4 pb-28 space-y-4">
      {/* Feedback Toast / Notice */}
      {paymentNotice && (
        <div className="p-3 bg-amber-50 border border-amber-300 text-amber-950 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{paymentNotice}</span>
        </div>
      )}

      {/* Main Student Profile & ID Card */}
      {isAuthenticated && currentUser ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-2xs space-y-3">
          <div className="flex items-start gap-3">
            {/* Avatar with Creator Trigger */}
            <div className="relative group shrink-0">
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-[#fbbf24] shadow-xs cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setIsAvatarModalOpen(true)}
              />
              <button
                type="button"
                onClick={() => setIsAvatarModalOpen(true)}
                className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center border-2 border-white shadow-xs hover:bg-[#fbbf24] hover:text-slate-950 transition-colors cursor-pointer"
                title="Edit avatar with custom builder"
                aria-label="Edit avatar"
              >
                <Palette className="w-3 h-3 text-[#fbbf24]" />
              </button>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-1 truncate">
                  <span>{currentUser.name}</span>
                  <BadgeCheck className="w-4 h-4 text-teal-600 shrink-0" />
                </h3>
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(!isEditingProfile)}
                  className="text-slate-600 hover:text-slate-900 text-[11px] font-bold flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-gray-100"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>{isEditingProfile ? 'Cancel' : 'Edit ID'}</span>
                </button>
              </div>

              <p className="text-xs text-gray-500 font-medium">
                Student ID / Reg #{currentUser.regNumber} • {currentUser.branch}
              </p>

              <div className="flex items-center gap-1.5 text-[11px] text-gray-600 mt-0.5">
                {currentUser.authType === 'email' ? (
                  <Mail className="w-3 h-3 text-gray-400 shrink-0" />
                ) : (
                  <Phone className="w-3 h-3 text-gray-400 shrink-0" />
                )}
                <span className="truncate">{currentUser.identifier}</span>
              </div>
            </div>
          </div>

          {/* Inline Profile ID Editor */}
          {isEditingProfile && (
            <form onSubmit={handleSaveProfile} className="pt-3 border-t border-gray-100 space-y-2.5">
              <span className="text-[11px] font-bold text-slate-900 block">
                Update Student ID Information:
              </span>
              <div>
                <label className="text-[10px] font-bold text-gray-600 block">Student Full Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-slate-900"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-gray-600 block">Registration Number</label>
                  <input
                    type="text"
                    value={editRegNumber}
                    onChange={(e) => setEditRegNumber(e.target.value)}
                    placeholder="Enter your UMS registration number"
                    autoComplete="off"
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-600 block">Department / Branch</label>
                  <input
                    type="text"
                    value={editBranch}
                    onChange={(e) => setEditBranch(e.target.value)}
                    placeholder="B.Tech CSE"
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs font-black bg-slate-900 text-white rounded-lg hover:bg-slate-800"
                >
                  Save ID Changes
                </button>
              </div>
            </form>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
            <button
              type="button"
              onClick={() => setIsAvatarModalOpen(true)}
              className="text-amber-600 font-bold hover:underline flex items-center gap-1.5 cursor-pointer"
            >
              <Palette className="w-3.5 h-3.5 text-amber-500" />
              <span>Edit Avatar</span>
            </button>

            <span className="text-[10px] font-bold bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full border border-teal-200">
              ✓ UMS Verified
            </span>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center space-y-3 shadow-2xs">
          <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <User className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900">
              Join LPU Campus Peer Network
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Create an account or log in with your email or mobile number to buy, sell, and rent.
            </p>
          </div>
          <button
            type="button"
            onClick={() => openAuthModal('Log in or create a student account')}
            className="w-full py-2.5 bg-[#fbbf24] hover:bg-[#f59e0b] text-slate-950 font-black text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In / Create Student Account</span>
          </button>
        </div>
      )}

      {/* CORE FEATURE: PhonePe & Google Pay UPI and Payment QR Scanner */}
      {isAuthenticated && currentUser && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                <QrCode className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900">
                  Payment Scanner & UPI (PhonePe / GPay)
                </h4>
                <p className="text-[10px] text-gray-500">
                  Buyers can pay or scan your QR code directly for your ads
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsEditingPayment(!isEditingPayment)}
              className="text-xs font-bold text-amber-600 hover:underline"
            >
              {isEditingPayment ? 'Cancel' : 'Edit Payment'}
            </button>
          </div>

          {/* Active Payment Details View */}
          {!isEditingPayment ? (
            <div className="space-y-3 pt-1">
              {/* UPI ID Badge & Status */}
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-gray-500 font-bold block uppercase tracking-wide">
                    {currentUser.upiApp === 'googlepay'
                      ? 'Google Pay UPI ID'
                      : currentUser.upiApp === 'paytm'
                      ? 'Paytm UPI ID'
                      : 'PhonePe UPI ID'}
                  </span>
                  <span className="text-xs font-black text-slate-900 mt-0.5 block font-mono">
                    {currentUser.upiId || 'Not configured yet'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {currentUser.upiApp === 'googlepay' ? (
                    <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                      GPay Active
                    </span>
                  ) : currentUser.upiApp === 'paytm' ? (
                    <span className="text-[10px] font-bold bg-cyan-50 text-cyan-700 px-2 py-0.5 rounded-full border border-cyan-200">
                      Paytm Active
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full border border-purple-200">
                      PhonePe Active
                    </span>
                  )}
                </div>
              </div>

              {/* QR Scanner Display / Preview */}
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 bg-white rounded-lg border border-gray-300 p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                    {currentUser.qrScannerUrl ? (
                      <img
                        src={currentUser.qrScannerUrl}
                        alt="Payment QR"
                        className="w-full h-full object-contain cursor-pointer"
                        onClick={() => setPreviewQrModal(true)}
                      />
                    ) : (
                      <QrCode className="w-7 h-7 text-gray-300" />
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      {currentUser.qrScannerUrl
                        ? 'Payment QR Scanner Attached'
                        : 'No Payment QR Scanner Uploaded'}
                    </span>
                    <span className="text-[10px] text-gray-500 block">
                      {currentUser.qrScannerUrl
                        ? 'Tap to preview full-screen QR for buyers to scan'
                        : 'Snap your PhonePe / GPay QR standee or card'}
                    </span>
                  </div>
                </div>

                {currentUser.qrScannerUrl ? (
                  <button
                    type="button"
                    onClick={() => setPreviewQrModal(true)}
                    className="p-2 text-slate-700 hover:text-slate-950 bg-white border border-gray-200 rounded-lg shadow-2xs"
                    title="View QR Code"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsEditingPayment(true)}
                    className="text-xs font-bold text-slate-900 bg-[#fbbf24] px-2.5 py-1.5 rounded-lg hover:bg-[#f59e0b] shadow-2xs cursor-pointer"
                  >
                    + Add QR
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Editing Payment Form */
            <form onSubmit={handleSavePayment} className="space-y-3 pt-1">
              {/* Preferred UPI App */}
              <div>
                <label className="text-[10px] font-bold text-gray-700 block mb-1">
                  Select Preferred Payment App:
                </label>
                <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setUpiAppSelect('phonepe')}
                    className={`py-1.5 px-2 rounded-lg font-bold border text-center transition-all ${
                      upiAppSelect === 'phonepe'
                        ? 'bg-purple-700 text-white border-purple-700'
                        : 'bg-white text-slate-700 border-gray-200'
                    }`}
                  >
                    PhonePe
                  </button>
                  <button
                    type="button"
                    onClick={() => setUpiAppSelect('googlepay')}
                    className={`py-1.5 px-2 rounded-lg font-bold border text-center transition-all ${
                      upiAppSelect === 'googlepay'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-700 border-gray-200'
                    }`}
                  >
                    Google Pay
                  </button>
                  <button
                    type="button"
                    onClick={() => setUpiAppSelect('paytm')}
                    className={`py-1.5 px-2 rounded-lg font-bold border text-center transition-all ${
                      upiAppSelect === 'paytm'
                        ? 'bg-cyan-600 text-white border-cyan-600'
                        : 'bg-white text-slate-700 border-gray-200'
                    }`}
                  >
                    Paytm / BHIM
                  </button>
                </div>
              </div>

              {/* UPI ID Input */}
              <div>
                <label className="text-[10px] font-bold text-gray-700 block mb-1">
                  Virtual Payment Address (UPI ID)
                </label>
                <input
                  type="text"
                  value={upiIdInput}
                  onChange={(e) => setUpiIdInput(e.target.value)}
                  placeholder="Enter your UPI ID (e.g. yourname@upi)"
                  autoComplete="off"
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-slate-900 font-mono"
                />
                <span className="text-[10px] text-gray-500 mt-0.5 block">
                  Format: handle@bank (e.g. @ybl for PhonePe, @okhdfcbank for Google Pay)
                </span>
              </div>

              {/* Payment QR Scanner Attachment */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-700 block">
                  Payment QR Scanner Image / Snapshot
                </label>

                {qrCodeDataUrl ? (
                  <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-xl border border-gray-200">
                    <img
                      src={qrCodeDataUrl}
                      alt="QR Preview"
                      className="w-16 h-16 object-contain bg-white rounded-lg border border-gray-300"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-bold text-slate-900 block truncate">
                        Payment QR Code Attached
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setCameraMode('qr');
                            setIsCameraOpen(true);
                          }}
                          className="text-[10px] font-bold text-amber-600 hover:underline"
                        >
                          Retake with Camera
                        </button>
                        <span className="text-gray-300">•</span>
                        <button
                          type="button"
                          onClick={() => setQrCodeDataUrl(null)}
                          className="text-[10px] font-bold text-red-600 hover:underline"
                        >
                          Remove QR
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {/* Snap QR with Camera Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setCameraMode('qr');
                        setIsCameraOpen(true);
                      }}
                      className="py-2.5 px-3 bg-slate-950 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-slate-800 cursor-pointer shadow-xs"
                    >
                      <Camera className="w-3.5 h-3.5 text-amber-400" />
                      <span>Snap QR Camera</span>
                    </button>

                    {/* Upload QR File Input */}
                    <label className="py-2.5 px-3 bg-white border border-gray-300 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-gray-50 cursor-pointer shadow-xs">
                      <Upload className="w-3.5 h-3.5 text-slate-600" />
                      <span>Upload QR File</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleQrFileUpload}
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* Form Action Buttons */}
              <div className="flex gap-2 justify-end pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsEditingPayment(false)}
                  className="px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-black bg-[#fbbf24] hover:bg-[#f59e0b] text-slate-950 rounded-xl shadow-xs"
                >
                  Save Payment & QR
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Multiple Students Session Switcher */}
      <div className="bg-white border border-gray-200 rounded-xl p-3.5 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-800" />
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Logged-in Campus Accounts
            </h4>
          </div>
          <button
            type="button"
            onClick={() => openAuthModal('Add or log in with another student ID')}
            className="text-[11px] font-bold text-amber-600 hover:underline cursor-pointer"
          >
            + Add Another Student ID
          </button>
        </div>
        <p className="text-[11px] text-gray-500">
          Anyone can sign up and switch freely between different student IDs:
        </p>

        {allUsers.length === 0 ? (
          <div className="p-3 bg-gray-50 rounded-lg text-center text-xs text-gray-500">
            No student accounts active yet. Sign in or register above!
          </div>
        ) : (
          <div className="space-y-1.5">
            {allUsers.map((u) => {
              const isActive = currentUser?.id === u.id;
              return (
                <div
                  key={u.id}
                  className={`w-full p-2.5 rounded-lg border text-left flex items-center justify-between transition-all ${
                    isActive
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-gray-50 hover:bg-gray-100 text-slate-800 border-gray-200'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => switchAccount(u.id)}
                    className="flex items-center gap-2.5 truncate flex-1 cursor-pointer text-left"
                  >
                    <img
                      src={u.avatarUrl}
                      alt={u.name}
                      className="w-7 h-7 rounded-full object-cover shrink-0 border border-white"
                    />
                    <div className="truncate">
                      <span className="font-bold block text-xs truncate leading-tight">
                        {u.name}
                      </span>
                      <span
                        className={`text-[10px] block truncate ${
                          isActive ? 'text-slate-300' : 'text-gray-500'
                        }`}
                      >
                        ID: {u.regNumber} • {u.identifier}
                      </span>
                    </div>
                  </button>

                  <div className="flex items-center gap-2 shrink-0">
                    {isActive ? (
                      <span className="text-[10px] font-bold text-[#fbbf24] flex items-center gap-0.5">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Active</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => switchAccount(u.id)}
                        className="text-[10px] text-gray-500 hover:text-slate-900 font-bold px-2 py-1 bg-white border border-gray-200 rounded-md"
                      >
                        Switch
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => deleteAccount(u.id)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      title="Remove Account"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Escrow Balance & Micro-Rental Wallet */}
      <div className="bg-[#0b242a] text-white rounded-2xl p-4 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
            <CreditCard className="w-4 h-4 text-[#fbbf24]" />
            <span>Student Escrow Wallet</span>
          </span>
          <span className="text-[10px] bg-[#fbbf24] text-slate-950 font-black px-2 py-0.5 rounded-xs">
            SECURE
          </span>
        </div>

        <div className="flex items-baseline justify-between">
          <div>
            <span className="text-2xl font-black text-white">
              ₹ {currentUser ? currentUser.walletBalance.toLocaleString('en-IN') : '0'}
            </span>
            <span className="text-xs text-slate-300 ml-1">in active deposit</span>
          </div>
          {currentUser?.upiId && (
            <span className="text-xs font-bold text-[#fbbf24]">
              Direct to {currentUser.upiApp === 'googlepay' ? 'GPay' : 'PhonePe'}
            </span>
          )}
        </div>

        <p className="text-[11px] text-slate-300 border-t border-slate-700/60 pt-2 leading-relaxed">
          Escrow payments release directly to your linked UPI address once peer handover is confirmed.
        </p>
      </div>

      {/* AI Help & Scale Diagnostics Links */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100 text-xs font-bold text-slate-800">
        <button
          type="button"
          onClick={onOpenAiHelp}
          className="w-full p-3 flex items-center justify-between hover:bg-gray-50 transition-colors text-left cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Ask PLUG AI Campus Advisor (gemini-4-argon)</span>
          </div>
          <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-xs">
            HIGH THINKING
          </span>
        </button>

        <div className="p-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>LPU Hostel Electric Appliance Guidelines</span>
          </div>
          <span className="text-[10px] text-gray-400">1800W max</span>
        </div>

        {onOpenScaleDiagnostics && (
          <button
            type="button"
            onClick={onOpenScaleDiagnostics}
            className="w-full p-3 flex items-center justify-between hover:bg-emerald-50/50 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-emerald-950 font-bold">30,000+ Campus Concurrency Monitor</span>
            </div>
            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-bold">
              Edge Active
            </span>
          </button>
        )}

        {isAuthenticated && (
          <>
            <button
              type="button"
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full p-3 flex items-center justify-between hover:bg-amber-50 text-amber-800 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <LogOut className="w-4 h-4 text-amber-600" />
                <span>Log Out of Current Session</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full p-3 flex items-center justify-between hover:bg-red-50 text-red-600 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Trash2 className="w-4 h-4" />
                <span>Delete Account Permanently</span>
              </div>
            </button>
          </>
        )}
      </div>

      {/* Custom Avatar Creator Modal */}
      {currentUser && (
        <AvatarCreatorModal
          isOpen={isAvatarModalOpen}
          onClose={() => setIsAvatarModalOpen(false)}
          onSave={(newAvatarUrl) => {
            updateAvatar(newAvatarUrl);
            setPaymentNotice('Profile avatar updated successfully!');
            setTimeout(() => setPaymentNotice(null), 3000);
          }}
          currentAvatarUrl={currentUser.avatarUrl}
          userName={currentUser.name}
        />
      )}

      {/* Confirmation Modal: Log Out */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-3 text-center shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <LogOut className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-black text-slate-900">
              Log Out of PLUG?
            </h4>
            <p className="text-xs text-gray-500">
              Your active session will be cleared on this device. You can log back in anytime using your registered campus email or phone number.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="py-2.5 px-3 bg-gray-100 hover:bg-gray-200 text-slate-800 font-bold text-xs rounded-xl"
              >
                Stay Logged In
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLogoutConfirm(false);
                  logout();
                }}
                className="py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl shadow-xs"
              >
                Yes, Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Delete Account */}
      {showDeleteConfirm && currentUser && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-3 text-center shadow-2xl border border-red-100">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-black text-slate-900">
              Permanently Delete Account?
            </h4>
            <p className="text-xs text-gray-500 leading-relaxed">
              Are you sure, <strong className="text-slate-900">{currentUser.name}</strong>? This action cannot be undone. All your saved profile data, settings, and local sessions will be permanently purged.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="py-2.5 px-3 bg-gray-100 hover:bg-gray-200 text-slate-800 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const targetId = currentUser.id;
                  setShowDeleteConfirm(false);
                  deleteAccount(targetId);
                }}
                className="py-2.5 px-3 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-xl shadow-xs"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Camera Modal for Profile Photo or QR Scanner Snap */}
      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(dataUrl) => {
          if (cameraMode === 'avatar') {
            updateAvatar(dataUrl);
          } else {
            setQrCodeDataUrl(dataUrl);
            setIsEditingPayment(true);
          }
        }}
        title={
          cameraMode === 'avatar'
            ? 'Snap Student Profile Picture'
            : 'Snap Photo of PhonePe / Google Pay QR Scanner'
        }
        facingModeDefault={cameraMode === 'avatar' ? 'user' : 'environment'}
      />

      {/* Full Screen QR Scanner Preview Modal */}
      {previewQrModal && currentUser?.qrScannerUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 text-center space-y-3 shadow-2xl relative">
            <h4 className="text-sm font-black text-slate-900">
              {currentUser.name}'s Payment QR Scanner
            </h4>
            <p className="text-[11px] text-gray-500">
              Scan with PhonePe, Google Pay, or Paytm to pay
            </p>
            <div className="w-64 h-64 mx-auto bg-gray-50 border border-gray-200 rounded-xl p-2 flex items-center justify-center overflow-hidden">
              <img
                src={currentUser.qrScannerUrl}
                alt="Payment QR"
                className="w-full h-full object-contain"
              />
            </div>
            {currentUser.upiId && (
              <div className="p-2 bg-gray-100 rounded-lg text-xs font-mono text-slate-800 font-bold">
                UPI ID: {currentUser.upiId}
              </div>
            )}
            <button
              type="button"
              onClick={() => setPreviewQrModal(false)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl"
            >
              Close QR Preview
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
