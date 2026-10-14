"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Send } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

function getToken() { if (typeof window === "undefined") return null; return localStorage.getItem("token"); }
function buildAuthHeaders(): Record<string, string> { const t = getToken(); return t ? { Authorization: `Bearer ${t}` } : {}; }

type ChatRow = { partnerId: string; username: string; avatar?: string | null; lastMessage: string; sentAt: string }
type Message  = { id: string; text: string; sender: "me" | "other"; timestamp: string }
type FollowRequest = { requesterId: string; username: string; createdAt: string }

function formatShortTime(iso: string) {
  if (!iso) return ""; const d = new Date(iso); const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s`; if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`; return d.toLocaleDateString();
}
function formatMessageTime(iso: string) { if (!iso) return ""; const d = new Date(iso); return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); }

export default function InboxPage() {
  const [meId, setMeId] = useState<string | null>(null)
  const [chats, setChats] = useState<ChatRow[]>([])
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [messageInput, setMessageInput] = useState("")
  const [loadingChats, setLoadingChats] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [followRequests, setFollowRequests] = useState<FollowRequest[]>([])
  const [showRequests, setShowRequests] = useState(false)

  const selectedChat = chats.find((c) => c.partnerId === selectedPartnerId) ?? null

  useEffect(() => { (async () => {
    try { const res = await fetch(`${API}/auth/me`, { headers: buildAuthHeaders() }); if (res.ok) { const me = await res.json(); setMeId(me.id); } }
    catch (err) { console.error("load me failed", err) }
  })() }, [])

  // load conversations (+ support ?user=)
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoadingChats(true)
      try {
        const res = await fetch(`${API}/messages/conversations`, { headers: buildAuthHeaders() })
        if (!res.ok) return
        const data = await res.json()
        if (cancelled) return

        let mapped: ChatRow[] = (data || []).map((c: any) => ({
          partnerId: c.partnerId, username: c.username, avatar: c.avatarUrl || null,
          lastMessage: c.lastMessage || "", sentAt: c.sentAt,
        }))

        let initialSelected: string | null = null
        if (typeof window !== "undefined") {
          const url = new URL(window.location.href)
          const fromParam = url.searchParams.get("user")
          if (fromParam) initialSelected = fromParam
        }
        if (initialSelected && !mapped.some((c) => c.partnerId === initialSelected)) {
          mapped = [{ partnerId: initialSelected, username: "New chat", avatar: null, lastMessage: "", sentAt: new Date().toISOString() }, ...mapped]
        }

        setChats(mapped)
        if (initialSelected) setSelectedPartnerId(initialSelected)
      } catch (err) {
        console.error("load conversations failed", err)
      } finally { if (!cancelled) setLoadingChats(false) }
    })()
    return () => { cancelled = true }
  }, [])

  // follow requests
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`${API}/users/me/follow-requests`, { headers: buildAuthHeaders() })
        if (!res.ok) return
        const data = await res.json()
        if (cancelled) return
        const mapped: FollowRequest[] = (data || []).map((r: any) => ({ requesterId: r.requesterId, username: r.requester?.username ?? "user", createdAt: r.createdAt }))
        setFollowRequests(mapped)
      } catch (err) { console.error("load follow-requests failed", err) }
    })()
    return () => { cancelled = true }
  }, [])

  // load messages for selected chat
  useEffect(() => {
    if (!selectedPartnerId) { setMessages([]); return }
    let cancelled = false
    ;(async () => {
      setLoadingMessages(true)
      try {
        const res = await fetch(`${API}/messages/with/${selectedPartnerId}`, { headers: buildAuthHeaders() })
        if (!res.ok) { setMessages([]); return }
        const data = await res.json()
        if (cancelled) return
        const mapped: Message[] = (data || []).map((m: any) => ({ id: m.id, text: m.text ?? "", sender: m.fromMe ? "me" : "other", timestamp: formatMessageTime(m.sentAt) }))
        setMessages(mapped)
      } catch (err) { console.error("load messages failed", err) }
      finally { if (!cancelled) setLoadingMessages(false) }
    })()
    return () => { cancelled = true }
  }, [selectedPartnerId])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    const text = messageInput.trim()
    if (!selectedPartnerId || !text) return
    try {
      await fetch(`${API}/messages/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...buildAuthHeaders() },
        body: JSON.stringify({ to: selectedPartnerId, content: text }),
      })
      setMessageInput("")
    } catch (err) { console.error("send failed", err) }
  }

  async function handleApprove(requesterId: string) {
    try {
      await fetch(`${API}/users/follow-requests/${requesterId}/approve`, { method: "POST", headers: buildAuthHeaders() })
      setFollowRequests((prev) => prev.filter((r) => r.requesterId !== requesterId))
    } catch (err) { console.error("approve failed", err) }
  }
  async function handleReject(requesterId: string) {
    try {
      await fetch(`${API}/users/follow-requests/${requesterId}/reject`, { method: "POST", headers: buildAuthHeaders() })
      setFollowRequests((prev) => prev.filter((r) => r.requesterId !== requesterId))
    } catch (err) { console.error("reject failed", err) }
  }

  // SSE messages
  useEffect(() => {
    if (typeof window === "undefined") return
    const es = new EventSource(`${API}/events`)
    es.addEventListener("message_new", (evt) => {
      try {
        const data = JSON.parse((evt as MessageEvent).data)
        if (!meId) return
        const { id, content, fromUserId, toUserId, sentAt, fromUsername, toUsername, fromAvatarUrl, toAvatarUrl } = data
        if (fromUserId !== meId && toUserId !== meId) return

        const otherId = fromUserId === meId ? toUserId : fromUserId
        const isFromMe = fromUserId === meId
        const text = content || ""
        const iso = sentAt as string

        setChats((prev) => {
          const idx = prev.findIndex((c) => c.partnerId === otherId)
          const baseUsername = isFromMe ? toUsername : fromUsername
          const baseAvatar = isFromMe ? toAvatarUrl : fromAvatarUrl
          const row: ChatRow = { partnerId: otherId, username: baseUsername || "user", avatar: baseAvatar || null, lastMessage: text || "New message", sentAt: iso }
          if (idx === -1) return [row, ...prev]
          const copy = [...prev]; copy.splice(idx, 1); return [row, ...copy]
        })

        if (selectedPartnerId === otherId) {
          setMessages((prev) => (prev.some((m) => m.id === id) ? prev : [...prev, { id, text, sender: isFromMe ? "me" : "other", timestamp: formatMessageTime(iso) }]))
        }
      } catch (err) { console.error("Inbox SSE parse error", err) }
    })
    es.onerror = (err) => { console.error("Inbox SSE error", err) }
    return () => es.close()
  }, [meId, selectedPartnerId])

  return (
    <div className="mx-auto h-[calc(100vh-4rem)] max-w-6xl px-4 py-6">
      <div className="grid h-full grid-cols-1 gap-4 md:grid-cols-5">
        {/* LEFT */}
        <aside className={`md:col-span-2 ${selectedPartnerId ? "hidden md:block" : "block"}`}>
          <Card className="flex h-full flex-col overflow-hidden">
            <div className="border-b p-4">
              <h1 className="text-2xl font-semibold tracking-tight">Messages</h1>
              {followRequests.length > 0 && (
                <button type="button" onClick={() => setShowRequests((s) => !s)} className="mt-2 inline-flex items-center gap-2 text-xs font-medium text-primary hover:underline">
                  Follow requests ({followRequests.length})
                </button>
              )}
            </div>

            {showRequests && followRequests.length > 0 && (
              <div className="border-b bg-muted/40">
                <div className="max-h-52 overflow-y-auto">
                  {followRequests.map((r) => (
                    <div key={r.requesterId} className="flex items-center justify-between gap-2 px-4 py-3 text-sm">
                      <div>
                        <p className="font-semibold">{r.username}</p>
                        <p className="text-xs text-muted-foreground">Requested {formatShortTime(r.createdAt)} ago</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleReject(r.requesterId)}>Reject</Button>
                        <Button size="sm" onClick={() => handleApprove(r.requesterId)}>Approve</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex-1 divide-y overflow-y-auto">
              {loadingChats && chats.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground">Loading conversations…</div>
              ) : chats.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground">No conversations yet</div>
              ) : (
                chats.map((c) => {
                  const isActive = selectedPartnerId === c.partnerId
                  return (
                    <button
                      key={c.partnerId}
                      onClick={() => setSelectedPartnerId(c.partnerId)}
                      className={`w-full p-4 text-left transition-colors ${isActive ? "bg-secondary" : "hover:bg-secondary/50"}`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={c.avatar || "/placeholder.svg"} alt={c.username} />
                          <AvatarFallback>{c.username[0]?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 overflow-hidden">
                          <div className="flex items-center justify-between">
                            {/* Username links to profile (no row click) */}
                            <Link href={`/user/${encodeURIComponent(c.username)}`} onClick={(e) => e.stopPropagation()} className="font-semibold hover:underline">
                              {c.username}
                            </Link>
                            <p className="text-xs text-muted-foreground">{formatShortTime(c.sentAt)}</p>
                          </div>
                          <p className="truncate text-sm text-muted-foreground">{c.lastMessage || "Tap to chat"}</p>
                        </div>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </Card>
        </aside>

        {/* RIGHT */}
        <section className={`md:col-span-3 ${selectedPartnerId ? "block" : "hidden md:block"}`}>
          <Card className="relative flex h-full flex-col overflow-hidden">
            <div className="pointer-events-none absolute inset-0 bg-[url('/chatbgl1.jpeg')] bg-cover bg-center" />
            <div className="pointer-events-none absolute inset-0 bg-background/60" />

            <div className="relative z-10 flex h-full flex-col">
              {/* Header */}
              <div className="flex items-center gap-3 border-b p-4">
                {selectedPartnerId && (
                  <Button className="md:hidden" variant="ghost" size="icon" onClick={() => setSelectedPartnerId(null)} aria-label="Back to inbox">
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                )}
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedChat?.avatar || "/placeholder.svg"} alt={selectedChat?.username || "Chat"} />
                  <AvatarFallback>{selectedChat?.username?.[0]?.toUpperCase() || " "}</AvatarFallback>
                </Avatar>
                {/* Header username links to profile */}
                <Link href={selectedChat ? `/user/${encodeURIComponent(selectedChat.username)}` : "#"} className="text-lg font-semibold hover:underline">
                  {selectedChat?.username || "Select a chat"}
                </Link>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4">
                {selectedPartnerId ? (
                  loadingMessages ? (
                    <p className="text-sm text-muted-foreground">Loading messages…</p>
                  ) : messages.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Say hi to start the conversation</p>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[70%] space-y-1 ${msg.sender === "me" ? "items-end" : "items-start"}`}>
                            <div className={`rounded-2xl px-4 py-2 ${msg.sender === "me" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
                              <p className="text-sm leading-relaxed">{msg.text}</p>
                            </div>
                            <p className="px-2 text-xs text-muted-foreground">{msg.timestamp}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-sm text-muted-foreground">Select a conversation to start messaging</p>
                  </div>
                )}
              </div>

              {/* Composer */}
              <form onSubmit={handleSend} className="flex gap-2 border-t p-3">
                <Input type="text" placeholder={selectedPartnerId ? "Type a message..." : "Select a chat to start"} value={messageInput} onChange={(e) => setMessageInput(e.target.value)} className="flex-1" disabled={!selectedPartnerId} />
                <Button type="submit" size="icon" aria-label="Send message" disabled={!selectedPartnerId}><Send className="h-4 w-4" /></Button>
              </form>
            </div>
          </Card>
        </section>
      </div>
    </div>
  )
}
