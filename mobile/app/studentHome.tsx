import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StatusBar, RefreshControl, ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { loadAuth } from "../lib/authStore";
import { apiGet, apiPost } from "../lib/api";
import { logout } from "../lib/logout";
import { useAppTheme } from "../lib/themeStore";
import StudentBottomNav from "../components/StudentBottomNav";
import PostCard from "../components/PostCard";

type FeedPost = {
  id: number; author_id: number; author_name: string; author_role: "ADMIN" | "STUDENT";
  sport_tag: string | null; content: string; likes_count: number;
  created_at: string; liked_by_me: number;
};

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60)    return "just now";
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  if (diff < 31536000) return `${Math.floor(diff / 2592000)}mo ago`;
  return `${Math.floor(diff / 31536000)}y ago`;
}

const AVATAR_COLORS = ["#4F46E5", "#10B981", "#C9A227", "#EF4444", "#8B5CF6", "#3B82F6", "#F59E0B"];
function hashColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function StudentHome() {
  const { theme, isDark } = useAppTheme();
  const [fullName, setFullName]     = useState("Student");
  const [avatarColor, setAvatarColor] = useState("#4F46E5");
  const [unread, setUnread]         = useState(0);
  const [posts, setPosts]           = useState<FeedPost[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingFeed, setLoadingFeed] = useState(true);

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoadingFeed(true);
      const auth = await loadAuth();
      if (!auth.token || auth.role !== "STUDENT") { router.replace("/login"); return; }
      if (auth.fullName) setFullName(auth.fullName);
      setAvatarColor(hashColor(auth.fullName || "Student"));

      const [postsData, unreadData] = await Promise.all([
        apiGet<FeedPost[]>("/api/student/posts", auth.token),
        apiGet<{ unread: number }>("/api/student/notifications/unread-count", auth.token),
      ]);
      setPosts(Array.isArray(postsData) ? postsData : []);
      setUnread(unreadData?.unread || 0);
    } catch { /* silent */ }
    finally { setLoadingFeed(false); setRefreshing(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  const onRefresh = () => { setRefreshing(true); loadData(true); };

  const toggleLike = async (postId: number) => {
    try {
      const { token } = await loadAuth();
      const res = await apiPost<{ liked: boolean }>(`/api/student/posts/${postId}/like`, {}, token!);
      setPosts((prev) =>
        prev.map((p) =>
          p.id !== postId ? p : { ...p, liked_by_me: res.liked ? 1 : 0, likes_count: res.liked ? p.likes_count + 1 : Math.max(0, p.likes_count - 1) }
        )
      );
    } catch { /* ignore */ }
  };

  const initials = fullName.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={theme.bgCard} />

      {/* ── Top Header ── */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 48, paddingBottom: 12, backgroundColor: theme.bgCard, borderBottomWidth: 1, borderBottomColor: theme.border }}>
        <TouchableOpacity onPress={() => router.push("/studentProfile")} activeOpacity={0.8}>
          <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: avatarColor }}>
            <Text style={{ color: "white", fontSize: 14, fontWeight: "900" }}>{initials}</Text>
          </View>
        </TouchableOpacity>

        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={{ color: theme.text, fontSize: 20, fontWeight: "900" }}>{fullName.split(" ")[0]}</Text>
          <Text style={{ color: theme.textSub, fontSize: 12 }}>Sports Feed</Text>
        </View>

        {/* Notifications */}
        <TouchableOpacity
          onPress={() => router.push("/studentNotifications")}
          style={{ padding: 9, borderRadius: 999, backgroundColor: theme.bgInput, borderWidth: 1, borderColor: theme.border, marginLeft: 8 }}
          activeOpacity={0.7}
        >
          <Ionicons name="notifications-outline" size={22} color={theme.text} />
          {unread > 0 && (
            <View style={{ position: "absolute", top: -4, right: -4, minWidth: 16, height: 16, borderRadius: 999, backgroundColor: "#EF4444", alignItems: "center", justifyContent: "center", paddingHorizontal: 4 }}>
              <Text style={{ color: "white", fontSize: 10, fontWeight: "900" }}>{unread > 99 ? "99+" : String(unread)}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Logout */}
        <TouchableOpacity
          onPress={logout}
          style={{ padding: 9, borderRadius: 999, backgroundColor: theme.bgInput, borderWidth: 1, borderColor: theme.border, marginLeft: 8 }}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={22} color={theme.textSub} />
        </TouchableOpacity>
      </View>

      {/* ── Feed ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 12 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} colors={[theme.accent]} />}
      >
        {/* Create-post bar */}
        <TouchableOpacity
          onPress={() => router.push("/studentCreatePost")}
          style={{ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: theme.bgCard, borderBottomWidth: 1, borderBottomColor: theme.border, padding: 14, paddingHorizontal: 16 }}
          activeOpacity={0.85}
        >
          <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: avatarColor }}>
            <Text style={{ color: "white", fontSize: 14, fontWeight: "900" }}>{initials}</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: theme.bgInput, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1, borderColor: theme.border }}>
            <Text style={{ color: theme.textSub, fontSize: 14 }}>Share something with your team...</Text>
          </View>
        </TouchableOpacity>

        {loadingFeed && !refreshing ? (
          <View style={{ alignItems: "center", paddingVertical: 40 }}>
            <ActivityIndicator size="large" color={theme.accent} />
          </View>
        ) : posts.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 60 }}>
            <Ionicons name="newspaper-outline" size={48} color={theme.textSub} />
            <Text style={{ color: theme.textSub, marginTop: 12, fontSize: 15, fontWeight: "700" }}>No posts yet</Text>
            <Text style={{ color: theme.textMuted, fontSize: 13, marginTop: 4 }}>Check back after your coach posts an update!</Text>
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
                avatarColor: hashColor(post.author_name),
              }}
              onLike={toggleLike}
            />
          ))
        )}
      </ScrollView>

      {/* ── Bottom Nav ── */}
      <StudentBottomNav activeRoute="/studentHome" />
    </View>
  );
}
