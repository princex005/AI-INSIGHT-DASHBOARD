import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  cover_image?: string;
  created_at: string;
}

export default function BlogSection() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBlogPosts();
  }, []);

  const fetchBlogPosts = async () => {
    try {
      if (!supabase) return;

      const { data, error } = await supabase
        .from('blog_posts')
        .select('id, title, slug, excerpt, cover_image, created_at')
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) throw error;
      setPosts(data as BlogPost[]);
    } catch (error) {
      console.error('Error fetching blog posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <section id="blog" className="relative py-32 overflow-hidden border-t border-white/5">
      <div className="absolute inset-0">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl opacity-20" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-16">
          <div>
            <h2 className="text-5xl md:text-6xl font-bold leading-tight mb-4">
              <span className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                Latest Blog
              </span>
            </h2>
            <p className="text-xl text-slate-400">
              Insights, tips, and updates about AI analytics
            </p>
          </div>
          <Link
            to="#blog"
            className="hidden md:flex items-center gap-2 px-6 py-3 rounded-lg border border-white/20 text-white hover:border-white/40 hover:bg-white/5 transition-all duration-300"
          >
            View All
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-96 bg-white/5 rounded-2xl animate-pulse border border-white/10" />
            ))}
          </div>
        ) : posts.length > 0 ? (
          <div className="grid md:grid-cols-3 gap-8">
            {posts.map((post) => (
              <Link
                key={post.id}
                to={`/blog/${post.slug}`}
                className="group relative overflow-hidden rounded-2xl h-full backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/10"
              >
                {post.cover_image && (
                  <div className="absolute inset-0 overflow-hidden">
                    <img
                      src={post.cover_image}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-950 opacity-80 group-hover:opacity-90 transition-opacity" />
                  </div>
                )}

                {!post.cover_image && (
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 opacity-50 group-hover:opacity-60 transition-opacity" />
                )}

                <div className="relative h-full p-8 flex flex-col justify-end">
                  <div>
                    <div className="flex items-center gap-4 mb-4 text-sm text-slate-400">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {formatDate(post.created_at)}
                      </div>
                    </div>

                    <h3 className="text-2xl font-bold mb-3 text-white group-hover:text-blue-300 transition-colors line-clamp-2">
                      {post.title}
                    </h3>

                    <p className="text-slate-300 text-sm leading-relaxed mb-4 line-clamp-2">
                      {post.excerpt}
                    </p>

                    <div className="flex items-center gap-2 text-blue-400 font-medium text-sm group-hover:text-blue-300">
                      Read Article
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-slate-400 text-lg">No blog posts yet. Check back soon!</p>
          </div>
        )}
      </div>
    </section>
  );
}

/*
  API Endpoint References for Backend Integration:

  // Fetch blog posts list
  const response = await fetch('/api/blog/list', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  const blogs = await response.json();

  // Fetch single blog post by slug
  const response = await fetch('/api/blog/my-blog-slug', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  const post = await response.json();
*/