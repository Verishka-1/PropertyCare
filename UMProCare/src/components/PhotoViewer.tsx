import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

type Props = {
  /** Photo addresses, already converted with getStorageUrl(). */
  photos: string[];
  /** Index of the photo to open first. null = viewer closed. */
  index: number | null;
  onClose: () => void;
};

/**
 * One page of the viewer: the photo fitted to the screen, with a loading
 * spinner and a clear message if it cannot be loaded.
 * On iPhone you can also pinch to zoom.
 */
function ViewerPage({
  uri,
  width,
  height,
}: {
  uri: string;
  width: number;
  height: number;
}) {
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  return (
    <ScrollView
      style={{ width, height }}
      contentContainerStyle={[styles.pageContent, { width, height }]}
      maximumZoomScale={4}
      minimumZoomScale={1}
      centerContent
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      bouncesZoom
    >
      {failed ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>Could not load this photo</Text>
          <Text style={styles.errorText}>
            Check your connection and that the server is running.
          </Text>
        </View>
      ) : (
        <Image
          source={{ uri }}
          style={{ width, height }}
          resizeMode="contain"
          onLoadEnd={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setFailed(true);
          }}
        />
      )}

      {loading && !failed ? (
        <View style={styles.spinner} pointerEvents="none">
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      ) : null}
    </ScrollView>
  );
}

/**
 * Full-screen photo viewer.
 *
 *   const [viewerIndex, setViewerIndex] = useState<number | null>(null);
 *   <PhotoViewer photos={urls} index={viewerIndex} onClose={() => setViewerIndex(null)} />
 *
 * Open it by setting index to the tapped photo. Swipe left/right for the
 * other photos, tap the X (or the Android back button) to close.
 */
export default function PhotoViewer({ photos, index, onClose }: Props) {
  const { width, height } = useWindowDimensions();

  const [page, setPage] = useState(index ?? 0);
  const listRef = useRef<FlatList<string>>(null);

  const visible = index !== null && photos.length > 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
      onShow={() => setPage(index ?? 0)}
    >
      <View style={styles.container}>
        {visible ? (
          <FlatList
            ref={listRef}
            data={photos}
            keyExtractor={(uri, i) => `${i}-${uri}`}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={Math.min(index ?? 0, photos.length - 1)}
            getItemLayout={(_, i) => ({
              length: width,
              offset: width * i,
              index: i,
            })}
            onMomentumScrollEnd={(event) => {
              setPage(Math.round(event.nativeEvent.contentOffset.x / width));
            }}
            renderItem={({ item }) => (
              <ViewerPage uri={item} width={width} height={height} />
            )}
          />
        ) : null}

        {/* top bar: counter + close button */}
        <View style={styles.topBar} pointerEvents="box-none">
          <View style={styles.counter}>
            <Text style={styles.counterText}>
              {Math.min(page, photos.length - 1) + 1} / {photos.length}
            </Text>
          </View>

          <Pressable
            onPress={onClose}
            hitSlop={12}
            style={styles.closeButton}
            accessibilityRole="button"
            accessibilityLabel="Close photo viewer"
          >
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
        </View>

        {photos.length > 1 ? (
          <Text style={styles.hint} pointerEvents="none">
            Swipe to see the other photos
          </Text>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.96)",
  },
  pageContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  spinner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  errorBox: {
    paddingHorizontal: 32,
    alignItems: "center",
    gap: 8,
  },
  errorTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  errorText: {
    color: "#CFC6CA",
    fontSize: 13,
    textAlign: "center",
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 48,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  counter: {
    backgroundColor: "rgba(255,255,255,0.16)",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  counterText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  closeButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
  },
  hint: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
  },
});