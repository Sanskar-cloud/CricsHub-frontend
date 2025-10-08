import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import Constants from 'expo-constants';

const baseURL = Constants.expoConfig?.extra?.BASE_URL || 'https://your-default-url.com';
const wsURl = Constants.expoConfig?.extra?.WS_URL
const apiService = async ({
  endpoint = '',
  method = 'GET',
  body = null,
  params = {},
  headers = {},
  isMultipart = false,
}) => {
  try {
    const token = await AsyncStorage.getItem('jwtToken');
    const config: any = {
      baseURL,
      url: endpoint,
      method: method.toLowerCase(),
      headers: {
        ...(isMultipart
          ? { 'Content-Type': 'multipart/form-data' }
          : { 'Content-Type': 'application/json' }),
        Authorization: token ? `Bearer ${token}` : '',
        ...headers,
      },
      params,
    };

    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.data = body;
    }

    const response = await axios(config);
    console.log(response.data);

    return { success: true, data: response.data };
  } catch (error: any) {
    const status = error.response?.status;
    if (status === 502) {
      const navigation = useNavigation();
      navigation.navigate('BadGatewayScreen');
    }
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status,
    };
  }
};
// export default 
export { apiService, wsURl };
export default apiService;