import { useState } from "react"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useCommentsStore } from "@/lib/stores/comments-store"
import { useRecipeComments } from "@/hooks/use-recipe-comments"
import { apiErrorMessage } from "@/lib/api"
import { formatTimestamp, getInitials } from "@/lib/utils"

export function RecipeComments({ recipeId, canComment }) {
  const user = useAuthStore((s) => s.user)
  const comments = useRecipeComments(recipeId)
  const addComment = useCommentsStore((s) => s.addComment)
  const deleteComment = useCommentsStore((s) => s.deleteComment)
  const [text, setText] = useState("")

  async function handleSubmit(event) {
    event.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) return
    try {
      await addComment(recipeId, trimmed)
      setText("")
    } catch (error) {
      toast.error(apiErrorMessage(error, "Impossible de publier le commentaire."))
    }
  }

  async function handleDelete(id) {
    try {
      await deleteComment(id)
    } catch (error) {
      toast.error(apiErrorMessage(error, "Impossible de supprimer le commentaire."))
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="font-heading text-lg font-semibold">Commentaires ({comments.length})</h2>

      {comments.length > 0 && (
        <ul className="space-y-4">
          {comments.map((comment) => (
            <li key={comment.id} className="flex items-start gap-3">
              <Avatar size="sm">
                <AvatarFallback>{getInitials(comment.authorName)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-0.5">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{comment.authorName}</p>
                  <p className="text-xs text-muted-foreground">{formatTimestamp(comment.createdAt)}</p>
                </div>
                <p className="text-sm whitespace-pre-wrap">{comment.text}</p>
              </div>
              {comment.authorId === user.id && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="shrink-0"
                  onClick={() => handleDelete(comment.id)}
                  aria-label="Supprimer le commentaire">
                  <Trash2 className="size-3.5" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      {canComment && (
        <form onSubmit={handleSubmit} className="space-y-2">
          <Textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Ajouter un commentaire..."
            rows={2}
          />
          <Button type="submit" size="sm" disabled={!text.trim()}>
            Publier
          </Button>
        </form>
      )}
    </div>
  )
}
