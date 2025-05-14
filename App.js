import React, { useState } from 'react';
import { StyleSheet, View, Text, Button, Image, PermissionsAndroid } from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import RNFS from 'react-native-fs';
import Geolocation from 'react-native-geolocation-service';
import { Platform } from 'react-native';

export default function App() {
  const [uri, setUri] = useState("");

  const openImagePicker = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        includeBase64: false,
        maxHeight: 2000,
        maxWidth: 2000,
      },
      handleResponse
    );
  };

  const handleCameraLaunch = () => {
    launchCamera(
      {
        mediaType: 'photo',
        includeBase64: false,
        maxHeight: 2000,
        maxWidth: 2000,
      },
      handleResponse
    );
  };

  const requestCameraPermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: "Camera Permission",
          message: "This app needs access to your camera to take photos.",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Cancel",
          buttonPositive: "OK",
        }
      );

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log("Camera permission granted");
        handleCameraLaunch();
      } else {
        console.log("Camera permission denied");
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const handleResponse = (response) => {
    console.log("Camera Response:", response);

    if (response.didCancel) {
      console.log("User cancelled image picker");
    } else if (response.errorCode) {
      console.log("Image picker error: ", response.errorMessage);
    } else if (response.assets && response.assets.length > 0) {
      const imageUri = response.assets[0].uri;
      console.log("Image URI:", imageUri);
      setUri(imageUri);
      saveFile(imageUri);
    } else {
      console.log("No assets found in the response");
    }
  };

  const saveFile = async (imageUri) => {
    const path = RNFS.PicturesDirectoryPath + "/image_" + Date.now() + ".jpg";
    await RNFS.copyFile(imageUri, path)
      .then(() => {
        console.log("File copied to:", path);
      })
      .catch((error) => {
        console.error("Error copying file:", error);
      });
  }

  const [coords, setCoords] = useState(null);

  const getLocation = async () => {
    const hasPermission = await hasLocationPermission();

    if (!hasPermission) {
      return;
    }

    Geolocation.getCurrentPosition(
      async (position) => {
        setCoords(position.coords);
        console.log(position);
        await saveLocation(position.coords);
      },
      (error) => {
        console.error("Code ${error.code}", error.message);
        console.log(error);
      },
      {
        accuracy: {
          android: "high",
        },
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
        distanceFilter: 0,
        forceRequestLocation: true,
        forceLocationManager: true,
        showLocationDialog: true,
      }
    );
  };

  const hasLocationPermission = async () => {
    if (Platform.OS === "android" && Platform.Version < 23) {
      return true;
    }

    const hasPermission = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
    );

    if (hasPermission) {
      return true;
    }

    const status = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
    );

    if (status === PermissionsAndroid.RESULTS.GRANTED) {
      return true;
    }

    if (status === PermissionsAndroid.RESULTS.DENIED) {
      console.log("Location permission denied by user.");
    } else if (status === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
      console.log("Location permission denied by user.");
    }

    return false;
  }

  const saveLocation = async (coords) => {
    const path = RNFS.DownloadDirectoryPath + "/location_" + Date.now() + ".txt";
    const data = `Longitude: ${coords.longitude}\nLatitude: ${coords.latitude}`;
    RNFS.writeFile(path, data, 'utf8')
      .then(() => {
        console.log("Location saved to:", path);
      })
      .catch((err) => {
        console.error(err);
      })
  }

  return (
    <View style={styles.container}>
      <Text>Adrianus Ezeekiel - 00000071229</Text>
      {coords && (
        <>
          <Text>Longitude: {coords.longitude}</Text>
          <Text>Latitude: {coords.latitude}</Text>
        </>
      )}
      <Button title="Open Camera" onPress={requestCameraPermission} />
      <Button title="Open Gallery" onPress={openImagePicker} />
      <Button title="Get Geo Location" onPress={getLocation} />
      {uri ? (
        <Image source={{ uri }} style={{ width: 200, height: 200, marginTop: 20 }} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});