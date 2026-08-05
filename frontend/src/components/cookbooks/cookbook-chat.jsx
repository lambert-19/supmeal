import { useEffect, useRef, useState } from "react"
import { useTheme } from "next-themes"
import EmojiPicker from "emoji-picker-react"
import { Check, CheckCheck, ImagePlus, MessageCircle, Send, Smile } from "lucide-react"
import { toast } from "sonner"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { EmptyState } from "@/components/empty-state"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useMessagesStore } from "@/lib/stores/messages-store"
import { usePresenceStore } from "@/lib/stores/presence-store"
import { useCookbookMessages } from "@/hooks/use-cookbook-messages"
import { getSocket } from "@/lib/socket"
import { api, apiErrorMessage } from "@/lib/api"
import { MAX_IMAGE_SIZE_BYTES } from "@/lib/constants/recipe"
import { cn, formatTimestamp, getInitials } from "@/lib/utils"

const TYPING_STOP_DELAY_MS = 3000
// Filet de sécurité si un event "typing:false" est perdu (déconnexion brutale,
// etc.) : on efface localement l'indicateur au bout d'un délai, un peu plus
// long que le délai d'arrêt normal de l'émetteur.
const TYPING_EXPIRY_MS = 5000

function MessageTicks({ message }) {
  if (message.read) return <CheckCheck className="size-3.5 text-blue-500" aria-label="Lu" />
  if (message.delivered) return <CheckCheck className="size-3.5 text-muted-foreground" aria-label="Distribué" />
  return <Check className="size-3.5 text-muted-foreground" aria-label="Envoyé" />
}

export function CookbookChat({ cookbookId, canComment }) {
  const user = useAuthStore((s) => s.user)
  const messages = useCookbookMessages(cookbookId)
  const addMessage = useMessagesStore((s) => s.addMessage)
  const presence = usePresenceStore((s) => s.presence)
  const { resolvedTheme } = useTheme()
  const [text, setText] = useState("")
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [uploadingSticker, setUploadingSticker] = useState(false)
  const [typingUsers, setTypingUsers] = useState({}) // { [userId]: name }
  const emojiPanelRef = useRef(null)
  const emojiButtonRef = useRef(null)
  const fileInputRef = useRef(null)
  const isTypingRef = useRef(false)
  const typingStopTimerRef = useRef(null)
  const typingExpiryTimersRef = useRef({})

  useEffect(() => {
    if (!showEmojiPicker) return
    function handleClickOutside(event) {
      if (emojiPanelRef.current?.contains(event.target) || emojiButtonRef.current?.contains(event.target)) return
      setShowEmojiPicker(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [showEmojiPicker])

  useEffect(() => {
    const socket = getSocket()
    const expiryTimers = typingExpiryTimersRef.current

    function removeTypingUser(userId) {
      setTypingUsers((current) => Object.fromEntries(Object.entries(current).filter(([id]) => id !== userId)))
    }

    function handleTypingUpdate({ userId, name, typing }) {
      if (userId === user.id) return
      clearTimeout(expiryTimers[userId])
      if (!typing) {
        removeTypingUser(userId)
        return
      }
      setTypingUsers((current) => ({ ...current, [userId]: name || "Quelqu'un" }))
      expiryTimers[userId] = setTimeout(() => removeTypingUser(userId), TYPING_EXPIRY_MS)
    }
    socket.on("typing:update", handleTypingUpdate)
    return () => {
      socket.off("typing:update", handleTypingUpdate)
      Object.values(expiryTimers).forEach(clearTimeout)
    }
  }, [user.id])

  // Réinitialise l'indicateur "en train d'écrire" à chaque changement de
  // cookbook (onglet Discussion démonté/remonté avec un id différent).
  useEffect(() => {
    return () => {
      clearTimeout(typingStopTimerRef.current)
      if (isTypingRef.current) {
        getSocket().emit("cookbook:typing", { cookbookId, typing: false })
        isTypingRef.current = false
      }
    }
  }, [cookbookId])

  function handleTextChange(event) {
    setText(event.target.value)
    const socket = getSocket()
    if (!isTypingRef.current) {
      isTypingRef.current = true
      socket.emit("cookbook:typing", { cookbookId, typing: true, name: user.name })
    }
    clearTimeout(typingStopTimerRef.current)
    typingStopTimerRef.current = setTimeout(() => {
      isTypingRef.current = false
      socket.emit("cookbook:typing", { cookbookId, typing: false })
    }, TYPING_STOP_DELAY_MS)
  }

  function stopTyping() {
    clearTimeout(typingStopTimerRef.current)
    if (!isTypingRef.current) return
    isTypingRef.current = false
    getSocket().emit("cookbook:typing", { cookbookId, typing: false })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) return
    stopTyping()
    try {
      await addMessage(cookbookId, { text: trimmed })
      setText("")
    } catch (error) {
      toast.error(apiErrorMessage(error, "Impossible d'envoyer le message."))
    }
  }

  function handleEmojiClick(emojiData) {
    setText((current) => current + emojiData.emoji)
  }

  async function handleStickerChange(event) {
    const file = event.target.files?.[0]
    event.target.value = "" // permet de renvoyer deux fois le même fichier d'affilée
    if (!file) return
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      toast.error("Image trop lourde (2 Mo maximum).")
      return
    }

    const formData = new FormData()
    formData.append("images", file)

    setUploadingSticker(true)
    try {
      const { data } = await api.post("/uploads/images", formData)
      await addMessage(cookbookId, { imageUrl: data.urls[0] })
    } catch (error) {
      toast.error(apiErrorMessage(error, "Impossible d'envoyer l'image."))
    } finally {
      setUploadingSticker(false)
    }
  }

  const typingNames = Object.values(typingUsers)

  return (
    <div className="space-y-3">
      {messages.length === 0 ? (
        <EmptyState
          icon={MessageCircle}
          title="Aucun message"
          description={
            canComment ? "Lancez la discussion avec les membres du cookbook." : "Aucun message n'a encore été publié."
          }
        />
      ) : (
        <div className="max-h-96 space-y-4 overflow-y-auto rounded-lg border border-border p-3">
          {messages.map((message) => {
            const isSelf = message.authorId === user.id
            const isOnline = presence[message.authorId]?.online
            return (
              <div key={message.id} className={cn("flex gap-2", isSelf && "flex-row-reverse")}>
                <div className="relative shrink-0">
                  <Avatar size="sm">
                    <AvatarFallback>{getInitials(message.authorName)}</AvatarFallback>
                  </Avatar>
                  {isOnline && (
                    <span className="absolute right-0 bottom-0 size-2 rounded-full bg-green-500 ring-2 ring-background" />
                  )}
                </div>
                <div className={cn("max-w-[75%] space-y-0.5", isSelf && "flex flex-col items-end")}>
                  <div className={cn("flex items-center gap-2 text-xs text-muted-foreground", isSelf && "flex-row-reverse")}>
                    <span className="font-medium text-foreground">{message.authorName}</span>
                    <span>{formatTimestamp(message.createdAt)}</span>
                  </div>
                  {message.imageUrl && (
                    <img
                      src={message.imageUrl}
                      alt="Image envoyée dans la discussion"
                      loading="lazy"
                      className="max-h-40 max-w-40 rounded-lg border border-border object-cover"
                    />
                  )}
                  {message.text && (
                    <p
                      className={cn(
                        "inline-block rounded-lg px-3 py-1.5 text-sm whitespace-pre-wrap",
                        isSelf ? "bg-primary text-primary-foreground" : "bg-muted"
                      )}>
                      {message.text}
                    </p>
                  )}
                  {isSelf && (
                    <div className="flex justify-end">
                      <MessageTicks message={message} />
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {typingNames.length > 0 && (
        <p className="text-xs text-muted-foreground italic">
          {typingNames.length === 1
            ? `${typingNames[0]} est en train d'écrire...`
            : `${typingNames.join(", ")} sont en train d'écrire...`}
        </p>
      )}

      {canComment && (
        <form onSubmit={handleSubmit} className="relative flex items-end gap-2">
          {showEmojiPicker && (
            <div ref={emojiPanelRef} className="absolute right-0 bottom-full z-50 mb-2">
              <EmojiPicker onEmojiClick={handleEmojiClick} theme={resolvedTheme === "dark" ? "dark" : "light"} height={350} />
            </div>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleStickerChange} />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={uploadingSticker}
            onClick={() => fileInputRef.current?.click()}
            aria-label="Envoyer une image">
            <ImagePlus className="size-4" />
          </Button>
          <div ref={emojiButtonRef}>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setShowEmojiPicker((current) => !current)}
              aria-label="Insérer un emoji">
              <Smile className="size-4" />
            </Button>
          </div>
          <Textarea
            value={text}
            onChange={handleTextChange}
            onBlur={stopTyping}
            placeholder="Écrire un message..."
            rows={1}
            className="flex-1 resize-none"
          />
          <Button type="submit" size="icon" disabled={!text.trim()} aria-label="Envoyer">
            <Send className="size-4" />
          </Button>
        </form>
      )}
    </div>
  )
}
