import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

// Define the type for a single player object, assuming a basic structure.
interface Player {
  id: number;
  profilePic?: string; // Optional profile picture URL
  name: string;
  role: string;
}

// Define the props interface for the PlayerCard component.
// This tells TypeScript what properties to expect and what their types are.
interface PlayerCardProps {
  player: Player;
  index: number;
  canEdit: boolean;
  teamCaptainId?: number; // Optional ID for the team captain
  onRemove: (playerId: number) => void;
  fadeAnim: Animated.Value;
}

// React.memo is used here to prevent re-renders of the component
// if its props do not change, which can improve performance.
const PlayerCard: React.FC<PlayerCardProps> = React.memo(({
  player,
  index,
  canEdit,
  teamCaptainId,
  onRemove,
  fadeAnim,
}) => {
  // Use a simple check to alternate card designs for a better visual effect.
  const isFirstDesign = index % 2 === 0;

  return (
    <Animated.View key={player.id} style={[styles.cardContainer, { opacity: fadeAnim }]}>
      <LinearGradient
        colors={isFirstDesign ?
          ['#8FDFFF', '#104B62'] :
          ['#209FFF', '#00354A']
        }
        style={styles.playerCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.playerInfo}>
          <Image
            source={player.profilePic ? { uri: player.profilePic } : require('../../assets/defaultLogo.png')}
            style={styles.searchResultAvatar}
            defaultSource={require('../../assets/defaultLogo.png')}
          />
          <View style={styles.playerDetails}>
            <Text style={styles.playerName}>{player?.name}</Text>
            <Text style={styles.playerStats}>
              {player.role} • {teamCaptainId === player.id && 'Captain'}
            </Text>
          </View>
        </View>
        {/* Only show the remove button if the user has editing permissions. */}
        {canEdit && (
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => onRemove(player.id)}
          >
            <MaterialIcons name="remove-circle" size={24} color="#fff" />
          </TouchableOpacity>
        )}
      </LinearGradient>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  cardContainer: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  playerCard: {
    padding: 16,
    borderRadius: 12,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerDetails: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  playerStats: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  searchResultAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#f5f5f5',
  },
  removeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
  },
});

export default PlayerCard;
