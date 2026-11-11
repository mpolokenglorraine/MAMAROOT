import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  BookOpen, 
  ShieldCheck, 
  Users, 
  Search, 
  ChevronRight, 
  Heart, 
  Sparkles, 
  Utensils, 
  Moon, 
  Dumbbell, 
  Pill, 
  Globe, 
  AlertTriangle, 
  Send,
  CheckCircle2
} from 'lucide-react';
import { supabase, CommunityPost } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { formatDate } from '../../lib/utils';

// Educational categories covering the full scope of women's health
const ARTICLE_CATEGORIES = [
  { id: 'all', label: 'All Resources' },
  { id: 'cycle', label: 'Menstrual & Reproductive' },
  { id: 'fertility', label: 'Fertility & Preconception' },
  { id: 'pregnancy', label: 'Pregnancy Care' },
  { id: 'loss', label: 'Pregnancy Loss & Support' },
  { id: 'postpartum', label: 'Early Motherhood & Postpartum' },
  { id: 'menopause', label: 'Hormonal & Menopause' },
  { id: 'consultation', label: 'Preparing for Healthcare Visits' },
];

const ARTICLES = [
  {
    id: 1,
    category: 'cycle',
    title: 'Understanding Your Natural Menstrual Rhythm & Cycle Vitality',
    snippet: 'How hormones shift across the follicular and luteal phases, and practical ways to manage cramps and fatigue with nourishing warm foods and rest.',
    readTime: '4 min read',
    topic: 'Reproductive Health'
  },
  {
    id: 2,
    category: 'fertility',
    title: 'Preconception Nourishment & Body Awareness',
    snippet: 'Gentle ways to track basal cues, cervical fluid changes, and vital micronutrients (folate, iron, and iodine) before conceiving.',
    readTime: '5 min read',
    topic: 'Fertility & Preconception'
  },
  {
    id: 3,
    category: 'pregnancy',
    title: 'Nourishing Through Nausea: Cultural Foods for Early Pregnancy',
    snippet: 'Ginger, roasted root grains, small frequent meals, and hydration habits to soothe pregnancy sickness without upsetting the digestive system.',
    readTime: '3 min read',
    topic: 'Pregnancy Care'
  },
  {
    id: 4,
    category: 'loss',
    title: 'Holding Space for Pregnancy Loss: Physical Recovery & Heart Healing',
    snippet: 'Gentle guidance on what your body experiences after miscarriage or ectopic loss, managing bleeding, and finding compassionate emotional rest.',
    readTime: '6 min read',
    topic: 'Pregnancy Loss'
  },
  {
    id: 5,
    category: 'postpartum',
    title: 'The Fourth Trimester: Honoring Traditional Confinement & Mother Care',
    snippet: 'The profound value of warm broths, belly binding, community caretaking, and pelvic floor rest during the first forty days following birth.',
    readTime: '5 min read',
    topic: 'Postpartum Wellbeing'
  },
  {
    id: 6,
    category: 'menopause',
    title: 'Navigating Perimenopause: Body Wisdom in Transition',
    snippet: 'Recognizing fluctuating cycles, night sweats, and mood changes with nutritional support, cooling botanicals, and bone density care.',
    readTime: '4 min read',
    topic: 'Hormonal Transition'
  },
  {
    id: 7,
    category: 'consultation',
    title: 'How to Advocate for Yourself in Healthcare Consultations',
    snippet: 'A practical framework for writing down questions, bringing a companion, and asking your doctor to explain treatments in plain, clear language.',
    readTime: '4 min read',
    topic: 'Clinical Preparation'
  },
  {
    id: 8,
    category: 'pregnancy',
    title: 'Safe Sleep Positions and Comfort as Your Body Expands',
    snippet: 'Why left-side sleeping supports healthy fetal circulation and renal drainage, paired with ergonomic pillow support between the knees.',
    readTime: '3 min read',
    topic: 'Prenatal Rest'
  }
];

const DAILY_SAFEGUARDS = [
  {
    icon: Utensils,
    title: 'Nourishment & Food Safety',
    description: 'Protecting maternal digestion and fetal growth',
    recommended: ['Well-cooked legumes, greens & root tubers', 'Pasteurized fermented dairy', 'Thoroughly washed fresh produce', 'Clean, boiled or filtered water'],
    caution: ['Unpasteurized milk or cheeses', 'Raw or undercooked meats/eggs', 'Excessive refined sugar intake', 'High-mercury predator fish']
  },
  {
    icon: Moon,
    title: 'Rest & Ergonomic Sleep',
    description: 'Restorative blood flow and pelvic relief',
    recommended: ['Side-sleeping (preferring left) with knee cushion', 'Elevating feet after long hours standing', '7-9 hours undisturbed night rest', 'Gentle breath pacing before bed'],
    caution: ['Prolonged flat back-sleeping after 20 weeks', 'Sudden heavy spinal lifting without assistance', 'Ignoring chronic persistent daytime exhaustion']
  },
  {
    icon: Dumbbell,
    title: 'Gentle Physical Movement',
    description: 'Joint mobility, stamina and pelvic support',
    recommended: ['Daily brisk or leisurely walking', 'Prenatal & postnatal pelvic tilts', 'Gentle chest-opening stretches', 'Regular hydration during walks'],
    caution: ['Contact sports or fall-risk activities', 'Deep abdominal strain or unassisted crunches', 'Exercising in extreme daytime heat or sun']
  },
  {
    icon: Pill,
    title: 'Remedies, Herbs & Supplements',
    description: 'Ensuring safe traditional & clinical harmony',
    recommended: ['Prescribed prenatal multivitamins (Folate/Iron)', 'Mild ginger or lemon for digestion', 'Doctor-approved calcium/magnesium', 'Discussing home remedies with clinician'],
    caution: ['High-dose unverified herbal mixtures', 'Unregulated herbal laxatives during pregnancy', 'Taking medications without pharmacist review']
  },
  {
    icon: Globe,
    title: 'Traditional Cultural Wisdom',
    description: 'Intergenerational honoring of mother replenishment',
    recommended: ['Warm traditional nourishing soups', 'Intergenerational storytelling & comfort', 'Accepting help with domestic chores', 'Gentle soothing body oils'],
    caution: ['Strict restrictive postpartum food taboos', 'Early strenuous chores before pelvic healing', 'Isolation from trusted family or community circles']
  }
];

export default function LearnSupportHub() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'knowledge';
  const { profile } = useAuth();

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeArticleModal, setActiveArticleModal] = useState<any | null>(null);

  // Community posts state
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [postSubmitting, setPostSubmitting] = useState(false);

  const handleTabChange = (tab: string) => {
    setSearchParams({ tab });
  };

  useEffect(() => {
    if (activeTab === 'community') {
      fetchCommunityPosts();
    }
  }, [activeTab]);

  const fetchCommunityPosts = async () => {
    try {
      setPostsLoading(true);
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
      console.error('Error fetching community posts:', err);
    } finally {
      setPostsLoading(false);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim() || !profile?.id) return;

    try {
      setPostSubmitting(true);
      const { error } = await supabase
        .from('community_posts')
        .insert({
          user_id: profile.id,
          content: newPostContent.trim(),
        });

      if (error) throw error;
      setNewPostContent('');
      fetchCommunityPosts();
    } catch (err) {
      console.error('Error posting to community:', err);
    } finally {
      setPostSubmitting(false);
    }
  };

  const filteredArticles = ARTICLES.filter((art) => {
    const matchesCat = selectedCategory === 'all' || art.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      art.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      art.snippet.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16 animate-in fade-in duration-500 font-sans">
      {/* Header */}
      <header className="pb-6 border-b border-[#D9A7A4]/30">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-[#572D43]">
              Learn & Health Guidance
            </h1>
            <p className="text-sm text-[#777078] mt-1">
              Culturally grounded, evidence-informed knowledge and safeguards for your health journey.
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 sm:gap-4 mt-8 border-b border-[#572D43]/10 overflow-x-auto pb-px custom-scrollbar">
          <button
            onClick={() => handleTabChange('knowledge')}
            className={`pb-3 px-3 text-sm font-semibold transition-colors relative flex items-center gap-2 shrink-0 ${
              activeTab === 'knowledge' ? 'text-[#914E61]' : 'text-[#777078] hover:text-[#572D43]'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Knowledge Hub & Articles</span>
            {activeTab === 'knowledge' && (
              <motion.div layoutId="learn-tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#914E61]" />
            )}
          </button>

          <button
            onClick={() => handleTabChange('safeguards')}
            className={`pb-3 px-3 text-sm font-semibold transition-colors relative flex items-center gap-2 shrink-0 ${
              activeTab === 'safeguards' ? 'text-[#914E61]' : 'text-[#777078] hover:text-[#572D43]'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Essential Daily Safeguards</span>
            {activeTab === 'safeguards' && (
              <motion.div layoutId="learn-tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#914E61]" />
            )}
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* TAB 1: KNOWLEDGE HUB */}
      {/* ========================================================================= */}
      {activeTab === 'knowledge' && (
        <div className="space-y-8">
          {/* Search & Categories */}
          <div className="space-y-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#777078]" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search topics, questions, nutrition, cycle wisdom, postpartum care..."
                className="w-full pl-11 pr-4 py-3 bg-white border border-[#572D43]/10 rounded-2xl text-xs outline-none focus:border-[#914E61] text-[#302B2D] shadow-xs"
              />
            </div>

            {/* Category pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
              {ARTICLE_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${
                    selectedCategory === cat.id
                      ? 'bg-[#914E61] text-white border-[#914E61] shadow-xs'
                      : 'bg-white text-[#777078] border-[#572D43]/10 hover:border-[#914E61]/40'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Articles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredArticles.map((art) => (
              <div 
                key={art.id}
                onClick={() => setActiveArticleModal(art)}
                className="bg-white rounded-3xl p-6 border border-[#572D43]/10 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] font-semibold text-[#914E61] mb-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#F4E8E0] border border-[#D9A7A4]/40">
                      {art.topic}
                    </span>
                    <span className="text-[#777078]">{art.readTime}</span>
                  </div>
                  <h2 className="text-lg font-bold text-[#572D43] group-hover:text-[#914E61] transition-colors leading-snug">
                    {art.title}
                  </h2>
                  <p className="text-xs text-[#777078] mt-2.5 leading-relaxed line-clamp-3">
                    {art.snippet}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-[#F4E8E0] flex items-center justify-between text-xs font-semibold text-[#914E61]">
                  <span>Read Guide</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>

          {filteredArticles.length === 0 && (
            <div className="text-center py-16 px-6 bg-white rounded-3xl border border-dashed border-[#572D43]/15">
              <BookOpen className="w-10 h-10 text-[#777078] mx-auto mb-3 opacity-60" />
              <h2 className="text-base font-bold text-[#572D43]">No articles found</h2>
              <p className="text-xs text-[#777078] mt-1">
                Try selecting a different category or clearing your search keywords.
              </p>
            </div>
          )}

          {/* Article Modal */}
          {activeArticleModal && (
            <div className="fixed inset-0 bg-[#302B2D]/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-xl w-full max-h-[85vh] overflow-y-auto p-6 sm:p-8 border border-[#572D43]/10 shadow-xl space-y-5 animate-in zoom-in-95 duration-200">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#F4E8E0] text-[#572D43]">
                      {activeArticleModal.topic}
                    </span>
                    <h2 className="text-2xl font-bold text-[#572D43] mt-2">
                      {activeArticleModal.title}
                    </h2>
                  </div>
                  <button 
                    onClick={() => setActiveArticleModal(null)}
                    className="p-1.5 rounded-full hover:bg-[#F4E8E0] text-[#777078]"
                  >
                    ✕
                  </button>
                </div>

                <div className="text-xs text-[#777078] border-y border-[#F4E8E0] py-2 flex items-center gap-4">
                  <span>Mama Root Medical Advisory Resource</span>
                  <span>•</span>
                  <span>{activeArticleModal.readTime}</span>
                </div>

                <div className="space-y-4 text-sm text-[#302B2D] leading-relaxed">
                  <p>{activeArticleModal.snippet}</p>
                  <p>
                    Throughout African communities, maternal care is practiced as both an individual experience and a collective duty. 
                    Listening to your body is the foundational principle: whether tracking cycle phases, navigating early pregnancy symptoms, healing after loss, or stepping into motherhood, your feelings are valid and worth gentle attention.
                  </p>
                  <div className="p-4 rounded-2xl bg-[#F4E8E0] border border-[#D9A7A4]/40 text-xs space-y-2">
                    <p className="font-semibold text-[#572D43]">Practical Takeaway for Today:</p>
                    <p className="text-[#777078]">
                      Drink adequate clean fluids throughout the day. Rest when your body signals fatigue. If you experience sharp, unexpected pains or unusual bleeding, contact your healthcare provider right away.
                    </p>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    onClick={() => setActiveArticleModal(null)}
                    className="btn-berry text-xs"
                  >
                    Close Reading
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ESSENTIAL DAILY SAFEGUARDS */}
      {/* ========================================================================= */}
      {activeTab === 'safeguards' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-[#F4E8E0]/70 border border-[#572D43]/10 text-xs text-[#302B2D] flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#914E61] shrink-0 mt-0.5" />
            <p>
              These evidence-based parameters are designed to protect your vitality across daily routines. 
              Always consult with your attending doctor or midwife before introducing new remedies or exercise regimens.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {DAILY_SAFEGUARDS.map((sg, idx) => (
              <div 
                key={idx}
                className="bg-white rounded-3xl p-6 sm:p-7 border border-[#572D43]/10 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-3.5 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-[#F4E8E0] text-[#914E61] flex items-center justify-center shrink-0">
                      <sg.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-[#572D43]">{sg.title}</h2>
                      <p className="text-[11px] text-[#777078]">{sg.description}</p>
                    </div>
                  </div>

                  {/* Recommended list */}
                  <div className="mt-4 space-y-2">
                    <p className="text-[11px] font-bold text-[#572D43] uppercase tracking-wider">
                      Recommended & Supportive
                    </p>
                    <div className="space-y-1.5">
                      {sg.recommended.map((item, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-[#302B2D]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#914E61] shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Caution list */}
                  <div className="mt-4 pt-3 border-t border-[#F4E8E0] space-y-2">
                    <p className="text-[11px] font-bold text-[#914E61] uppercase tracking-wider">
                      Exercise Caution / Limit
                    </p>
                    <div className="space-y-1.5">
                      {sg.caution.map((item, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-[#777078]">
                          <AlertTriangle className="w-3.5 h-3.5 text-[#914E61] shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SISTER CIRCLE COMMUNITY */}
      {/* ========================================================================= */}
      {activeTab === 'community' && (
        <div className="space-y-8">
          {/* Post Creation Box */}
          <div className="bg-white rounded-3xl p-6 border border-[#572D43]/10 shadow-xs">
            <h2 className="text-base font-bold text-[#572D43] mb-1">Share with the Sister Circle</h2>
            <p className="text-xs text-[#777078] mb-4">
              Ask questions, offer encouragement, or share a comforting thought. This is a respectful, supportive space.
            </p>

            <form onSubmit={handleCreatePost} className="space-y-3">
              <textarea 
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder="Share your question, experience, or words of encouragement..."
                rows={3}
                className="w-full p-4 bg-[#FFF9F3] border border-[#D9A7A4]/40 rounded-2xl text-xs sm:text-sm outline-none focus:border-[#914E61] text-[#302B2D] resize-none"
              />

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-[#777078]">
                  Posting as {profile?.full_name || 'Sister Circle Member'}
                </span>
                <button
                  type="submit"
                  disabled={postSubmitting || !newPostContent.trim()}
                  className="btn-berry text-xs flex items-center gap-2 py-2 px-5 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{postSubmitting ? 'Posting...' : 'Share Message'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Community Feed */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2">
              <h2 className="text-sm font-bold text-[#572D43]">Community Conversations</h2>
              <span className="text-xs text-[#777078]">{posts.length} posts shared</span>
            </div>

            {postsLoading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="h-28 bg-white rounded-2xl border border-[#572D43]/10 animate-pulse" />
              ))
            ) : posts.length > 0 ? (
              posts.map((post) => (
                <div 
                  key={post.id}
                  className="bg-white rounded-2xl p-5 sm:p-6 border border-[#572D43]/10 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#572D43] text-white flex items-center justify-center font-bold text-xs shrink-0">
                        {post.users?.full_name ? post.users.full_name.charAt(0).toUpperCase() : 'M'}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#572D43]">
                          {post.users?.full_name || 'Mama Root Sister'}
                        </p>
                        <p className="text-[11px] text-[#777078]">
                          {formatDate(post.created_at)}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#F4E8E0] text-[#572D43]">
                      Sister Circle
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-[#302B2D] leading-relaxed whitespace-pre-wrap">
                    {post.content}
                  </p>

                  <div className="pt-2 border-t border-[#F4E8E0] flex items-center gap-6 text-xs text-[#777078]">
                    <span className="flex items-center gap-1.5 text-[#914E61]">
                      <Heart className="w-3.5 h-3.5" /> Supportive Space
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-16 px-6 bg-white rounded-3xl border border-dashed border-[#572D43]/15">
                <Users className="w-10 h-10 text-[#777078] mx-auto mb-3 opacity-60" />
                <h2 className="text-base font-bold text-[#572D43]">The Sister Circle is open</h2>
                <p className="text-xs text-[#777078] max-w-sm mx-auto mt-1 mb-4">
                  Be the first to share an uplifting note or question with fellow women on their health journey.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
