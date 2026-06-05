import { getFeedPosts } from "@/lib/queries/community";
import { getPostComments } from "@/lib/queries/community";
import { getSession } from "@/lib/auth/session";
import { PostCard } from "@/components/community/PostCard";
import { CreatePostForm } from "./CreatePostForm";

export const dynamic = "force-dynamic";

export default async function ComunidadePage() {
  const session = await getSession();
  const posts = await getFeedPosts(session?.userId, 30);

  const postsWithComments = await Promise.all(
    posts.slice(0, 10).map(async (post) => ({
      post,
      comments: await getPostComments(post.id),
    }))
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Comunidade</h1>
        <p className="text-sm text-zinc-500">
          Debata jogos, palpites e resultados
        </p>
      </div>

      <CreatePostForm isLoggedIn={!!session} />

      <div className="space-y-4">
        {postsWithComments.map(({ post, comments }) => (
          <PostCard key={post.id} post={post} comments={comments} />
        ))}
        {posts.length === 0 && (
          <p className="text-center text-sm text-gray-500 py-12">
            Seja o primeiro a postar!
          </p>
        )}
      </div>
    </div>
  );
}
