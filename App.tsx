import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Search,
  Users,
  Compass,
  MessageSquare,
  Award,
  Crown,
  Bell,
  User as UserIcon,
  LogOut,
  Moon,
  Sun,
  ShieldCheck,
  CheckCircle,
  Mail,
  Lock,
  Plus,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  Info,
  Layers,
  MapPin,
  Heart,
  QrCode,
  Share2
} from 'lucide-react';

import {
  User,
  Creator,
  CommunityPost,
  CreatorApplication,
  Coupon,
  Notification,
  Payment,
  Plan,
  ContentItem
} from './types';

import {
  SYSTEM_MEMBERSHIP_PLANS,
  MOCK_USERS,
  MOCK_CREATORS,
  MOCK_COMMUNITY_POSTS,
  MOCK_APPLICATIONS,
  MOCK_COUPONS
} from './data/mockData';

// Component imports
import AuthModal from './components/AuthModal';
import LiveChatSupport from './components/LiveChatSupport';
import AdminDashboard from './components/AdminDashboard';
import CreatorDashboard from './components/CreatorDashboard';
import CreatorCard from './components/CreatorCard';
import CommunitySection from './components/CommunitySection';
import CreatorProfileView from './components/CreatorProfileView';

import { auth, db } from './firebase';
import { doc, getDoc, setDoc, collection, onSnapshot } from 'firebase/firestore';

export default function App() {
  // Navigation State
  const [activeView, setActiveView] = useState<'home' | 'creators' | 'community' | 'about' | 'apply_collab' | 'contact' | 'profile' | 'admin' | 'creator_studio' | 'terms' | 'privacy' | 'faq'>('home');
  const [selectedCreatorId, setSelectedCreatorId] = useState<string | null>(null);

  // Authenticated User state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Platform Data lists (synced with LocalStorage)
  const [creatorsList, setCreatorsList] = useState<Creator[]>([]);
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);
  const [applications, setApplications] = useState<CreatorApplication[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<Payment[]>([]);

  // Platform Users list for Admin view
  const [platformUsers, setPlatformUsers] = useState<User[]>([]);

  // Brand collaborations for Creator view
  const [collabProposals, setCollabProposals] = useState<{
    id: string;
    senderName: string;
    senderEmail: string;
    message: string;
    proposedBudget: number;
    status: 'pending' | 'accepted' | 'declined';
  }[]>([
    {
      id: 'coll_1',
      senderName: 'Vanguard Luxury Group',
      senderEmail: 'partnerships@vanguard.mock',
      message: 'We are launching a premium cashmere travel capsule and want to lease a cinematic 30-second pre-roll in Jeana’s Amalfi Coast travel log.',
      proposedBudget: 3500,
      status: 'pending'
    }
  ]);

  // Support / Live variables
  const [activeTheme, setActiveTheme] = useState<'dark' | 'light'>('dark');
  const [cookieConsentOpen, setCookieConsentOpen] = useState(true);
  const [notificationDrawerOpen, setNotificationDrawerOpen] = useState(false);

  // Search/Filters in Search Page
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');

  // Presence / Active Site Visitors state
  const [activePresences, setActivePresences] = useState<any[]>([]);

  // Creator applications form inputs
  const [appFormName, setAppFormName] = useState('');
  const [appFormEmail, setAppFormEmail] = useState('');
  const [appFormHandle, setAppFormHandle] = useState('');
  const [appFormCategory, setAppFormCategory] = useState('Fashion & Luxury Travel');
  const [appFormPortfolio, setAppFormPortfolio] = useState('');
  const [appFormDesc, setAppFormDesc] = useState('');
  const [appFormPaymentRef, setAppFormPaymentRef] = useState('');
  const [appFormSuccess, setAppFormSuccess] = useState('');

  // Contact Page form inputs
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactSubject, setContactSubject] = useState('Membership Billing');
  const [contactMsg, setContactMsg] = useState('');
  const [contactSuccess, setContactSuccess] = useState('');

  // User Profile Edit inputs
  const [editUserName, setEditUserName] = useState('');
  const [editUserBio, setEditUserBio] = useState('');
  const [editUserAvatar, setEditUserAvatar] = useState('');
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');

  // Real-time Presence Tracker
  useEffect(() => {
    const visitorId = localStorage.getItem('creatorhub_visitor_id') || 'visitor_' + Math.random().toString(36).substring(2, 11);
    if (!localStorage.getItem('creatorhub_visitor_id')) {
      localStorage.setItem('creatorhub_visitor_id', visitorId);
    }

    const updatePresence = async () => {
      try {
        const presenceRef = doc(db, 'presence', visitorId);
        await setDoc(presenceRef, {
          id: visitorId,
          name: currentUser?.name || 'Guest Explorer',
          email: currentUser?.email || 'Anonymous Visitor',
          role: currentUser?.role || 'visitor',
          lastActive: new Date().toISOString(),
          viewingPage: activeView + (selectedCreatorId ? ` (${selectedCreatorId})` : ''),
        }, { merge: true });
      } catch (err) {
        console.warn('Error updating presence:', err);
      }
    };

    updatePresence();
    const presenceInterval = setInterval(updatePresence, 15000); // ping every 15s

    // Subscribe to all presence records
    const presenceCollection = collection(db, 'presence');
    const unsubscribePresence = onSnapshot(presenceCollection, (snapshot) => {
      const docsList = snapshot.docs.map(d => d.data());
      setActivePresences(docsList);
    }, (err) => {
      console.warn('Presence snapshot error:', err);
    });

    return () => {
      clearInterval(presenceInterval);
      unsubscribePresence();
    };
  }, [currentUser, activeView, selectedCreatorId]);

  // Hydrate State on Mount
  useEffect(() => {
    // Theme
    const savedTheme = localStorage.getItem('creatorhub_theme') as 'dark' | 'light';
    if (savedTheme) {
      setActiveTheme(savedTheme);
    }

    // Cookie Consent
    const savedCookie = localStorage.getItem('creatorhub_cookies');
    if (savedCookie === 'accepted') {
      setCookieConsentOpen(false);
    }

    // Real-time Firebase Auth Session synchronizer
    const unsubscribeAuth = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            setCurrentUser(userData);
            localStorage.setItem('creatorhub_user', JSON.stringify(userData));
          } else {
            // Default profile creation fallback
            const defaultProfile: User = {
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              username: firebaseUser.email?.split('@')[0] || 'user',
              name: firebaseUser.email?.split('@')[0].toUpperCase() || 'Member',
              avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${firebaseUser.email}`,
              role: 'member',
              isVerified: true,
              is2FAEnabled: false,
              activeSubscriptions: {},
              favorites: [],
              status: 'active'
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), defaultProfile);
            setCurrentUser(defaultProfile);
            localStorage.setItem('creatorhub_user', JSON.stringify(defaultProfile));
          }
        } catch (err) {
          console.error("Error synchronizing active session: ", err);
        }
      } else {
        setCurrentUser(null);
        localStorage.removeItem('creatorhub_user');
      }
    });

    // Creators List
    const savedCreators = localStorage.getItem('creatorhub_creators');
    if (savedCreators) {
      setCreatorsList(JSON.parse(savedCreators));
    } else {
      setCreatorsList(MOCK_CREATORS);
      localStorage.setItem('creatorhub_creators', JSON.stringify(MOCK_CREATORS));
    }

    // Community Posts
    const savedPosts = localStorage.getItem('creatorhub_posts');
    if (savedPosts) {
      setCommunityPosts(JSON.parse(savedPosts));
    } else {
      setCommunityPosts(MOCK_COMMUNITY_POSTS);
      localStorage.setItem('creatorhub_posts', JSON.stringify(MOCK_COMMUNITY_POSTS));
    }

    // Applications
    const savedApps = localStorage.getItem('creatorhub_applications');
    if (savedApps) {
      setApplications(JSON.parse(savedApps));
    } else {
      setApplications(MOCK_APPLICATIONS);
      localStorage.setItem('creatorhub_applications', JSON.stringify(MOCK_APPLICATIONS));
    }

    // Coupons
    const savedCoupons = localStorage.getItem('creatorhub_coupons');
    if (savedCoupons) {
      setCoupons(JSON.parse(savedCoupons));
    } else {
      setCoupons(MOCK_COUPONS);
      localStorage.setItem('creatorhub_coupons', JSON.stringify(MOCK_COUPONS));
    }

    // Users (Platform list for Admin panel)
    const savedUsers = localStorage.getItem('creatorhub_platform_users');
    if (savedUsers) {
      setPlatformUsers(JSON.parse(savedUsers));
    } else {
      setPlatformUsers(MOCK_USERS);
      localStorage.setItem('creatorhub_platform_users', JSON.stringify(MOCK_USERS));
    }

    // Prepopulate some demo transactions
    const savedHistory = localStorage.getItem('creatorhub_payments');
    if (savedHistory) {
      setPaymentHistory(JSON.parse(savedHistory));
    } else {
      const demoPayments: Payment[] = [
        {
          id: 'pay_1',
          userId: 'user_1',
          creatorId: 'creator_1',
          creatorName: 'Jeana',
          amount: 15.00,
          date: '2026-06-11',
          status: 'success',
          planTitle: 'Elite Jetsetter'
        }
      ];
      setPaymentHistory(demoPayments);
      localStorage.setItem('creatorhub_payments', JSON.stringify(demoPayments));
    }

    // Initial Notifications
    const demoNotifications: Notification[] = [
      {
        id: 'n_init_1',
        userId: 'all',
        title: 'Welcome to Creator Hub',
        description: 'Establish premium subscriptions, view custom lookbooks, or apply as a creator.',
        type: 'system',
        read: false,
        date: '2026-07-11'
      }
    ];
    setNotifications(demoNotifications);

    return () => {
      unsubscribeAuth();
    };
  }, []);

  // Sync edits
  useEffect(() => {
    if (currentUser) {
      setEditUserName(currentUser.name);
      setEditUserBio(currentUser.bio || '');
      setEditUserAvatar(currentUser.avatarUrl);
    }
  }, [currentUser]);

  // Synchronize state helpers
  const updateCreatorsInStateAndStorage = (updatedList: Creator[]) => {
    setCreatorsList(updatedList);
    localStorage.setItem('creatorhub_creators', JSON.stringify(updatedList));
  };

  const updatePostsInStateAndStorage = (updatedPosts: CommunityPost[]) => {
    setCommunityPosts(updatedPosts);
    localStorage.setItem('creatorhub_posts', JSON.stringify(updatedPosts));
  };

  const updateAppsInStateAndStorage = (updatedApps: CreatorApplication[]) => {
    setApplications(updatedApps);
    localStorage.setItem('creatorhub_applications', JSON.stringify(updatedApps));
  };

  const updateCouponsInStateAndStorage = (updatedCoupons: Coupon[]) => {
    setCoupons(updatedCoupons);
    localStorage.setItem('creatorhub_coupons', JSON.stringify(updatedCoupons));
  };

  const updateUsersInStateAndStorage = (updatedUsers: User[]) => {
    setPlatformUsers(updatedUsers);
    localStorage.setItem('creatorhub_platform_users', JSON.stringify(updatedUsers));
  };

  const updatePaymentsInStateAndStorage = (updatedPayments: Payment[]) => {
    setPaymentHistory(updatedPayments);
    localStorage.setItem('creatorhub_payments', JSON.stringify(updatedPayments));
  };

  // Toggle Theme
  const handleToggleTheme = () => {
    const nextTheme = activeTheme === 'dark' ? 'light' : 'dark';
    setActiveTheme(nextTheme);
    localStorage.setItem('creatorhub_theme', nextTheme);
  };

  // Accept cookies
  const handleAcceptCookies = () => {
    setCookieConsentOpen(false);
    localStorage.setItem('creatorhub_cookies', 'accepted');
  };

  // Auth Modal callback
  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);

    // Add user to platform list if new
    if (!platformUsers.some((u) => u.email === user.email)) {
      const newList = [...platformUsers, user];
      updateUsersInStateAndStorage(newList);
    }

    // Trigger Notification
    triggerNotification(
      user.id,
      'Authentication Active',
      `Greetings ${user.name}. Your secure platform access has been established.`,
      'system'
    );
  };

  // Sign out
  const handleSignOut = () => {
    auth.signOut();
    setCurrentUser(null);
    localStorage.removeItem('creatorhub_user');
    setProfileDropdownOpen(false);
    setSelectedCreatorId(null);
    setActiveView('home');
  };

  // Helper to trigger notifications
  const triggerNotification = (userId: string, title: string, description: string, type: Notification['type']) => {
    const newNotif: Notification = {
      id: 'notif_' + Date.now(),
      userId,
      title,
      description,
      type,
      read: false,
      date: new Date().toISOString().split('T')[0]
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  // Subscribe user to creator plan
  const handleSubscribe = (creatorId: string, plan: Plan, promoCode?: string) => {
    if (!currentUser) return;

    const price = promoCode
      ? (promoCode.toUpperCase() === 'HUBGOLD10' ? plan.price * 0.9 : Math.max(0, plan.price - 5))
      : plan.price;

    const activeUserSub = {
      planId: plan.id,
      tier: plan.tier,
      startDate: new Date().toISOString().split('T')[0],
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'active' as const
    };

    // 1. Update user active subscriptions
    const updatedUser: User = {
      ...currentUser,
      activeSubscriptions: {
        ...currentUser.activeSubscriptions,
        [creatorId]: activeUserSub
      }
    };
    setCurrentUser(updatedUser);
    localStorage.setItem('creatorhub_user', JSON.stringify(updatedUser));

    // Update inside platform list
    const updatedPlatformUsers = platformUsers.map((u) => (u.id === currentUser.id ? updatedUser : u));
    updateUsersInStateAndStorage(updatedPlatformUsers);

    // 2. Add Payment transaction
    const creator = creatorsList.find((c) => c.id === creatorId);
    const newPayment: Payment = {
      id: 'pay_' + Date.now(),
      userId: currentUser.id,
      creatorId,
      creatorName: creator?.name || 'Creator',
      amount: parseFloat(price.toFixed(2)),
      date: new Date().toISOString().split('T')[0],
      status: 'success',
      planTitle: plan.title,
      couponCode: promoCode
    };
    updatePaymentsInStateAndStorage([newPayment, ...paymentHistory]);

    // 3. Update Creator analytics metrics (earnings & views)
    if (creator) {
      const updatedCreators = creatorsList.map((c) => {
        if (c.id === creatorId) {
          return {
            ...c,
            subscriberCount: c.subscriberCount + 1,
            revenue: c.revenue + price
          };
        }
        return c;
      });
      updateCreatorsInStateAndStorage(updatedCreators);
    }

    // Trigger Notification
    triggerNotification(
      currentUser.id,
      'Subscription Activated',
      `You subscribed to ${creator?.name}'s ${plan.title}. VIP content unlocked.`,
      'subscription'
    );
  };

  // Unsubscribe user
  const handleUnsubscribe = (creatorId: string) => {
    if (!currentUser) return;

    const subsCopy = { ...currentUser.activeSubscriptions };
    delete subsCopy[creatorId];

    const updatedUser: User = {
      ...currentUser,
      activeSubscriptions: subsCopy
    };
    setCurrentUser(updatedUser);
    localStorage.setItem('creatorhub_user', JSON.stringify(updatedUser));

    // Update platform list
    const updatedPlatformUsers = platformUsers.map((u) => (u.id === currentUser.id ? updatedUser : u));
    updateUsersInStateAndStorage(updatedPlatformUsers);

    // Decrease subscriber count
    const creator = creatorsList.find((c) => c.id === creatorId);
    if (creator) {
      const updatedCreators = creatorsList.map((c) => {
        if (c.id === creatorId) {
          return {
            ...c,
            subscriberCount: Math.max(0, c.subscriberCount - 1)
          };
        }
        return c;
      });
      updateCreatorsInStateAndStorage(updatedCreators);
    }

    triggerNotification(
      currentUser.id,
      'Subscription Cancelled',
      `You revoked your sub to ${creator?.name}. Gated content will re-lock next month.`,
      'subscription'
    );
  };

  // Add Community Thread
  const handleAddPost = (title: string, content: string, category: string) => {
    if (!currentUser) return;

    const newPost: CommunityPost = {
      id: 'post_c_' + Date.now(),
      userId: currentUser.id,
      username: currentUser.username,
      avatarUrl: currentUser.avatarUrl,
      title,
      content,
      likes: 0,
      comments: [],
      date: new Date().toISOString().split('T')[0],
      category,
      reportsCount: 0,
      isPinned: false,
      likedBy: []
    };

    const nextPosts = [newPost, ...communityPosts];
    updatePostsInStateAndStorage(nextPosts);

    triggerNotification(
      'all',
      'New discussion thread created',
      `@${currentUser.username} published: "${title}"`,
      'community'
    );
  };

  // Like Community post
  const handleLikePost = (postId: string) => {
    if (!currentUser) return;

    const updated = communityPosts.map((post) => {
      if (post.id === postId) {
        const likedBy = post.likedBy || [];
        const index = likedBy.indexOf(currentUser.id);

        if (index > -1) {
          // Unlike
          likedBy.splice(index, 1);
          return { ...post, likes: Math.max(0, post.likes - 1), likedBy };
        } else {
          // Like
          likedBy.push(currentUser.id);
          return { ...post, likes: post.likes + 1, likedBy };
        }
      }
      return post;
    });

    updatePostsInStateAndStorage(updated);
  };

  // Report Community post
  const handleReportPost = (postId: string) => {
    const updated = communityPosts.map((post) => {
      if (post.id === postId) {
        return { ...post, reportsCount: post.reportsCount + 1 };
      }
      return post;
    });
    updatePostsInStateAndStorage(updated);

    // Notify admin
    triggerNotification(
      'admin_1',
      '⚠️ Thread reported',
      `A community thread was flagged for moderation review.`,
      'system'
    );
  };

  // Delete Community post (Admin or Author)
  const handleDeletePost = (postId: string) => {
    const nextPosts = communityPosts.filter((p) => p.id !== postId);
    updatePostsInStateAndStorage(nextPosts);
  };

  // Add comment to Community Post
  const handleAddComment = (postId: string, commentContent: string) => {
    if (!currentUser) return;

    const newComment = {
      id: 'comm_' + Date.now(),
      userId: currentUser.id,
      username: currentUser.username,
      avatarUrl: currentUser.avatarUrl,
      content: commentContent,
      date: new Date().toISOString().split('T')[0]
    };

    const updated = communityPosts.map((post) => {
      if (post.id === postId) {
        return {
          ...post,
          comments: [...post.comments, newComment]
        };
      }
      return post;
    });

    updatePostsInStateAndStorage(updated);
  };

  // Add Comment on Creator Premium Content Gated Feed
  const handleAddCreatorFeedComment = (postId: string, commentContent: string) => {
    if (!currentUser || !selectedCreatorId) return;

    const newComment = {
      id: 'feed_comm_' + Date.now(),
      userId: currentUser.id,
      username: currentUser.username,
      avatarUrl: currentUser.avatarUrl,
      content: commentContent,
      date: new Date().toISOString().split('T')[0]
    };

    const updatedCreators = creatorsList.map((creator) => {
      if (creator.id === selectedCreatorId) {
        const posts = creator.posts.map((post) => {
          if (post.id === postId) {
            return {
              ...post,
              comments: [...post.comments, newComment]
            };
          }
          return post;
        });
        return { ...creator, posts };
      }
      return creator;
    });

    updateCreatorsInStateAndStorage(updatedCreators);
  };

  // Like Creator Premium Content Feed post
  const handleLikeCreatorFeedPost = (postId: string) => {
    if (!currentUser || !selectedCreatorId) return;

    const updatedCreators = creatorsList.map((creator) => {
      if (creator.id === selectedCreatorId) {
        const posts = creator.posts.map((post) => {
          if (post.id === postId) {
            const likedBy = post.likedBy || [];
            const index = likedBy.indexOf(currentUser.id);

            if (index > -1) {
              likedBy.splice(index, 1);
              return { ...post, likes: Math.max(0, post.likes - 1), likedBy };
            } else {
              likedBy.push(currentUser.id);
              return { ...post, likes: post.likes + 1, likedBy };
            }
          }
          return post;
        });
        return { ...creator, posts };
      }
      return creator;
    });

    updateCreatorsInStateAndStorage(updatedCreators);
  };

  // Apply as Creator
  const handleApplyCreatorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appFormName.trim() || !appFormEmail.trim() || !appFormHandle.trim() || !appFormPortfolio.trim()) return;
    if (!appFormPaymentRef.trim()) {
      alert('A compulsory $65 application screening payment reference ID is required.');
      return;
    }

    const newApp: CreatorApplication = {
      id: 'app_' + Date.now(),
      userId: currentUser?.id || 'guest_' + Date.now(),
      name: appFormName,
      email: appFormEmail,
      username: appFormHandle.toLowerCase().replace(/\s+/g, ''),
      category: appFormCategory,
      description: `${appFormDesc} (WhatsApp Payment ID: ${appFormPaymentRef})`,
      portfolioUrl: appFormPortfolio,
      status: 'pending',
      date: new Date().toISOString().split('T')[0]
    };

    const nextApps = [newApp, ...applications];
    updateAppsInStateAndStorage(nextApps);

    setAppFormName('');
    setAppFormEmail('');
    setAppFormHandle('');
    setAppFormPortfolio('');
    setAppFormDesc('');
    setAppFormPaymentRef('');
    setAppFormSuccess('Your Creator Application has been successfully submitted after verifying your $65 application fee! Platform Admins will review your details.');

    // Notify admins
    triggerNotification(
      'admin_1',
      '👑 New Creator application',
      `Audit required: application submitted by Vincent de Noir for Brutalist Architecture.`,
      'system'
    );
  };

  // Admin: Approve Creator Application
  const handleApproveApplication = (appId: string) => {
    const app = applications.find((a) => a.id === appId);
    if (!app) return;

    // 1. Update Application status
    const updatedApps = applications.map((a) => (a.id === appId ? { ...a, status: 'approved' as const } : a));
    updateAppsInStateAndStorage(updatedApps);

    // 2. Register/upgrade applicant's user role
    const updatedUsers = platformUsers.map((u) => {
      if (u.id === app.userId || u.username === app.username) {
        return { ...u, role: 'creator' as const };
      }
      return u;
    });
    updateUsersInStateAndStorage(updatedUsers);

    // 3. Insert new Creator record
    const newCreator: Creator = {
      id: 'creator_' + Date.now(),
      name: app.name,
      username: app.username,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${app.username}`,
      bannerUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=1200',
      bio: app.description,
      category: app.category,
      subscriberCount: 0,
      plans: [
        {
          id: 'plan_bronze_' + app.username,
          title: 'Bronze Entry Level',
          price: 4.99,
          description: 'Basic access to behind-the-scenes diaries.',
          features: ['Weekly publications feed', 'High-res illustrations'],
          interval: 'month',
          tier: 1
        }
      ],
      posts: [],
      tags: [app.category.split(' ')[0]],
      isApproved: true,
      viewsCount: 0,
      revenue: 0,
      rating: 5.0,
      socialLinks: {}
    };
    updateCreatorsInStateAndStorage([...creatorsList, newCreator]);

    // Notify applicant
    triggerNotification(
      app.userId,
      '👑 Application Approved!',
      'Congratulations. Your creator application has cleared platform audit. Your Creator Studio portal is active!',
      'system'
    );
  };

  // Admin: Reject Creator Application
  const handleRejectApplication = (appId: string) => {
    const updatedApps = applications.map((a) => (a.id === appId ? { ...a, status: 'rejected' as const } : a));
    updateAppsInStateAndStorage(updatedApps);
  };

  // Admin: Suspend / Activate platform user
  const handleToggleUserStatus = (userId: string) => {
    const updatedUsers = platformUsers.map((u) => {
      if (u.id === userId) {
        const nextStatus = u.status === 'active' ? 'suspended' as const : 'active' as const;
        return { ...u, status: nextStatus };
      }
      return u;
    });
    updateUsersInStateAndStorage(updatedUsers);

    // Sync active session if admin self-suspended (unlikely, but safe)
    const updatedSelf = updatedUsers.find((u) => u.id === currentUser?.id);
    if (updatedSelf) {
      setCurrentUser(updatedSelf);
      localStorage.setItem('creatorhub_user', JSON.stringify(updatedSelf));
    }
  };

  // Admin: Toggle user role manually
  const handleToggleUserRole = (userId: string, newRole: 'admin' | 'creator' | 'member') => {
    const updatedUsers = platformUsers.map((u) => {
      if (u.id === userId) {
        return { ...u, role: newRole };
      }
      return u;
    });
    updateUsersInStateAndStorage(updatedUsers);

    const updatedSelf = updatedUsers.find((u) => u.id === currentUser?.id);
    if (updatedSelf) {
      setCurrentUser(updatedSelf);
      localStorage.setItem('creatorhub_user', JSON.stringify(updatedSelf));
    }
  };

  // Admin: Add promotion Coupon
  const handleAddCoupon = (coupon: Coupon) => {
    const nextCoupons = [...coupons, coupon];
    updateCouponsInStateAndStorage(nextCoupons);
  };

  // Admin: Delete Coupon
  const handleDeleteCoupon = (couponId: string) => {
    const nextCoupons = coupons.filter((c) => c.id !== couponId);
    updateCouponsInStateAndStorage(nextCoupons);
  };

  // Admin: Broadcast platform notification
  const handleBroadcastAnnouncement = (title: string, message: string) => {
    triggerNotification('all', `📢 ${title}`, message, 'broadcast');
  };

  // Creator: Update Creator profile settings
  const handleUpdateCreatorProfile = (updatedCreator: Creator) => {
    const nextCreators = creatorsList.map((c) => (c.id === updatedCreator.id ? updatedCreator : c));
    updateCreatorsInStateAndStorage(nextCreators);
  };

  // Creator: Add Premium Content
  const handleAddCreatorContent = (newPost: ContentItem) => {
    if (!currentUser) return;

    const nextCreators = creatorsList.map((c) => {
      if (c.username === currentUser.username) {
        return {
          ...c,
          posts: [newPost, ...c.posts]
        };
      }
      return c;
    });

    updateCreatorsInStateAndStorage(nextCreators);

    // Notify subscribers
    triggerNotification(
      'all',
      '✨ New Premium content unlocked',
      `${currentUser.name} uploaded a new VIP publication: "${newPost.title}"`,
      'broadcast'
    );
  };

  // Creator: Respond to sponsorship/brand deal proposals
  const handleRespondToCollab = (collabId: string, action: 'accepted' | 'declined') => {
    setCollabProposals((prev) =>
      prev.map((c) => (c.id === collabId ? { ...c, status: action } : c))
    );
  };

  // Member User: Toggle Favorite Creators list
  const handleToggleFavorite = (creatorId: string) => {
    if (!currentUser) {
      setAuthModalOpen(true);
      return;
    }

    const favs = currentUser.favorites || [];
    const index = favs.indexOf(creatorId);
    let nextFavs = [...favs];

    if (index > -1) {
      nextFavs.splice(index, 1);
    } else {
      nextFavs.push(creatorId);
    }

    const updatedUser = { ...currentUser, favorites: nextFavs };
    setCurrentUser(updatedUser);
    localStorage.setItem('creatorhub_user', JSON.stringify(updatedUser));

    // Sync in platform users list
    const updatedList = platformUsers.map((u) => (u.id === currentUser.id ? updatedUser : u));
    updateUsersInStateAndStorage(updatedList);
  };

  // Member: Submit brand proposal directly to active Creator profile page
  const handleAddCollabProposalFromProfile = (proposedBudget: number, message: string) => {
    if (!currentUser) return;

    const newProposal = {
      id: 'coll_' + Date.now(),
      senderName: currentUser.name,
      senderEmail: currentUser.email,
      message,
      proposedBudget,
      status: 'pending' as const
    };

    setCollabProposals((prev) => [newProposal, ...prev]);
  };

  // Contact page form submit
  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactEmail.trim() || !contactMsg.trim()) return;

    setContactName('');
    setContactEmail('');
    setContactMsg('');
    setContactSuccess('Your support ticket coordinates have been uploaded successfully. A VIP Concierge representative will contact you.');
    setTimeout(() => setContactSuccess(''), 4500);
  };

  // Member: Save edited Profile details
  const handleSaveProfileEdits = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const updated: User = {
      ...currentUser,
      name: editUserName,
      bio: editUserBio,
      avatarUrl: editUserAvatar
    };

    setCurrentUser(updated);
    localStorage.setItem('creatorhub_user', JSON.stringify(updated));

    const updatedList = platformUsers.map((u) => (u.id === currentUser.id ? updated : u));
    updateUsersInStateAndStorage(updatedList);

    setProfileSuccessMsg('Profile credentials updated successfully!');
    setTimeout(() => setProfileSuccessMsg(''), 3000);
  };

  // 2FA toggle simulation
  const handleToggle2FA = () => {
    if (!currentUser) return;

    const next2FA = !currentUser.is2FAEnabled;
    const updated = {
      ...currentUser,
      is2FAEnabled: next2FA,
      twoFactorSecret: next2FA ? 'KVKVEVK7KVKVEVK7' : undefined
    };

    setCurrentUser(updated);
    localStorage.setItem('creatorhub_user', JSON.stringify(updated));

    const updatedList = platformUsers.map((u) => (u.id === currentUser.id ? updated : u));
    updateUsersInStateAndStorage(updatedList);

    triggerNotification(
      currentUser.id,
      '2FA Security Changed',
      `Two-factor authentication is now ${next2FA ? 'ENABLED' : 'DISABLED'}.`,
      'system'
    );
  };

  // Filter creators based on category & tag selectors
  const filteredCreators = creatorsList.filter((creator) => {
    if (selectedCategory !== 'all' && creator.category !== selectedCategory) return false;
    if (selectedTag !== 'all' && !creator.tags.includes(selectedTag)) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        creator.name.toLowerCase().includes(q) ||
        creator.username.toLowerCase().includes(q) ||
        creator.bio.toLowerCase().includes(q) ||
        creator.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Extract all categories & tags from mock list
  const uniqueCategories = ['all', ...Array.from(new Set(creatorsList.map((c) => c.category)))];
  const uniqueTags = ['all', ...Array.from(new Set(creatorsList.flatMap((c) => c.tags)))];

  // Active creator details profile helper
  const activeCreator = creatorsList.find((c) => c.id === selectedCreatorId);

  // Active creator dashboard profile helper
  const activeCreatorDashboardProfile = currentUser
    ? creatorsList.find((c) => c.username === currentUser.username)
    : null;

  return (
    <div className={`min-h-screen flex flex-col ${activeTheme === 'dark' ? 'bg-[#180a0f] text-pink-100' : 'bg-[#fff0f4] text-neutral-900'}`}>
      
      {/* Persistant Top Header Navbar */}
      <header className={`sticky top-0 z-40 border-b transition-colors duration-200 ${activeTheme === 'dark' ? 'bg-[#180a0f]/95 border-pink-950/30 text-white' : 'bg-[#fff0f4]/95 border-pink-200 text-neutral-900'} backdrop-blur-md`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Brand Logo */}
          <button
            onClick={() => {
              setSelectedCreatorId(null);
              setActiveView('home');
            }}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="p-1.5 rounded-xl bg-gradient-to-br from-gold-500 to-gold-700 text-neutral-950 font-bold border border-gold-300 relative">
              <Crown size={18} className="text-neutral-950 animate-pulse" />
            </div>
            <span className="font-display font-black tracking-wider text-sm tracking-[0.2em] uppercase">
              CREATOR <span className="gold-gradient-text font-extrabold">HUB</span>
            </span>
          </button>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold">
            <button
              onClick={() => {
                setSelectedCreatorId(null);
                setActiveView('home');
              }}
              className={`transition cursor-pointer ${activeView === 'home' ? 'text-gold-400' : 'text-neutral-400 hover:text-white'}`}
            >
              Home
            </button>
            <button
              onClick={() => {
                setSelectedCreatorId(null);
                setActiveView('creators');
              }}
              className={`transition cursor-pointer ${activeView === 'creators' ? 'text-gold-400' : 'text-neutral-400 hover:text-white'}`}
            >
              Find Creators
            </button>
            <button
              onClick={() => {
                setSelectedCreatorId(null);
                setActiveView('community');
              }}
              className={`transition cursor-pointer ${activeView === 'community' ? 'text-gold-400' : 'text-neutral-400 hover:text-white'}`}
            >
              Community Feed
            </button>
            <button
              onClick={() => setActiveView('apply_collab')}
              className={`transition cursor-pointer ${activeView === 'apply_collab' ? 'text-gold-400' : 'text-neutral-400 hover:text-white'}`}
            >
              Apply as Creator
            </button>
            <button
              onClick={() => setActiveView('about')}
              className={`transition cursor-pointer ${activeView === 'about' ? 'text-gold-400' : 'text-neutral-400 hover:text-white'}`}
            >
              About
            </button>
            <button
              onClick={() => setActiveView('contact')}
              className={`transition cursor-pointer ${activeView === 'contact' ? 'text-gold-400' : 'text-neutral-400 hover:text-white'}`}
            >
              Help & Contact
            </button>
          </nav>

          {/* Quick Controls, Notifications & Account */}
          <div className="flex items-center gap-3">
            {/* Theme toggle */}
            <button
              onClick={handleToggleTheme}
              className="p-1.5 rounded-lg border border-neutral-900 hover:bg-neutral-900 text-gold-400 cursor-pointer"
              title="Toggle theme mode"
            >
              {activeTheme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {/* Notification triggers */}
            <div className="relative">
              <button
                onClick={() => setNotificationDrawerOpen(!notificationDrawerOpen)}
                className="p-1.5 rounded-lg border border-neutral-900 hover:bg-neutral-900 text-neutral-300 relative cursor-pointer"
              >
                <Bell size={15} />
                {notifications.some((n) => !n.read) && (
                  <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-gold-400 animate-ping" />
                )}
              </button>

              {/* Notification Drawer List */}
              <AnimatePresence>
                {notificationDrawerOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2.5 w-72 rounded-2xl border border-gold-400/20 bg-neutral-950 p-4 shadow-xl z-50 text-white text-xs space-y-3"
                  >
                    <div className="flex justify-between items-center border-b border-neutral-900 pb-2">
                      <span className="font-bold text-gold-400">System Logs & Alerts</span>
                      <button
                        onClick={() => {
                          setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
                          setNotificationDrawerOpen(false);
                        }}
                        className="text-[10px] text-neutral-400 hover:underline"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="space-y-2 max-h-52 overflow-y-auto">
                      {notifications.map((notif) => (
                        <div key={notif.id} className="p-2 bg-neutral-900 border border-neutral-850 rounded-lg space-y-0.5">
                          <span className="font-semibold block text-white text-[11px]">{notif.title}</span>
                          <span className="text-[10px] text-neutral-400 leading-relaxed block">{notif.description}</span>
                          <span className="text-[8px] text-neutral-500 font-mono block text-right">{notif.date}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Account controls */}
            {currentUser ? (
              <div className="relative">
                <button
                  id="profile-dropdown-btn"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-1.5 p-1 px-2.5 border border-gold-400/30 rounded-xl bg-neutral-950/40 hover:bg-neutral-900 cursor-pointer text-xs"
                >
                  <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-5.5 h-5.5 rounded-full object-cover" />
                  <span className="hidden sm:inline font-semibold">{currentUser.name}</span>
                  <ChevronDown size={12} className="text-neutral-400" />
                </button>

                {/* Dropdown Options */}
                <AnimatePresence>
                  {profileDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-52 rounded-2xl border border-neutral-900 bg-neutral-950 p-3 shadow-xl z-50 text-white text-xs space-y-1"
                    >
                      {/* Active level label */}
                      <div className="px-2 py-1.5 bg-neutral-900 border border-neutral-850 rounded-xl mb-1.5 text-[10px] text-gold-400 font-semibold font-mono">
                        👤 Role: {currentUser.role.toUpperCase()}
                      </div>

                      <button
                        onClick={() => {
                          setActiveView('profile');
                          setSelectedCreatorId(null);
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full text-left py-2 px-2.5 hover:bg-neutral-900 rounded-lg transition text-neutral-300 hover:text-white"
                      >
                        My VIP Profile
                      </button>

                      {/* Admin View gated option */}
                      {currentUser.role === 'admin' && (
                        <button
                          onClick={() => {
                            setActiveView('admin');
                            setSelectedCreatorId(null);
                            setProfileDropdownOpen(false);
                          }}
                          className="w-full text-left py-2 px-2.5 hover:bg-gold-500/10 hover:text-gold-300 rounded-lg transition font-semibold text-gold-400"
                        >
                          👑 Admin Panel
                        </button>
                      )}

                      {/* Creator Studio gated option */}
                      {currentUser.role === 'creator' && (
                        <button
                          onClick={() => {
                            setActiveView('creator_studio');
                            setSelectedCreatorId(null);
                            setProfileDropdownOpen(false);
                          }}
                          className="w-full text-left py-2 px-2.5 hover:bg-gold-500/10 hover:text-gold-300 rounded-lg transition font-semibold text-gold-400"
                        >
                          ⚡ Creator Studio
                        </button>
                      )}

                      {/* Unified persistent visible Sign Out button on every page */}
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left py-2 px-2.5 hover:bg-red-500/10 rounded-lg transition text-red-400 font-semibold flex items-center gap-1 border-t border-neutral-900 mt-1"
                      >
                        <LogOut size={12} />
                        Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="py-1.5 px-4 bg-gradient-to-r from-gold-600 to-gold-400 text-neutral-950 font-display font-bold rounded-xl text-xs shadow shadow-gold-500/10 hover:opacity-95 cursor-pointer active:scale-95 transition"
              >
                Access Hub
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container Stage */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          
          {/* Active Router views */}

          {/* VIEW: Creator Detail Profile Screen */}
          {selectedCreatorId && activeCreator && (
            <motion.div
              key="creator-profile"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
            >
              <button
                onClick={() => {
                  setSelectedCreatorId(null);
                  setActiveView('creators');
                }}
                className="mb-4 text-xs font-semibold text-neutral-400 hover:text-gold-400 flex items-center gap-1"
              >
                ← Return to Channels Listing
              </button>
              
              <CreatorProfileView
                creator={activeCreator}
                currentUser={currentUser}
                onSubscribe={handleSubscribe}
                onUnsubscribe={handleUnsubscribe}
                onLikePost={handleLikeCreatorFeedPost}
                onAddComment={handleAddCreatorFeedComment}
                onAddCollabProposal={handleAddCollabProposalFromProfile}
                onOpenAuth={() => setAuthModalOpen(true)}
                isFavorite={currentUser?.favorites?.includes(activeCreator.id) || false}
                onToggleFavorite={handleToggleFavorite}
              />
            </motion.div>
          )}

          {/* VIEW: Home screen */}
          {!selectedCreatorId && activeView === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="space-y-12"
            >
              {/* Luxurious Hero Slider Banner */}
              <div className="relative overflow-hidden rounded-3xl border border-neutral-900 bg-neutral-950 p-8 md:p-12 shadow-[0_15px_50px_rgba(0,0,0,0.6)]">
                {/* Gold aesthetic details */}
                <div className="absolute -top-32 -left-32 h-64 w-64 rounded-full bg-gold-500/10 blur-[120px] pointer-events-none" />
                <div className="absolute -bottom-32 -right-32 h-64 w-64 rounded-full bg-gold-500/10 blur-[120px] pointer-events-none" />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center relative z-10">
                  <div className="space-y-6 text-center lg:text-left">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-500/10 border border-gold-400/25 text-gold-400 text-xs font-semibold font-display tracking-wide uppercase self-center lg:self-start">
                      <Sparkles size={12} />
                      <span>The Sovereign Gated Platform</span>
                    </div>

                    <h1 className="font-display font-black text-3xl sm:text-5xl tracking-tight text-white leading-tight">
                      Where Elite <span className="gold-gradient-text">Creators</span> & Dedicated Supporters Align
                    </h1>

                    <p className="text-neutral-400 text-xs sm:text-sm leading-relaxed max-w-lg mx-auto lg:mx-0">
                      Access lookbooks, high-end investment theses, vocal loops, and digital assets. Subscribe directly to elite plans or apply for platform sponsorships.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                      <button
                        onClick={() => setActiveView('creators')}
                        className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-gold-600 to-gold-400 text-neutral-950 font-display font-bold text-xs shadow-lg shadow-gold-500/15 hover:opacity-95 active:scale-98 transition flex items-center justify-center gap-1.5"
                      >
                        Explore VIP Channels
                        <ArrowRight size={14} />
                      </button>
                      <button
                        onClick={() => setActiveView('apply_collab')}
                        className="py-2.5 px-6 rounded-xl bg-neutral-900 border border-neutral-850 hover:bg-neutral-850 text-neutral-200 text-xs font-semibold transition"
                      >
                        Apply for Collaboration
                      </button>
                    </div>
                  </div>

                  {/* Feature preview visual graphics */}
                  <div className="grid grid-cols-2 gap-3.5 max-w-md mx-auto">
                    {[
                      {
                        title: 'Jeana',
                        tag: 'Couture Design',
                        img: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=400',
                        subscribers: '1.4k supporters'
                      },
                      {
                        title: 'Rachel',
                        tag: 'Venture Capital',
                        img: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=400',
                        subscribers: '840 supporters'
                      }
                    ].map((f, i) => (
                      <div
                        key={i}
                        className="p-3 bg-neutral-900 border border-neutral-850 rounded-2xl space-y-3 shadow-md hover:border-gold-400/30 transition cursor-pointer"
                        onClick={() => {
                          setSelectedCreatorId(i === 0 ? 'creator_1' : 'creator_2');
                        }}
                      >
                        <div className="h-28 rounded-xl overflow-hidden bg-neutral-950">
                          <img src={f.img} alt={f.title} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <span className="block text-[10px] text-gold-400 font-mono uppercase">{f.tag}</span>
                          <span className="font-bold text-white text-xs block truncate mt-0.5">{f.title}</span>
                          <span className="text-[10px] text-neutral-400 block mt-1">{f.subscribers}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Core Platform statistics section */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                {[
                  { value: '$1.4M+', label: 'Dispatched Earnings' },
                  { value: '45,000+', label: 'Active Supporters' },
                  { value: '4.95★', label: 'Average Channel Rating' },
                  { value: '3,200+', label: 'Successful Sponsorships' }
                ].map((stat, i) => (
                  <div key={i} className="p-4 bg-neutral-900/40 border border-neutral-900 rounded-2xl">
                    <span className="block text-2xl font-display font-extrabold text-gold-400">{stat.value}</span>
                    <span className="block text-[10px] text-neutral-400 uppercase mt-1 tracking-wider">{stat.label}</span>
                  </div>
                ))}
              </div>

              {/* Trending creators teaser shelf */}
              <div className="space-y-4">
                <div className="flex justify-between items-end border-b border-neutral-900 pb-3">
                  <div>
                    <h2 className="font-display font-bold text-lg text-white">Trending VIP Creators</h2>
                    <p className="text-xs text-neutral-400 mt-0.5">Explore our highly requested aesthetic channel coordinators.</p>
                  </div>
                  <button
                    onClick={() => setActiveView('creators')}
                    className="text-xs font-semibold text-gold-400 hover:underline flex items-center gap-1"
                  >
                    View All Coordinates <ChevronDown size={14} className="-rotate-90" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {creatorsList.slice(0, 3).map((creator) => (
                    <CreatorCard
                      key={creator.id}
                      creator={creator}
                      onSelectCreator={(id) => setSelectedCreatorId(id)}
                      isFavorite={currentUser?.favorites?.includes(creator.id) || false}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  ))}
                </div>
              </div>

              {/* Global system membership plans summary */}
              <div className="p-8 rounded-3xl bg-neutral-900/60 border border-neutral-800 space-y-6">
                <div className="text-center max-w-lg mx-auto space-y-2">
                  <h3 className="font-display font-bold text-xl text-white">Standard Gated Platform Plans</h3>
                  <p className="text-neutral-400 text-xs leading-relaxed">
                    While each creator specifies custom pricing, the platform provides three basic tiers of subscriber engagement.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {SYSTEM_MEMBERSHIP_PLANS.map((plan) => (
                    <div key={plan.id} className="p-5 bg-neutral-950 border border-neutral-900 rounded-2xl flex flex-col justify-between">
                      <div>
                        <h4 className="font-display font-bold text-sm text-gold-400 uppercase">{plan.title}</h4>
                        <span className="block text-2xl font-bold font-display text-white mt-1.5">${plan.price} / mo</span>
                        <p className="text-[11px] text-neutral-400 mt-2 leading-relaxed">{plan.description}</p>
                      </div>
                      <button
                        onClick={() => setActiveView('creators')}
                        className="mt-5 w-full py-2 bg-neutral-900 border border-neutral-850 hover:bg-gold-500 hover:text-neutral-950 text-neutral-200 text-xs font-semibold rounded-lg transition-colors"
                      >
                        Explore Gated Creators
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* VIEW: Creators Listing Search Screen */}
          {!selectedCreatorId && activeView === 'creators' && (
            <motion.div
              key="creators"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="space-y-6"
            >
              {/* Filter Area Header */}
              <div className="border-b border-neutral-900 pb-5 space-y-3.5">
                <div>
                  <h2 className="font-display text-2xl font-bold tracking-tight text-white">
                    VIP Channels <span className="gold-gradient-text">Registry</span>
                  </h2>
                  <p className="text-neutral-400 text-xs mt-1">
                    Search and sort active creator feeds. Follow them or authorize subscriptions to access lock boxes.
                  </p>
                </div>

                {/* Search query input */}
                <div className="relative max-w-md">
                  <Search className="absolute left-3.5 top-3 text-neutral-500" size={16} />
                  <input
                    type="text"
                    placeholder="Search creators, categories, tags..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-900 rounded-xl py-2 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-gold-500 transition"
                  />
                </div>

                {/* Categories & tags filters */}
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] text-neutral-500 uppercase font-mono font-bold">Category:</span>
                    {uniqueCategories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`py-1 px-2.5 rounded-lg text-[10px] font-semibold border transition uppercase ${
                          selectedCategory === cat
                            ? 'bg-gold-500/10 text-gold-400 border-gold-400/30'
                            : 'bg-neutral-950 text-neutral-400 border-neutral-900 hover:text-white'
                        }`}
                      >
                        {cat === 'all' ? 'All Niches' : cat}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] text-neutral-500 uppercase font-mono font-bold">Tag:</span>
                    {uniqueTags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => setSelectedTag(tag)}
                        className={`py-1 px-2.5 rounded-lg text-[10px] font-semibold border transition ${
                          selectedTag === tag
                            ? 'bg-gold-500/10 text-gold-400 border-gold-400/30'
                            : 'bg-neutral-950 text-neutral-400 border-neutral-900 hover:text-white'
                        }`}
                      >
                        {tag === 'all' ? '#AllTags' : `#${tag}`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Creators Grid list */}
              {filteredCreators.length === 0 ? (
                <div className="p-8 text-center bg-neutral-950 border border-neutral-900 rounded-2xl text-neutral-400 text-xs">
                  No active channels comply with your search query. Please revise your filters.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCreators.map((creator) => (
                    <CreatorCard
                      key={creator.id}
                      creator={creator}
                      onSelectCreator={(id) => setSelectedCreatorId(id)}
                      isFavorite={currentUser?.favorites?.includes(creator.id) || false}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* VIEW: Community feed forum */}
          {!selectedCreatorId && activeView === 'community' && (
            <motion.div
              key="community"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
            >
              <CommunitySection
                currentUser={currentUser}
                posts={communityPosts}
                onAddPost={handleAddPost}
                onLikePost={handleLikePost}
                onReportPost={handleReportPost}
                onDeletePost={handleDeletePost}
                onAddComment={handleAddComment}
                onOpenAuth={() => setAuthModalOpen(true)}
              />
            </motion.div>
          )}

          {/* VIEW: Apply for Collaboration / Creator Application Form */}
          {!selectedCreatorId && activeView === 'apply_collab' && (
            <motion.div
              key="apply_collab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="max-w-xl mx-auto space-y-6"
            >
              <div className="border-b border-neutral-900 pb-4">
                <h2 className="font-display text-2xl font-bold tracking-tight text-white">
                  Creator Application <span className="gold-gradient-text">Coordinates</span>
                </h2>
                <p className="text-neutral-400 text-xs mt-1">
                  Apply for platform creator privileges. Share your niche, handle details, and portfolio files to unlock your studio portal.
                </p>
              </div>

              {appFormSuccess && (
                <div className="p-4 bg-green-950/20 border border-green-500/20 text-green-300 text-xs rounded-2xl flex items-center gap-2">
                  <CheckCircle size={18} className="text-green-400 shrink-0" />
                  <span>{appFormSuccess}</span>
                </div>
              )}

              <form onSubmit={handleApplyCreatorSubmit} className="p-6 rounded-2xl bg-neutral-900/40 border border-neutral-900 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-neutral-400 mb-1">Your Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Vincent de Noir"
                      value={appFormName}
                      onChange={(e) => setAppFormName(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-850 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-gold-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-neutral-400 mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="vincent@denoir.com"
                      value={appFormEmail}
                      onChange={(e) => setAppFormEmail(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-850 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-gold-500 transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-neutral-400 mb-1">Requested @Username</label>
                    <input
                      type="text"
                      required
                      placeholder="vincentdenoir"
                      value={appFormHandle}
                      onChange={(e) => setAppFormHandle(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-850 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-gold-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-neutral-400 mb-1">Aesthetic Niche</label>
                    <select
                      value={appFormCategory}
                      onChange={(e) => setAppFormCategory(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-850 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-gold-500 transition"
                    >
                      <option value="Fashion & Luxury Travel">Fashion & Luxury Travel</option>
                      <option value="Finance & Leadership">Finance & Leadership</option>
                      <option value="Music & Audio Design">Music & Audio Design</option>
                      <option value="Brutalist Architecture & Photography">Brutalist Architecture & Photography</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-neutral-400 mb-1">Portfolio/Instagram URL</label>
                  <input
                    type="url"
                    required
                    placeholder="https://vincentdenoir.com"
                    value={appFormPortfolio}
                    onChange={(e) => setAppFormPortfolio(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-850 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-gold-500 transition font-mono text-[11px]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-neutral-400 mb-1">Briefly tell us about your channel plans</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Describe lookbooks, vlogs, digital assets, or modular synth packs you plan to gate..."
                    value={appFormDesc}
                    onChange={(e) => setAppFormDesc(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-850 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-gold-500 transition resize-none"
                  />
                </div>

                {/* Compulsory WhatsApp Payment verification */}
                <div className="p-4 rounded-xl border border-green-500/20 bg-green-950/15 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-bold text-green-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      Application Verification Fee: $65.00 USD
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded font-bold uppercase">
                      Compulsory before submission
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-300 leading-relaxed">
                    All prospective creators must complete a mandatory $65 verification fee to verify portfolio authenticity and cover administrative onboarding. Please chat with our billing specialist to complete payment, then paste your unique Transaction reference ID below.
                  </p>
                  <a
                    href={`https://wa.me/2349039106418?text=Hello! I am applying as a creator on Creator Hub.%0A%0A- Full Name: ${encodeURIComponent(appFormName || '[Not Entered]')}%0A- Email: ${encodeURIComponent(appFormEmail || '[Not Entered]')}%0A- Requested Username: @${encodeURIComponent(appFormHandle || '[Not Entered]')}%0A%0AI would like to make the compulsory $65.00 USD application payment.`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 bg-green-500 hover:bg-green-600 text-neutral-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition active:scale-[0.98] cursor-pointer"
                  >
                    💬 Direct WhatsApp Payment Portal (+234 903 910 6418)
                  </a>
                  <div className="space-y-1 pt-1">
                    <label className="block text-[11px] font-medium text-neutral-400">WhatsApp Payment Reference ID</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. WA-REF-4819 (provided after WhatsApp payment)"
                      value={appFormPaymentRef}
                      onChange={(e) => setAppFormPaymentRef(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-850 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-green-500 transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-gradient-to-r from-gold-600 to-gold-400 text-neutral-950 font-display font-bold rounded-xl text-xs shadow-md active:scale-[0.98] transition"
                >
                  Submit verification application
                </button>
              </form>
            </motion.div>
          )}

          {/* VIEW: About Page */}
          {!selectedCreatorId && activeView === 'about' && (
            <motion.div
              key="about"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="space-y-8 max-w-3xl mx-auto"
            >
              <div className="text-center space-y-3.5 border-b border-neutral-900 pb-6">
                <Crown className="mx-auto text-gold-400 h-10 w-10" />
                <h2 className="font-display text-3xl font-bold tracking-tight">The Sovereignty of Gated Publications</h2>
                <p className="text-neutral-400 text-xs sm:text-sm max-w-lg mx-auto leading-relaxed">
                  Creator Hub represents a digital renaissance. Establishing end-to-end transparency, premium design values, and secure, recurrent billing.
                </p>
              </div>

              {/* Grid content blocks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 leading-relaxed">
                <div className="p-5 rounded-2xl bg-neutral-900/40 border border-neutral-900 space-y-2">
                  <h4 className="font-display font-bold text-sm text-gold-400">Premium Aesthetics First</h4>
                  <p className="text-xs text-neutral-300">
                    No cookie-cutter structures or telemetry lines. We hand-audit and curate channels mapping luxury fashion, institutional business analysis, and spatial soundtracks.
                  </p>
                </div>
                <div className="p-5 rounded-2xl bg-neutral-900/40 border border-neutral-900 space-y-2">
                  <h4 className="font-display font-bold text-sm text-gold-400">Secure Vault Protection</h4>
                  <p className="text-xs text-neutral-300">
                    Financial coordination is authorized through secure Stripe Card or PayPal flows using enterprise encryption standards. No raw details are ever vulnerable.
                  </p>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-3">
                <h4 className="font-display font-semibold text-xs tracking-wider text-neutral-300 uppercase">Platform Coordinates</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono text-neutral-400">
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-gold-500 shrink-0" />
                    <span>HQ: Mayfair, London, United Kingdom</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-gold-500 shrink-0" />
                    <span>Inquiries: concierge@creatorhub.com</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* VIEW: Contact and support Page */}
          {!selectedCreatorId && activeView === 'contact' && (
            <motion.div
              key="contact"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="max-w-xl mx-auto space-y-8"
            >
              <div className="border-b border-neutral-900 pb-4">
                <h2 className="font-display text-2xl font-bold tracking-tight text-white">
                  VIP support <span className="gold-gradient-text">Concierge</span>
                </h2>
                <p className="text-neutral-400 text-xs mt-1">
                  Upload a support ticket coordinates. Our physical operations specialists reply in less than 2 hours.
                </p>
              </div>

              {contactSuccess && (
                <div className="p-4 bg-green-950/20 border border-green-500/20 text-green-300 text-xs rounded-2xl flex items-center gap-2">
                  <CheckCircle size={18} className="text-green-400 shrink-0" />
                  <span>{contactSuccess}</span>
                </div>
              )}

              <form onSubmit={handleContactSubmit} className="p-6 rounded-2xl bg-neutral-900/40 border border-neutral-900 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-neutral-400 mb-1">Your Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Kate"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-850 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-gold-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-neutral-400 mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="aria@thorne.com"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-850 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-gold-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-neutral-400 mb-1">Inquiry coordinates</label>
                  <select
                    value={contactSubject}
                    onChange={(e) => setContactSubject(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-850 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-gold-500 transition"
                  >
                    <option value="Membership Billing">Membership Billing</option>
                    <option value="Creator Verification Auditing">Creator Verification Auditing</option>
                    <option value="Sponsorship Disputes">Sponsorship Disputes</option>
                    <option value="System Technical Bug">System Technical Bug</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-neutral-400 mb-1">Message coordinates</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Enter your ticket description detail here..."
                    value={contactMsg}
                    onChange={(e) => setContactMsg(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-850 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-gold-500 transition resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-gradient-to-r from-gold-600 to-gold-400 text-neutral-950 font-display font-bold rounded-xl text-xs transition"
                >
                  Upload support ticket
                </button>
              </form>

              {/* FAQ Teaser accordion */}
              <div className="space-y-3">
                <h3 className="font-display font-bold text-sm text-gold-400">Platform Frequently Inquired Coordinates</h3>
                {[
                  { q: 'Is there a contract or commitment period?', a: 'None at all. All subscriber perks operate on monthly schedules and can be cancelled with immediate effect in your subscriber profile.' },
                  { q: 'Which payment methods are supported?', a: 'We support all major international credit cards processed via Stripe as well as instant PayPal express payments.' }
                ].map((faq, i) => (
                  <div key={i} className="p-4 rounded-xl bg-neutral-900/30 border border-neutral-900 text-xs space-y-1">
                    <h4 className="font-bold text-white">{faq.q}</h4>
                    <p className="text-neutral-400 leading-relaxed">{faq.a}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* VIEW: User Profile & Subscription Management */}
          {!selectedCreatorId && activeView === 'profile' && currentUser && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="space-y-6"
            >
              {/* Profile Card Header */}
              <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4">
                <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.name}
                    className="w-20 h-20 rounded-full border-2 border-gold-400 object-cover bg-neutral-950"
                  />
                  <div className="space-y-1">
                    <h3 className="font-display font-bold text-lg text-white">{currentUser.name}</h3>
                    <span className="text-xs text-gold-400 block font-mono">@{currentUser.username} • {currentUser.email}</span>
                    <span className="px-2 py-0.5 rounded-full bg-neutral-950 border border-neutral-850 text-[9px] font-mono text-neutral-400 inline-block">
                      Member Role: {currentUser.role.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSignOut}
                    className="py-1.5 px-4 rounded-lg bg-neutral-950 border border-neutral-850 hover:border-red-400/30 text-red-400 text-xs font-semibold flex items-center gap-1 transition"
                  >
                    <LogOut size={13} />
                    Sign Out Session
                  </button>
                </div>
              </div>

              {/* Double column details */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Column: Edit profile & 2FA security */}
                <div className="space-y-6 lg:col-span-1">
                  
                  {/* Form */}
                  <div className="p-5 rounded-2xl bg-neutral-900/40 border border-neutral-900 space-y-4">
                    <h4 className="font-display font-semibold text-xs tracking-wider text-neutral-300 uppercase">Edit Credentials</h4>

                    {profileSuccessMsg && (
                      <div className="p-2.5 bg-green-950/20 border border-green-500/20 text-green-300 text-xs rounded-lg flex items-center gap-2">
                        <CheckCircle size={14} className="text-green-400 shrink-0" />
                        <span>{profileSuccessMsg}</span>
                      </div>
                    )}

                    <form onSubmit={handleSaveProfileEdits} className="space-y-3">
                      <div>
                        <label className="block text-[10px] text-neutral-400 mb-1">Your Full Name</label>
                        <input
                          type="text"
                          required
                          value={editUserName}
                          onChange={(e) => setEditUserName(e.target.value)}
                          className="w-full bg-neutral-950 border border-neutral-850 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-gold-500 transition"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-neutral-400 mb-1">Short Biography</label>
                        <textarea
                          rows={2}
                          value={editUserBio}
                          onChange={(e) => setEditUserBio(e.target.value)}
                          className="w-full bg-neutral-950 border border-neutral-850 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-gold-500 transition resize-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-neutral-400 mb-1">Select Avatar Variant</label>
                        <div className="grid grid-cols-4 gap-2 py-1">
                          {[
                            `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.username}`,
                            `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.username}`,
                            `https://api.dicebear.com/7.x/identicon/svg?seed=${currentUser.username}`,
                            `https://api.dicebear.com/7.x/shapes/svg?seed=${currentUser.username}`
                          ].map((av, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setEditUserAvatar(av)}
                              className={`rounded-full overflow-hidden border p-0.5 ${
                                editUserAvatar === av ? 'border-gold-400 bg-gold-400/10' : 'border-transparent bg-neutral-950'
                              }`}
                            >
                              <img src={av} alt="avatar option" className="w-full h-full rounded-full" />
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="py-1.5 px-4 bg-gradient-to-r from-gold-600 to-gold-400 text-neutral-950 font-bold rounded-xl text-xs transition"
                      >
                        Save Coordinates
                      </button>
                    </form>
                  </div>

                  {/* 2FA Security section */}
                  <div className="p-5 rounded-2xl bg-neutral-900/40 border border-neutral-900 space-y-3">
                    <h4 className="font-display font-semibold text-xs tracking-wider text-neutral-300 uppercase">Two-Factor Authentication</h4>
                    <p className="text-[11px] text-neutral-400 leading-relaxed">
                      Secure login sessions using standard Google Authenticator or coordinate OTP generators.
                    </p>

                    <div className="flex items-center justify-between p-2.5 bg-neutral-950 rounded-xl border border-neutral-850">
                      <div>
                        <span className="font-bold text-xs text-white block">Status: {currentUser.is2FAEnabled ? 'ENABLED' : 'DISABLED'}</span>
                        <span className="text-[10px] text-neutral-500 block mt-0.5">Protect credentials</span>
                      </div>
                      <button
                        onClick={handleToggle2FA}
                        className={`py-1 px-2.5 rounded-lg text-xs font-semibold border transition ${
                          currentUser.is2FAEnabled
                            ? 'bg-neutral-900 text-red-400 border-neutral-850 hover:bg-neutral-850'
                            : 'bg-gold-500 text-neutral-950 border-gold-300 hover:opacity-90'
                        }`}
                      >
                        {currentUser.is2FAEnabled ? 'Disable' : 'Enable 2FA'}
                      </button>
                    </div>

                    {currentUser.is2FAEnabled && currentUser.twoFactorSecret && (
                      <div className="p-3 bg-neutral-950 border border-neutral-900 rounded-xl text-center space-y-2">
                        <span className="block text-[10px] text-neutral-400 font-mono">Secret Key Coordinates:</span>
                        <strong className="block text-xs font-mono text-gold-400 bg-neutral-900 py-1.5 rounded">{currentUser.twoFactorSecret}</strong>
                        <span className="block text-[9px] text-neutral-500 leading-relaxed">Scan the barcode or copy this key to synchronize OTPs.</span>
                      </div>
                    )}
                  </div>

                  {/* Referral Program */}
                  <div className="p-5 rounded-2xl bg-neutral-900/40 border border-neutral-900 space-y-3">
                    <h4 className="font-display font-semibold text-xs tracking-wider text-neutral-300 uppercase">Referral Invitation coordinates</h4>
                    <p className="text-[11px] text-neutral-400">
                      Invite coordinates. Successful referrals yield a recurring 10% cash credit.
                    </p>
                    <div className="p-2.5 bg-neutral-950 border border-neutral-850 rounded-xl flex items-center justify-between">
                      <span className="font-mono text-xs text-gold-400 font-bold">HUBREF-{currentUser.username.toUpperCase()}</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`https://creatorhub.com/invite?ref=HUBREF-${currentUser.username.toUpperCase()}`);
                          setProfileSuccessMsg('Referral coordinate coordinates copied to clipboard!');
                          setTimeout(() => setProfileSuccessMsg(''), 2500);
                        }}
                        className="p-1 text-neutral-400 hover:text-white transition"
                        title="Copy code"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Column: Subscriptions & Payments */}
                <div className="space-y-6 lg:col-span-2">
                  
                  {/* Subscription management */}
                  <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-4">
                    <h4 className="font-display font-semibold text-xs tracking-wider text-neutral-300 uppercase">My Active Subscription Perks</h4>
                    
                    {Object.keys(currentUser.activeSubscriptions).length === 0 ? (
                      <p className="text-neutral-400 text-xs py-2">You hold no active premium subscriptions.</p>
                    ) : (
                      <div className="space-y-4">
                        {Object.entries(currentUser.activeSubscriptions).map(([creatorId, subVal]) => {
                          const sub = subVal as {
                            planId: string;
                            tier: number;
                            startDate: string;
                            expiryDate: string;
                            status: 'active' | 'cancelled';
                          };
                          const creator = creatorsList.find((c) => c.id === creatorId);
                          return (
                            <div key={creatorId} className="p-4 bg-neutral-950 border border-neutral-850 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <img
                                  src={creator?.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg'}
                                  alt={creator?.name}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                                <div>
                                  <span className="font-bold text-white block text-sm">{creator?.name}</span>
                                  <span className="text-xs text-gold-400">
                                    {sub.tier === 1 && 'Bronze Plan'}
                                    {sub.tier === 2 && 'Silver VIP'}
                                    {sub.tier === 3 && 'Gold VIP Tier'}
                                  </span>
                                  <span className="block text-[10px] text-neutral-500 font-mono">Renews: {sub.expiryDate}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedCreatorId(creatorId);
                                    setActiveView('creators');
                                  }}
                                  className="py-1 px-2.5 rounded-lg bg-neutral-900 hover:bg-neutral-850 border border-neutral-850 text-xs font-semibold transition"
                                >
                                  Open Feed
                                </button>
                                <button
                                  onClick={() => handleUnsubscribe(creatorId)}
                                  className="py-1 px-2.5 rounded-lg text-red-400 hover:bg-red-500/10 text-xs font-semibold transition"
                                >
                                  Revoke
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Payment History ledger */}
                  <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-4">
                    <h4 className="font-display font-semibold text-xs tracking-wider text-neutral-300 uppercase">Chronological Payments ledger</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-neutral-850 text-neutral-400 font-medium">
                            <th className="py-2">Transaction ID</th>
                            <th>Creator</th>
                            <th>Plan Level</th>
                            <th>Authorized Value</th>
                            <th className="text-right">Transaction Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-900 text-neutral-300 font-mono text-[11px]">
                          {paymentHistory
                            .filter((p) => p.userId === currentUser.id)
                            .map((pay) => (
                              <tr key={pay.id} className="hover:bg-neutral-850/30 transition">
                                <td className="py-2.5">{pay.id}</td>
                                <td className="font-sans font-semibold text-white">{pay.creatorName}</td>
                                <td className="font-sans text-gold-400">{pay.planTitle}</td>
                                <td className="text-white">${pay.amount.toFixed(2)}</td>
                                <td className="text-right text-neutral-500">{pay.date}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* VIEW: Admin Dashboard */}
          {!selectedCreatorId && activeView === 'admin' && currentUser?.role === 'admin' && (
            <motion.div
              key="admin"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
            >
              <AdminDashboard
                currentUser={currentUser}
                applications={applications}
                onApproveApplication={handleApproveApplication}
                onRejectApplication={handleRejectApplication}
                users={platformUsers}
                onToggleUserStatus={handleToggleUserStatus}
                onToggleUserRole={handleToggleUserRole}
                coupons={coupons}
                onAddCoupon={handleAddCoupon}
                onDeleteCoupon={handleDeleteCoupon}
                onBroadcastAnnouncement={handleBroadcastAnnouncement}
                communityPosts={communityPosts}
                onDeleteCommunityPost={handleDeletePost}
                activePresences={activePresences}
              />
            </motion.div>
          )}

          {/* VIEW: Creator Studio Dashboard */}
          {!selectedCreatorId && activeView === 'creator_studio' && currentUser?.role === 'creator' && activeCreatorDashboardProfile && (
            <motion.div
              key="creator_studio"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
            >
              <CreatorDashboard
                currentUser={currentUser}
                creatorProfile={activeCreatorDashboardProfile}
                onUpdateCreatorProfile={handleUpdateCreatorProfile}
                onAddContent={handleAddCreatorContent}
                collabApplications={collabProposals}
                onRespondToCollab={handleRespondToCollab}
              />
            </motion.div>
          )}

          {/* VIEW: Terms and Policies */}
          {!selectedCreatorId && activeView === 'terms' && (
            <motion.div
              key="terms"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="max-w-2xl mx-auto space-y-6 leading-relaxed text-xs text-neutral-300"
            >
              <h2 className="font-display text-xl font-bold tracking-tight text-white border-b border-neutral-900 pb-3">
                Terms of Service Coordinates
              </h2>
              <p>Welcome to Creator Hub. This agreement is effective as of July 11, 2026.</p>
              <h3 className="font-display font-semibold text-white">1. Gated Access & Subscription renews</h3>
              <p>Subscribing to creator plans authorizes recurring credit transactions processed via Stripe or PayPal. Cancelation of perks can be executed anytime with instant effect.</p>
              <h3 className="font-display font-semibold text-white">2. Creator Guidelines</h3>
              <p>Uploaded video, photos, or audio templates must comply with international standards. We do not tolerate copyright violations or abusive content.</p>
            </motion.div>
          )}

          {/* VIEW: Privacy policy */}
          {!selectedCreatorId && activeView === 'privacy' && (
            <motion.div
              key="privacy"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="max-w-2xl mx-auto space-y-6 leading-relaxed text-xs text-neutral-300"
            >
              <h2 className="font-display text-xl font-bold tracking-tight text-white border-b border-neutral-900 pb-3">
                GDPR & Privacy Coordinates
              </h2>
              <p>We take database security seriously. Creator Hub encrypts and hashes all supporter details.</p>
              <h3 className="font-display font-semibold text-white">1. Personally Identifiable Information (PII)</h3>
              <p>No card details or secrets are written to plain text databases. All payments are verified securely via tokenized gateways.</p>
              <h3 className="font-display font-semibold text-white">2. Right to erasure</h3>
              <p>You can request account deletion coordinates. If verified, all sub files, records, and diaries are permanently wiped.</p>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Floating support live chat widget */}
      <LiveChatSupport />

      {/* Cookie Consent Banner */}
      <AnimatePresence>
        {cookieConsentOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-6 z-40 max-w-sm p-4 rounded-2xl border border-gold-400/20 bg-neutral-950 text-white shadow-xl space-y-3 text-xs"
          >
            <div className="flex items-center gap-1.5 font-semibold text-gold-400">
              <Info size={14} />
              <span>Cookie Consent Coordinates</span>
            </div>
            <p className="text-neutral-400 text-[11px] leading-relaxed">
              We leverage browser local storage to preserve sessions, selected themes, and synchronized creator profiles securely.
            </p>
            <div className="flex justify-end gap-2 text-[10px] font-bold">
              <button
                onClick={() => setActiveView('privacy')}
                className="px-2.5 py-1.5 hover:underline text-neutral-400"
              >
                Review Policy
              </button>
              <button
                onClick={handleAcceptCookies}
                className="px-3 py-1.5 bg-gradient-to-r from-gold-600 to-gold-400 text-neutral-950 rounded-lg transition"
              >
                Acknowledge & Save
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Persistent global Footer */}
      <footer className={`mt-auto border-t py-8 transition-colors duration-200 ${activeTheme === 'dark' ? 'bg-[#13070b]/60 border-pink-950/40 text-pink-200/80' : 'bg-[#ffe4ec]/80 border-pink-200 text-neutral-600'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs text-center sm:text-left">
          
          <div className="space-y-2">
            <span className="font-display font-black tracking-wider uppercase text-white">
              CREATOR <span className="gold-gradient-text font-extrabold">HUB</span>
            </span>
            <p className="text-[10px] text-neutral-500 leading-relaxed">
              Premium subscription gateway coordinates. Synthesizing audio, fashion, and business briefs securely.
            </p>
          </div>

          <div className="space-y-1.5">
            <h5 className="font-bold text-white text-xs uppercase">Platform Coordinates</h5>
            <div className="flex flex-col gap-1">
              <button onClick={() => setActiveView('terms')} className="hover:text-gold-400 text-left cursor-pointer">Terms of Service</button>
              <button onClick={() => setActiveView('privacy')} className="hover:text-gold-400 text-left cursor-pointer">Privacy & GDPR</button>
              <button onClick={() => setActiveView('about')} className="hover:text-gold-400 text-left cursor-pointer">About Platform</button>
            </div>
          </div>

          <div className="space-y-1.5">
            <h5 className="font-bold text-white text-xs uppercase">VIP Concierge</h5>
            <p className="text-[10px] text-neutral-500 leading-relaxed">
              Direct physical operations base: Mayfair, London, UK. Concierge dispatch: concierge@creatorhub.com
            </p>
            <p className="text-[9px] text-neutral-600 mt-1">© 2026 Creator Hub Platform, Inc. All rights reserved.</p>
          </div>

        </div>
      </footer>

      {/* Auth Modal overlay portal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}
