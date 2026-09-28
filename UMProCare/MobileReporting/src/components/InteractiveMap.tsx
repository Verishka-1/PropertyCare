import React from "react";
import {
  Image,
  ImageSourcePropType,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import {
  Gesture,
  GestureDetector,
} from "react-native-gesture-handler";

export type MapHotspot = {
  id: string;
  name: string;

  /**
   * Position in the ORIGINAL PNG.
   *
   * Example:
   * x = 500
   * y = 300
   * width = 400
   * height = 250
   */
  x: number;
  y: number;
  width: number;
  height: number;

  type: "building" | "facility" | "room";
};

type InteractiveMapProps = {
  image: ImageSourcePropType;
  hotspots: MapHotspot[];
  onPress: (hotspot: MapHotspot) => void;
  debug?: boolean;
};

const MIN_SCALE = 1;
const MAX_SCALE = 4;

export default function InteractiveMap({
  image,
  hotspots,
  onPress,
  debug = false,
}: InteractiveMapProps) {
  const [containerWidth, setContainerWidth] = React.useState(0);

  // ============================================================
  // IMAGE SIZE
  // ============================================================

  const [imageSize, setImageSize] = React.useState({
    width: 1,
    height: 1,
  });

  React.useEffect(() => {
    const resolved = Image.resolveAssetSource(image);

    if (resolved?.width && resolved?.height) {
      setImageSize({
        width: resolved.width,
        height: resolved.height,
      });
    }
  }, [image]);

  // ============================================================
  // MAP DIMENSIONS
  // ============================================================

  const aspectRatio =
    imageSize.width / imageSize.height;

  const mapWidth = containerWidth;

  const mapHeight =
    containerWidth > 0 && aspectRatio > 0
      ? containerWidth / aspectRatio
      : 0;

  // ============================================================
  // ZOOM
  // ============================================================

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);

  // ============================================================
  // PAN
  // ============================================================

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  // ============================================================
  // PINCH
  // ============================================================

  const pinchGesture = Gesture.Pinch()
    .onBegin(() => {
      savedScale.value = scale.value;
    })
    .onUpdate((event) => {
      const nextScale =
        savedScale.value * event.scale;

      scale.value = Math.min(
        MAX_SCALE,
        Math.max(MIN_SCALE, nextScale)
      );
    })
    .onEnd(() => {
      if (scale.value <= 1) {
        scale.value = withTiming(1);

        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
      }
    });

  // ============================================================
  // PAN
  // ============================================================

  const panGesture = Gesture.Pan()
    /**
     * This is important.
     *
     * A normal finger tap produces almost no movement,
     * so it won't activate the pan gesture.
     */
    .minDistance(15)

    .onBegin(() => {
      savedTranslateX.value =
        translateX.value;

      savedTranslateY.value =
        translateY.value;
    })

    .onUpdate((event) => {
      if (scale.value <= 1) {
        return;
      }

      const scaledWidth =
        mapWidth * scale.value;

      const scaledHeight =
        mapHeight * scale.value;

      const maxX = Math.max(
        0,
        (scaledWidth - mapWidth) / 2
      );

      const maxY = Math.max(
        0,
        (scaledHeight - mapHeight) / 2
      );

      const nextX =
        savedTranslateX.value +
        event.translationX;

      const nextY =
        savedTranslateY.value +
        event.translationY;

      translateX.value = Math.max(
        -maxX,
        Math.min(maxX, nextX)
      );

      translateY.value = Math.max(
        -maxY,
        Math.min(maxY, nextY)
      );
    });

  // ============================================================
  // DOUBLE TAP
  // ============================================================

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .maxDuration(250)
    .onEnd((_event, success) => {
      if (!success) {
        return;
      }

      if (scale.value > 1) {
        scale.value = withTiming(1);

        translateX.value =
          withTiming(0);

        translateY.value =
          withTiming(0);
      } else {
        scale.value = withTiming(2);
      }
    });

  // ============================================================
  // COMBINED MAP GESTURE
  // ============================================================

  /**
   * Pinch + pan are simultaneous.
   *
   * Double tap is kept separate from the pan so a normal
   * room tap isn't accidentally treated as a map gesture.
   */
  const mapGesture = Gesture.Simultaneous(
    pinchGesture,
    panGesture
  );

  // ============================================================
  // ANIMATED MAP
  // ============================================================

  const animatedMapStyle =
    useAnimatedStyle(() => {
      return {
        transform: [
          {
            translateX: translateX.value,
          },
          {
            translateY: translateY.value,
          },
          {
            scale: scale.value,
          },
        ],
      };
    });

  // ============================================================
  // LAYOUT
  // ============================================================

  const handleLayout = (
    event: LayoutChangeEvent
  ) => {
    const width =
      event.nativeEvent.layout.width;

    setContainerWidth(width);
  };

  // ============================================================
  // HOTSPOT PRESS
  // ============================================================

  const handleHotspotPress = (
    hotspot: MapHotspot
  ) => {
    console.log(
      "HOTSPOT PRESSED:",
      hotspot.id,
      hotspot.name
    );

    onPress(hotspot);
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <View
      style={styles.outerContainer}
      onLayout={handleLayout}
    >
      {containerWidth > 0 &&
        mapHeight > 0 && (
          <GestureDetector
            gesture={mapGesture}
          >
            <View
              style={[
                styles.viewport,
                {
                  width: mapWidth,
                  height: mapHeight,
                },
              ]}
            >
              <Animated.View
                style={[
                  styles.mapContainer,
                  {
                    width: mapWidth,
                    height: mapHeight,
                  },
                  animatedMapStyle,
                ]}
              >
                {/* ==================================================
                    MAP IMAGE
                   ================================================== */}

                <Image
                  source={image}
                  style={[
                    styles.mapImage,
                    {
                      width: mapWidth,
                      height: mapHeight,
                    },
                  ]}
                  resizeMode="stretch"
                />

                {/* ==================================================
                    ROOM / BUILDING HOTSPOTS
                   ================================================== */}

                {hotspots.map((hotspot) => {
                  const left =
                    (hotspot.x /
                      imageSize.width) *
                    mapWidth;

                  const top =
                    (hotspot.y /
                      imageSize.height) *
                    mapHeight;

                  const width =
                    (hotspot.width /
                      imageSize.width) *
                    mapWidth;

                  const height =
                    (hotspot.height /
                      imageSize.height) *
                    mapHeight;

                  return (
                    <Pressable
                      key={hotspot.id}
                      onPress={() =>
                        handleHotspotPress(
                          hotspot
                        )
                      }
                      hitSlop={2}
                      style={({ pressed }) => [
                        styles.hotspot,

                        {
                          left,
                          top,
                          width,
                          height,
                        },

                        debug &&
                          styles.debugHotspot,

                        pressed &&
                          styles.hotspotPressed,
                      ]}
                    >
                      {debug && (
                        <Text
                          style={
                            styles.debugText
                          }
                          numberOfLines={2}
                        >
                          {hotspot.name}
                        </Text>
                      )}
                    </Pressable>
                  );
                })}
              </Animated.View>
            </View>
          </GestureDetector>
        )}
    </View>
  );
}

const styles = StyleSheet.create({
  // ============================================================
  // OUTER
  // ============================================================

  outerContainer: {
    width: "100%",
    overflow: "hidden",
  },

  // ============================================================
  // VIEWPORT
  // ============================================================

  viewport: {
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },

  // ============================================================
  // MAP
  // ============================================================

  mapContainer: {
    position: "relative",
    alignSelf: "center",
  },

  mapImage: {
    position: "absolute",
    left: 0,
    top: 0,
  },

  // ============================================================
  // HOTSPOTS
  // ============================================================

  hotspot: {
    position: "absolute",

    zIndex: 100,

    elevation: 10,
  },

  debugHotspot: {
    backgroundColor:
      "rgba(128, 0, 32, 0.15)",

    borderWidth: 2,

    borderColor:
      "rgba(128, 0, 32, 0.65)",

    borderRadius: 4,

    alignItems: "center",
    justifyContent: "center",
  },

  debugText: {
    color: "#800020",

    fontSize: 9,

    fontWeight: "800",

    textAlign: "center",
  },

  hotspotPressed: {
    backgroundColor:
      "rgba(128, 0, 32, 0.35)",
  },
});