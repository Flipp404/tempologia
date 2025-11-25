import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ActivityIndicator,
    ScrollView,
    Alert,
    SafeAreaView,
    Platform,
    RefreshControl,
    TextInput,
    TouchableOpacity,
    Keyboard,
} from 'react-native';
import axios from 'axios';
import { Feather } from '@expo/vector-icons';
import * as Location from 'expo-location';


const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const WEATHER_API_URL = 'https://api.open-meteo.com/v1/forecast';
const ACCENT_COLOR = '#F59E0B'; 


const getWeatherIcon = (wmoCode) => {
    
    if (wmoCode === 0) return { icon: 'sun', description: 'Céu Limpo', color: ACCENT_COLOR };
    if (wmoCode >= 95) return { icon: 'cloud-lightning', description: 'Tempestade', color: '#FCD34D' };
    if ((wmoCode >= 71 && wmoCode <= 75) || wmoCode === 85 || wmoCode === 86) return { icon: 'cloud-snow', description: 'Neve', color: '#E0F2F1' };
    if ((wmoCode >= 51 && wmoCode <= 55) || (wmoCode >= 61 && wmoCode <= 65) || (wmoCode >= 80 && wmoCode <= 82)) return { icon: 'cloud-rain', description: 'Chuvoso', color: '#60A5FA' };
    if (wmoCode === 45 || wmoCode === 48) return { icon: 'cloud-fog', description: 'Nevoeiro', color: '#BCCCDC' };
    if (wmoCode >= 1 && wmoCode <= 49) return { icon: 'cloud', description: 'Nublado/Parcial', color: '#FFFFFF' };
    return { icon: 'help-circle', description: 'Não Identificado', color: '#FFFFFF' };
};

export default function ClimaScreen() {
    const [clima, setClima] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [cidadeNome, setCidadeNome] = useState('Buscando Localização...');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchClimaData = useCallback(async (lat, lon, city) => {
        
        const apiUrl = `${WEATHER_API_URL}?latitude=${lat}&longitude=${lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`;

        try {
            const response = await axios.get(apiUrl);
            setClima(response.data);
            setCidadeNome(city);
            setError(null);
        } catch (err) {
            console.error("Erro ao carregar clima:", err);
            setError("Não foi possível carregar os dados do clima.");
            setClima(null);
        }
        setLoading(false);
        setIsRefreshing(false);
    }, []); 

    const getLocationAndFetch = useCallback(async () => {
        setLoading(true);
        setError(null);

        let city = 'Rio de Janeiro (Padrão)';
        let lat = -22.9068;
        let lon = -43.1729;

        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
                lat = location.coords.latitude;
                lon = location.coords.longitude;

                try {
                   
                    let geocode = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
                    
                    city = geocode[0]?.city || geocode[0]?.subregion || 'Local Desconhecido';
                } catch (e) {
                    city = 'Local Desconhecido (Coordenadas)';
                }
            } else {
                Alert.alert('Permissão Negada', 'Usando localização padrão. Permita o acesso para ver o clima atual.');
            }
        } catch (e) {
            console.error("Erro ao obter localização ou geocode:", e);
        }

        await fetchClimaData(lat, lon, city);
    }, [fetchClimaData]);


    const handleSearch = useCallback(async () => {
        Keyboard.dismiss();
        const trimmedQuery = searchQuery.trim();

        if (!trimmedQuery) {
            Alert.alert('Atenção', 'Por favor, digite o nome de uma cidade.');
            return;
        }

        setLoading(true);
        setClima(null);
        setCidadeNome(`Buscando ${trimmedQuery}...`);

        try {
            
            const geocodingResponse = await axios.get(NOMINATIM_URL, {
                params: {
                    q: trimmedQuery,
                    format: 'json',
                    limit: 1,
                }
            });

            if (geocodingResponse.data && geocodingResponse.data.length > 0) {
                const result = geocodingResponse.data[0];
                const lat = parseFloat(result.lat);
                const lon = parseFloat(result.lon);

               
                const cityName = result.display_name.split(',')[0] || trimmedQuery;

                await fetchClimaData(lat, lon, cityName);
            } else {
                Alert.alert('Cidade não encontrada', `Não encontramos coordenadas para "${trimmedQuery}".`);
                setCidadeNome('Busca Falhou');
                setError('Cidade não encontrada.');
                setLoading(false);
            }

        } catch (e) {
            console.error("Erro no geocode da API Web:", e);
            setError("Falha na busca. Tente novamente mais tarde.");
            setLoading(false);
        }
        setSearchQuery('');
    }, [searchQuery, fetchClimaData]);


    const onRefresh = useCallback(() => {
        setIsRefreshing(true);
        getLocationAndFetch();
    }, [getLocationAndFetch]);

    useEffect(() => {
        
        setLoading(true);
        getLocationAndFetch();
    }, [getLocationAndFetch]);

    if (loading && !isRefreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FFF" />
                <Text style={styles.loadingText}>{cidadeNome.includes('Buscando') ? cidadeNome : `Carregando clima para ${cidadeNome}...`}</Text>
            </View>
        );
    }

    if (error || !clima) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Falha ao carregar o clima: {error || 'Dados indisponíveis.'}</Text>
                <TouchableOpacity onPress={getLocationAndFetch}>
                    <Text style={styles.errorTextDetail}>Tentar Localização Atual</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const temperaturaAtual = Math.round(clima.current_weather.temperature);
    const wmoCodeAtual = clima.current_weather.weathercode;
    const { icon: iconAtual, description: descriptionAtual, color: iconColor } = getWeatherIcon(wmoCodeAtual);

    const dailyForecast = clima.daily.time.slice(0, 4).map((date, index) => {
        const maxTemp = Math.round(clima.daily.temperature_2m_max[index]);
        const minTemp = Math.round(clima.daily.temperature_2m_min[index]);
        const dayWmoCode = clima.daily.weathercode[index];
        const { icon: dayIcon, color: dayIconColor } = getWeatherIcon(dayWmoCode);

        const dateObj = new Date(date);
        const dayName = index === 0
            ? 'HOJE'
            : dateObj.toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase().replace('.', '');

        return { dayName, maxTemp, minTemp, dayIcon, dayIconColor };
    });

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.searchBarContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Buscar cidade (ex: Cabo Frio, Madrid)"
                    placeholderTextColor="#9CA3AF"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onSubmitEditing={handleSearch}
                    returnKeyType="search"
                />
                <TouchableOpacity onPress={handleSearch} style={styles.searchButton}>
                    <Feather name="search" size={24} color="#1F2937" />
                </TouchableOpacity>
            </View>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={onRefresh}
                        tintColor="#FFF"
                        progressBackgroundColor="#374151"
                    />
                }
            >
                <View style={styles.currentWeatherContainer}>
                    <Text style={styles.locationTitle}>Clima Atual em:</Text>
                    <Text style={styles.cityText}>{cidadeNome}</Text>

                    <View style={styles.tempGroup}>
                        <Feather name={iconAtual} size={100} color={iconColor} />
                        
                        <Text style={[styles.tempText, styles.accentColorText]}>{temperaturaAtual}°C</Text>
                    </View>
                    <Text style={styles.descriptionText}>{descriptionAtual}</Text>
                </View>

               
                <View style={styles.dailyForecastWrapper}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dailyForecastScroll}>
                        {dailyForecast.map((day, index) => (
                            <View key={index} style={[styles.dailyItem, index > 0 && { marginLeft: 10 }]}>
                                <Text style={styles.dailyDay}>{day.dayName}</Text>
                                <Feather name={day.dayIcon} size={28} color={day.dayIconColor} />
                                <Text style={styles.dailyTemp}>{day.maxTemp}°/{day.minTemp}°</Text>
                            </View>
                        ))}
                    </ScrollView>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#1F2937',
        paddingTop: Platform.OS === 'android' ? 25 : 0,
    },
    searchBarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#374151',
    },
    searchInput: {
        flex: 1,
        height: 45,
        backgroundColor: '#374151',
        borderRadius: 25,
        paddingHorizontal: 15,
        color: '#FFF',
        fontSize: 16,
    },
    searchButton: {
        marginLeft: 10,
        backgroundColor: ACCENT_COLOR, 
        borderRadius: 25,
        height: 45,
        width: 45,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'space-between',
        paddingBottom: 20,
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: '#1F2937',
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        color: '#FFF',
        marginTop: 10,
        fontSize: 16,
    },
    errorContainer: {
        flex: 1,
        backgroundColor: '#1F2937',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    errorText: {
        color: 'red',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 10,
    },
    errorTextDetail: {
        color: '#60A5FA',
        fontSize: 14,
        textDecorationLine: 'underline',
    },
    currentWeatherContainer: {
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center',
        width: '100%',
    },
    locationTitle: {
        color: '#DEDEDE',
        fontSize: 16,
        marginBottom: 5,
    },
    cityText: {
        color: '#FFF',
        fontSize: 36,
        fontWeight: 'bold',
        marginBottom: 50,
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    tempGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    tempText: {
        fontSize: 80,
        fontWeight: '300',
        marginLeft: 10,
    },
    
    accentColorText: {
        color: ACCENT_COLOR,
    },
    descriptionText: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: '500',
    },
    dailyForecastWrapper: {
        width: '100%', 
        alignSelf: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        paddingVertical: 15,
        borderRadius: 0, 
        marginVertical: 20,
    },
    dailyForecastScroll: {
        paddingHorizontal: 20, 
    },
    dailyItem: {
        alignItems: 'center',
        paddingHorizontal: 8,
        justifyContent: 'center',
    },
    dailyDay: {
        color: '#FFF',
        fontSize: 14,
        marginBottom: 5,
    },
    dailyTemp: {
        color: '#FFF',
        fontSize: 14,
        marginTop: 5,
        fontWeight: 'bold',
    },
});