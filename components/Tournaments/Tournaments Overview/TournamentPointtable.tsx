import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, Dimensions, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppNavigation } from '../../NavigationService';
import apiService from '../../APIservices';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppColors } from '../../../assets/constants/colors';

const PointsTable = ({ id }) => {
  const navigation = useAppNavigation();
  const screenWidth = Dimensions.get('window').width;

  const columnStyles = {
    name: screenWidth * 0.35,
    others: screenWidth * 0.65 / 6,
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
        setPointsData(Array.isArray(data.data) ? data.data : []);
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
      <Text style={[styles.headerCell, { width: columnStyles.name }]}>Team</Text>
      <Text style={[styles.headerCell, { width: columnStyles.others }]}>P</Text>
      <Text style={[styles.headerCell, { width: columnStyles.others }]}>W</Text>
      <Text style={[styles.headerCell, { width: columnStyles.others }]}>L</Text>
      <Text style={[styles.headerCell, { width: columnStyles.others }]}>D</Text>
      <Text style={[styles.headerCell, { width: columnStyles.others }]}>Pts</Text>
      <Text style={[styles.headerCell, { width: columnStyles.others }]}>NRR</Text>
    </View>
  );

  const renderItem = ({ item, index }) => (
    <View style={[
      styles.row,
      index % 2 === 0 ? styles.evenRow : styles.oddRow,
      index === 0 && styles.firstRow
    ]}>
      <Text
        style={[
          styles.cell,
          { width: columnStyles.name },
          index === 0 && styles.firstPlaceText
        ]}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {item.team?.name || 'Unknown Team'}
      </Text>
      <Text style={[styles.cell, { width: columnStyles.others }]}>{item.matchesPlayed || 0}</Text>
      <Text style={[styles.cell, { width: columnStyles.others }]}>{item.matchesWon || 0}</Text>
      <Text style={[styles.cell, { width: columnStyles.others }]}>{item.matchesLost || 0}</Text>
      <Text style={[styles.cell, { width: columnStyles.others }]}>{item.matchesDrawn || 0}</Text>
      <Text style={[styles.cell, { width: columnStyles.others }]}>{item.points || 0}</Text>
      <Text style={[
        styles.cell,
        { width: columnStyles.others },
        (item.netRunRate || 0) > 0 ? styles.positiveNRR : styles.negativeNRR
      ]}>
        {(item.netRunRate?.toFixed(2) || '0.00')}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Loading points table...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <MaterialCommunityIcons name="alert-circle" size={50} color="#FF5252" />
        <Text style={styles.errorTitle}>Error Loading Data</Text>
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
        <MaterialCommunityIcons name="trophy-outline" size={60} color="#FFC107" />
        <Text style={styles.emptyTitle}>Tournament Standings</Text>
        <Text style={styles.emptyText}>
          The tournament is just getting started! The points table will appear here once matches are completed.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Current Standings</Text>
      <View style={styles.tableContainer}>
        {renderHeader()}
        <FlatList
          data={pointsData.sort((a, b) => b.points - a.points || b.netRunRate - a.netRunRate)}
          renderItem={renderItem}
          keyExtractor={(item) => item.team?.id?.toString() || Math.random().toString()}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  tableContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: AppColors.primaryBlue,
    marginBottom: 16,
    marginLeft: 4,
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: AppColors.primaryBlue,
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  headerCell: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  evenRow: {
    backgroundColor: '#F5F5F5',
  },
  oddRow: {
    backgroundColor: '#FFFFFF',
  },
  firstRow: {
    borderLeftWidth: 3,
    borderLeftColor: '#FFD700',
  },
  cell: {
    fontSize: 14,
    color: '#424242',
    textAlign: 'center',
  },
  firstPlaceText: {
    fontWeight: 'bold',
    color: AppColors.primaryBlue,
  },
  positiveNRR: {
    color: AppColors.primaryBlue,
    fontWeight: 'bold',
  },
  negativeNRR: {
    color: '#D32F2F',
  },
  emptyContainer: {
    marginTop: 10,
    flex: 1,
    justifyContent: 'center',
    borderRadius: 12,
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: AppColors.primaryBlue,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#616161',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#D32F2F',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#616161',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
  },
  retryText: {
    fontSize: 16,
    color: AppColors.primaryBlue,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
  },
});

export default PointsTable;