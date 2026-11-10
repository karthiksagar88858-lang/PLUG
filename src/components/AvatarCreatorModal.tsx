import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Sparkles,
  Shuffle,
  Camera,
  Upload,
  Palette,
  Check,
  RefreshCw,
} from 'lucide-react';
import {
  AvatarOptions,
  DEFAULT_AVATAR_OPTIONS,
  SKIN_TONES,
  HAIR_COLORS,
  CLOTHES_COLORS,
  BG_COLORS,
  FACE_SHAPES,
  HAIR_STYLES,
  EYE_STYLES,
  ACCESSORIES,
  CLOTHES_STYLES,
  generateAvatarSvg,
  svgToDataUrl,
} from '../utils/avatar';

interface AvatarCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (avatarUrl: string) => void;
  currentAvatarUrl?: string;
  userName?: string;
}

export const AvatarCreatorModal: React.FC<AvatarCreatorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentAvatarUrl,
  userName,
}) => {
  const [activeTab, setActiveTab] = useState<'designer' | 'upload' | 'camera'>('designer');
  const [options, setOptions] = useState<AvatarOptions>(DEFAULT_AVATAR_OPTIONS);

  // Upload state
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);

  // Camera state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null);

  // Initialize options based on userName or defaults
  useEffect(() => {
    if (isOpen) {
      setUploadedImageUrl(null);
      setCapturedPhotoUrl(null);
      setCameraError(null);
    }
  }, [isOpen]);

  // Handle camera stream
  useEffect(() => {
    let stream: MediaStream | null = null;
    if (isOpen && activeTab === 'camera') {
      navigator.mediaDevices
        ?.getUserMedia({ video: { facingMode: 'user' } })
        .then((s) => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
            videoRef.current.play().catch(console.error);
          }
          setIsCameraActive(true);
        })
        .catch((err) => {
          console.warn('Camera access denied or unavailable', err);
          setCameraError('Camera access unavailable. You can use Avatar Designer or Upload Photo.');
          setIsCameraActive(false);
        });
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      setIsCameraActive(false);
    };
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  const currentSvg = generateAvatarSvg(options);
  const currentSvgDataUrl = svgToDataUrl(currentSvg);

  const handleRandomize = () => {
    const randomSkin = SKIN_TONES[Math.floor(Math.random() * SKIN_TONES.length)].value;
    const randomFace = FACE_SHAPES[Math.floor(Math.random() * FACE_SHAPES.length)];
    const randomHair = HAIR_STYLES[Math.floor(Math.random() * HAIR_STYLES.length)];
    const randomHairColor = HAIR_COLORS[Math.floor(Math.random() * HAIR_COLORS.length)].value;
    const randomEyes = EYE_STYLES[Math.floor(Math.random() * EYE_STYLES.length)];
    const randomAcc = ACCESSORIES[Math.floor(Math.random() * ACCESSORIES.length)];
    const randomClothes = CLOTHES_STYLES[Math.floor(Math.random() * CLOTHES_STYLES.length)];
    const randomClothesColor = CLOTHES_COLORS[Math.floor(Math.random() * CLOTHES_COLORS.length)].value;
    const randomBg = BG_COLORS[Math.floor(Math.random() * BG_COLORS.length)].value;

    setOptions({
      skinTone: randomSkin,
      faceShape: randomFace,
      hairStyle: randomHair,
      hairColor: randomHairColor,
      eyeStyle: randomEyes,
      accessory: randomAcc,
      clothesStyle: randomClothes,
      clothesColor: randomClothesColor,
      bgColor: randomBg,
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCaptureCamera = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 320;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const video = videoRef.current;
      const minDim = Math.min(video.videoWidth || 320, video.videoHeight || 320);
      const startX = ((video.videoWidth || 320) - minDim) / 2;
      const startY = ((video.videoHeight || 320) - minDim) / 2;
      ctx.drawImage(video, startX, startY, minDim, minDim, 0, 0, 320, 320);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setCapturedPhotoUrl(dataUrl);
    }
  };

  const handleSave = () => {
    if (activeTab === 'upload' && uploadedImageUrl) {
      onSave(uploadedImageUrl);
    } else if (activeTab === 'camera' && capturedPhotoUrl) {
      onSave(capturedPhotoUrl);
    } else {
      onSave(currentSvgDataUrl);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#fbbf24] text-slate-950 flex items-center justify-center font-black">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">Campus Avatar Creator</h3>
              <p className="text-[11px] text-slate-300">
                Design your custom LPU identity or take a photo
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-3 border-b border-gray-200 bg-gray-50 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('designer')}
            className={`py-2.5 flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'designer'
                ? 'bg-white text-slate-900 border-b-2 border-slate-950 font-black'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Palette className="w-3.5 h-3.5 text-amber-500" />
            <span>Designer</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`py-2.5 flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'upload'
                ? 'bg-white text-slate-900 border-b-2 border-slate-950 font-black'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5 text-emerald-600" />
            <span>Upload Photo</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('camera')}
            className={`py-2.5 flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'camera'
                ? 'bg-white text-slate-900 border-b-2 border-slate-950 font-black'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Camera className="w-3.5 h-3.5 text-purple-600" />
            <span>Snap Selfie</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
          {/* TAB 1: DESIGNER */}
          {activeTab === 'designer' && (
            <div className="space-y-4">
              {/* Live Preview Box */}
              <div className="flex items-center justify-center flex-col gap-2 p-3 bg-gray-50 rounded-2xl border border-gray-200">
                <div className="w-28 h-28 rounded-full border-4 border-white shadow-md overflow-hidden bg-white">
                  <div
                    className="w-full h-full"
                    dangerouslySetInnerHTML={{ __html: currentSvg }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleRandomize}
                    className="px-3 py-1 bg-white hover:bg-gray-100 text-slate-800 border border-gray-300 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-2xs"
                  >
                    <Shuffle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Randomize</span>
                  </button>
                  <span className="text-[11px] text-gray-500">
                    Live SVG Layer Preview
                  </span>
                </div>
              </div>

              {/* Skin Tone Selector */}
              <div>
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 block mb-1.5">
                  1. Skin Tone
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {SKIN_TONES.map((tone) => (
                    <button
                      key={tone.value}
                      type="button"
                      onClick={() => setOptions({ ...options, skinTone: tone.value })}
                      className={`w-7 h-7 rounded-full border-2 transition-transform ${
                        options.skinTone === tone.value
                          ? 'border-slate-900 scale-110 shadow-xs ring-2 ring-amber-400'
                          : 'border-white hover:scale-105'
                      }`}
                      style={{ backgroundColor: tone.value }}
                      title={tone.label}
                    />
                  ))}
                </div>
              </div>

              {/* Hairstyle Selector */}
              <div>
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 block mb-1.5">
                  2. Hairstyle
                </label>
                <div className="grid grid-cols-4 gap-1.5 text-xs">
                  {HAIR_STYLES.map((style) => (
                    <button
                      key={style}
                      type="button"
                      onClick={() => setOptions({ ...options, hairStyle: style })}
                      className={`py-1.5 px-2 rounded-lg border text-center font-bold capitalize transition-colors ${
                        options.hairStyle === style
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hair Color */}
              <div>
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 block mb-1.5">
                  3. Hair Color
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {HAIR_COLORS.map((hc) => (
                    <button
                      key={hc.value}
                      type="button"
                      onClick={() => setOptions({ ...options, hairColor: hc.value })}
                      className={`w-7 h-7 rounded-full border-2 transition-transform ${
                        options.hairColor === hc.value
                          ? 'border-slate-900 scale-110 shadow-xs ring-2 ring-amber-400'
                          : 'border-white hover:scale-105'
                      }`}
                      style={{ backgroundColor: hc.value }}
                      title={hc.label}
                    />
                  ))}
                </div>
              </div>

              {/* Face Shape */}
              <div>
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 block mb-1.5">
                  4. Face Shape
                </label>
                <div className="grid grid-cols-5 gap-1.5 text-[11px]">
                  {FACE_SHAPES.map((fs) => (
                    <button
                      key={fs}
                      type="button"
                      onClick={() => setOptions({ ...options, faceShape: fs })}
                      className={`py-1.5 rounded-lg border text-center font-bold capitalize ${
                        options.faceShape === fs
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-700 border-gray-200'
                      }`}
                    >
                      {fs}
                    </button>
                  ))}
                </div>
              </div>

              {/* Eye Style */}
              <div>
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 block mb-1.5">
                  5. Eyes & Expression
                </label>
                <div className="grid grid-cols-5 gap-1 text-[11px]">
                  {EYE_STYLES.map((es) => (
                    <button
                      key={es}
                      type="button"
                      onClick={() => setOptions({ ...options, eyeStyle: es })}
                      className={`py-1.5 rounded-lg border text-center font-bold capitalize ${
                        options.eyeStyle === es
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-700 border-gray-200'
                      }`}
                    >
                      {es}
                    </button>
                  ))}
                </div>
              </div>

              {/* Accessories */}
              <div>
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 block mb-1.5">
                  6. Accessories
                </label>
                <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                  {ACCESSORIES.map((acc) => (
                    <button
                      key={acc}
                      type="button"
                      onClick={() => setOptions({ ...options, accessory: acc })}
                      className={`py-1.5 px-2 rounded-lg border text-center font-bold capitalize ${
                        options.accessory === acc
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-700 border-gray-200'
                      }`}
                    >
                      {acc.replace(/([A-Z])/g, ' $1').trim()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clothes & Color */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 block mb-1.5">
                    7. Clothes
                  </label>
                  <div className="grid grid-cols-2 gap-1 text-[11px]">
                    {CLOTHES_STYLES.map((cs) => (
                      <button
                        key={cs}
                        type="button"
                        onClick={() => setOptions({ ...options, clothesStyle: cs })}
                        className={`py-1.5 rounded-lg border text-center font-bold capitalize ${
                          options.clothesStyle === cs
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-700 border-gray-200'
                        }`}
                      >
                        {cs}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 block mb-1.5">
                    Clothes Color
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {CLOTHES_COLORS.map((cc) => (
                      <button
                        key={cc.value}
                        type="button"
                        onClick={() => setOptions({ ...options, clothesColor: cc.value })}
                        className={`w-6 h-6 rounded-full border-2 ${
                          options.clothesColor === cc.value
                            ? 'border-slate-900 scale-110 shadow-xs'
                            : 'border-white'
                        }`}
                        style={{ backgroundColor: cc.value }}
                        title={cc.label}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Background Color */}
              <div>
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 block mb-1.5">
                  8. Background Color
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {BG_COLORS.map((bg) => (
                    <button
                      key={bg.value}
                      type="button"
                      onClick={() => setOptions({ ...options, bgColor: bg.value })}
                      className={`w-7 h-7 rounded-full border-2 ${
                        options.bgColor === bg.value
                          ? 'border-slate-900 scale-110 shadow-xs ring-2 ring-amber-400'
                          : 'border-white hover:scale-105'
                      }`}
                      style={{ backgroundColor: bg.value }}
                      title={bg.label}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: UPLOAD PHOTO */}
          {activeTab === 'upload' && (
            <div className="p-4 space-y-4 text-center">
              {uploadedImageUrl ? (
                <div className="space-y-3">
                  <div className="w-32 h-32 rounded-full mx-auto border-4 border-[#fbbf24] overflow-hidden shadow-md">
                    <img
                      src={uploadedImageUrl}
                      alt="Uploaded profile"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <label className="inline-block py-2 px-4 bg-white border border-gray-300 text-slate-800 rounded-xl text-xs font-bold hover:bg-gray-50 cursor-pointer shadow-2xs">
                    Choose Another Photo
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 space-y-3 bg-gray-50">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900">
                      Upload Your Profile Photo
                    </h4>
                    <p className="text-[11px] text-gray-500 mt-1">
                      Select any photo from your device (PNG, JPG, WebP)
                    </p>
                  </div>
                  <label className="inline-block py-2.5 px-4 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-slate-800 cursor-pointer shadow-xs">
                    Browse File
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CAMERA SELFIE */}
          {activeTab === 'camera' && (
            <div className="space-y-4 text-center">
              {cameraError ? (
                <div className="p-4 bg-red-50 text-red-700 text-xs rounded-xl font-medium">
                  {cameraError}
                </div>
              ) : capturedPhotoUrl ? (
                <div className="space-y-3">
                  <div className="w-32 h-32 rounded-full mx-auto border-4 border-[#fbbf24] overflow-hidden shadow-md">
                    <img
                      src={capturedPhotoUrl}
                      alt="Selfie"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setCapturedPhotoUrl(null)}
                    className="py-2 px-4 bg-white border border-gray-300 text-slate-800 rounded-xl text-xs font-bold hover:bg-gray-50 flex items-center gap-1.5 mx-auto"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retake Photo</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-48 h-48 rounded-full mx-auto overflow-hidden bg-black border-4 border-slate-900 shadow-md relative">
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleCaptureCamera}
                    disabled={!isCameraActive}
                    className="py-2.5 px-5 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-slate-800 disabled:opacity-50 flex items-center gap-2 mx-auto shadow-xs"
                  >
                    <Camera className="w-4 h-4 text-[#fbbf24]" />
                    <span>Snap Selfie Now</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 bg-[#fbbf24] hover:bg-[#f59e0b] text-slate-950 text-xs font-black rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Save Profile Avatar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
