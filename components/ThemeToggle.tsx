import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface ThemeToggleProps {
  showLabel?: boolean;
  size?: 'small' | 'medium' | 'large';
  style?: any;
}

export function ThemeToggle({ showLabel = false, size = 'medium', style }: ThemeToggleProps) {
  const { colors, theme, changeTheme, getThemeIcon, getThemeLabel } = useTheme();
  const [showModal, setShowModal] = useState(false);

  const iconSize = size === 'small' ? 20 : size === 'large' ? 32 : 24;

  const handlePress = () => {
    setShowModal(true);
  };

  const handleThemeSelect = async (selectedTheme: 'light' | 'dark' | 'system') => {
    await changeTheme(selectedTheme);
    setShowModal(false);
  };

  const themeOptions = [
    { key: 'light' as const, label: 'Tema Claro', icon: 'sunny' as const, description: 'Fondo claro y texto oscuro' },
    { key: 'dark' as const, label: 'Tema Oscuro', icon: 'moon' as const, description: 'Fondo oscuro y texto claro' },
    { key: 'system' as const, label: 'Seguir Sistema', icon: 'phone-portrait' as const, description: 'Usa la configuración del dispositivo' },
  ];

  return (
    <>
      <TouchableOpacity
        style={[styles.toggleButton, { backgroundColor: colors.cardBackground }, style]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <Ionicons 
          name={getThemeIcon() as any} 
          size={iconSize} 
          color={colors.tint} 
        />
        {showLabel && (
          <Text style={[styles.toggleLabel, { color: colors.text }]}>
            {getThemeLabel()}
          </Text>
        )}
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowModal(false)}
        >
          <TouchableOpacity 
            style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Seleccionar Tema
            </Text>

            {themeOptions.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.themeOption,
                  { backgroundColor: colors.background, borderColor: colors.border },
                  theme === option.key && { 
                    backgroundColor: colors.tint + '15',
                    borderColor: colors.tint 
                  }
                ]}
                onPress={() => handleThemeSelect(option.key)}
                activeOpacity={0.7}
              >
                <View style={styles.themeOptionLeft}>
                  <Ionicons 
                    name={option.icon as any} 
                    size={24} 
                    color={theme === option.key ? colors.tint : colors.textSecondary} 
                  />
                  <View style={styles.themeOptionText}>
                    <Text style={[
                      styles.themeOptionLabel, 
                      { color: theme === option.key ? colors.tint : colors.text }
                    ]}>
                      {option.label}
                    </Text>
                    <Text style={[styles.themeOptionDescription, { color: colors.textSecondary }]}>
                      {option.description}
                    </Text>
                  </View>
                </View>
                
                {theme === option.key && (
                  <Ionicons name="checkmark-circle" size={20} color={colors.tint} />
                )}
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: colors.border }]}
              onPress={() => setShowModal(false)}
              activeOpacity={0.7}
            >
              <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>
                Cancelar
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleLabel: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  themeOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  themeOptionText: {
    marginLeft: 16,
    flex: 1,
  },
  themeOptionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  themeOptionDescription: {
    fontSize: 13,
  },
  cancelButton: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});