import { useRef, useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";

type OTPInputProps = {
  code: string;
  setCode: (code: string) => void;
  length?: number;
};

export function OTPInput({ code, setCode, length = 6 }: OTPInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const boxes = new Array(length).fill(0);

  const handlePress = () => {
    setIsFocused(true);
    inputRef.current?.focus();
  };

  return (
    <View>
      <Pressable onPress={handlePress} className="flex-row justify-center gap-3">
        {boxes.map((_, index) => {
          const digit = code[index] || "";
          const isCurrentBox = index === code.length;
          const isLastBox = index === length - 1;
          const isComplete = code.length === length;
          const isFocusedBox = isFocused && (isCurrentBox || (isLastBox && isComplete));

          return (
            <View
              key={index}
              className={`w-12 h-14 border-2 rounded-xl items-center justify-center ${
                isFocusedBox
                  ? "border-green-500 bg-gray-100 dark:bg-gray-800"
                  : "border-gray-300 dark:border-gray-700"
              }`}
            >
              <Text className="text-2xl text-gray-900 dark:text-white">
                {digit}
              </Text>
            </View>
          );
        })}
      </Pressable>
      <TextInput
        ref={inputRef}
        value={code}
        onChangeText={setCode}
        onBlur={() => setIsFocused(false)}
        keyboardType="number-pad"
        maxLength={length}
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        className="absolute opacity-0"
      />
    </View>
  );
}
