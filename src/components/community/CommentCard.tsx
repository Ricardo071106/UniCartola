import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { CommentWithAuthor } from "@/types";

interface CommentCardProps {
  comment: CommentWithAuthor;
}

export function CommentCard({ comment }: CommentCardProps) {
  return (
    <div className="flex gap-2">
      <Avatar className="h-8 w-8">
        {comment.user.avatarUrl && (
          <AvatarImage src={comment.user.avatarUrl} alt={comment.user.nickname} />
        )}
        <AvatarFallback label={comment.user.nickname} />
      </Avatar>
      <div className="flex-1 rounded-lg bg-zinc-900 px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-white">
            {comment.user.nickname}
          </span>
          {comment.user.university && (
            <span className="text-[10px] text-[#00a86b]">
              {comment.user.university.shortName}
            </span>
          )}
        </div>
        <p className="text-sm text-zinc-300 mt-0.5">{comment.content}</p>
      </div>
    </div>
  );
}
