import React, { useEffect, useRef, useState } from 'react';
import { View, Text, SafeAreaView, Image, StyleSheet } from 'react-native';
import { Camera } from 'expo-camera';
import { Foundation } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as MediaLibrary from 'expo-media-library';

const CameraComponent = () => {
  const navigation = useNavigation();
  const cameraRef = useRef();
  const [hasCameraPermission, setHasCameraPermission] = useState();
  const [hasMediaLibraryPermission, setHasMediaLibraryPermission] = useState();
  const [photo, setPhoto] = useState();

  useEffect(() => {
    const getPermissions = async () => {
      const cameraPermission = await Camera.requestCameraPermissionsAsync();
      const mediaLibraryPermission = await MediaLibrary.requestPermissionsAsync();
      setHasCameraPermission(cameraPermission.status === 'granted');
      setHasMediaLibraryPermission(mediaLibraryPermission.status === 'granted');
    };
    getPermissions();
  }, []);

  if (hasCameraPermission === undefined) {
    return <Text>Requesting permissions to access camera</Text>;
  } else if (!hasCameraPermission) {
    return <Text>Permission for camera not granted</Text>;
  }

  const takePicture = async () => {
    const options = {
      quality: 1,
      base64: true,
      exif: false,
    };

    const newPhoto = await cameraRef.current.takePictureAsync(options);
    setPhoto(newPhoto);
  };

  if (photo) {
    const savePhoto = async () => {
      await MediaLibrary.saveToLibraryAsync(photo.uri);
      setPhoto(undefined);
    };

    return (
      <SafeAreaView style={styles.container}>
        <Image style={styles.save} source={{ uri: `data:image/jpg;base64,${photo.base64}` }} />
        {hasMediaLibraryPermission ? (
          <MaterialIcons name="save-alt" size={50} color="black" onPress={savePhoto} />
        ) : null}
      </SafeAreaView>
    );
  }

  return (
    <Camera style={styles.container} ref={cameraRef}>
      <View style={styles.button}>
        <Foundation name="camera" size={50} color="black" onPress={takePicture} />
      </View>
    </Camera>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    position: 'absolute',
    bottom: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
    padding: 20,
  },
  save: {
    alignSelf: 'stretch',
    flex: 1,
  },
});

export default CameraComponent;
