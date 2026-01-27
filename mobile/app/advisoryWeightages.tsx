import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import Screen from "../components/Screen";

type Weightage = {
  id: string;
  name: string;
  weight: number;
  description: string;
};

type SportWeightages = {
  sport: string;
  criteria: Weightage[];
  overallWeight: number;
};

type StudentPerformance = {
  id: string;
  name: string;
  studentId: string;
  matchScore: number;
  fitnessScore: number;
  attendance: number;
  discipline: number;
  overall: number;
};

export default function AdvisoryWeightages() {
  const [activeTab, setActiveTab] = useState<"criteria" | "colors">("criteria");
  const [selectedSport, setSelectedSport] = useState("Cricket");
  const [loading, setLoading] = useState(false);

  // Mock data - each sport has 4 criteria that must total 100%
  const [weightages, setWeightages] = useState<SportWeightages[]>([
    {
      sport: "Cricket",
      overallWeight: 35,
      criteria: [
        { id: "1", name: "Match Performance", weight: 40, description: "Runs, wickets, catches, etc." },
        { id: "2", name: "Fitness Tests", weight: 25, description: "Physical assessment scores" },
        { id: "3", name: "Attendance", weight: 20, description: "Practice session attendance" },
        { id: "4", name: "Discipline", weight: 15, description: "Conduct and behavior" },
      ],
    },
    {
      sport: "Basketball",
      overallWeight: 30,
      criteria: [
        { id: "1", name: "Match Performance", weight: 35, description: "Points, assists, rebounds" },
        { id: "2", name: "Fitness Tests", weight: 30, description: "Physical assessment scores" },
        { id: "3", name: "Attendance", weight: 20, description: "Practice session attendance" },
        { id: "4", name: "Discipline", weight: 15, description: "Conduct and behavior" },
      ],
    },
    {
      sport: "Football",
      overallWeight: 35,
      criteria: [
        { id: "1", name: "Match Performance", weight: 40, description: "Goals, assists, defense" },
        { id: "2", name: "Fitness Tests", weight: 25, description: "Physical assessment scores" },
        { id: "3", name: "Attendance", weight: 20, description: "Practice session attendance" },
        { id: "4", name: "Discipline", weight: 15, description: "Conduct and behavior" },
      ],
    },
  ]);

  // Mock student performance data
  const studentPerformance: StudentPerformance[] = [
    {
      id: "1",
      name: "Diwanja Kumar",
      studentId: "IM/2022/051",
      matchScore: 85,
      fitnessScore: 78,
      attendance: 92,
      discipline: 88,
      overall: 84.5,
    },
    {
      id: "2",
      name: "John Smith",
      studentId: "CS/2022/123",
      matchScore: 72,
      fitnessScore: 85,
      attendance: 88,
      discipline: 90,
      overall: 80.2,
    },
    {
      id: "3",
      name: "Jane Doe",
      studentId: "PY/2023/045",
      matchScore: 65,
      fitnessScore: 70,
      attendance: 75,
      discipline: 82,
      overall: 71.8,
    },
  ];

  const currentWeightages = weightages.find((w) => w.sport === selectedSport);
  const totalCriteriaWeight = currentWeightages?.criteria.reduce((sum, c) => sum + c.weight, 0) || 0;
  const totalOverallWeight = weightages.reduce((sum, w) => sum + w.overallWeight, 0);

  const updateWeight = (sportName: string, criteriaId: string, newWeight: string) => {
    const numWeight = parseInt(newWeight) || 0;
    setWeightages((prev) =>
      prev.map((sport) => {
        if (sport.sport !== sportName) return sport;
        return {
          ...sport,
          criteria: sport.criteria.map((c) =>
            c.id === criteriaId ? { ...c, weight: numWeight } : c
          ),
        };
      })
    );
  };

  const updateOverallWeight = (sportName: string, newWeight: string) => {
    const numWeight = parseInt(newWeight) || 0;
    setWeightages((prev) =>
      prev.map((sport) =>
        sport.sport === sportName ? { ...sport, overallWeight: numWeight } : sport
      )
    );
  };

  const saveWeightages = async () => {
    if (activeTab === "criteria" && totalCriteriaWeight !== 100) {
      Alert.alert("Invalid Weightages", "Criteria weightages must equal 100%");
      return;
    }
    if (activeTab === "colors" && totalOverallWeight !== 100) {
      Alert.alert("Invalid Weightages", "Overall colors weightages must equal 100%");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert("Success", "Weightages saved successfully");
    }, 1000);
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#F9FAFB" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Manage Weightages</Text>
          <Text style={styles.headerSubtitle}>
            Review performance data and set weightages for colours eligibility
          </Text>
        </View>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <Pressable
          style={[styles.tab, activeTab === "criteria" && styles.tabActive]}
          onPress={() => setActiveTab("criteria")}
        >
          <Text style={[styles.tabText, activeTab === "criteria" && styles.tabTextActive]}>
            Criteria Weightages
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === "colors" && styles.tabActive]}
          onPress={() => setActiveTab("colors")}
        >
          <Text style={[styles.tabText, activeTab === "colors" && styles.tabTextActive]}>
            Overall Colors Weight
          </Text>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        {activeTab === "criteria" ? (
          <>
            {/* Sport Selector */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sport Selection</Text>
              <Text style={styles.sectionSubtitle}>
                Choose a sport to configure criteria weightages
              </Text>
              <View style={styles.sportBtns}>
                {weightages.map((w) => (
                  <Pressable
                    key={w.sport}
                    style={[
                      styles.sportBtn,
                      selectedSport === w.sport && styles.sportBtnActive,
                    ]}
                    onPress={() => setSelectedSport(w.sport)}
                  >
                    <Text
                      style={[
                        styles.sportBtnText,
                        selectedSport === w.sport && styles.sportBtnTextActive,
                      ]}
                    >
                      {w.sport}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Performance Analytics */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Student Performance Overview</Text>
              <Text style={styles.sectionSubtitle}>
                Review current scores across all criteria for {selectedSport}
              </Text>

              {studentPerformance.map((student) => (
                <View key={student.id} style={styles.studentCard}>
                  <View style={styles.studentHeader}>
                    <View>
                      <Text style={styles.studentName}>{student.name}</Text>
                      <Text style={styles.studentId}>{student.studentId}</Text>
                    </View>
                    <View style={styles.overallBadge}>
                      <Text style={styles.overallScore}>{student.overall}</Text>
                      <Text style={styles.overallLabel}>Overall</Text>
                    </View>
                  </View>

                  <View style={styles.scoreGrid}>
                    <View style={styles.scoreItem}>
                      <Text style={styles.scoreLabel}>Match</Text>
                      <Text style={styles.scoreValue}>{student.matchScore}</Text>
                    </View>
                    <View style={styles.scoreItem}>
                      <Text style={styles.scoreLabel}>Fitness</Text>
                      <Text style={styles.scoreValue}>{student.fitnessScore}</Text>
                    </View>
                    <View style={styles.scoreItem}>
                      <Text style={styles.scoreLabel}>Attendance</Text>
                      <Text style={styles.scoreValue}>{student.attendance}</Text>
                    </View>
                    <View style={styles.scoreItem}>
                      <Text style={styles.scoreLabel}>Discipline</Text>
                      <Text style={styles.scoreValue}>{student.discipline}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            {/* Criteria Configuration */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Criteria Weightages</Text>
              <Text style={styles.sectionSubtitle}>
                Set the weight for each criterion (must total 100%)
              </Text>

              {currentWeightages?.criteria.map((criteria) => (
                <View key={criteria.id} style={styles.criteriaCard}>
                  <View style={styles.criteriaInfo}>
                    <Text style={styles.criteriaName}>{criteria.name}</Text>
                    <Text style={styles.criteriaDesc}>{criteria.description}</Text>
                  </View>
                  <View style={styles.valueContainer}>
                    <Text style={styles.valueLabel}>Value</Text>
                    <View style={styles.inputWrapper}>
                      <TextInput
                        value={String(criteria.weight)}
                        onChangeText={(val) =>
                          updateWeight(selectedSport, criteria.id, val)
                        }
                        keyboardType="number-pad"
                        style={styles.input}
                        maxLength={3}
                        placeholderTextColor="#6B7280"
                      />
                      <Text style={styles.percentLabel}>%</Text>
                    </View>
                  </View>
                </View>
              ))}

              {/* Total Display */}
              <View style={styles.totalCard}>
                <Text style={styles.totalLabel}>Total Weight</Text>
                <View
                  style={[
                    styles.totalValue,
                    totalCriteriaWeight === 100 ? styles.validTotal : styles.invalidTotal,
                  ]}
                >
                  <Text
                    style={[
                      styles.totalText,
                      totalCriteriaWeight === 100 ? styles.validText : styles.invalidText,
                    ]}
                  >
                    {totalCriteriaWeight}%
                  </Text>
                  {totalCriteriaWeight === 100 ? (
                    <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                  ) : (
                    <Ionicons name="alert-circle" size={20} color="#EF4444" />
                  )}
                </View>
              </View>
            </View>
          </>
        ) : (
          <>
            {/* Overall Colors Weightages */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Overall Colors Weightages</Text>
              <Text style={styles.sectionSubtitle}>
                Set the overall weight for each sport in colors eligibility (must total 100%)
              </Text>

              {weightages.map((sport) => (
                <View key={sport.sport} style={styles.criteriaCard}>
                  <View style={styles.criteriaInfo}>
                    <Text style={styles.criteriaName}>{sport.sport}</Text>
                    <Text style={styles.criteriaDesc}>
                      Overall contribution to colors eligibility
                    </Text>
                  </View>
                  <View style={styles.valueContainer}>
                    <Text style={styles.valueLabel}>Value</Text>
                    <View style={styles.inputWrapper}>
                      <TextInput
                        value={String(sport.overallWeight)}
                        onChangeText={(val) => updateOverallWeight(sport.sport, val)}
                        keyboardType="number-pad"
                        style={styles.input}
                        maxLength={3}
                        placeholderTextColor="#6B7280"
                      />
                      <Text style={styles.percentLabel}>%</Text>
                    </View>
                  </View>
                </View>
              ))}

              {/* Total Display */}
              <View style={styles.totalCard}>
                <Text style={styles.totalLabel}>Total Weight</Text>
                <View
                  style={[
                    styles.totalValue,
                    totalOverallWeight === 100 ? styles.validTotal : styles.invalidTotal,
                  ]}
                >
                  <Text
                    style={[
                      styles.totalText,
                      totalOverallWeight === 100 ? styles.validText : styles.invalidText,
                    ]}
                  >
                    {totalOverallWeight}%
                  </Text>
                  {totalOverallWeight === 100 ? (
                    <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                  ) : (
                    <Ionicons name="alert-circle" size={20} color="#EF4444" />
                  )}
                </View>
              </View>

              {/* Info Box */}
              <View style={styles.infoBox}>
                <Ionicons name="information-circle" size={20} color="#C9A227" />
                <Text style={styles.infoText}>
                  The overall colors weightage determines how much each sport contributes to a
                  student's final colors eligibility score.
                </Text>
              </View>
            </View>
          </>
        )}

        {/* Save Button */}
        <Pressable
          style={[
            styles.saveBtn,
            (loading ||
              (activeTab === "criteria" && totalCriteriaWeight !== 100) ||
              (activeTab === "colors" && totalOverallWeight !== 100)) && {
              opacity: 0.5,
            },
          ]}
          onPress={saveWeightages}
          disabled={
            loading ||
            (activeTab === "criteria" && totalCriteriaWeight !== 100) ||
            (activeTab === "colors" && totalOverallWeight !== 100)
          }
        >
          <Ionicons name="save" size={20} color="#0B0F14" />
          <Text style={styles.saveBtnText}>
            {loading ? "Saving..." : `Save ${activeTab === "criteria" ? "Criteria" : "Colors"} Weightages`}
          </Text>
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    color: "#F9FAFB",
    fontSize: 24,
    fontWeight: "900",
  },
  headerSubtitle: {
    color: "rgba(229,231,235,0.6)",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 4,
    lineHeight: 18,
  },
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: "#C9A227",
  },
  tabText: {
    color: "#A7B0BE",
    fontSize: 13,
    fontWeight: "800",
  },
  tabTextActive: {
    color: "#0B0F14",
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 20,
    backgroundColor: "rgba(18, 24, 38, 0.8)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  sectionTitle: {
    color: "#F9FAFB",
    fontSize: 17,
    fontWeight: "900",
    marginBottom: 4,
  },
  sectionSubtitle: {
    color: "rgba(229,231,235,0.55)",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 16,
    lineHeight: 16,
  },
  sportBtns: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  sportBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  sportBtnActive: {
    backgroundColor: "rgba(201,162,39,0.15)",
    borderColor: "#C9A227",
  },
  sportBtnText: {
    color: "#A7B0BE",
    fontSize: 13,
    fontWeight: "700",
  },
  sportBtnTextActive: {
    color: "#C9A227",
  },
  studentCard: {
    backgroundColor: "rgba(38, 48, 65, 0.6)",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  studentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  studentName: {
    color: "#F9FAFB",
    fontSize: 15,
    fontWeight: "800",
  },
  studentId: {
    color: "#A7B0BE",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  overallBadge: {
    backgroundColor: "rgba(201,162,39,0.15)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: "center",
  },
  overallScore: {
    color: "#C9A227",
    fontSize: 16,
    fontWeight: "900",
  },
  overallLabel: {
    color: "#C9A227",
    fontSize: 9,
    fontWeight: "700",
    marginTop: 2,
  },
  scoreGrid: {
    flexDirection: "row",
    gap: 8,
  },
  scoreItem: {
    flex: 1,
    backgroundColor: "rgba(11, 15, 20, 0.5)",
    borderRadius: 8,
    padding: 8,
    alignItems: "center",
  },
  scoreLabel: {
    color: "rgba(229,231,235,0.5)",
    fontSize: 10,
    fontWeight: "700",
    marginBottom: 4,
  },
  scoreValue: {
    color: "#F9FAFB",
    fontSize: 14,
    fontWeight: "900",
  },
  criteriaCard: {
    backgroundColor: "rgba(38, 48, 65, 0.6)",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  criteriaInfo: {
    marginBottom: 12,
  },
  criteriaName: {
    color: "#F9FAFB",
    fontSize: 15,
    fontWeight: "800",
  },
  criteriaDesc: {
    color: "#A7B0BE",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 4,
  },
  valueContainer: {
    gap: 6,
  },
  valueLabel: {
    color: "rgba(229,231,235,0.5)",
    fontSize: 12,
    fontWeight: "700",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(11, 15, 20, 0.8)",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  input: {
    flex: 1,
    color: "#F9FAFB",
    fontSize: 16,
    fontWeight: "700",
  },
  percentLabel: {
    color: "#A7B0BE",
    fontSize: 14,
    fontWeight: "700",
  },
  totalCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  totalLabel: {
    color: "#F9FAFB",
    fontSize: 15,
    fontWeight: "800",
  },
  totalValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  validTotal: {
    backgroundColor: "rgba(16,185,129,0.1)",
  },
  invalidTotal: {
    backgroundColor: "rgba(239,68,68,0.1)",
  },
  totalText: {
    fontSize: 15,
    fontWeight: "900",
  },
  validText: {
    color: "#10B981",
  },
  invalidText: {
    color: "#EF4444",
  },
  infoBox: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
    padding: 12,
    backgroundColor: "rgba(201,162,39,0.08)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(201,162,39,0.2)",
  },
  infoText: {
    flex: 1,
    color: "rgba(229,231,235,0.7)",
    fontSize: 11,
    fontWeight: "600",
    lineHeight: 16,
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: "#C9A227",
  },
  saveBtnText: {
    color: "#0B0F14",
    fontSize: 15,
    fontWeight: "900",
  },
});
