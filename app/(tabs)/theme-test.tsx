import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { ThemeToggle } from '../../components/ThemeToggle';
import { useTheme } from '../../hooks/useTheme';

export default function ThemeTestScreen() {
  const { theme, currentColorScheme, colors, changeTheme } = useTheme();

  const handleClearStorage = async () => {
    try {
      // Eliminar la preferencia de tema
      await AsyncStorage.removeItem('@app_theme_preference');
      await AsyncStorage.removeItem('user_theme_preference');
      console.log('Theme storage cleared - reload the app');
    } catch (error) {
      console.error('Error clearing theme storage:', error);
    }
  };

  const handleDebugStorage = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      console.log('All AsyncStorage keys:', keys);
      
      for (const key of keys) {
        const value = await AsyncStorage.getItem(key);
        console.log(`${key}:`, value);
      }
    } catch (error) {
      console.error('Error debugging AsyncStorage:', error);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
        <Text style={[styles.title, { color: colors.text }]}>
          Test de Tema
        </Text>
        
        <View style={styles.infoSection}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            Tema seleccionado:
          </Text>
          <Text style={[styles.value, { color: colors.text }]}>
            {theme}
          </Text>
        </View>

        <View style={styles.infoSection}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            Color scheme actual:
          </Text>
          <Text style={[styles.value, { color: colors.text }]}>
            {currentColorScheme}
          </Text>
        </View>

        <View style={styles.buttonSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Cambiar tema directamente:
          </Text>
          
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.tint }]}
            onPress={() => changeTheme('light')}
          >
            <Text style={styles.buttonText}>Tema Claro</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.tint }]}
            onPress={() => changeTheme('dark')}
          >
            <Text style={styles.buttonText}>Tema Oscuro</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.tint }]}
            onPress={() => changeTheme('system')}
          >
            <Text style={styles.buttonText}>Seguir Sistema</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Componente ThemeToggle:
          </Text>
          <ThemeToggle showLabel={true} size="large" />
        </View>

        <View style={styles.buttonSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Debug:
          </Text>
          
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.warning }]}
            onPress={handleDebugStorage}
          >
            <Text style={styles.buttonText}>Ver AsyncStorage</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.danger }]}
            onPress={handleClearStorage}
          >
            <Text style={styles.buttonText}>Limpiar Storage</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.colorPalette, { borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Paleta de colores actual:
          </Text>
          
          <View style={styles.colorRow}>
            <View style={[styles.colorBox, { backgroundColor: colors.text }]} />
            <Text style={[styles.colorLabel, { color: colors.text }]}>Text</Text>
          </View>
          
          <View style={styles.colorRow}>
            <View style={[styles.colorBox, { backgroundColor: colors.background }]} />
            <Text style={[styles.colorLabel, { color: colors.text }]}>Background</Text>
          </View>
          
          <View style={styles.colorRow}>
            <View style={[styles.colorBox, { backgroundColor: colors.cardBackground }]} />
            <Text style={[styles.colorLabel, { color: colors.text }]}>Card Background</Text>
          </View>
          
          <View style={styles.colorRow}>
            <View style={[styles.colorBox, { backgroundColor: colors.tint }]} />
            <Text style={[styles.colorLabel, { color: colors.text }]}>Tint</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    margin: 20,
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  infoSection: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    marginBottom: 5,
  },
  value: {
    fontSize: 18,
    fontWeight: '600',
  },
  buttonSection: {
    marginVertical: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  button: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  colorPalette: {
    marginTop: 20,
    padding: 15,
    borderWidth: 1,
    borderRadius: 10,
  },
  colorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  colorBox: {
    width: 30,
    height: 30,
    borderRadius: 5,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  colorLabel: {
    fontSize: 14,
  },
});