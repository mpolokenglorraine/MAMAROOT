import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Send, 
  Users, 
  Search, 
  MessageCircle, 
  Share2
} from 'lucide-react';
import { supabase, CommunityPost } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { formatDate } from '../../lib/utils';

export default function Community() {
  const { profile } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  async function fetchPosts() {
    try {
      const { data, error } = await supabase
        .from('community_posts')
        .select(`
          *,
          users:user_id (
            full_name,
            role
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (err) {
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreatePost(e: React.FormEvent) {
    e.preventDefault();
    if (!newPost.trim() || !profile?.id) return;

    try {
      setSubmitting(true);
      const { error } = await supabase.from('community_posts').insert({
        user_id: profile?.id,
        content: newPost,
      });

      if (error) throw error;
      setNewPost('');
      fetchPosts();
    } catch (err) {
      console.error('Error creating post:', err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 pb-10">
      <header className="pb-4 border-b border-[#E6D5CB]">
        <h1 className="text-2xl font-bold text-[#572D43]">Sister Circle</h1>
        <p className="text-xs text-[#65515A]">Supportive community space for women</p>
      </header>

      {/* Share message card */}
      <div className="bg-white border border-[#E6D5CB] rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#572D43] text-white flex items-center justify-center font-bold text-sm shrink-0">
            {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'M'}
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#572D43]">Share with the Circle</h2>
            <p className="text-[11px] text-[#65515A]">Post words of comfort, questions, or encouragement</p>
          </div>
        </div>

        <form onSubmit={handleCreatePost} className="space-y-3">
          <textarea
            value={newPost}
            onChange={e => setNewPost(e.target.value)}
            placeholder="Write your note or question..."
            rows={3}
            className="w-full px-3.5 py-2.5 text-sm bg-[#FFF9F3] border border-[#E6D5CB] rounded-xl outline-none focus-ring text-[#2B1A24] resize-none"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting || !newPost.trim()}
              className="btn-primary !h-10 !min-h-[40px] !w-auto px-6 text-xs flex items-center gap-2 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'Sharing...' : 'Share Message'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Posts list */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-8 text-center text-xs text-[#65515A]">Loading circle messages...</div>
        ) : posts.length > 0 ? (
          posts.map(post => (
            <div key={post.id} className="bg-white border border-[#E6D5CB] rounded-2xl p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#F4E8E0] text-[#572D43] flex items-center justify-center font-bold text-xs">
                    {post.users?.full_name?.charAt(0) || 'M'}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#572D43]">{post.users?.full_name || 'Sister Circle Member'}</h3>
                    <p className="text-[10px] text-[#65515A]">{formatDate(post.created_at)}</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-[#572D43] bg-[#F4E8E0] px-2 py-0.5 rounded-md">
                  Community
                </span>
              </div>
              <p className="text-xs text-[#2B1A24] leading-relaxed whitespace-pre-wrap">{post.content}</p>
            </div>
          ))
        ) : (
          <div className="p-8 text-center bg-white rounded-2xl border border-[#E6D5CB] space-y-2">
            <Users className="w-8 h-8 text-[#D9A7A4] mx-auto" />
            <p className="text-xs text-[#65515A]">The circle is open. Share your thoughts above.</p>
          </div>
        )}
      </div>
    </div>
  );
}
