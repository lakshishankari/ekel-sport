import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View, Text, ScrollView, StatusBar,
  TouchableOpacity, RefreshControl, Animated,
  TouchableWithoutFeedback, Platform, ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { loadAuth, clearAuth } from "../lib/authStore";
import { useAppTheme } from "../lib/themeStore";
import { apiGet, apiPost } from "../lib/api";
import PostCard from "../components/PostCard";

/* ─── Types ─────────────────────────────────────────────────── */
type Stats = { totalStudents: number; totalSports: number; pendingEnrollments: number; inSquadCount: number };
type FeedPost = {
  id: number; author_id: number; author_name: string; author_role: "ADMIN" | "STUDENT";
  sport_tag: string | null; content: string; likes_count: number;
  visibility: string;
  created_at: string; liked_by_me: number;
};

/* ─── Bottom Nav Tabs ─────────────────────────────────────────── */
const BOTTOM_TABS = [
  { label: "Home",        icon: "home-outline"      as const, route: "/adminHome",       isCreate: false },
  { label: "Students",   icon: "people-outline"    as const, route: "/adminUsers",       isCreate: false },
  { label: "Post",       icon: "add-circle-outline" as const, route: "/adminCreatePost",  isCreate: true  },
  { label: "Enroll",     icon: "clipboard-outline"  as const, route: "/adminEnrollments", isCreate: false },
  { label: "Reports",    icon: "bar-chart-outline"  as const, route: "/adminReports",     isCreate: false },
];

/* ─── Drawer Items (clean, no duplicates) ────────────────────── */
const DRAWER_ITEMS = [
  { title: "Sports",              icon: "football-outline"          as const, route: "/adminSports",               accent: "#10B981" },
  { title: "Squad Pool",          icon: "shield-outline"            as const, route: "/adminSquadPool",             accent: "#6366F1" },
  { title: "Attendance",          icon: "calendar-number-outline"   as const, route: "/adminAttendanceList",        accent: "#F59E0B" },
  { title: "Player Stats",         icon: "stats-chart-outline"       as const, route: "/adminPlayerStats",              accent: "#D4AF37" },
  { title: "Announcements",       icon: "megaphone-outline"         as const, route: "/adminAnnouncements",         accent: "#F59E0B" },
  { title: "Events",              icon: "calendar-outline"          as const, route: "/adminEvents",                accent: "#3B82F6" },
  { title: "Reports",             icon: "bar-chart-outline"         as const, route: "/adminReports",               accent: "#EF4444" },
  { title: "Create Advisory",     icon: "person-add-outline"        as const, route: "/createAdvisory",             accent: "#8B5CF6" },
];

/* ════════════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════════════ */
export default function AdminHome() {
  const { theme, isDark } = useAppTheme();
  const [userName, setUserName]       = useState("Admin");
  const [stats, setStats]             = useState<Stats>({ totalStudents: 0, totalSports: 0, pendingEnrollments: 0, inSquadCount: 0 });
  const [posts, setPosts]             = useState<FeedPost[]>([]);
  const [refreshing, setRefreshing]   = useState(false);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [drawerOpen, setDrawerOpen]   = useState(false);
  const [feedFilter, setFeedFilter]   = useState<"all" | "my-sports">("all");

  const drawerX        = useRef(new Animated.Value(-300)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  /* ── Load data ── */
  const loadData = useCallback(async (isRefresh = false, filter: "all" | "my-sports" = feedFilter) => {
    try {
      if (!isRefresh) setLoadingFeed(true);
      const { token, role, fullName } = await loadAuth();
      if (!token || role !== "ADMIN") { router.replace("/login"); return; }
      if (fullName) setUserName(fullName);

      const postsUrl = filter === "my-sports"
        ? "/api/admin/posts?filter=my-sports"
        : "/api/admin/posts";

      const [statsData, postsData] = await Promise.all([
        apiGet<Stats>("/api/admin/stats", token),
        apiGet<FeedPost[]>(postsUrl, token),
      ]);
      setStats(statsData);
      setPosts(Array.isArray(postsData) ? postsData : []);
    } catch (e) {
      // silently fall back — keep whatever was loaded before
    } finally {
      setLoadingFeed(false);
      setRefreshing(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedFilter]);

  useEffect(() => { loadData(); }, [loadData]);
  const onRefresh = () => { setRefreshing(true); loadData(true); };

  const switchFilter = (f: "all" | "my-sports") => {
    setFeedFilter(f);
    setLoadingFeed(true);
    loadData(false, f);
  };

  /* ── Like toggle ── */
  const toggleLike = async (postId: number) => {
    try {
      const { token } = await loadAuth();
      const res = await apiPost<{ liked: boolean }>(`/api/admin/posts/${postId}/like`, {}, token!);
      setPosts((prev) =>
        prev.map((p) =>
          p.id !== postId ? p : { ...p, liked_by_me: res.liked ? 1 : 0, likes_count: res.liked ? p.likes_count + 1 : Math.max(0, p.likes_count - 1) }
        )
      );
    } catch { /* ignore */ }
  };

  /* ── Drawer helpers ── */
  const openDrawer = () => {
    setDrawerOpen(true);
    Animated.parallel([
      Animated.spring(drawerX, { toValue: 0, useNativeDriver: true, tension: 80, friction: 10 }),
      Animated.timing(overlayOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
  };
  const closeDrawer = () => {
    Animated.parallel([
      Animated.spring(drawerX, { toValue: -300, useNativeDriver: true, tension: 80, friction: 10 }),
      Animated.timing(overlayOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setDrawerOpen(false));
  };
  const navigateDrawer = (route: string) => {
    closeDrawer();
    setTimeout(() => router.replace(route as any), 220);
  };

  const adminInitials = userName.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");

  const QUICK_STATS = [
    { label: "Students", value: String(stats.totalStudents),      color: "#C9A227" },
    { label: "Sports",   value: String(stats.totalSports),        color: "#10B981" },
    { label: "Pending",  value: String(stats.pendingEnrollments), color: "#F59E0B" },
    { label: "In Squad", value: String(stats.inSquadCount),       color: "#6366F1" },
  ];

  /* ─── RENDER ─── */
  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={theme.bgCard} />

      {/* ══ TOP HEADER ══ */}
      <View style={{
        flexDirection: "row", alignItems: "center",
        paddingHorizontal: 16, paddingTop: 48, paddingBottom: 12,
        backgroundColor: theme.bgCard,
        borderBottomWidth: 1, borderBottomColor: theme.border,
      }}>
        <TouchableOpacity
          onPress={openDrawer}
          style={{ padding: 8, borderRadius: 10, backgroundColor: theme.bgInput, borderWidth: 1, borderColor: theme.border }}
          activeOpacity={0.7}
        >
          <Ionicons name="menu-outline" size={24} color={theme.text} />
        </TouchableOpacity>

        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={{ color: theme.text, fontSize: 20, fontWeight: "900" }}>
            {userName.split(" ")[0]}
          </Text>
          <Text style={{ color: theme.textSub, fontSize: 12 }}>Admin · Sports Feed</Text>
        </View>

        <TouchableOpacity
          onPress={() => router.push("/adminProfile" as any)}
          style={{ padding: 9, borderRadius: 999, backgroundColor: theme.bgInput, borderWidth: 1, borderColor: theme.border }}
          activeOpacity={0.7}
        >
          <Ionicons name="person-circle-outline" size={22} color={theme.text} />
        </TouchableOpacity>
      </View>

      {/* ══ FEED ══ */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 12 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} colors={[theme.accent]} />
        }
      >
        {/* Quick stats strip */}
        <View style={{
          flexDirection: "row", gap: 8,
          paddingHorizontal: 14, paddingVertical: 12,
          backgroundColor: theme.bgCard,
          borderBottomWidth: 1, borderBottomColor: theme.border,
        }}>
          {QUICK_STATS.map((s) => (
            <View key={s.label} style={{
              flex: 1, backgroundColor: theme.bg,
              borderRadius: 12, paddingVertical: 10,
              alignItems: "center", borderWidth: 1, borderColor: theme.border,
            }}>
              <Text style={{ fontSize: 18, fontWeight: "900", color: s.color }}>{s.value}</Text>
              <Text style={{ color: theme.textSub, fontSize: 9, fontWeight: "700", marginTop: 2 }}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Create-post bar */}
        <TouchableOpacity
          onPress={() => router.push("/adminCreatePost" as any)}
          style={{
            flexDirection: "row", alignItems: "center", gap: 12,
            backgroundColor: theme.bgCard,
            borderBottomWidth: 1, borderBottomColor: theme.border,
            padding: 14, paddingHorizontal: 16,
          }}
          activeOpacity={0.85}
        >
          <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: theme.accent }}>
            <Text style={{ color: "white", fontSize: 14, fontWeight: "900" }}>{adminInitials}</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: theme.bgInput, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1, borderColor: theme.border }}>
            <Text style={{ color: theme.textSub, fontSize: 14 }}>Share an announcement or update...</Text>
          </View>
        </TouchableOpacity>

        {/* Filter toggle bar */}
        <View style={{ flexDirection: "row", backgroundColor: theme.bgCard, borderBottomWidth: 1, borderBottomColor: theme.border, paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}>
          {(["all", "my-sports"] as const).map((f) => {
            const active = feedFilter === f;
            return (
              <TouchableOpacity
                key={f}
                onPress={() => switchFilter(f)}
                activeOpacity={0.8}
                style={{
                  flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: "center",
                  backgroundColor: active ? theme.accent + "18" : theme.bgInput,
                  borderWidth: 1, borderColor: active ? theme.accent : theme.border,
                }}
              >
                <Text style={{ color: active ? theme.accent : theme.textSub, fontSize: 13, fontWeight: active ? "800" : "600" }}>
                  {f === "all" ? "🌐 All Posts" : "⚽ Tagged Sport"}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Feed */}
        {loadingFeed && !refreshing ? (
          <View style={{ alignItems: "center", paddingVertical: 40 }}>
            <ActivityIndicator size="large" color={theme.accent} />
          </View>
        ) : posts.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 60 }}>
            <Ionicons name="newspaper-outline" size={48} color={theme.textSub} />
            <Text style={{ color: theme.textSub, marginTop: 12, fontSize: 15, fontWeight: "700" }}>No posts yet</Text>
            <Text style={{ color: theme.textMuted, fontSize: 13, marginTop: 4 }}>Be the first to share an update!</Text>
          </View>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={{
                id: post.id,
                authorId: String(post.author_id),
                authorName: post.author_name,
                authorRole: post.author_role,
                sport: post.sport_tag ?? undefined,
                content: post.content,
                hashtags: [],
                timeAgo: formatTimeAgo(post.created_at),
                likes: post.likes_count,
                comments: 0,
                liked: post.liked_by_me === 1,
                avatarColor: "#C9A227",
              }}
              onLike={toggleLike}
            />
          ))
        )}
      </ScrollView>

      {/* ══ BOTTOM NAV ══ */}
      <View style={{
        flexDirection: "row",
        backgroundColor: theme.bgCard,
        borderTopWidth: 1, borderTopColor: theme.border,
        paddingTop: 8,
        paddingBottom: Platform.OS === "ios" ? 24 : 10,
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: -3 },
        elevation: 8,
      }}>
        {BOTTOM_TABS.map((tab) => {
          if (tab.isCreate) {
            return (
              <TouchableOpacity
                key={tab.route}
                onPress={() => router.replace(tab.route as any)}
                style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
                activeOpacity={0.8}
              >
                <View style={{
                  width: 52, height: 52, borderRadius: 26,
                  backgroundColor: theme.accent,
                  alignItems: "center", justifyContent: "center",
                  marginTop: -26,
                  shadowColor: theme.accent,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.45, shadowRadius: 10, elevation: 10,
                }}>
                  <Ionicons name="add" size={28} color="white" />
                </View>
                <Text style={{ color: theme.textSub, fontSize: 10, marginTop: 5, fontWeight: "600" }}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          }
          const isActive = tab.route === "/adminHome";
          return (
            <TouchableOpacity
              key={tab.route}
              onPress={() => router.replace(tab.route as any)}
              style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 2, position: "relative" }}
              activeOpacity={0.7}
            >
              {/* Active top indicator */}
              {isActive && (
                <View style={{
                  position: "absolute", top: -8,
                  width: 28, height: 3, borderRadius: 2,
                  backgroundColor: theme.accent,
                }} />
              )}
              <View style={{
                width: 36, height: 36, borderRadius: 10,
                alignItems: "center", justifyContent: "center",
                backgroundColor: isActive ? theme.accent + "1A" : "transparent",
              }}>
                <Ionicons name={tab.icon} size={22} color={isActive ? theme.accent : theme.textSub} />
              </View>
              <Text style={{ color: isActive ? theme.accent : theme.textSub, fontSize: 10, marginTop: 2, fontWeight: isActive ? "800" : "500" }}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ══ DRAWER OVERLAY ══ */}
      {drawerOpen && (
        <TouchableWithoutFeedback onPress={closeDrawer}>
          <Animated.View style={{
            position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: "#000",
            opacity: overlayOpacity.interpolate({ inputRange: [0, 1], outputRange: [0, 0.5] }),
          }} />
        </TouchableWithoutFeedback>
      )}

      {/* ══ DRAWER PANEL ══ */}
      <Animated.View style={{
        position: "absolute", top: 0, bottom: 0, left: 0,
        width: 285,
        backgroundColor: theme.bgCard,
        transform: [{ translateX: drawerX }],
        shadowColor: "#000",
        shadowOffset: { width: 4, height: 0 },
        shadowOpacity: 0.18, shadowRadius: 12, elevation: 16,
        paddingTop: Platform.OS === "ios" ? 54 : 44,
      }}>
        {/* Drawer header */}
        <View style={{ paddingHorizontal: 22, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: theme.border }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 14 }}>
            <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: theme.accent, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ color: "white", fontSize: 17, fontWeight: "900" }}>{adminInitials}</Text>
            </View>
            <View>
              <Text style={{ color: theme.text, fontSize: 16, fontWeight: "900" }}>{userName}</Text>
              <Text style={{ color: theme.textSub, fontSize: 12 }}>Administrator</Text>
            </View>
          </View>
          <TouchableOpacity onPress={closeDrawer} style={{ position: "absolute", top: 0, right: 16, padding: 8 }} activeOpacity={0.7}>
            <Ionicons name="close" size={24} color={theme.textSub} />
          </TouchableOpacity>
        </View>

        {/* Drawer items */}
        <ScrollView contentContainerStyle={{ paddingVertical: 12 }}>
          <Text style={{ color: theme.textSub, fontSize: 11, fontWeight: "800", letterSpacing: 1.2, paddingHorizontal: 22, marginBottom: 8, marginTop: 4 }}>
            ADMIN TOOLS
          </Text>
          {DRAWER_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.route}
              onPress={() => navigateDrawer(item.route)}
              style={{ flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 22, paddingVertical: 13 }}
              activeOpacity={0.7}
            >
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: item.accent + "22", alignItems: "center", justifyContent: "center" }}>
                <Ionicons name={item.icon} size={20} color={item.accent} />
              </View>
              <Text style={{ color: theme.text, fontSize: 14, fontWeight: "700", flex: 1 }}>{item.title}</Text>
              <Ionicons name="chevron-forward" size={16} color={theme.textSub} />
            </TouchableOpacity>
          ))}

          <View style={{ height: 1, backgroundColor: theme.border, marginHorizontal: 22, marginVertical: 12 }} />

          {/* Logout */}
          <TouchableOpacity
            onPress={async () => { closeDrawer(); await clearAuth(); router.replace("/login"); }}
            style={{ flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 22, paddingVertical: 14 }}
            activeOpacity={0.7}
          >
            <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: "#EF444422", alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            </View>
            <Text style={{ color: "#EF4444", fontSize: 14, fontWeight: "700", flex: 1 }}>Logout</Text>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now  = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60)   return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  if (diff < 31536000) return `${Math.floor(diff / 2592000)}mo ago`;
  return `${Math.floor(diff / 31536000)}y ago`;
}
