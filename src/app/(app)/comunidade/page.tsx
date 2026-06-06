import { getFeedPosts } from "@/lib/queries/community";
import { getPostComments } from "@/lib/queries/community";
import { getSession } from "@/lib/auth/session";
import { getCurrencyMode } from "@/lib/currency/server";
import { safeQuery } from "@/lib/db/safe-query";
import { getUserBalances } from "@/lib/queries/user-balances";
import { PostCard } from "@/components/community/PostCard";
import { CurrencyToggle } from "@/components/currency/CurrencyToggle";
import { CreatePostForm } from "./CreatePostForm";

export const dynamic = "force-dynamic";

export default async function ComunidadePage() {
  const session = await getSession();
  const currencyMode = await getCurrencyMode();
  let totalPoints = 0;
  let realBalance = 0;
  if (session) {
    const balances = await getUserBalances(session.userId);
    totalPoints = balances.totalPoints;
    realBalance = balances.realBalance;
  }

  const posts = await safeQuery(() => getFeedPosts(session?.userId, 30), []);

  const postsWithComments = await safeQuery(
    () =>
      Promise.all(
        posts.slice(0, 10).map(async (post) => ({
          post,
          comments: await getPostComments(post.id),
        }))
      ),
    []
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Fórum</h1>
          <p className="text-sm text-zinc-500">
            Debata jogos, palpites e resultados com a galera
          </p>
        </div>
        <CurrencyToggle
          mode={currencyMode}
          totalPoints={totalPoints}
          realBalance={realBalance}
        />
      </div>

      <CreatePostForm isLoggedIn={!!session} />

      <div className="space-y-4">
        {postsWithComments.map(({ post, comments }) => (
          <PostCard key={post.id} post={post} comments={comments} />
        ))}
        {posts.length === 0 && (
          <p className="text-center text-sm text-zinc-400 py-12">
            Seja o primeiro a postar!
          </p>
        )}
      </div>
    </div>
  );
}
