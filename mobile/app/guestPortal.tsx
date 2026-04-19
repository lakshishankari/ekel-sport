import React, { useRef, useState, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StatusBar,
  Animated, Dimensions, Platform, ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAppTheme } from "../lib/themeStore";
import PostCard from "../components/PostCard";
import type { Post } from "../components/PostCard";
import { API_BASE_URL } from "../lib/config";

const { width } = Dimensions.get("window");

/* ─────────────────────────────────────────────
   Sport icon / color map (fallback for dynamic sports)
───────────────────────────────────────────── */
const SPORT_META: Record<string, { icon: any; color: string }> = {
  Cricket:    { icon: "baseball-outline",    color: "#6366F1" },
  Badminton:  { icon: "tennisball-outline",  color: "#8B5CF6" },
  Football:   { icon: "football-outline",    color: "#10B981" },
  Basketball: { icon: "basketball-outline",  color: "#F59E0B" },
  Volleyball: { icon: "american-football-outline", color: "#EF4444" },
  Athletics:  { icon: "walk-outline",        color: "#EC4899" },
  Swimming:   { icon: "water-outline",       color: "#14B8A6" },
  Karate:     { icon: "body-outline",        color: "#EF4444" },
  Tennis:     { icon: "tennisball-outline",  color: "#F97316" },
  Hockey:     { icon: "baseball-outline",    color: "#0EA5E9" },
  Rugby:      { icon: "american-football-outline", color: "#84CC16" },
  Chess:      { icon: "grid-outline",        color: "#A78BFA" },
};

const COLORS = ["#6366F1","#10B981","#F59E0B","#EF4444","#8B5CF6","#EC4899","#14B8A6","#F97316","#0EA5E9","#84CC16"];

const AVATAR_POOL = ["#4F46E5","#10B981","#C9A227","#EF4444","#8B5CF6","#3B82F6","#F59E0B"];
function hashAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_POOL[Math.abs(hash) % AVATAR_POOL.length];
}

function formatTimeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60)    return "just now";
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return `${Math.floor(diff / 2592000)}mo ago`;
}

const GENERAL_REQUIREMENTS = [
  "✅  Open to students of ALL nationalities",
  "✅  International students are welcome",
  "✅  Admission letter or enrollment confirmation needed",
  "✅  Valid passport / national ID",
  "✅  Medical fitness certificate",
  "✅  No sports scholarship bonds required",
];

type LiveSport = {
  id: number;
  name: string;
  venue: string | null;
  schedule_text: string | null;
  eligibility_criteria: string | null;
  icon: any;
  color: string;
};

const TABS = ["Feed", "Sports", "Eligibility"] as const;
type Tab = typeof TABS[number];

const LEVELS = ["Beginner", "Intermediate", "Competitive"];

/* ════════════════════════════════════════════
   GUEST PORTAL SCREEN
════════════════════════════════════════════ */
export default function GuestPortal() {
  const { theme, isDark } = useAppTheme();
  const [activeTab, setActiveTab] = useState<Tab>("Feed");
  const [expandedSport, setExpandedSport] = useState<number | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [sportPrograms, setSportPrograms] = useState<LiveSport[]>([]);
  const [loadingSports, setLoadingSports] = useState(true);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Load sports from live public API (no auth required)
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/sports`)
      .then((r) => r.json())
      .then((data: any[]) => {
        if (Array.isArray(data)) {
          const mapped: LiveSport[] = data.map((s, i) => ({
            id: s.id,
            name: s.name,
            venue: s.venue,
            schedule_text: s.schedule_text,
            eligibility_criteria: s.eligibility_criteria ?? null,
            icon: SPORT_META[s.name]?.icon ?? "football-outline",
            color: SPORT_META[s.name]?.color ?? COLORS[i % COLORS.length],
          }));
          setSportPrograms(mapped);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingSports(false));

    // Load public posts
    fetch(`${API_BASE_URL}/api/public-posts`)
      .then((r) => r.json())
      .then((data: any[]) => {
        if (Array.isArray(data)) {
          const mapped: Post[] = data.map((p) => ({
            id: p.id,
            authorId: String(p.author_id),
            authorName: p.author_name,
            authorRole: p.author_role,
            sport: p.sport_tag ?? undefined,
            content: p.content,
            hashtags: [],
            timeAgo: formatTimeAgo(p.created_at),
            likes: p.likes_count,
            comments: 0,
            liked: false,
            avatarColor: hashAvatarColor(p.author_name),
          }));
          setPosts(mapped);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingPosts(false));
  }, []);

  const switchTab = (tab: Tab) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
    setActiveTab(tab);
    setExpandedSport(null);
  };

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

      {/* ── Header ── */}
      <View style={{
        backgroundColor: theme.bgCard,
        borderBottomWidth: 1, borderBottomColor: theme.border,
        paddingTop: Platform.OS === "ios" ? 52 : 40,
        paddingBottom: 0,
      }}>
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ padding: 8, borderRadius: 10, backgroundColor: theme.bgInput, borderWidth: 1, borderColor: theme.border, marginRight: 12 }}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={22} color={theme.text} />
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text style={{ color: theme.text, fontSize: 20, fontWeight: "900" }}>EKEL-Sport</Text>
            <Text style={{ color: theme.textSub, fontSize: 12 }}>Guest Portal · University of Kelaniya</Text>
          </View>

          <TouchableOpacity
            onPress={() => router.replace("/register")}
            style={{ backgroundColor: theme.accent, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 }}
            activeOpacity={0.85}
          >
            <Text style={{ color: "white", fontWeight: "800", fontSize: 13 }}>Join Now</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={{ flexDirection: "row", paddingHorizontal: 16 }}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => switchTab(tab)}
              style={{ marginRight: 24, paddingBottom: 12 }}
              activeOpacity={0.7}
            >
              <Text style={{
                color: activeTab === tab ? theme.accent : theme.textSub,
                fontSize: 14, fontWeight: activeTab === tab ? "800" : "500",
              }}>
                {tab}
              </Text>
              {activeTab === tab && (
                <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, backgroundColor: theme.accent, borderRadius: 1 }} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── Content ── */}
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

          {/* ══ FEED TAB ══ */}
          {activeTab === "Feed" && (
            <>
              {/* University banner */}
              <View style={{
                margin: 16, borderRadius: 16,
                backgroundColor: theme.accent + "18",
                borderWidth: 1, borderColor: theme.accent + "44",
              }}>
                <View style={{ padding: 18 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: theme.accent + "33", alignItems: "center", justifyContent: "center" }}>
                      <Ionicons name="school-outline" size={22} color={theme.accent} />
                    </View>
                    <View>
                      <Text style={{ color: theme.text, fontSize: 15, fontWeight: "900" }}>University of Kelaniya</Text>
                      <Text style={{ color: theme.textSub, fontSize: 12 }}>Sports Department</Text>
                    </View>
                  </View>
                  <Text style={{ color: theme.textSub, fontSize: 13, lineHeight: 20 }}>
                    World-class sports programs open to students of all nationalities. Our{" "}
                    <Text style={{ color: theme.accent, fontWeight: "700" }}>{sportPrograms.length > 0 ? sportPrograms.length : ""} active sports</Text>
                    {" "}welcome athletes from across the globe. 🌍
                  </Text>
                  <TouchableOpacity
                    onPress={() => router.replace("/register")}
                    style={{ marginTop: 14, backgroundColor: theme.accent, borderRadius: 12, paddingVertical: 11, alignItems: "center" }}
                    activeOpacity={0.85}
                  >
                    <Text style={{ color: "white", fontWeight: "900", fontSize: 14 }}>Register as Student →</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={{ color: theme.textSub, fontSize: 11, fontWeight: "800", letterSpacing: 1.2, paddingHorizontal: 16, marginBottom: 10 }}>
                RECENT POSTS
              </Text>
              {posts.map((post) => (
                <PostCard key={post.id} post={post} onLike={toggleLike} />
              ))}
            </>
          )}

          {/* ══ SPORTS TAB ══ */}
          {activeTab === "Sports" && (
            <View style={{ padding: 16 }}>
              <Text style={{ color: theme.text, fontSize: 22, fontWeight: "900", marginBottom: 4 }}>
                Available Sports
              </Text>
              <Text style={{ color: theme.textSub, fontSize: 13, lineHeight: 20, marginBottom: 20 }}>
                {sportPrograms.length} programs — open to all nationalities 🌍
                {"\n"}Tap a sport to see schedules, details & student achievements.
              </Text>

              {loadingSports ? (
                <ActivityIndicator color={theme.accent} style={{ marginTop: 20 }} />
              ) : sportPrograms.length === 0 ? (
                <Text style={{ color: theme.textSub, textAlign: "center", marginTop: 20 }}>No sports available yet.</Text>
              ) : null}

              {sportPrograms.map((sport) => {
                const pct = Math.round((sport.enrolled / sport.slots) * 100);
                const isOpen = pct < 100;
                const isExpanded = expandedSport === sport.id;
                const achievements: Post[] = [];

                return (
                  /* Outer wrapper is View — avoids nested-touchable issues */
                  <View
                    key={sport.id}
                    style={{
                      backgroundColor: theme.bgCard,
                      borderRadius: 16, marginBottom: 14,
                      borderWidth: 1, borderColor: isExpanded ? sport.color + "66" : theme.border,
                      overflow: "hidden",
                    }}
                  >
                    {/* ── Tap-to-expand header ── */}
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => setExpandedSport(isExpanded ? null : sport.id)}
                    >
                      <View style={{ padding: 16, flexDirection: "row", alignItems: "center", gap: 14 }}>
                        <View style={{
                          width: 50, height: 50, borderRadius: 14,
                          backgroundColor: sport.color + "22",
                          alignItems: "center", justifyContent: "center",
                        }}>
                          <Ionicons name={sport.icon} size={26} color={sport.color} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                            <Text style={{ color: theme.text, fontSize: 17, fontWeight: "900" }}>{sport.name}</Text>
                            <View style={{ backgroundColor: "#10B98122", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 }}>
                              <Text style={{ color: "#10B981", fontSize: 10, fontWeight: "700" }}>Open</Text>
                            </View>
                          </View>
                          <Text style={{ color: theme.textSub, fontSize: 12, marginTop: 2 }}>
                            {sport.venue ?? "University Grounds"}
                          </Text>
                        </View>
                        <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={20} color={theme.textSub} />
                      </View>
                    </TouchableOpacity>

                    {/* ── Expanded details ── */}
                    {isExpanded && (
                      <View style={{ borderTopWidth: 1, borderTopColor: theme.border }}>
                        {/* Schedule / venue / levels */}
                        <View style={{ padding: 16, gap: 10 }}>
                          {sport.schedule_text ? (
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                              <Ionicons name="calendar-outline" size={15} color={theme.textSub} />
                              <Text style={{ color: theme.textSub, fontSize: 13, flex: 1 }}>{sport.schedule_text}</Text>
                            </View>
                          ) : null}
                          {sport.venue ? (
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                              <Ionicons name="location-outline" size={15} color={theme.textSub} />
                              <Text style={{ color: theme.textSub, fontSize: 13 }}>{sport.venue}</Text>
                            </View>
                          ) : null}
                          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                            {LEVELS.map((lvl) => (
                              <View key={lvl} style={{ backgroundColor: sport.color + "18", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, borderWidth: 1, borderColor: sport.color + "44" }}>
                                <Text style={{ color: sport.color, fontSize: 12, fontWeight: "700" }}>{lvl}</Text>
                              </View>
                            ))}
                          </View>
                          <TouchableOpacity
                            onPress={() => { setActiveTab("Eligibility"); setExpandedSport(sport.id); }}
                            style={{ marginTop: 4, flexDirection: "row", alignItems: "center", gap: 6 }}
                            activeOpacity={0.7}
                          >
                            <Text style={{ color: theme.accent, fontSize: 13, fontWeight: "700" }}>View Eligibility Criteria</Text>
                            <Ionicons name="arrow-forward" size={14} color={theme.accent} />
                          </TouchableOpacity>
                        </View>

                        {/* ── Achievements for this sport ── */}
                        {achievements.length > 0 && (
                          <>
                            <View style={{ height: 1, backgroundColor: theme.border }} />
                            <View style={{ padding: 16, paddingBottom: 8 }}>
                              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                                <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: sport.color + "22", alignItems: "center", justifyContent: "center" }}>
                                  <Ionicons name="trophy-outline" size={15} color={sport.color} />
                                </View>
                                <Text style={{ color: theme.text, fontSize: 14, fontWeight: "900" }}>
                                  Student Achievements
                                </Text>
                              </View>
                            </View>
                            {achievements.map((post) => (
                              <PostCard
                                key={post.id}
                                post={post}
                                onLike={toggleLike}
                              />
                            ))}
                            <View style={{ height: 12 }} />
                          </>
                        )}

                        {achievements.length === 0 && (
                          <View style={{ padding: 16, paddingTop: 0, alignItems: "center" }}>
                            <Text style={{ color: theme.textSub, fontSize: 13 }}>No achievements posted yet.</Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          {/* ══ ELIGIBILITY TAB ══ */}
          {activeTab === "Eligibility" && (
            <View style={{ padding: 16 }}>
              <Text style={{ color: theme.text, fontSize: 22, fontWeight: "900", marginBottom: 4 }}>
                Eligibility Criteria
              </Text>
              <Text style={{ color: theme.textSub, fontSize: 13, lineHeight: 20, marginBottom: 16 }}>
                Requirements for joining each sport. International and out-of-university students are encouraged to apply! 🌏
              </Text>

              {/* General box */}
              <View style={{
                backgroundColor: theme.accent + "14", borderRadius: 14,
                borderWidth: 1, borderColor: theme.accent + "44",
                padding: 16, marginBottom: 20,
              }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <Ionicons name="globe-outline" size={22} color={theme.accent} />
                  <Text style={{ color: theme.accent, fontSize: 15, fontWeight: "900" }}>General Requirements</Text>
                </View>
                {[
                  "✅  Open to students of ALL nationalities",
                  "✅  International students are welcome",
                  "✅  Admission letter or enrollment confirmation needed",
                  "✅  Valid passport / national ID",
                  "✅  Medical fitness certificate",
                  "✅  No sports scholarship bonds required",
                ].map((item) => (
                  <Text key={item} style={{ color: theme.text, fontSize: 13, lineHeight: 22 }}>{item}</Text>
                ))}
              </View>

              {/* Per-sport eligibility */}
              {sportPrograms.map((sport) => {
                const criteria = sport.eligibility_criteria
                  ? sport.eligibility_criteria.split("\n").map((s) => s.trim()).filter(Boolean)
                  : [];

                return (
                  <View key={sport.id} style={{
                    backgroundColor: theme.bgCard, borderRadius: 16,
                    borderWidth: 1, borderColor: theme.border,
                    marginBottom: 12, overflow: "hidden",
                  }}>
                    <TouchableOpacity
                      onPress={() => setExpandedSport(expandedSport === sport.id ? null : sport.id)}
                      style={{ flexDirection: "row", alignItems: "center", gap: 14, padding: 16 }}
                      activeOpacity={0.8}
                    >
                      <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: sport.color + "22", alignItems: "center", justifyContent: "center" }}>
                        <Ionicons name={sport.icon} size={22} color={sport.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: theme.text, fontSize: 16, fontWeight: "900" }}>{sport.name}</Text>
                        {criteria.length > 0 && (
                          <Text style={{ color: theme.textSub, fontSize: 12, marginTop: 2 }}>
                            {criteria.length} requirement{criteria.length !== 1 ? "s" : ""}
                          </Text>
                        )}
                      </View>
                      <Ionicons name={expandedSport === sport.id ? "chevron-up" : "chevron-down"} size={18} color={theme.textSub} />
                    </TouchableOpacity>

                    {expandedSport === sport.id && (
                      <View style={{ borderTopWidth: 1, borderTopColor: theme.border, padding: 16 }}>
                        {criteria.length > 0 ? (
                          criteria.map((req, i) => (
                            <View key={i} style={{ flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
                              <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: sport.color + "22", alignItems: "center", justifyContent: "center", marginTop: 1 }}>
                                <Ionicons name="checkmark" size={13} color={sport.color} />
                              </View>
                              <Text style={{ color: theme.text, fontSize: 13, lineHeight: 20, flex: 1 }}>{req}</Text>
                            </View>
                          ))
                        ) : (
                          <Text style={{ color: theme.textMuted, fontSize: 13, fontStyle: "italic" }}>
                            No specific criteria set — general requirements apply.
                          </Text>
                        )}
                      </View>
                    )}
                  </View>
                );
              })}

              {/* CTA */}
              <View style={{
                backgroundColor: theme.bgCard, borderRadius: 16,
                borderWidth: 1, borderColor: theme.border,
                padding: 20, marginTop: 8, alignItems: "center",
              }}>
                <Ionicons name="rocket-outline" size={36} color={theme.accent} />
                <Text style={{ color: theme.text, fontSize: 18, fontWeight: "900", marginTop: 12, textAlign: "center" }}>
                  Ready to Join?
                </Text>
                <Text style={{ color: theme.textSub, fontSize: 13, textAlign: "center", marginTop: 8, lineHeight: 20 }}>
                  Create your student account and apply for your preferred sport today. Our team will review your application within 48 hours.
                </Text>
                <TouchableOpacity
                  onPress={() => router.replace("/register")}
                  style={{ marginTop: 16, backgroundColor: theme.accent, borderRadius: 14, paddingVertical: 13, paddingHorizontal: 32, width: "100%", alignItems: "center" }}
                  activeOpacity={0.85}
                >
                  <Text style={{ color: "white", fontWeight: "900", fontSize: 15 }}>Create Student Account</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => router.replace("/login")}
                  style={{ marginTop: 10, paddingVertical: 11, width: "100%", alignItems: "center" }}
                  activeOpacity={0.7}
                >
                  <Text style={{ color: theme.textSub, fontSize: 14, fontWeight: "600" }}>Already have an account? Login →</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
}
