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

  /*
   * These coordinates are in the ORIGINAL
   * PNG image's pixel coordinate system.
   */
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

  /*
   * IMPORTANT:
   *
   * reportCounts must use hotspot IDs.
   *
   * Example:
   *
   * {
   *   br309: 3,
   *   br310: 1
   * }
   */
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
  debug = false,
}: AdminInteractiveMapProps) {
  const [containerWidth, setContainerWidth] =
    React.useState(0);

  /*
   * Get the ACTUAL dimensions of the PNG.
   *
   * This is important because your user building
   * map uses the real image dimensions.
   */
  const [imageSize, setImageSize] =
    React.useState({
      width: 1,
      height: 1,
    });

  React.useEffect(() => {
    const resolved =
      Image.resolveAssetSource(image);

    if (
      resolved?.width &&
      resolved?.height
    ) {
      setImageSize({
        width: resolved.width,
        height: resolved.height,
      });

      console.log(
        "ADMIN MAP IMAGE SIZE:",
        resolved.width,
        resolved.height
      );
    }
  }, [image]);

  const aspectRatio =
    imageSize.width /
    imageSize.height;

  const mapWidth =
    containerWidth;

  const mapHeight =
    containerWidth > 0 &&
    aspectRatio > 0
      ? containerWidth /
        aspectRatio
      : 0;

  /*
   * ZOOM
   */
  const scale =
    useSharedValue(1);

  const savedScale =
    useSharedValue(1);

  /*
   * PAN
   */
  const translateX =
    useSharedValue(0);

  const translateY =
    useSharedValue(0);

  const savedTranslateX =
    useSharedValue(0);

  const savedTranslateY =
    useSharedValue(0);

  /*
   * PINCH
   */
  const pinchGesture =
    Gesture.Pinch()
      .onBegin(() => {
        savedScale.value =
          scale.value;
      })
      .onUpdate((event) => {
        const nextScale =
          savedScale.value *
          event.scale;

        scale.value =
          Math.min(
            MAX_SCALE,
            Math.max(
              MIN_SCALE,
              nextScale
            )
          );
      })
      .onEnd(() => {
        if (scale.value <= 1) {
          scale.value =
            withTiming(1);

          translateX.value =
            withTiming(0);

          translateY.value =
            withTiming(0);
        }
      });

  /*
   * PAN
   */
  const panGesture =
    Gesture.Pan()
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
          mapWidth *
          scale.value;

        const scaledHeight =
          mapHeight *
          scale.value;

        const maxX =
          Math.max(
            0,
            (scaledWidth -
              mapWidth) /
              2
          );

        const maxY =
          Math.max(
            0,
            (scaledHeight -
              mapHeight) /
              2
          );

        const nextX =
          savedTranslateX.value +
          event.translationX;

        const nextY =
          savedTranslateY.value +
          event.translationY;

        translateX.value =
          Math.max(
            -maxX,
            Math.min(
              maxX,
              nextX
            )
          );

        translateY.value =
          Math.max(
            -maxY,
            Math.min(
              maxY,
              nextY
            )
          );
      });

  /*
   * DOUBLE TAP ZOOM
   */
  const doubleTapGesture =
    Gesture.Tap()
      .numberOfTaps(2)
      .maxDuration(250)
      .onEnd(
        (_event, success) => {
          if (!success) {
            return;
          }

          if (scale.value > 1) {
            scale.value =
              withTiming(1);

            translateX.value =
              withTiming(0);

            translateY.value =
              withTiming(0);
          } else {
            scale.value =
              withTiming(2);
          }
        }
      );

  /*
   * Combine gestures.
   */
  const mapGesture =
    Gesture.Simultaneous(
      pinchGesture,
      panGesture,
      doubleTapGesture
    );

  /*
   * Animated map transform.
   */
  const animatedMapStyle =
    useAnimatedStyle(() => {
      return {
        transform: [
          {
            translateX:
              translateX.value,
          },
          {
            translateY:
              translateY.value,
          },
          {
            scale:
              scale.value,
          },
        ],
      };
    });

  /*
   * Container size.
   */
  const handleLayout = (
    event: LayoutChangeEvent
  ) => {
    const width =
      event.nativeEvent.layout
        .width;

    setContainerWidth(width);
  };

  /*
   * Hotspot press.
   */
  const handleHotspotPress = (
    hotspot: MapHotspot
  ) => {
    console.log(
      "ADMIN HOTSPOT PRESSED:",
      hotspot.id,
      hotspot.name,
      "REPORT COUNT:",
      reportCounts[
        hotspot.id
      ] ?? 0
    );

    onPress(hotspot);
  };

  return (
    <View
      style={
        styles.outerContainer
      }
      onLayout={
        handleLayout
      }
    >
      {containerWidth > 0 &&
        mapHeight > 0 && (
          <GestureDetector
            gesture={
              mapGesture
            }
          >
            <View
              style={[
                styles.viewport,
                {
                  width:
                    mapWidth,
                  height:
                    mapHeight,
                },
              ]}
            >
              <Animated.View
                style={[
                  styles.mapContainer,
                  {
                    width:
                      mapWidth,
                    height:
                      mapHeight,
                  },
                  animatedMapStyle,
                ]}
              >
                {/* MAP IMAGE */}

                <Image
                  source={image}
                  style={[
                    styles.mapImage,
                    {
                      width:
                        mapWidth,
                      height:
                        mapHeight,
                    },
                  ]}
                  resizeMode="stretch"
                />

                {/* HOTSPOTS */}

                {hotspots.map(
                  (hotspot) => {
                    /*
                     * IMPORTANT:
                     *
                     * Hotspot coordinates are based
                     * on the actual original PNG.
                     */
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

                    /*
                     * Make small rooms easier
                     * to tap.
                     */
                    const touchWidth =
                      Math.max(
                        width,
                        44
                      );

                    const touchHeight =
                      Math.max(
                        height,
                        44
                      );

                    const touchLeft =
                      left +
                      width / 2 -
                      touchWidth / 2;

                    const touchTop =
                      top +
                      height / 2 -
                      touchHeight / 2;

                    /*
                     * REAL REPORT COUNT
                     */
                    const reportCount =
                      Number(
                        reportCounts[
                          hotspot.id
                        ] ?? 0
                      );

                    return (
                      <Pressable
                        key={
                          hotspot.id
                        }
                        onPress={() =>
                          handleHotspotPress(
                            hotspot
                          )
                        }
                        hitSlop={4}
                        accessibilityRole="button"
                        accessibilityLabel={`View ${reportCount} reports for ${hotspot.name}`}
                        style={({
                          pressed,
                        }) => [
                          styles.hotspot,

                          {
                            left:
                              touchLeft,

                            top:
                              touchTop,

                            width:
                              touchWidth,

                            height:
                              touchHeight,
                          },

                          debug &&
                            styles.debugHotspot,

                          pressed &&
                            styles.hotspotPressed,
                        ]}
                      >
                        {/* REPORT COUNT */}

                        <View
                          style={[
                            styles.reportCountBox,

                            reportCount >
                              0 &&
                              styles.reportCountBoxActive,
                          ]}
                        >
                          <Text
                            style={
                              styles.reportCountText
                            }
                          >
                            {
                              reportCount
                            }
                          </Text>
                        </View>

                        {/* DEBUG ROOM NAME */}

                        {debug && (
                          <Text
                            style={
                              styles.debugText
                            }
                            numberOfLines={
                              2
                            }
                          >
                            {
                              hotspot.name
                            }
                          </Text>
                        )}
                      </Pressable>
                    );
                  }
                )}
              </Animated.View>
            </View>
          </GestureDetector>
        )}
    </View>
  );
}

const styles =
  StyleSheet.create({
    outerContainer: {
      width: "100%",
      overflow: "hidden",
    },

    viewport: {
      overflow: "hidden",
      backgroundColor:
        "#FFFFFF",
    },

    mapContainer: {
      position: "relative",
      alignSelf:
        "center",
    },

    mapImage: {
      position:
        "absolute",
      left: 0,
      top: 0,
    },

    hotspot: {
      position:
        "absolute",
      zIndex: 100,
      elevation: 10,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    reportCountBox: {
      minWidth: 24,
      height: 22,
      paddingHorizontal: 5,
      borderRadius: 11,
      backgroundColor:
        "#777777",
      alignItems:
        "center",
      justifyContent:
        "center",
      borderWidth: 1,
      borderColor:
        "#FFFFFF",
      elevation: 5,
    },

    reportCountBoxActive: {
      backgroundColor:
        "#800020",
    },

    reportCountText: {
      color: "#FFFFFF",
      fontSize: 11,
      fontWeight:
        "800",
      textAlign:
        "center",
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
      color:
        "#800020",
      fontSize: 9,
      fontWeight:
        "800",
      textAlign:
        "center",
    },

    hotspotPressed: {
      backgroundColor:
        "rgba(128, 0, 32, 0.35)",
    },
  });