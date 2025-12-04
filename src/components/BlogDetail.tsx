import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Share2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface BlogPost {
  id: string;
  title: string;
  content: string;
  cover_image?: string;
  created_at: string;
}

export default function BlogDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPost();
  }, [slug]);

  const fetchPost = async () => {
    try {
      if (!supabase) return;

      const { data, error: fetchError } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!data) {
        setError('Blog post not found');
      } else {
        setPost(data as BlogPost);
      }
    } catch (error) {
      console.error('Error fetching blog post:', error);
      setError('Failed to load blog post');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen pt-32">
        <div className="max-w-4xl mx-auto px-4">
          <Link to="/" className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-8">
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </Link>
          <div className="text-center py-16">
            <p className="text-slate-400 text-lg">{error || 'Blog post not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-16">
      <article className="max-w-4xl mx-auto px-4">
        <Link to="/" className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-8">
          <ArrowLeft className="w-5 h-5" />
          Back to Blog
        </Link>

        {post.cover_image && (
          <div className="relative h-96 rounded-2xl overflow-hidden mb-8 border border-white/10">
            <img
              src={post.cover_image}
              alt={post.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-950 opacity-30" />
          </div>
        )}

        <div className="mb-8">
          <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-4 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            {post.title}
          </h1>

          <div className="flex items-center gap-6 text-slate-400">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              {formatDate(post.created_at)}
            </div>
            <button className="flex items-center gap-2 hover:text-slate-300 transition-colors">
              <Share2 className="w-5 h-5" />
              Share
            </button>
          </div>
        </div>

        <div className="prose prose-invert max-w-none">
          <div className="text-slate-300 leading-relaxed space-y-6 text-lg">
            {post.content.split('\n\n').map((paragraph, i) => (
              <p key={i} className="text-slate-300">
                {paragraph}
              </p>
            ))}
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-white/10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <span className="text-2xl font-bold">A</span>
            </div>
            <div>
              <p className="font-semibold text-white">InsightAI Team</p>
              <p className="text-slate-400">Sharing insights and updates about AI analytics</p>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}

/*
  API Endpoint References for Backend Integration:

  // Fetch single blog post by slug
  const response = await fetch(`/api/blog/${slug}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  const post = await response.json();
*/