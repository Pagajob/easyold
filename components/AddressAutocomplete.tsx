import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView,
  ActivityIndicator,
  Animated
} from 'react-native';
import { MapPin, Check } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { AddressService, AddressSuggestion } from '@/services/addressService';

interface AddressAutocompleteProps {
  value: string;
  onAddressSelect: (address: string) => void;
  placeholder?: string;
  label?: string;
  style?: any;
  disabled?: boolean;
}

export default function AddressAutocomplete({
  value,
  onAddressSelect,
  placeholder = "Commencez à taper votre adresse...",
  label,
  style,
  disabled = false
}: AddressAutocompleteProps) {
  const { colors } = useTheme();
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const inputRef = useRef<TextInput>(null);
  const animatedHeight = useRef(new Animated.Value(0)).current;

  // Synchroniser la valeur externe avec l'état local
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Animation pour l'ouverture/fermeture de la liste
  useEffect(() => {
    Animated.timing(animatedHeight, {
      toValue: showSuggestions ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [showSuggestions]);

  // Fonction de recherche avec debounce
  const searchAddresses = async (searchQuery: string) => {
    if (!searchQuery || searchQuery.trim().length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const results = await AddressService.searchAddresses(searchQuery, 6);
      setSuggestions(results);
      setShowSuggestions(results.length > 0 && isFocused);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de recherche');
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Gestion du changement de texte avec debounce
  const handleTextChange = (text: string) => {
    setQuery(text);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for search
    searchTimeoutRef.current = setTimeout(() => {
      searchAddresses(text);
    }, 300);
  };

  // Sélection d'une suggestion
  const handleSuggestionSelect = (suggestion: AddressSuggestion) => {
    const formattedAddress = AddressService.formatFullAddress(suggestion);
    setQuery(formattedAddress);
    onAddressSelect(formattedAddress);
    setShowSuggestions(false);
    setSuggestions([]);
    inputRef.current?.blur();
  };

  // Gestion du focus
  const handleFocus = () => {
    setIsFocused(true);
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  // Gestion de la perte de focus
  const handleBlur = () => {
    setIsFocused(false);
    // Délai pour permettre la sélection d'une suggestion
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  // Validation manuelle de l'adresse
  const handleManualValidation = () => {
    if (query.trim()) {
      onAddressSelect(query.trim());
      setShowSuggestions(false);
    }
  };

  const styles = createStyles(colors);

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View style={styles.inputContainer}>
        <View style={[styles.inputWrapper, isFocused && styles.inputWrapperFocused]}>
          <MapPin size={20} color={colors.textSecondary} style={styles.inputIcon} />
          <TextInput
            ref={inputRef}
            style={[styles.input, disabled && styles.inputDisabled]}
            value={query}
            onChangeText={handleTextChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            placeholderTextColor={colors.textSecondary}
            editable={!disabled}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
          {isLoading && (
            <ActivityIndicator 
              size="small" 
              color={colors.primary} 
              style={styles.loadingIndicator}
            />
          )}
        </View>

        {/* Liste déroulante des suggestions */}
        <Animated.View 
          style={[
            styles.suggestionsDropdown,
            {
              maxHeight: animatedHeight.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 300],
              }),
              opacity: animatedHeight,
            }
          ]}
        >
          {showSuggestions && (
            <ScrollView 
              style={styles.suggestionsList}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled={true}
            >
              {suggestions.map((suggestion, index) => (
                <TouchableOpacity
                  key={`${suggestion.id}-${index}`}
                  style={[
                    styles.suggestionItem,
                    index === suggestions.length - 1 && styles.suggestionItemLast
                  ]}
                  onPress={() => handleSuggestionSelect(suggestion)}
                  activeOpacity={0.7}
                >
                  <View style={styles.suggestionIcon}>
                    <MapPin size={14} color={colors.primary} />
                  </View>
                  <View style={styles.suggestionContent}>
                    <Text style={styles.suggestionLabel}>
                      {AddressService.formatAddress(suggestion)}
                    </Text>
                    <Text style={styles.suggestionContext}>
                      {suggestion.context}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}

              {suggestions.length === 0 && !isLoading && query.length >= 3 && (
                <View style={styles.noResultsContainer}>
                  <Text style={styles.noResultsText}>
                    Aucune adresse trouvée
                  </Text>
                </View>
              )}
            </ScrollView>
          )}
        </Animated.View>

        {/* Bouton de validation manuelle */}
        {query.length >= 3 && !showSuggestions && !isLoading && isFocused && (
          <TouchableOpacity 
            style={styles.validateButton}
            onPress={handleManualValidation}
          >
            <Check size={16} color={colors.success} />
            <Text style={styles.validateButtonText}>Valider cette adresse</Text>
          </TouchableOpacity>
        )}
      </View>

      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    marginBottom: 16,
    zIndex: 1000,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  inputContainer: {
    position: 'relative',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 28,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 80,
  },
  inputWrapperFocused: {
    borderColor: colors.primary,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  inputIcon: {
    marginTop: 2,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    textAlignVertical: 'top',
    minHeight: 60,
  },
  inputDisabled: {
    color: colors.textSecondary,
    backgroundColor: colors.border,
  },
  loadingIndicator: {
    marginLeft: 8,
    marginTop: 2,
  },
  suggestionsDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: colors.primary,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
    overflow: 'hidden',
  },
  suggestionsList: {
    maxHeight: 280,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  suggestionItemLast: {
    borderBottomWidth: 0,
  },
  suggestionIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 2,
    lineHeight: 20,
  },
  suggestionContext: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  noResultsContainer: {
    padding: 16,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  validateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success + '20',
    borderRadius: 28,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 8,
    gap: 6,
  },
  validateButtonText: {
    fontSize: 14,
    color: colors.success,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    marginTop: 4,
    fontStyle: 'italic',
  },
});