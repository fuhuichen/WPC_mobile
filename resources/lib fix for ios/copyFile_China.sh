cp -f RCTUIImageViewAnimated.m ../../node_modules/react-native/Libraries/Image/RCTUIImageViewAnimated.m
cp -f RNSVGPathMeasure.m ../../node_modules/react-native-svg/ios/Utils/RNSVGPathMeasure.m
rm -f ../../app/notification/bgMessaging.js
cp -f china/index.js ../../index.js
cp -f china/JMessage.js ../../app/notification/JMessage.js
cp -f china/InfoPlist.strings ../../ios/zh-Hans.lproj/InfoPlist.strings
cp -f china/RNLocation.m ../../node_modules/react-native-location/ios/RNLocation.m
cp -f china/china/Environment.js ../../Environments/Environment.js
cp -f china/china/AppDelegate.m ../../ios/LookStore/AppDelegate.m
