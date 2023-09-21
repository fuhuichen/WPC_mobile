
import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import QRCodeScanner from 'react-native-qrcode-scanner';
import { RNCamera } from 'react-native-camera';
import {NavigationContainer} from '@react-navigation/native';
import {Provider} from  'react-redux';
import PageRouter from './app/PageRouter';
import {createStore} from 'redux';
import reducers from './reducers'

/*<View width={"100%"} height={"100%"}>
  <QRCodeScanner
    onRead={(data) => alert(JSON.stringify(data))}
    flashMode={RNCamera.Constants.FlashMode.torch}
    reactivate={true}
    reactivateTimeout={500}
    topContent={
      <View>
        <Text>{"QRCode Scanner"}</Text>
      </View>
    }
  />
  </View>*/

const APP = () => {
  return (
    <Provider store={createStore(reducers)}>
      <PageRouter>App</PageRouter>
    </Provider>
  )
}


export default APP;
