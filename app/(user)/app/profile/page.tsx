"use client"

import { useState, useEffect, useRef } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
  User, Mail, Shield, Key, LogOut,
  ChevronRight, CheckCircle2, AlertTriangle, Clock,
  Eye, EyeOff, Lock, Camera, Loader2, Image as ImageIcon, X, Calendar,
} from "lucide-react"
import { UserHeader } from "@/components/user/UserHeader"
import { CameraCaptureModal } from "@/components/user/CameraCaptureModal"
import { useThemeColors } from "@/components/shared/ThemeProvider"

export default function ProfilePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const colors = useThemeColors()

  const KYC_STATUS: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
    verified:   { icon: CheckCircle2,  color: colors.green, bg: colors.greenBg,  label: "Verified" },
    unverified: { icon: AlertTriangle, color: colors.yellow || "#F59E0B", bg: colors.yellowBg || "rgba(245,158,11,0.12)", label: "Unverified" },
    pending:    { icon: Clock,         color: colors.blue, bg: colors.blueBg, label: "Pending" },
    rejected:   { icon: AlertTriangle, color: colors.red, bg: colors.redBg,  label: "Rejected" },
  }
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmNewPassword: "" })
  const [pwLoading, setPwLoading] = useState(false)
  const [pwError, setPwError] = useState("")
  const [pwSuccess, setPwSuccess] = useState(false)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)

  // The session JWT captures kycStatus at login time and can go stale (e.g.
  // after submitting documents or an admin review). Fetch the authoritative
  // value from the server so the profile always shows the real status.
  const [liveKycStatus, setLiveKycStatus] = useState<string | null>(null)
  const [joinedDate, setJoinedDate] = useState<string | null>(null)

  // Profile picture
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarError, setAvatarError] = useState("")
  const [photoMenuOpen, setPhotoMenuOpen] = useState(false)
  const [cameraOpen, setCameraOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let active = true
    fetch("/api/user/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!active || !d) return
        if (d.kycStatus) setLiveKycStatus(d.kycStatus)
        if (d.avatarUrl) setAvatarUrl(d.avatarUrl)
        if (d.createdAt) setJoinedDate(d.createdAt)
      })
      .catch(() => { /* fall back to session value */ })
    return () => { active = false }
  }, [])

  const handleGallerySelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = "" // allow re-selecting the same file
    if (file) uploadAvatarFile(file)
  }

  const uploadAvatarFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setAvatarError("Please choose an image file")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError("Image must be under 5MB")
      return
    }

    setAvatarError("")
    setAvatarUploading(true)
    try {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
      if (!cloudName || !uploadPreset) throw new Error("Upload service not configured. Please contact support.")

      // 1. Upload directly to Cloudinary (unsigned preset), same as KYC docs
      const formData = new FormData()
      formData.append("file", file)
      formData.append("upload_preset", uploadPreset)
      formData.append("folder", "avatars")

      const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: formData,
      })
      const uploadData = await uploadRes.json()
      if (!uploadRes.ok) throw new Error(uploadData.error?.message || "Failed to upload image")

      // 2. Save the URL to the user
      const saveRes = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: uploadData.secure_url }),
      })
      if (!saveRes.ok) {
        const data = await saveRes.json().catch(() => ({}))
        throw new Error(data.error || "Failed to save photo")
      }

      setAvatarUrl(uploadData.secure_url)
      // Let the app shell (sidebar) update its avatar immediately.
      window.dispatchEvent(new CustomEvent("avatar-updated", { detail: uploadData.secure_url }))
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : "Failed to update photo")
    } finally {
      setAvatarUploading(false)
    }
  }

  const user = session?.user

  const handleChangePassword = async () => {
    setPwLoading(true)
    setPwError("")
    setPwSuccess(false)
    try {
      const res = await fetch("/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pwForm),
      })
      if (res.ok) {
        setPwSuccess(true)
        setPwForm({ currentPassword: "", newPassword: "", confirmNewPassword: "" })
        setTimeout(() => setShowPasswordForm(false), 2000)
      } else {
        const data = await res.json()
        setPwError(data.error || "Failed to change password")
      }
    } catch {
      setPwError("Network error")
    }
    setPwLoading(false)
  }

  const effectiveKyc = liveKycStatus ?? user?.kycStatus
  const kycStatus = effectiveKyc ? (KYC_STATUS[effectiveKyc] || KYC_STATUS.unverified) : KYC_STATUS.unverified
  const KycIcon = kycStatus.icon

  return (
    <>
      <UserHeader title="Profile" />

      <div className="px-4 py-5 lg:px-6 space-y-5 max-w-[600px] mx-auto">
        {/* Avatar + name */}
        <div className="text-center py-4">
          <button
            type="button"
            onClick={() => !avatarUploading && setPhotoMenuOpen(true)}
            className="relative mx-auto block h-20 w-20 rounded-full"
            style={{ cursor: avatarUploading ? "default" : "pointer" }}
            aria-label="Change profile photo"
          >
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt="Profile"
                className="h-20 w-20 rounded-full object-cover"
                style={{ border: `1px solid ${colors.border}` }}
              />
            ) : (
              <span
                className="flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold text-white"
                style={{ background: `linear-gradient(135deg, ${colors.blue} 0%, ${colors.isDark ? '#1a6fcc' : '#2563eb'} 100%)` }}
              >
                {user?.firstName?.[0]?.toUpperCase()}{user?.lastName?.[0]?.toUpperCase()}
              </span>
            )}

            {/* Camera badge */}
            <span
              className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full"
              style={{ background: colors.blue, border: `2px solid ${colors.bgBase}` }}
            >
              {avatarUploading
                ? <Loader2 className="h-3.5 w-3.5 text-white animate-spin" />
                : <Camera className="h-3.5 w-3.5 text-white" />}
            </span>
          </button>

          {/* Gallery / file picker (no capture → opens gallery/files) */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleGallerySelect}
          />

          {avatarError && (
            <p className="mt-2 text-[12px]" style={{ color: colors.red }}>{avatarError}</p>
          )}

          <p className="mt-3 text-[18px] font-semibold" style={{ color: colors.textPrimary }}>
            {user?.firstName} {user?.lastName}
          </p>
          <p className="text-[14px] mt-0.5" style={{ color: colors.textTertiary }}>
            {user?.email}
          </p>
          <button
            type="button"
            onClick={() => !avatarUploading && setPhotoMenuOpen(true)}
            className="mt-2 text-[13px] font-medium"
            style={{ color: colors.blue }}
          >
            {avatarUploading ? "Uploading…" : avatarUrl ? "Change photo" : "Add photo"}
          </button>
        </div>

        {/* Photo source chooser — centered dialog on desktop, bottom sheet on mobile */}
        {photoMenuOpen && (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4"
            style={{ background: "rgba(16,24,40,0.45)", backdropFilter: "blur(2px)" }}
            onClick={() => setPhotoMenuOpen(false)}
            role="dialog"
            aria-modal="true"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full rounded-t-2xl p-2 pb-5 sm:w-full sm:max-w-[380px] sm:rounded-2xl sm:pb-2"
              style={{ background: colors.bgElevated, border: `1px solid ${colors.border}`, boxShadow: "0 24px 48px rgba(16,24,40,0.24)" }}
            >
              {/* Mobile grabber */}
              <div className="mx-auto mb-1 mt-1 h-1 w-9 rounded-full sm:hidden" style={{ background: colors.border }} />

              <div className="flex items-center justify-between px-3 pt-2 pb-1">
                <p className="text-[15px] font-semibold" style={{ color: colors.textPrimary }}>Change profile photo</p>
                <button
                  onClick={() => setPhotoMenuOpen(false)}
                  aria-label="Close"
                  className="flex h-8 w-8 items-center justify-center rounded-full transition-colors"
                  style={{ color: colors.textSecondary }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = colors.bgHover }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-1">
                <PhotoOption
                  icon={<Camera className="h-[18px] w-[18px]" style={{ color: colors.blue }} />}
                  iconBg={colors.blueBg}
                  label="Take a photo"
                  hint="Use your camera"
                  colors={colors}
                  onClick={() => { setPhotoMenuOpen(false); setCameraOpen(true) }}
                />
                <PhotoOption
                  icon={<ImageIcon className="h-[18px] w-[18px]" style={{ color: colors.green }} />}
                  iconBg={colors.greenBg}
                  label="Upload from gallery"
                  hint="Choose an existing image"
                  colors={colors}
                  onClick={() => { setPhotoMenuOpen(false); fileInputRef.current?.click() }}
                />
              </div>
            </div>
          </div>
        )}

        <CameraCaptureModal
          open={cameraOpen}
          onClose={() => setCameraOpen(false)}
          onCapture={(file) => { setCameraOpen(false); uploadAvatarFile(file) }}
        />

        {/* Info card */}
        <div className="rounded-2xl overflow-hidden" style={{ background: colors.bgElevated, border: `1px solid ${colors.border}` }}>
          <InfoRow icon={<User className="h-4 w-4" />} label="Full Name" value={`${user?.firstName || ""} ${user?.lastName || ""}`} colors={colors} />
          <InfoRow icon={<Mail className="h-4 w-4" />} label="Email" value={user?.email || ""} colors={colors} />
          <InfoRow
            icon={<Shield className="h-4 w-4" />}
            label="KYC Status"
            value={
              <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1" style={{ background: kycStatus.bg }}>
                <KycIcon className="h-3 w-3" style={{ color: kycStatus.color }} />
                <span className="text-[11px] font-semibold" style={{ color: kycStatus.color }}>{kycStatus.label}</span>
              </span>
            }
            colors={colors}
          />
          <InfoRow
            icon={<Calendar className="h-4 w-4" />}
            label="Date Joined"
            value={joinedDate
              ? new Date(joinedDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
              : "—"}
            colors={colors}
          />
        </div>

        {/* Actions */}
        <div className="rounded-2xl overflow-hidden" style={{ background: colors.bgElevated, border: `1px solid ${colors.border}` }}>
          <ActionRow
            icon={<Key className="h-4 w-4" style={{ color: colors.blue }} />}
            label="Change Password"
            onClick={() => setShowPasswordForm((v) => !v)}
            colors={colors}
          />
          <ActionRow
            icon={<Shield className="h-4 w-4" style={{ color: colors.yellow || "#F59E0B" }} />}
            label="Verify Identity"
            onClick={() => router.push("/app/kyc")}
            colors={colors}
          />
          <ActionRow
            icon={<LogOut className="h-4 w-4" style={{ color: colors.red }} />}
            label="Sign Out"
            onClick={() => signOut({ callbackUrl: "/login" })}
            danger
            colors={colors}
          />
        </div>

        {/* Change password form */}
        {showPasswordForm && (
          <div className="rounded-2xl p-5 space-y-4" style={{ background: colors.bgElevated, border: `1px solid ${colors.border}` }}>
            <p className="text-[15px] font-semibold" style={{ color: colors.textPrimary }}>Change Password</p>

            <div>
              <label className="text-[12px] font-medium uppercase tracking-wide" style={{ color: colors.textTertiary }}>Current password</label>
              <div className="relative mt-1.5">
                <input
                  type={showCurrent ? "text" : "password"}
                  value={pwForm.currentPassword}
                  onChange={(e) => setPwForm((f) => ({ ...f, currentPassword: e.target.value }))}
                  className="w-full h-11 rounded-xl px-4 text-[14px] outline-none pr-10"
                  style={{ background: colors.bgHover, border: `1px solid ${colors.border}`, color: colors.textPrimary }}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: colors.textMuted }}
                >
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-[12px] font-medium uppercase tracking-wide" style={{ color: colors.textTertiary }}>New password</label>
              <div className="relative mt-1.5">
                <input
                  type={showNew ? "text" : "password"}
                  value={pwForm.newPassword}
                  onChange={(e) => setPwForm((f) => ({ ...f, newPassword: e.target.value }))}
                  className="w-full h-11 rounded-xl px-4 text-[14px] outline-none pr-10"
                  style={{ background: colors.bgHover, border: `1px solid ${colors.border}`, color: colors.textPrimary }}
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: colors.textMuted }}
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-[12px] font-medium uppercase tracking-wide" style={{ color: colors.textTertiary }}>Confirm new password</label>
              <input
                type="password"
                value={pwForm.confirmNewPassword}
                onChange={(e) => setPwForm((f) => ({ ...f, confirmNewPassword: e.target.value }))}
                className="w-full h-11 rounded-xl px-4 text-[14px] outline-none mt-1.5"
                style={{ background: colors.bgHover, border: `1px solid ${colors.border}`, color: colors.textPrimary }}
              />
            </div>

            {pwError && <p className="text-[13px]" style={{ color: colors.red }}>{pwError}</p>}
            {pwSuccess && <p className="text-[13px]" style={{ color: colors.green }}>Password changed successfully!</p>}

            <button
              onClick={handleChangePassword}
              disabled={!pwForm.currentPassword || !pwForm.newPassword || !pwForm.confirmNewPassword || pwLoading}
              className="w-full h-11 rounded-xl text-[14px] font-semibold text-white transition-all active:scale-[0.98]"
              style={{
                background: pwForm.currentPassword && pwForm.newPassword ? colors.blue : colors.bgHover,
                opacity: pwForm.currentPassword && pwForm.newPassword && !pwLoading ? 1 : 0.5,
              }}
            >
              {pwLoading ? "Updating..." : "Update Password"}
            </button>
          </div>
        )}
      </div>
    </>
  )
}

interface RowColors {
  textPrimary: string
  textSecondary: string
  textTertiary: string
  textMuted: string
  border: string
  red: string
}

function InfoRow({ icon, label, value, colors }: { icon: React.ReactNode; label: string; value: React.ReactNode; colors: RowColors }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: `1px solid ${colors.border}` }}>
      <span style={{ color: colors.textMuted }}>{icon}</span>
      <span className="text-[13px]" style={{ color: colors.textTertiary }}>{label}</span>
      <span className="ml-auto text-[13px] font-medium text-right" style={{ color: colors.textPrimary }}>{value}</span>
    </div>
  )
}

function ActionRow({ icon, label, onClick, danger, colors }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean; colors: RowColors }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors"
      style={{ borderBottom: `1px solid ${colors.border}` }}
    >
      {icon}
      <span className="flex-1 text-[14px] font-medium" style={{ color: danger ? colors.red : colors.textPrimary }}>{label}</span>
      <ChevronRight className="h-4 w-4" style={{ color: colors.textMuted }} />
    </button>
  )
}

function PhotoOption({
  icon, iconBg, label, hint, colors, onClick,
}: {
  icon: React.ReactNode
  iconBg: string
  label: string
  hint: string
  colors: ReturnType<typeof useThemeColors>
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors active:scale-[0.99]"
      style={{ background: "transparent" }}
      onMouseEnter={(e) => { e.currentTarget.style.background = colors.bgHover }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
    >
      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full" style={{ background: iconBg }}>
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-[14px] font-medium" style={{ color: colors.textPrimary }}>{label}</span>
        <span className="block text-[12px]" style={{ color: colors.textTertiary }}>{hint}</span>
      </span>
    </button>
  )
}
