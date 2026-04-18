import React, { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StatusBar, Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAppTheme } from "../lib/themeStore";
import type { Post } from "../components/PostCard";
import PostCard from "../components/PostCard";

export default function ViewProfile() {
  const { theme, isDark } = useAppTheme();
  const { authorId, authorName, avatarColor } = useLocalSearchParams<{
    authorId: string;
    authorName: string;
    avatarColor: string;
  }>();

  const [posts, setPosts] = useState<Post[]>([]);

  const initials = (authorName || "?")
    .split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");

  const color = avatarColor || "#4F46E5";

  const toggleLike = (postId: number) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id !== postId ? p : { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 }
      )
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={theme.bgCard} />

      {/* ── Header bar ── */}
      <View style={{
        flexDirection: "row", alignItems: "center",
        paddingHorizontal: 16,
        paddingTop: Platform.OS === "ios" ? 52 : 40,
        paddingBottom: 12,
        backgroundColor: theme.bgCard,
        borderBottomWidth: 1, borderBottomColor: theme.border,
      }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 14 }} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={{ color: theme.text, fontSize: 18, fontWeight: "900", flex: 1 }}>{authorName}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>

        {/* ── Profile card ── */}
        <View style={{
          backgroundColor: theme.bgCard,
          borderBottomWidth: 1, borderBottomColor: theme.border,
          paddingBottom: 20,
        }}>
          {/* Accent banner */}
          <View style={{ height: 80, backgroundColor: color + "33" }} />

          {/* Avatar */}
          <View style={{ paddingHorizontal: 16, marginTop: -36 }}>
            <View style={{
              width: 72, height: 72, borderRadius: 36,
              backgroundColor: color,
              alignItems: "center", justifyContent: "center",
              borderWidth: 3, borderColor: theme.bgCard,
            }}>
              <Text style={{ color: "white", fontSize: 24, fontWeight: "900" }}>{initials}</Text>
            </View>
          </View>

          {/* Name & role */}
          <View style={{ paddingHorizontal: 16, marginTop: 10 }}>
            <Text style={{ color: theme.text, fontSize: 22, fontWeight: "900" }}>{authorName}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 }}>
              {posts.length > 0 && (
                <View style={{
                  backgroundColor: posts[0].authorRole === "ADMIN" ? theme.accent + "22" : "#10B98122",
                  paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999,
                }}>
                  <Text style={{
                    color: posts[0].authorRole === "ADMIN" ? theme.accent : "#10B981",
                    fontSize: 12, fontWeight: "700",
                  }}>
                    {posts[0].authorRole === "ADMIN" ? "Coach / Admin" : "Student"}
                  </Text>
                </View>
              )}
              {posts[0]?.sport && (
                <Text style={{ color: theme.textSub, fontSize: 13 }}>{posts[0].sport}</Text>
              )}
            </View>
            <Text style={{ color: theme.textSub, fontSize: 13, marginTop: 6 }}>
              University of Kelaniya · Sports Department
            </Text>
          </View>

          {/* Stats row */}
          <View style={{
            flexDirection: "row", marginHorizontal: 16, marginTop: 16,
            gap: 20,
          }}>
            <View style={{ alignItems: "center" }}>
              <Text style={{ color: theme.text, fontSize: 18, fontWeight: "900" }}>{posts.length}</Text>
              <Text style={{ color: theme.textSub, fontSize: 11, marginTop: 2 }}>Posts</Text>
            </View>
            <View style={{ alignItems: "center" }}>
              <Text style={{ color: theme.text, fontSize: 18, fontWeight: "900" }}>
                {posts.reduce((s, p) => s + p.likes, 0)}
              </Text>
              <Text style={{ color: theme.textSub, fontSize: 11, marginTop: 2 }}>Likes</Text>
            </View>
            <View style={{ alignItems: "center" }}>
              <Text style={{ color: theme.text, fontSize: 18, fontWeight: "900" }}>
                {posts.reduce((s, p) => s + p.comments, 0)}
              </Text>
              <Text style={{ color: theme.textSub, fontSize: 11, marginTop: 2 }}>Comments</Text>
            </View>
          </View>
        </View>

        {/* ── Posts section ── */}
        <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
          <Text style={{ color: theme.text, fontSize: 16, fontWeight: "900" }}>Activity</Text>
          <Text style={{ color: theme.textSub, fontSize: 13, marginTop: 2 }}>
            {posts.length > 0 ? `${posts.length} post${posts.length !== 1 ? "s" : ""}` : "No posts yet"}
          </Text>
        </View>

        {posts.length === 0 ? (
          <View style={{ alignItems: "center", paddingTop: 40, paddingHorizontal: 24 }}>
            <Ionicons name="document-text-outline" size={48} color={theme.border} />
            <Text style={{ color: theme.textSub, fontSize: 14, marginTop: 12 }}>No posts yet</Text>
          </View>
        ) : (
          posts.map((post) => (
            <PostCard key={post.id} post={post} onLike={toggleLike} />
          ))
        )}
      </ScrollView>
    </View>
  );
}
