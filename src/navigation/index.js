import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator as createNativeStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

import LoginScreen    from '../screens/auth/LoginScreen';
import CadastroScreen from '../screens/auth/CadastroScreen';

import HomeScreen       from '../screens/HomeScreen';
import PsicologosScreen from '../screens/PsicologosScreen';
import CreditosScreen   from '../screens/CreditosScreen';
import SessoesScreen    from '../screens/SessoesScreen';
import PerfilScreen     from '../screens/PerfilScreen';

import PsicologoDetailScreen from '../screens/PsicologoDetailScreen';
import EmergenciaScreen      from '../screens/EmergenciaScreen';
import ChatPsicologoScreen   from '../screens/ChatPsicologoScreen';
import AgendarSessaoScreen   from '../screens/AgendarSessaoScreen';
import PlanosScreen          from '../screens/PlanosScreen';
import ExtratoScreen         from '../screens/ExtratoScreen';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

const TAB_CONFIG = [
  { name: 'Início',     component: HomeScreen,       icon: 'home',          iconOff: 'home-outline' },
  { name: 'Psicólogos', component: PsicologosScreen, icon: 'people',        iconOff: 'people-outline' },
  { name: 'Créditos',   component: CreditosScreen,   icon: 'wallet',        iconOff: 'wallet-outline' },
  { name: 'Sessões',    component: SessoesScreen,    icon: 'calendar',      iconOff: 'calendar-outline' },
  { name: 'Perfil',     component: PerfilScreen,     icon: 'person-circle', iconOff: 'person-circle-outline' },
];

function TabNavigator() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const tab = TAB_CONFIG.find(t => t.name === route.name);
        return {
          headerShown: false,
          tabBarActiveTintColor:   colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarStyle: {
            backgroundColor: colors.tabBar,
            borderTopColor:  colors.border,
            borderTopWidth:  1,
            height:          62,
            paddingBottom:   8,
            paddingTop:      6,
          },
          tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
          tabBarIcon: ({ focused, color }) =>
            tab ? (
              <Ionicons
                name={focused ? tab.icon : tab.iconOff}
                size={22}
                color={color}
              />
            ) : null,
        };
      }}
    >
      {TAB_CONFIG.map(tab => (
        <Tab.Screen key={tab.name} name={tab.name} component={tab.component} />
      ))}
    </Tab.Navigator>
  );
}

export default function Navigation() {
  const { isAuthenticated, loading } = useAuth();
  const { colors } = useTheme();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="MainTabs"        component={TabNavigator} />
            <Stack.Screen name="PerfilPsicologo" component={PsicologoDetailScreen} />
            <Stack.Screen name="ChatPsicologo"   component={ChatPsicologoScreen} />
            <Stack.Screen name="AgendarSessao"   component={AgendarSessaoScreen} />
            <Stack.Screen name="Emergencia"      component={EmergenciaScreen} />
            <Stack.Screen name="Planos"          component={PlanosScreen} />
            <Stack.Screen name="Extrato"         component={ExtratoScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login"    component={LoginScreen} />
            <Stack.Screen name="Cadastro" component={CadastroScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
