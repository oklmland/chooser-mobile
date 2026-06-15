import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { WheelOption } from '@/types/wheel';
import { generateId } from '@/utils/id';

type Props = {
  visible: boolean;
  options: WheelOption[];
  onChange: (options: WheelOption[]) => void;
  onClose: () => void;
};

export function WheelEditor({ visible, options, onChange, onClose }: Props) {
  const theme = useTheme();
  const [draft, setDraft] = useState<WheelOption[]>(options);

  const open = () => setDraft(options);

  const updateLabel = (id: string, label: string) => {
    setDraft((prev) => prev.map((o) => (o.id === id ? { ...o, label } : o)));
  };

  const removeOption = (id: string) => {
    setDraft((prev) => prev.filter((o) => o.id !== id));
  };

  const addOption = () => {
    setDraft((prev) => [...prev, { id: generateId(), label: '' }]);
  };

  const handleClose = () => {
    const cleaned = draft.filter((o) => o.label.trim().length > 0);
    onChange(cleaned);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onShow={open}
      onRequestClose={handleClose}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <ThemedText type="subtitle">Modifier les options</ThemedText>
          <Pressable onPress={handleClose}>
            <ThemedText type="linkPrimary">Terminé</ThemedText>
          </Pressable>
        </View>

        <FlatList
          data={draft}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <TextInput
                value={item.label}
                onChangeText={(text) => updateLabel(item.id, text)}
                placeholder="Nouvelle option"
                placeholderTextColor={theme.textSecondary}
                style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
              />
              <Pressable onPress={() => removeOption(item.id)} style={styles.deleteButton}>
                <ThemedText themeColor="textSecondary">✕</ThemedText>
              </Pressable>
            </View>
          )}
          ListFooterComponent={
            <Pressable onPress={addOption} style={styles.addButton}>
              <ThemedView type="backgroundElement" style={styles.addButtonInner}>
                <ThemedText type="linkPrimary">+ Ajouter une option</ThemedText>
              </ThemedView>
            </Pressable>
          }
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  list: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.five,
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  input: {
    flex: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  deleteButton: {
    padding: Spacing.two,
  },
  addButton: {
    marginTop: Spacing.two,
  },
  addButtonInner: {
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
});
