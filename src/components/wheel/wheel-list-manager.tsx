import { useState } from 'react';
import { Alert, FlatList, Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Wheel } from '@/types/wheel';

type Props = {
  visible: boolean;
  wheels: Wheel[];
  activeWheelId: string | null;
  onSelect: (id: string) => void;
  onCreate: (name: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
};

export function WheelListManager({
  visible,
  wheels,
  activeWheelId,
  onSelect,
  onCreate,
  onRename,
  onDelete,
  onClose,
}: Props) {
  const theme = useTheme();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [newName, setNewName] = useState('');

  const startEditing = (wheel: Wheel) => {
    setEditingId(wheel.id);
    setEditingName(wheel.name);
  };

  const commitRename = () => {
    if (editingId && editingName.trim().length > 0) {
      onRename(editingId, editingName.trim());
    }
    setEditingId(null);
  };

  const confirmDelete = (wheel: Wheel) => {
    Alert.alert('Supprimer cette roue ?', `« ${wheel.name} » sera définitivement supprimée.`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => onDelete(wheel.id) },
    ]);
  };

  const handleCreate = () => {
    const name = newName.trim();
    if (name.length === 0) {
      return;
    }
    onCreate(name);
    setNewName('');
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <ThemedText type="subtitle">Mes roues</ThemedText>
          <Pressable onPress={onClose}>
            <ThemedText type="linkPrimary">Fermer</ThemedText>
          </Pressable>
        </View>

        <FlatList
          data={wheels}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const isActive = item.id === activeWheelId;
            const isEditing = item.id === editingId;

            return (
              <ThemedView type="backgroundElement" style={styles.row}>
                {isEditing ? (
                  <TextInput
                    value={editingName}
                    onChangeText={setEditingName}
                    onSubmitEditing={commitRename}
                    onBlur={commitRename}
                    autoFocus
                    style={[styles.input, { color: theme.text }]}
                  />
                ) : (
                  <Pressable style={styles.nameButton} onPress={() => onSelect(item.id)}>
                    <ThemedText type={isActive ? 'smallBold' : 'default'}>
                      {isActive ? '● ' : ''}
                      {item.name}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {item.options.length} option{item.options.length > 1 ? 's' : ''}
                    </ThemedText>
                  </Pressable>
                )}

                {!isEditing && (
                  <View style={styles.actions}>
                    <Pressable onPress={() => startEditing(item)} style={styles.actionButton}>
                      <ThemedText type="link">Renommer</ThemedText>
                    </Pressable>
                    {wheels.length > 1 && (
                      <Pressable onPress={() => confirmDelete(item)} style={styles.actionButton}>
                        <ThemedText type="link" themeColor="textSecondary">
                          Supprimer
                        </ThemedText>
                      </Pressable>
                    )}
                  </View>
                )}
              </ThemedView>
            );
          }}
          ListFooterComponent={
            <View style={styles.createRow}>
              <TextInput
                value={newName}
                onChangeText={setNewName}
                onSubmitEditing={handleCreate}
                placeholder="Nom de la nouvelle roue"
                placeholderTextColor={theme.textSecondary}
                style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement, flex: 1 }]}
              />
              <Pressable onPress={handleCreate} style={styles.createButton}>
                <ThemedText type="linkPrimary">Créer</ThemedText>
              </Pressable>
            </View>
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
    justifyContent: 'space-between',
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    gap: Spacing.two,
  },
  nameButton: {
    flex: 1,
    gap: Spacing.half,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  actionButton: {
    paddingVertical: Spacing.one,
  },
  input: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  createRow: {
    marginTop: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  createButton: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
});
