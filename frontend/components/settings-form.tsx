"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { User, Lock, Shield, LogOut } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import BlockedUsersPanel from "@/components/blocked-users-panel"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

function getToken() {
  if (typeof window === "undefined") return null
  return localStorage.getItem("token")
}

function buildAuthHeaders(): Record<string, string> {
  const t = getToken()
  return t ? { Authorization: `Bearer ${t}` } : {}
}

export function SettingsForm() {
  const router = useRouter()

  const [username, setUsername] = useState("")
  const [name, setName] = useState("")
  const [bio, setBio] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [avatarFile, setAvatarFile] = useState<File | null>(null)

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const [accountType, setAccountType] = useState<"public" | "private">("public")
  const [status, setStatus] = useState("")

  // Load current user on mount
  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch(`${API}/auth/me`, {
          headers: buildAuthHeaders(),
          cache: "no-store",
        })
        if (!res.ok) return
        const me = await res.json()
        setUsername(me.username || "")
        setName(me.name || "")
        setBio(me.bio || "")
        setAvatarUrl(me.avatarUrl || "")
        setAccountType(me.accountType === "PRIVATE" ? "private" : "public")
      } catch (err) {
        console.error("load settings failed", err)
      }
    })()
  }, [])

  async function uploadAvatar(file: File): Promise<string> {
    const data = new FormData()
    data.append("file", file)
    data.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_IMAGE_UPLOAD_PRESET || "unsigned_post_upload") // same preset as posts
    const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "duqral7bw"}/auto/upload`, {
      method: "POST",
      body: data,
    })
    const json = await res.json()
    if (!res.ok || !json.secure_url) throw new Error("Avatar upload failed")
    return json.secure_url as string
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      let newAvatar = avatarUrl
      if (avatarFile) newAvatar = await uploadAvatar(avatarFile)

      const res = await fetch(`${API}/users/me`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...buildAuthHeaders() },
        body: JSON.stringify({ username, name, bio, avatarUrl: newAvatar }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.ok) {
        alert(data.message || "Update failed")
        return
      }
      setAvatarUrl(newAvatar)
      setAvatarFile(null)
      setStatus("Profile updated")
    } catch (err) {
      console.error(err)
      alert("Update failed")
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentPassword || !newPassword || !confirmPassword) {
      alert("All fields are required")
      return
    }
    if (newPassword !== confirmPassword) {
      alert("New passwords do not match")
      return
    }
    try {
      const res = await fetch(`${API}/users/me/password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...buildAuthHeaders() },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.ok) {
        alert(data.message || "Password update failed")
        return
      }
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setStatus("Password updated")
    } catch (err) {
      console.error(err)
      alert("Password update failed")
    }
  }

  const handleUpdateAccountType = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch(`${API}/users/me/privacy`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...buildAuthHeaders() },
        body: JSON.stringify({ accountType: accountType === "private" ? "PRIVATE" : "PUBLIC" }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.ok) {
        alert(data.message || "Privacy update failed")
        return
      }
      setStatus("Privacy updated")
    } catch (err) {
      console.error(err)
      alert("Privacy update failed")
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    router.push("/login")
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {/* Blocked users panel */}
      <BlockedUsersPanel />

      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Settings</h1>

      <div className="space-y-8">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              <CardTitle>Profile</CardTitle>
            </div>
            <CardDescription>Update your public profile details</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Input id="bio" value={bio} onChange={(e) => setBio(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="avatar">Avatar URL</Label>
                <Input id="avatar" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} />
                <div className="text-xs text-muted-foreground">Or upload:</div>
                <Input type="file" accept="image/*" onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)} />
                {(avatarUrl || avatarFile) && (
                  <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                    <div className="h-10 w-10 overflow-hidden rounded-full border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={avatarFile ? URL.createObjectURL(avatarFile) : avatarUrl}
                        alt="avatar preview"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <span>Preview</span>
                  </div>
                )}
              </div>

              <Button type="submit">Save profile</Button>
            </form>
          </CardContent>
        </Card>

        {/* Password Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              <CardTitle>Password</CardTitle>
            </div>
            <CardDescription>Change your password</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm new password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
              <Button type="submit">Update password</Button>
            </form>
          </CardContent>
        </Card>

        {/* Privacy Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <CardTitle>Privacy</CardTitle>
            </div>
            <CardDescription>Control who can see your posts</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateAccountType} className="space-y-4">
              <div className="space-y-2">
                <Label>Account type</Label>
                <Select value={accountType} onValueChange={(v: "public" | "private") => setAccountType(v)}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Account type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit">Save privacy</Button>
            </form>
          </CardContent>
        </Card>

        {/* Logout */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <LogOut className="h-5 w-5" />
              <CardTitle>Logout</CardTitle>
            </div>
            <CardDescription>Sign out from this device</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={handleLogout} className="w-full sm:w-auto">
              Logout from this device
            </Button>
          </CardContent>
        </Card>

        {status ? (
          <div className="text-sm text-emerald-600" role="status" aria-live="polite">
            {status}
          </div>
        ) : null}
      </div>
    </div>
  )
}
