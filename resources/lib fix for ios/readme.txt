Auto:
1. npm install
2. cd  && pod install
3. cd copyFile
4. chmod 777 copyFile.sh
5. run copyFile


Manual:

1. npm install
2. replace RNFirebaseNotifications.m in 
    node_modules/react-native-firebase/ios/RNFirebase/notifications/RNFirebaseNotifications.m  (notice crash fix for ios14)
3. replace RCTUIImageViewAnimated.m in 
    node_modules/react-native/Libraries/Image/RCTUIImageViewAnimated.m   (image not show fix for Xcode 12)
4. replace RNCamera.m in
   node_modules/react-native-camera/ios/RN/RNCamera.m   (zoom fix for Xcode 12)
5. cd  && pod install
6. replace EZOpenSDKFramework.framework in  ios/Pods/EZOpenSDK/dist/EZOpenSDK/dynamicSDK/EZOpenSDKFramework.framework


