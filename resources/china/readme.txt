【ios global】
1. modified react-native-image-picker to '^2.3.4' from package.json

【ios china】
1. remove react-native-firebase from package.json

2. modified jcore-react-native to '^1.8.0' from package.json

3. modified jpush-react-native to '^2.8.1' from package.json

4. remove Firebase and RNFirebase from Podfile

5. override the AppDelegate.m and JMessage.js files

6. npm install && pod install

7. update the EZOpenSDKFramework.framework from resources folder

8. check 'Location update' from Background Modes
   modify allowBackgroundLocationUpdate to false from RNLocation.m

9. modify EZVIZ_GLOBAL macro to 0 from Pods/Build Settings/App Clang/Preprocessor Macros

10. modify the app display name
  => InfoPlist.strings(chinese,Simplified): "店看看"

11. modify the ios bundle id && schema
    => bundle id: com.adv.storeviu.china
    => schema: StoreMo_x.x.x_china

【ios qa】
1. execution steps from 【ios china】(ignore step 8,10,11) 

2. modify the jpush appkey for debug from AppDelegate.m

3. modify _Environments to QA_China from Environment.js

4. modify the ios bundle id && schema
   => bundle id: com.adv.storeviu.qa
   => schema: StoreMo_x.x.x_qa

【android global】
1.modify to remove background location permission from jpush-react-native

【android china】
1. modify _Environments to Stable_China from Environment.js

2. modify the app display name
  => strings.xml: "店看看"

3. npm install

【android qa】
1. modify _Environments to QA_China from Environment.js

2. modify the jpush appkey for debug from build.gradle

3. npm install