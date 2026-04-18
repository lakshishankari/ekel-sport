export interface Post {
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
}

export const MOCK_POSTS: Post[] = [
  /* ── Dekum Diwanjana – Cricket Colours Night ── */
  {
    id: 1,
    authorId: "dekum_diwanjana",
    authorName: "Dekum Diwanjana",
    authorRole: "STUDENT",
    sport: "Cricket",
    content:
      "Honoured to receive my University Colours in Cricket at the University of Kelaniya Sri Lanka Colours Night 2025. 🏏✨\n\nGrateful for the opportunity to represent the university and for the guidance and support from coaches, staff, and teammates throughout the season.\n\nThis recognition reflects sustained commitment, discipline, teamwork, and performance — qualities I continue to uphold in my academic and professional journey.",
    hashtags: [
      "#UniversityColours",
      "#UniversityOfKelaniya",
      "#Cricket",
      "#StudentAthlete",
      "#Achievement",
      "#Teamwork",
      "#Discipline",
      "#Commitment",
      "#ProudMoment",
      "#UOK",
    ],
    timeAgo: "2mo ago",
    likes: 155,
    comments: 70,
    liked: false,
    avatarColor: "#10B981",
    images: [
      require("../assets/images/posts/shankari_cricket_1.png"),
    ],
  },

  /* ── Test User – Karate Inter-Faculty Championship ── */
  {
    id: 2,
    authorId: "testuser",
    authorName: "Test User",
    authorRole: "STUDENT",
    sport: "Karate",
    content:
      "Thrilled to share that I secured 🥇 1st place in Individual Kata Level 1 and 1st place in Team Kata Level 1 at the University of Kelaniya Inter-Faculty Karate Championships! 🥋🎉\n\nA huge thank you to my amazing teammates for their incredible support and teamwork. It's an honour to represent and achieve this success together. 🙏\n\nLooking forward to many more challenges and opportunities ahead!",
    hashtags: [
      "#Karate",
      "#Teamwork",
      "#InterFacultyChampionships",
      "#UniversityOfKelaniya",
      "#KarateAchievements",
      "#Level1Kata",
      "#ProudMoment",
    ],
    timeAgo: "1y ago",
    likes: 103,
    comments: 14,
    liked: false,
    avatarColor: "#4F46E5",
    images: [
      require("../assets/images/posts/dekum_karate_1.png"),
      require("../assets/images/posts/dekum_karate_2.png"),
    ],
  },

  /* ── Coach Ahmad – Basketball training update ── */
  {
    id: 3,
    authorId: "coach_ahmad",
    authorName: "Coach Ahmad",
    authorRole: "ADMIN",
    sport: "Basketball",
    content:
      "🏀 Great session today! The team showed incredible stamina during the full-court drill. Keep it up, warriors! Next practice is Thursday at 5 PM on Court B.",
    hashtags: ["#Basketball", "#Training", "#UOKSports"],
    timeAgo: "2h ago",
    likes: 24,
    comments: 8,
    liked: false,
    avatarColor: "#F59E0B",
  },

  /* ── Sports Admin – Tournament announcement ── */
  {
    id: 4,
    authorId: "sports_admin",
    authorName: "Sports Admin",
    authorRole: "ADMIN",
    content:
      "📢 Annual inter-college sports tournament registrations are NOW OPEN! Register before April 25th to secure your spot. Contact your respective coaches for details.",
    hashtags: ["#Tournament", "#UOKSports", "#Register"],
    timeAgo: "1d ago",
    likes: 102,
    comments: 34,
    liked: false,
    avatarColor: "#8B5CF6",
  },
];

/** Return all posts by a specific authorId */
export function getPostsByAuthor(authorId: string): Post[] {
  return MOCK_POSTS.filter((p) => p.authorId === authorId);
}

/** Return all posts tagged to a specific sport */
export function getPostsBySport(sport: string): Post[] {
  return MOCK_POSTS.filter(
    (p) => p.sport?.toLowerCase() === sport.toLowerCase()
  );
}
