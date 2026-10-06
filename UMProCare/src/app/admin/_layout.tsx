import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function AdminTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarActiveTintColor: "#176B45",
        tabBarInactiveTintColor: "#777777",

        tabBarStyle: {
          height: 64,
          paddingTop: 6,
          paddingBottom: 8,
          backgroundColor: "#FFFFFF",
          borderTopColor: "#E5E5E5",
        },

        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
        },
      }}
    >
      {/* 1. HOME */}
      <Tabs.Screen
        name="admin-dashboard"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="home-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      {/* 2. REPORT MAP */}
      <Tabs.Screen
        name="admin-campus-map"
        options={{
          title: "Report Map",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="map-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      {/* 3. REPORT HISTORY */}
      <Tabs.Screen
        name="admin-report-history"
        options={{
          title: "Report History",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="time-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      {/* 4. USERS */}
      <Tabs.Screen
        name="admin-users"
        options={{
          title: "Users",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="people-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      {/* 5. COMPLAINTS */}
      <Tabs.Screen
        name="admin-complaints"
        options={{
          title: "Complaints",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      {/* 6. SETTINGS */}
      <Tabs.Screen
        name="admin-settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="settings-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      {/* These screens are accessible through navigation,
          but should NOT appear as footer tabs. */}

      <Tabs.Screen
        name="admin-report-details"
        options={{ href: null }}
      />

      <Tabs.Screen
        name="admin-building-map"
        options={{ href: null }}
      />

      <Tabs.Screen
        name="admin-room-reports"
        options={{ href: null }}
      />

      <Tabs.Screen
        name="admin-notifications"
        options={{ href: null }}
      />

      {/* Older screens still used by links - kept, but never shown as tabs. */}
      <Tabs.Screen
        name="admin-reports"
        options={{ href: null }}
      />

      <Tabs.Screen
        name="admin-map"
        options={{ href: null }}
      />
    </Tabs>
  );
}