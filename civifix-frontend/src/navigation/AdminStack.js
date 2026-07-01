import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

import AdminDashboardScreen from '../screens/Admin/AdminDashboardScreen';
import UserManagementScreen from '../screens/Admin/UserManagementScreen';
import ComplaintMonitoringScreen from '../screens/Admin/ComplaintMonitoringScreen';
import TerritoryManagementScreen from '../screens/Admin/TerritoryManagementScreen';
import SystemSettingsScreen from '../screens/Admin/SystemSettingsScreen';

const Tab = createBottomTabNavigator();

export default function AdminStack() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          switch (route.name) {
            case 'AdminDashboard':
              iconName = focused ? 'view-dashboard' : 'view-dashboard-outline';
              break;
            case 'UserManagement':
              iconName = focused ? 'account-group' : 'account-group-outline';
              break;
            case 'ComplaintMonitoring':
              iconName = focused ? 'file-document-multiple' : 'file-document-multiple-outline';
              break;
            case 'TerritoryManagement':
              iconName = focused ? 'map' : 'map-outline';
              break;
            case 'SystemSettings':
              iconName = focused ? 'cog' : 'cog-outline';
              break;
          }
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textLight,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.card,
          borderTopWidth: 0,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          paddingBottom: 5,
          paddingTop: 5,
        }
      })}
    >
      <Tab.Screen 
        name="AdminDashboard" 
        component={AdminDashboardScreen} 
        options={{ tabBarLabel: 'Dashboard' }} 
      />
      <Tab.Screen 
        name="ComplaintMonitoring" 
        component={ComplaintMonitoringScreen} 
        options={{ tabBarLabel: 'Complaints' }} 
      />
      <Tab.Screen 
        name="UserManagement" 
        component={UserManagementScreen} 
        options={{ tabBarLabel: 'Users' }} 
      />
      <Tab.Screen 
        name="TerritoryManagement" 
        component={TerritoryManagementScreen} 
        options={{ tabBarLabel: 'Territories' }} 
      />
      <Tab.Screen 
        name="SystemSettings" 
        component={SystemSettingsScreen} 
        options={{ tabBarLabel: 'Settings' }} 
      />
    </Tab.Navigator>
  );
}
