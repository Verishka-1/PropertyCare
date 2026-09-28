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

const HOTSPOT_REFERENCE_WIDTH = 2000;
const HOTSPOT_REFERENCE_HEIGHT = 2000;

export type MapHotspot = {
  id: string;
  name: string;

  x: number;
  y: number;
  width: number;
  height: number;

  type: "building" | "facility" | "room";
};

type AdminInteractiveMapProps = {
  image: ImageSourcePropType;
  hotspots: MapHotspot[];
  onPress: (hotspot: MapHotspot) => void;

  reportCounts?: Record<string, number>;

  debug?: boolean;
};

const MIN_SCALE = 1;
const MAX_SCALE = 4;

export default function AdminInteractiveMap({
  image,
  hotspots,
  onPress,
  reportCounts = {},
  debug = true,
}: AdminInteractiveMapProps) {
  const [containerWidth, setContainerWidth] = React.useState(0);


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


  const aspectRatio =
    imageSize.width / imageSize.height;

  const mapWidth = containerWidth;

  const mapHeight =
    containerWidth > 0 && aspectRatio > 0
      ? containerWidth / aspectRatio
      : 0;


  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);


  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

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


  const panGesture = Gesture.Pan()
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


  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .maxDuration(250)
    .onEnd((_event, success) => {
      if (!success) {
        return;
      }

      if (scale.value > 1) {
        scale.value = withTiming(1);

        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
      } else {
        scale.value = withTiming(2);
      }
    });


  const mapGesture = Gesture.Simultaneous(
    pinchGesture,
    panGesture
  );

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

  const handleLayout = (
    event: LayoutChangeEvent
  ) => {
    const width =
      event.nativeEvent.layout.width;

    setContainerWidth(width);
  };


  const handleHotspotPress = (
    hotspot: MapHotspot
  ) => {
    console.log(
      "ADMIN HOTSPOT PRESSED:",
      hotspot.id,
      hotspot.name
    );

    onPress(hotspot);
  };

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


                {hotspots.map((hotspot) => {
                  const left =
                    (hotspot.x / HOTSPOT_REFERENCE_WIDTH) * mapWidth;

                  const top =
                    (hotspot.y / HOTSPOT_REFERENCE_HEIGHT) * mapHeight;

                  const width =
                    (hotspot.width / HOTSPOT_REFERENCE_WIDTH) * mapWidth;

                  const height =
                    (hotspot.height / HOTSPOT_REFERENCE_HEIGHT) * mapHeight;

                  const touchWidth = Math.max(width, 44);
                  const touchHeight = Math.max(height, 44);

                  const touchLeft =
                    left + width / 2 - touchWidth / 2;

                  const touchTop =
                    top + height / 2 - touchHeight / 2;

                  const reportCount =
                    reportCounts[hotspot.id] ?? 0;

                  return (
                    <Pressable
                      key={hotspot.id}
                      onPress={() => handleHotspotPress(hotspot)}
                      hitSlop={4}
                      accessibilityRole="button"
                      accessibilityLabel={`View reports for ${hotspot.name}`}
                      style={({ pressed }) => [
                        styles.hotspot,
                        {
                          left: touchLeft,
                          top: touchTop,
                          width: touchWidth,
                          height: touchHeight,
                        },
                        debug && styles.debugHotspot,
                        pressed && styles.hotspotPressed,
                      ]}
                    >
                      <View style={styles.reportCountBox}>
                        <Text style={styles.reportCountText}>
                          {reportCount}
                        </Text>
                      </View>

                      {debug && (
                        <Text style={styles.debugText} numberOfLines={2}>
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

  outerContainer: {
    width: "100%",
    overflow: "hidden",
  },


  viewport: {
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },


  mapContainer: {
    position: "relative",
    alignSelf: "center",
  },

  mapImage: {
    position: "absolute",
    left: 0,
    top: 0,
  },


  hotspot: {
    position: "absolute",

    zIndex: 100,

    elevation: 10,

    alignItems: "center",
    justifyContent: "center",
  },


  reportCountBox: {
  minWidth: 20,
  height: 18,
  paddingHorizontal: 4,
  borderRadius: 4,
  backgroundColor: "#800020",
  alignItems: "center",
  justifyContent: "center",
  borderWidth: 1,
  borderColor: "#FFFFFF",
  elevation: 4,
},

reportCountText: {
  color: "#FFFFFF",
  fontSize: 10,
  fontWeight: "800",
  textAlign: "center",
},


  debugHotspot: {
    backgroundColor:
      "rgba(128, 0, 32, 0.15)",

    borderWidth: 2,

    borderColor:
      "rgba(128, 0, 32, 0.65)",

    borderRadius: 4,
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