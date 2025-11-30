import { useState, useRef } from "react";
import { View, TextInput, TouchableOpacity } from "react-native";
import { Search, X } from "lucide-react-native";
import { colors } from "@/theme/colors";

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
};

export function SearchBar({ value, onChangeText, placeholder = "Search..." }: Props) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const handleCancel = () => {
    onChangeText("");
    setIsFocused(false);
    inputRef.current?.blur();
  };

  return (
    <View className="flex-row items-center">
      <View className="flex-1 flex-row items-center bg-gray-100 dark:bg-gray-800 rounded-xl px-3 py-2 border border-gray-200 dark:border-gray-700">
        <Search color={colors.text.tertiary} size={20} />
        <TextInput
          ref={inputRef}
          className="flex-1 text-base text-text-primary dark:text-white"
          style={{ paddingLeft: 8, lineHeight: 0 }}
          placeholder={placeholder}
          placeholderTextColor={colors.text.tertiary}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => !value && setIsFocused(false)}
        />
      </View>
      {isFocused && (
        <TouchableOpacity onPress={handleCancel} className="ml-2 px-2">
          <X color={colors.text.secondary} size={20} />
        </TouchableOpacity>
      )}
    </View>
  );
}
