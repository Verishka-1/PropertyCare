import React, { useState } from "react";
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = Omit<TextInputProps, "secureTextEntry" | "style"> & {
  /** Optional label shown above the input. */
  label?: string;
  /** Style of the TextInput (same style you already use for normal inputs). */
  inputStyle?: StyleProp<TextStyle>;
  /** Style of the label text. */
  labelStyle?: StyleProp<TextStyle>;
  /** Style of the whole component (outer wrapper). */
  wrapperStyle?: StyleProp<ViewStyle>;
};

/**
 * Password input with a SHOW / HIDE (eye) button.
 *
 * Works everywhere a plain <TextInput secureTextEntry /> was used: pass the
 * same `inputStyle`/`labelStyle` you already use and it looks identical,
 * plus the eye icon on the right.
 */
export default function PasswordField({
  label,
  inputStyle,
  labelStyle,
  wrapperStyle,
  editable = true,
  ...rest
}: Props) {
  const [visible, setVisible] = useState(false);

  // The eye icon is centred on the INPUT only, so any bottom margin that
  // came with the input style is moved to the outer wrapper.
  const flat = StyleSheet.flatten(inputStyle) ?? {};
  const { marginBottom, marginTop, ...inputOnly } = flat as TextStyle;

  return (
    <View style={[{ marginBottom, marginTop }, wrapperStyle]}>
      {label ? <Text style={[styles.label, labelStyle]}>{label}</Text> : null}

      <View>
        <TextInput
          placeholderTextColor="#A49A9F"
          autoCapitalize="none"
          autoCorrect={false}
          {...rest}
          editable={editable}
          secureTextEntry={!visible}
          style={[styles.input, inputOnly, { paddingRight: 46 }]}
        />

        <Pressable
          onPress={() => setVisible((current) => !current)}
          hitSlop={10}
          style={styles.eye}
          accessibilityRole="button"
          accessibilityLabel={visible ? "Hide password" : "Show password"}
        >
          <Ionicons
            name={visible ? "eye-off-outline" : "eye-outline"}
            size={22}
            color="#756B70"
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    color: "#211A1D",
    fontWeight: "700",
    fontSize: 13,
    marginBottom: 6,
  },
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: "#E9E1E4",
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
    color: "#211A1D",
    fontSize: 14,
  },
  eye: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 46,
    alignItems: "center",
    justifyContent: "center",
  },
});
