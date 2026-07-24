"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { User, Mail, Phone, Save, Loader2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName:  z.string().min(1, "Last name is required"),
  phone:     z.string().optional(),
})

type ProfileFormValues = z.infer<typeof profileSchema>

interface ProfileClientProps {
  user: {
    id:        string
    email:     string
    firstName: string
    lastName:  string
  }
}

export function ProfileClient({ user }: ProfileClientProps) {
  const [saving, setSaving] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user.firstName,
      lastName:  user.lastName,
      phone:     "",
    },
  })

  const onSubmit = async (values: ProfileFormValues) => {
    setSaving(true)
    try {
      const res = await fetch("/api/admin/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast({
          title: "Update failed",
          description: data.error ?? "Something went wrong",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully. Changes will reflect on next login.",
        variant: "success",
      })
    } catch {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const inputClass =
    "w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-all"
  const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Profile</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Manage your admin account information
        </p>
      </div>

      {/* Profile Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        {/* Avatar Section */}
        <div className="px-6 py-8 bg-gradient-to-r from-indigo-500 to-indigo-600 flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white text-2xl font-bold">
            {user.firstName[0]}{user.lastName[0]}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">
              {user.firstName} {user.lastName}
            </h2>
            <p className="text-indigo-100">{user.email}</p>
            <span className="inline-block mt-2 px-3 py-1 text-xs font-medium bg-white/20 text-white rounded-full">
              Administrator
            </span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className={labelClass}>
                <User className="inline w-4 h-4 mr-1.5 text-gray-400" />
                First Name
              </label>
              <input
                {...register("firstName")}
                className={inputClass}
                placeholder="John"
              />
              {errors.firstName && (
                <p className="mt-1.5 text-xs text-red-500">{errors.firstName.message}</p>
              )}
            </div>

            <div>
              <label className={labelClass}>
                <User className="inline w-4 h-4 mr-1.5 text-gray-400" />
                Last Name
              </label>
              <input
                {...register("lastName")}
                className={inputClass}
                placeholder="Doe"
              />
              {errors.lastName && (
                <p className="mt-1.5 text-xs text-red-500">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className={labelClass}>
              <Mail className="inline w-4 h-4 mr-1.5 text-gray-400" />
              Email Address
            </label>
            <input
              type="email"
              value={user.email}
              disabled
              className={`${inputClass} bg-gray-50 dark:bg-gray-800 cursor-not-allowed opacity-60`}
            />
            <p className="mt-1.5 text-xs text-gray-500">
              Email cannot be changed for security reasons
            </p>
          </div>

          <div>
            <label className={labelClass}>
              <Phone className="inline w-4 h-4 mr-1.5 text-gray-400" />
              Phone Number
            </label>
            <input
              {...register("phone")}
              className={inputClass}
              placeholder="+1 555 123 4567"
            />
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
