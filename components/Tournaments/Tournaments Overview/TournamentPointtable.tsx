import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, StyleSheet, Text, View } from 'react-native';
import apiService from '../../APIservices';
import { useAppNavigation } from '../../NavigationService';

const MinimalColors = {
  primary: '#007AFF',
  secondary: '#3C3C43', 
  background: '#F9F9F9',
  card: '#FFFFFF',
  border: '#E0E0E0',
  headerBackground: '#EFEFF4', 
  headerText: '#3C3C43',
  positiveNRR: '#4CAF50',
  negativeNRR: '#F44336',
  firstPlaceHighlight: '#FFD700',
};

const PointsTable = ({ id }) => {
  const navigation = useAppNavigation();
  const screenWidth = Dimensions.get('window').width;
  const PADDING_HORIZONTAL = 16; 
  const TABLE_WIDTH = screenWidth - (PADDING_HORIZONTAL * 2);

  const columnStyles = {
    name: TABLE_WIDTH * 0.35, 
    others: (TABLE_WIDTH * 0.65) / 6, 
  };

  const [pointsData, setPointsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getPointsTable = async () => {
    const token = await AsyncStorage.getItem('jwtToken');
    if (!token) {
      navigation.navigate('Login');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const { success, data, error: apiError } = await apiService({
        endpoint: `tournaments/points-table/${id}`,
        method: 'GET',
      });

      if (success) {
        console.log(data.data);
        const sortedData = Array.isArray(data.data) 
          ? data.data.sort((a, b) => b.points - a.points || b.netRunRate - a.netRunRate) 
          : [];
        setPointsData(sortedData);
      } else {
        console.error('Failed to fetch points table:', apiError);
        setError(apiError || 'Failed to fetch points table');
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getPointsTable();
  }, [id]);

  const renderHeader = () => (
    <View style={styles.headerRow}>
      {/* paddingLeft: 8 added here to match cell content alignment */}
      <Text style={[styles.headerCell, { width: columnStyles.name, textAlign: 'left', paddingLeft: 8 }]}>TEAM</Text>
      <Text style={[styles.headerCell, { width: columnStyles.others }]}>P</Text>
      <Text style={[styles.headerCell, { width: columnStyles.others }]}>W</Text>
      <Text style={[styles.headerCell, { width: columnStyles.others }]}>L</Text>
      <Text style={[styles.headerCell, { width: columnStyles.others }]}>D</Text>
      {/* PTS column visually emphasized */}
      <Text style={[styles.headerCell, { width: columnStyles.others, fontWeight: '700' }]}>PTS</Text>
      <Text style={[styles.headerCell, { width: columnStyles.others }]}>NRR</Text>
    </View>
  );

  const renderItem = ({ item, index }) => (
    <View style={[
      styles.row,
      index % 2 === 0 ? styles.evenRow : styles.oddRow,
      index === 0 && styles.firstRowHighlight,
    ]}>
      {/* Team Name Cell with position and paddingLeft for correct alignment */}
      <View style={[styles.cellContainer, { width: columnStyles.name, alignItems: 'flex-start', paddingLeft: 8 }]}>
        <Text style={styles.positionText}>{index + 1}.</Text>
        <Text
          style={[
            styles.cell,
            styles.teamNameCell,
            index === 0 && styles.firstPlaceText,
          ]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {item.team?.name || 'Unknown Team'}
        </Text>
      </View>
      <Text style={[styles.cell, { width: columnStyles.others }]}>{item.matchesPlayed || 0}</Text>
      <Text style={[styles.cell, { width: columnStyles.others }]}>{item.matchesWon || 0}</Text>
      <Text style={[styles.cell, { width: columnStyles.others }]}>{item.matchesLost || 0}</Text>
      <Text style={[styles.cell, { width: columnStyles.others }]}>{item.matchesDrawn || 0}</Text>
      <Text style={[styles.cell, { width: columnStyles.others, fontWeight: '700', color: MinimalColors.primary }]}>{item.points || 0}</Text>
      
      <Text style={[
        styles.cell,
        { width: columnStyles.others },
        (item.netRunRate || 0) > 0 ? styles.positiveNRR : styles.negativeNRR
      ]}>
        {(item.netRunRate !== undefined && item.netRunRate !== null ? item.netRunRate.toFixed(2) : '0.00')}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={MinimalColors.primary} />
        <Text style={styles.loadingText}>Loading standings...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <MaterialCommunityIcons name="alert-circle" size={50} color={MinimalColors.negativeNRR} />
        <Text style={styles.errorTitle}>Oops! Cannot Load Data</Text>
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.retryText} onPress={getPointsTable}>
          Tap to retry
        </Text>
      </View>
    );
  }

  if (pointsData.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons name="trophy-outline" size={60} color={MinimalColors.primary} />
        <Text style={styles.emptyTitle}>No Standings Yet</Text>
        <Text style={styles.emptyText}>
          The points table will appear here once the tournament matches have been played.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Tournament Standings</Text>
      <View style={styles.tableContainer}>
        {renderHeader()}
        <FlatList
          data={pointsData}
          renderItem={renderItem}
          keyExtractor={(item) => item.team?.id?.toString() || Math.random().toString()}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={<View style={{ height: 20 }} />}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MinimalColors.background,
    padding: 16, // PADDING_HORIZONTAL = 16
  },
  tableContainer: {
    flex: 1,
    backgroundColor: MinimalColors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: MinimalColors.border,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: MinimalColors.secondary,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: MinimalColors.headerBackground,
    paddingVertical: 12,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderColor: MinimalColors.border,
  },
  headerCell: {
    fontWeight: '600',
    fontSize: 12,
    color: MinimalColors.headerText,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 0,
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: MinimalColors.border,
  },
  evenRow: {
    backgroundColor: MinimalColors.card,
  },
  oddRow: {
    backgroundColor: MinimalColors.headerBackground,
  },
  firstRowHighlight: {
    borderLeftWidth: 4,
    borderLeftColor: MinimalColors.firstPlaceHighlight,
  },
  cellContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  positionText: {
    fontSize: 14,
    fontWeight: '600',
    color: MinimalColors.secondary,
    marginRight: 4,
    width: 20,
    textAlign: 'left',
  },
  cell: {
    fontSize: 14,
    color: MinimalColors.secondary,
    textAlign: 'center',
  },
  teamNameCell: {
    fontWeight: '400',
    textAlign: 'left',
    flexShrink: 1,
  },
  firstPlaceText: {
    fontWeight: '700',
    color: MinimalColors.primary,
  },
  positiveNRR: {
    color: MinimalColors.positiveNRR,
    fontWeight: '600',
  },
  negativeNRR: {
    color: MinimalColors.negativeNRR,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: MinimalColors.background,
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: MinimalColors.secondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: MinimalColors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: MinimalColors.border,
    marginTop: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: MinimalColors.secondary,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#6A6A6A',
    textAlign: 'center',
    lineHeight: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: MinimalColors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: MinimalColors.border,
    marginTop: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: MinimalColors.negativeNRR,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#6A6A6A',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  retryText: {
    fontSize: 14,
    color: MinimalColors.primary,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});

export default PointsTable;