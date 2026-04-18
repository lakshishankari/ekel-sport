import React from "react";
import {
  View, Text, Image, TouchableOpacity, Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAppTheme } from "../lib/themeStore";

export type Post = {
  id: number;
  authorId: string;
  authorName: string;
  authorRole: "ADMIN" | "STUDENT";
  sport?: string;
  content: string;
  hashtags: string[];
  timeAgo: string;
  likes: number;
  comments: number;
  liked: boolean;
  avatarColor: string;
  images?: ReturnType<typeof require>[];
};

const { width: SCREEN_W } = Dimensions.get("window");

function ImageGrid({ images }: { images: ReturnType<typeof require>[] }) {
  const { theme } = useAppTheme();
  if (!images || images.length === 0) return null;

  if (images.length === 1) {
    return (
      <Image
        source={images[0]}
        style={{ width: "100%", height: 240, backgroundColor: theme.border }}
        resizeMode="cover"
      />
    );
  }

  // 2-image layout: main image on left (60%), two stacked on right (40%)
  const mainW = SCREEN_W * 0.595;
  const sideW = SCREEN_W * 0.4;

  return (
    <View style={{ flexDirection: "row", height: 230, gap: 2 }}>
      <Image
        source={images[0]}
        style={{ width: mainW, height: "100%", backgroundColor: theme.border }}
        resizeMode="cover"
      />
      <View style={{ flex: 1, gap: 2 }}>
        {images.slice(1, 3).map((img, i) => (
          <Image
            key={i}
            source={img}
            style={{ flex: 1, width: sideW, backgroundColor: theme.border }}
            resizeMode="cover"
          />
        ))}
        {images.length > 3 && (
          <View style={{
            position: "absolute", bottom: 0, right: 0,
            width: sideW, height: "50%",
            backgroundColor: "#000000aa",
            alignItems: "center", justifyContent: "center",
          }}>
            <Text style={{ color: "white", fontSize: 22, fontWeight: "900" }}>
              +{images.length - 3}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

type Props = {
  post: Post;
  onLike: (id: number) => void;
};

export default function PostCard({ post, onLike }: Props) {
  const { theme } = useAppTheme();
  const isAdmin = post.authorRole === "ADMIN";
  const initials = post.authorName
    .split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");

  const goToProfile = () => {
    router.push({
      pathname: "/viewProfile" as any,
      params: { authorId: post.authorId, authorName: post.authorName, avatarColor: post.avatarColor },
    });
  };

  return (
    <View style={{
      backgroundColor: theme.bgCard,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      marginBottom: 6,
    }}>
      {/* ── Header ── */}
      <View style={{ flexDirection: "row", alignItems: "center", padding: 14, paddingBottom: 10 }}>
        <TouchableOpacity onPress={goToProfile} activeOpacity={0.8}>
          <View style={{
            width: 46, height: 46, borderRadius: 23,
            backgroundColor: post.avatarColor,
            alignItems: "center", justifyContent: "center",
          }}>
            <Text style={{ color: "white", fontSize: 15, fontWeight: "900" }}>{initials}</Text>
          </View>
        </TouchableOpacity>

        <View style={{ flex: 1, marginLeft: 10 }}>
          <TouchableOpacity onPress={goToProfile} activeOpacity={0.8}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <Text style={{ color: theme.accent, fontSize: 15, fontWeight: "900" }}>
                {post.authorName}
              </Text>
              <View style={{
                backgroundColor: isAdmin ? theme.accent + "22" : "#10B98122",
                paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999,
              }}>
                <Text style={{
                  color: isAdmin ? theme.accent : "#10B981",
                  fontSize: 10, fontWeight: "700",
                }}>
                  {isAdmin ? "Coach / Admin" : "Student"}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
          <Text style={{ color: theme.textSub, fontSize: 12, marginTop: 2 }}>
            {post.sport ? `${post.sport} · ` : ""}{post.timeAgo}
          </Text>
        </View>

        <Ionicons name="ellipsis-horizontal" size={20} color={theme.textSub} />
      </View>

      {/* ── Body text ── */}
      <Text style={{
        color: theme.text, fontSize: 14, lineHeight: 21,
        paddingHorizontal: 14, paddingBottom: 10,
      }}>
        {post.content}
      </Text>

      {/* ── Hashtags ── */}
      {post.hashtags && post.hashtags.length > 0 && (
        <View style={{ flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 14, paddingBottom: 12, gap: 4 }}>
          {post.hashtags.map((tag) => (
            <Text key={tag} style={{ color: theme.accent, fontSize: 13, fontWeight: "600" }}>
              {tag}{" "}
            </Text>
          ))}
        </View>
      )}

      {/* ── Image grid ── */}
      {post.images && post.images.length > 0 && (
        <ImageGrid images={post.images} />
      )}

      {/* ── Counts ── */}
      <View style={{
        flexDirection: "row", justifyContent: "space-between",
        paddingHorizontal: 14, paddingTop: 10, paddingBottom: 8,
      }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <View style={{ flexDirection: "row", gap: -4 }}>
            <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: "#EF4444", alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="heart" size={10} color="white" />
            </View>
            <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: "#3B82F6", alignItems: "center", justifyContent: "center", marginLeft: -4 }}>
              <Ionicons name="thumbs-up" size={10} color="white" />
            </View>
          </View>
          <Text style={{ color: theme.textSub, fontSize: 12, marginLeft: 6 }}>{post.likes}</Text>
        </View>
        <Text style={{ color: theme.textSub, fontSize: 12 }}>{post.comments} comments</Text>
      </View>

      {/* ── Divider ── */}
      <View style={{ height: 1, backgroundColor: theme.border, marginHorizontal: 14 }} />

      {/* ── Actions ── */}
      <View style={{ flexDirection: "row", paddingVertical: 4 }}>
        {/* Like */}
        <TouchableOpacity
          onPress={() => onLike(post.id)}
          style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 9, gap: 6 }}
          activeOpacity={0.7}
        >
          <Ionicons
            name={post.liked ? "heart" : "heart-outline"}
            size={20}
            color={post.liked ? "#EF4444" : theme.textSub}
          />
          <Text style={{ color: post.liked ? "#EF4444" : theme.textSub, fontSize: 13, fontWeight: "600" }}>
            {post.liked ? "Liked" : "Like"}
          </Text>
        </TouchableOpacity>

        {/* Comment */}
        <TouchableOpacity
          style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 9, gap: 6 }}
          activeOpacity={0.7}
        >
          <Ionicons name="chatbubble-outline" size={20} color={theme.textSub} />
          <Text style={{ color: theme.textSub, fontSize: 13, fontWeight: "600" }}>Comment</Text>
        </TouchableOpacity>

        {/* Repost */}
        <TouchableOpacity
          style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 9, gap: 6 }}
          activeOpacity={0.7}
        >
          <Ionicons name="repeat-outline" size={20} color={theme.textSub} />
          <Text style={{ color: theme.textSub, fontSize: 13, fontWeight: "600" }}>Repost</Text>
        </TouchableOpacity>

        {/* Send */}
        <TouchableOpacity
          style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 9, gap: 6 }}
          activeOpacity={0.7}
        >
          <Ionicons name="paper-plane-outline" size={20} color={theme.textSub} />
          <Text style={{ color: theme.textSub, fontSize: 13, fontWeight: "600" }}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
