import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function UserTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#7A1838",
        tabBarInactiveTintColor: "#858585",
        tabBarStyle: {
          height: 64,
          paddingTop: 6,
          paddingBottom: 8,
          backgroundColor: "#FFFFFF",
          borderTopColor: "#E5E5E5",
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="user-dashboard"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="user-reports"
        options={{
          title: "My Reports",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="campus-map"
        options={{
          title: "Map",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="feedback"
        options={{
          title: "Feedback",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="user-settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Other user screens are opened from buttons or links, not the tab bar. */}
      <Tabs.Screen name="select-room" options={{ href: null }} />
      <Tabs.Screen name="report-damage" options={{ href: null }} />
      <Tabs.Screen name="report-history" options={{ href: null }} />
      <Tabs.Screen name="building-map" options={{ href: null }} />
      <Tabs.Screen name="report-details" options={{ href: null }} />
    </Tabs>
  );
}