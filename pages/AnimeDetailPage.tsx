
import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchAnimeDetail, getAnimeSlug } from '../services/animeApi.ts';
import { Anime } from '../types.ts';
import { auth, db } from '../firebase.ts';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, deleteDoc, collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';

interface Comment {
  id: string;
  animeId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  text: string;
  timestamp: any;
  parentId: string | null;
}

const AnimeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const rawId = id ? decodeURIComponent(id) : '';
  const cleanId = getAnimeSlug(rawId);
  
  const [anime, setAnime] = useState<Anime | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [liveViews, setLiveViews] = useState(0);
  const [watchingNow, setWatchingNow] = useState(0);

  // Chat States
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [sendingComment, setSendingComment] = useState(false);
  
  const episodesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cleanId) return;

    setLoading(true);
    fetchAnimeDetail(cleanId).then(data => {
      setAnime(data);
      setLoading(false);
      setLiveViews(Math.floor(Math.random() * 120000) + 45000);
      setWatchingNow(Math.floor(Math.random() * 800) + 200);
    }).catch(err => {
      console.error("Failed to fetch anime detail:", err);
      setLoading(false);
    });

    // Listen for Auth changes to check bookmark status correctly
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Ensure cleanId is valid before accessing Firestore path
          if(cleanId) {
             const docRef = doc(db, "users", user.uid, "bookmarks", cleanId);
             const docSnap = await getDoc(docRef);
             if (docSnap.exists()) setIsBookmarked(true);
             else setIsBookmarked(false);
          }
        } catch (e) {
          console.warn("Bookmark check permission error (likely during sign-out):", e);
        }
      } else {
        setIsBookmarked(false);
      }
    });

    // Real-time Chat listener
    if (cleanId) {
        const commentsRef = collection(db, "comments");
        // Note: Creating a composite index in Firestore is required for this query
        // URL: https://console.firebase.google.com/project/_/firestore/indexes
        const commentsQuery = query(
          commentsRef,
          where("animeId", "==", cleanId),
          orderBy("timestamp", "desc")
        );
        
        const unsubscribeComments = onSnapshot(
          commentsQuery, 
          (snapshot) => {
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));
            setComments(list);
          }, 
          (error) => {
            // Ignore permission-denied errors initially to prevent console spam if rules aren't propogated
            if (error.code !== 'permission-denied') {
               console.error(`[Firestore Chat Error]: ${error.code} - ${error.message}`);
            } else {
               console.warn("Chat access denied. Please check Firestore Rules.");
            }
          }
        );

        return () => {
          unsubscribeAuth();
          unsubscribeComments();
        };
    }

    return () => {
      unsubscribeAuth();
    };
  }, [cleanId]);

  useEffect(() => {
    if (loading || !anime) return;
    const interval = setInterval(() => {
        setWatchingNow(prev => {
            const delta = Math.floor(Math.random() * 7) - 3;
            const newVal = prev + delta;
            return newVal < 50 ? 50 : newVal;
        });
        setLiveViews(prev => prev + 1);
    }, 3000);
    return () => clearInterval(interval);
  }, [loading, anime]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) {
      alert("Harap login untuk bergabung dalam diskusi.");
      return;
    }
    if (!commentText.trim()) return;

    setSendingComment(true);
    try {
      await addDoc(collection(db, "comments"), {
        animeId: cleanId,
        userId: user.uid,
        userName: user.displayName || 'Genzuro Watcher',
        userAvatar: user.photoURL || `https://ui-avatars.com/api/?name=${user.email}`,
        text: commentText,
        timestamp: serverTimestamp(),
        parentId: replyTo ? replyTo.id : null
      });
      setCommentText('');
      setReplyTo(null);
    } catch (e) {
      console.error("Comment post error:", e);
    } finally {
      setSendingComment(false);
    }
  };

  const scrollToEpisodes = () => {
    episodesRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleToggleBookmark = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        alert("Silakan login untuk menyimpan.");
        return;
      }
      setSaving(true);
      const docRef = doc(db, "users", user.uid, "bookmarks", cleanId);

      if (isBookmarked) {
        await deleteDoc(docRef);
        setIsBookmarked(false);
      } else if (anime) {
        await setDoc(docRef, {
          anime_id: anime.id,
          anime_title: anime.title,
          anime_poster: anime.poster,
          timestamp: Date.now()
        });
        setIsBookmarked(true);
      }
    } catch (e: any) {
        console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[80vh] space-y-6">
       <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!anime) return <div className="text-center py-20 uppercase font-black opacity-20">ANIME NOT FOUND</div>;

  const topLevelComments = comments.filter(c => !c.parentId);
  const getReplies = (parentId: string) => comments.filter(c => c.parentId === parentId).reverse();

  return (
    <div className="animate-fadeIn relative bg-black min-h-screen">
      
      {/* Cover Section */}
      <section className="relative h-[100vh] w-full flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={anime.poster} alt="" className="w-full h-full object-cover blur-3xl opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent"></div>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-end px-8 md:px-20 pb-32 gap-12 w-full max-w-7xl">
            <div className="w-64 md:w-96 aspect-[2/3] rounded-[48px] overflow-hidden shadow-2xl border border-white/10 group">
                <img src={anime.poster} alt={anime.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" />
            </div>

            <div className="flex-1 space-y-8 text-center md:text-left">
                <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                        <span className="bg-red-600 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{anime.status || 'Ongoing'}</span>
                        <span className="text-white/80 bg-white/5 border border-white/10 px-4 py-1 rounded-full text-[10px] font-black uppercase">★ {anime.score || '8.9'} SCORE</span>
                    </div>
                    <h1 className="text-4xl md:text-7xl font-[900] text-white tracking-tighter uppercase italic leading-tight">
                        {anime.title}
                    </h1>
                </div>

                <div className="flex items-center justify-center md:justify-start space-x-8 text-[11px] font-black uppercase text-gray-400">
                    <div className="flex items-center space-x-2">
                       <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_#22c55e]"></div>
                       <span>{watchingNow} Watching Now</span>
                    </div>
                    <div className="flex items-center space-x-2">
                       <i className="fa-solid fa-eye text-red-600"></i>
                       <span>{liveViews.toLocaleString()} Views</span>
                    </div>
                </div>

                <p className="text-gray-400 text-sm md:text-lg max-w-2xl line-clamp-3 md:line-clamp-none leading-relaxed">
                    {anime.description || "In a world where destinies collide, follow the journey of legend in this GENZURO original series."}
                </p>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-4">
                    <button 
                        onClick={scrollToEpisodes}
                        className="bg-red-600 hover:bg-red-700 text-white px-10 py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all flex items-center space-x-3 shadow-2xl shadow-red-600/30"
                    >
                        <i className="fa-solid fa-play"></i>
                        <span>Pilih Episode</span>
                    </button>
                    <button onClick={handleToggleBookmark} className="bg-white/5 hover:bg-white/10 text-white border border-white/20 px-10 py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all">
                        <i className={`fa-solid ${isBookmarked ? 'fa-check' : 'fa-plus'}`}></i>
                        <span className="ml-3">{isBookmarked ? 'In List' : 'Playlist'}</span>
                    </button>
                </div>
            </div>
        </div>
      </section>

      {/* Episode Grid */}
      <div className="px-8 md:px-20 py-24 space-y-32 bg-black">
          <section ref={episodesRef} className="space-y-12 scroll-mt-32">
              <div className="border-b border-white/5 pb-10">
                  <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter italic">Episode Guide</h2>
                  <p className="text-gray-500 text-xs font-black uppercase tracking-[0.5em] mt-4">Kualitas Ultra HD Server Premium</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {anime.episodes?.map((ep, idx) => (
                      <Link 
                        key={ep.id}
                        to={`/watch/${encodeURIComponent(cleanId)}/${encodeURIComponent(ep.id)}`}
                        className="group relative flex flex-col p-8 bg-[#0a0a0a] border border-white/5 rounded-[40px] hover:border-red-600 hover:bg-red-600/5 transition-all duration-500 shadow-xl"
                      >
                         <div className="flex items-center justify-between mb-4">
                            <span className="text-5xl font-black italic text-white group-hover:text-red-600 transition-colors">
                                {ep.number || (idx + 1).toString().padStart(2, '0')}
                            </span>
                            <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-white group-hover:bg-red-600 transition-all">
                                <i className="fa-solid fa-play text-xs"></i>
                            </div>
                         </div>
                         <h4 className="text-sm font-bold text-gray-300 group-hover:text-white uppercase line-clamp-2">
                             {ep.title}
                         </h4>
                      </Link>
                  ))}
              </div>
          </section>

          {/* Chat System */}
          <section className="space-y-12">
              <div className="border-b border-white/5 pb-8 flex items-end justify-between">
                <h2 className="text-4xl font-black uppercase italic tracking-tighter">Community Hub</h2>
                <div className="text-[10px] font-black uppercase text-gray-500">{comments.length} Discussion</div>
              </div>

              <div className="bg-[#0a0a0a] p-8 md:p-12 rounded-[48px] border border-white/5">
                 <form onSubmit={handlePostComment} className="space-y-4">
                    {replyTo && (
                      <div className="flex items-center justify-between bg-red-600/10 p-3 rounded-2xl text-[10px] font-bold">
                         <span className="text-red-500 uppercase tracking-widest">Balas @{replyTo.userName}</span>
                         <button onClick={() => setReplyTo(null)} className="text-gray-500 hover:text-white"><i className="fa-solid fa-xmark"></i></button>
                      </div>
                    )}
                    <div className="flex gap-4">
                       <img src={auth.currentUser?.photoURL || `https://ui-avatars.com/api/?name=${auth.currentUser?.email || 'G'}`} className="w-12 h-12 rounded-full border border-white/10 shrink-0" alt="" />
                       <div className="flex-1 relative">
                          <textarea 
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder={auth.currentUser ? "Tulis pesan anda..." : "Harap login untuk membalas"}
                            disabled={!auth.currentUser || sendingComment}
                            className="w-full bg-black/40 border border-white/5 rounded-[32px] p-6 text-sm text-white focus:outline-none focus:border-red-600 h-28 resize-none"
                          />
                          <button 
                            type="submit"
                            disabled={!auth.currentUser || sendingComment || !commentText.trim()}
                            className="absolute bottom-4 right-4 bg-red-600 text-white px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-red-600/30"
                          >
                             {sendingComment ? '...' : 'Posting'}
                          </button>
                       </div>
                    </div>
                 </form>

                 <div className="mt-16 space-y-12">
                    {topLevelComments.map(comment => (
                       <div key={comment.id} className="space-y-6">
                          <div className="flex gap-5 group">
                             <img src={comment.userAvatar} className="w-12 h-12 rounded-full border border-white/10 shadow-lg" alt="" />
                             <div className="flex-1 space-y-2">
                                <div className="flex items-center space-x-3">
                                   <span className="text-xs font-black uppercase text-white tracking-widest">{comment.userName}</span>
                                   <span className="text-[9px] text-gray-600 font-bold uppercase">{comment.timestamp ? '• Online' : '• Sending'}</span>
                                </div>
                                <div className="bg-white/5 p-6 rounded-[32px] rounded-tl-none text-sm text-gray-300 leading-relaxed border border-white/5">
                                   {comment.text}
                                </div>
                                <div className="flex items-center space-x-6 pl-2">
                                   <button onClick={() => setReplyTo(comment)} className="text-[10px] font-black text-gray-500 hover:text-red-600 uppercase tracking-widest transition-colors">Reply</button>
                                   <button className="text-[10px] font-black text-gray-500 hover:text-white uppercase tracking-widest"><i className="fa-regular fa-heart mr-2"></i>Like</button>
                                </div>
                             </div>
                          </div>

                          {/* Nested Replies */}
                          <div className="ml-16 space-y-6 border-l border-white/5 pl-8">
                             {getReplies(comment.id).map(reply => (
                                <div key={reply.id} className="flex gap-4 group">
                                   <img src={reply.userAvatar} className="w-8 h-8 rounded-full border border-white/10 shadow-md" alt="" />
                                   <div className="flex-1 space-y-2">
                                      <div className="flex items-center space-x-3">
                                         <span className="text-[10px] font-black uppercase text-white tracking-widest">{reply.userName}</span>
                                      </div>
                                      <div className="bg-red-600/5 p-4 rounded-[24px] rounded-tl-none text-xs text-gray-400 border border-red-600/10">
                                         {reply.text}
                                      </div>
                                   </div>
                                </div>
                             ))}
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
          </section>
      </div>
    </div>
  );
};

export default AnimeDetailPage;
