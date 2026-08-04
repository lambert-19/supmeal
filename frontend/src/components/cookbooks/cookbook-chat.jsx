import { useState } from "react"
import { MessageCircle, Send } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { EmptyState } from "@/components/empty-state"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useMessagesStore } from "@/lib/stores/messages-store"
import { useCookbookMessages } from "@/hooks/use-cookbook-messages"
import { cn, formatTimestamp, getInitials } from "@/lib/utils"

export function CookbookChat({ cookbookId, canComment }) {
  const user = useAuthStore((s) => s.user)
  const messages = useCookbookMessages(cookbookId)
  const addMessage = useMessagesStore((s) => s.addMessage)
  const [text, setText] = useState("")

  function handleSubmit(event) {
    event.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) return
    addMessage(cookbookId, { authorId: user.id, authorName: user.name, text: trimmed })
    setText("")
  }

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
            return (
              <div key={message.id} className={cn("flex gap-2", isSelf && "flex-row-reverse")}>
                <Avatar size="sm" className="shrink-0">
                  <AvatarFallback>{getInitials(message.authorName)}</AvatarFallback>
                </Avatar>
                <div className={cn("max-w-[75%] space-y-0.5", isSelf && "flex flex-col items-end")}>
                  <div className={cn("flex items-center gap-2 text-xs text-muted-foreground", isSelf && "flex-row-reverse")}>
                    <span className="font-medium text-foreground">{message.authorName}</span>
                    <span>{formatTimestamp(message.createdAt)}</span>
                  </div>
                  <p
                    className={cn(
                      "inline-block rounded-lg px-3 py-1.5 text-sm whitespace-pre-wrap",
                      isSelf ? "bg-primary text-primary-foreground" : "bg-muted"
                    )}>
                    {message.text}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {canComment && (
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <Textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
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
