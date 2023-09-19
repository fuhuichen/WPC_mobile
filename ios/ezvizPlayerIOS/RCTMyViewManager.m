#import <Foundation/Foundation.h>
#import "RCTMyViewManager.h"
#import "MyView.h"
#import <React/RCTBridge.h>
#import <React/RCTUIManager.h>
#import <EZOpenSDKFramework/EZHCNetDeviceSDK.h>
#import <EZOpenSDKFramework/EZOpenSDK.h>
#import <EZOpenSDKFramework/EZGlobalSDK.h>
#ifndef EZVIZ_GLOBAL
#define EZVIZ_GLOBAL 1
#endif
#define EZVIZ_GLOBAL 1
#if EZVIZ_GLOBAL
#define EZOPENSDK [EZGlobalSDK class]
#else
#define EZOPENSDK [EZOpenSDK class]
#endif

@implementation RCTMyViewManager

@synthesize _verifyCode;

RCT_EXPORT_MODULE()
RCT_EXPORT_VIEW_PROPERTY(sound, BOOL)
RCT_EXPORT_VIEW_PROPERTY(play, BOOL)
RCT_EXPORT_VIEW_PROPERTY(fullScreen, BOOL)
RCT_EXPORT_VIEW_PROPERTY(onVideoLoad, RCTDirectEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onVideoError, RCTDirectEventBlock);



RCT_EXPORT_METHOD(capture:(nonnull NSNumber *)reactTag
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject){
    
    MyView *myView = [self getViewWithTag:reactTag];
    [myView capture:resolve reject:reject];
}

RCT_EXPORT_METHOD(stop:(nonnull NSNumber *)reactTag)
{
    MyView *myView = [self getViewWithTag:reactTag];
    [myView stop];
}

RCT_EXPORT_METHOD( setVideoLevel:
                   (NSString *)deviceSerial
                   cameraNo:(NSInteger)cameraNo
                   videoLevel:(NSInteger) videoLevel
                   reactTag:(nonnull NSNumber *)reactTag
                   resolve:(RCTPromiseResolveBlock)resolve
                   reject:(RCTPromiseRejectBlock)reject)
                  
{
    MyView *myView = [self getViewWithTag:reactTag];
    [myView setVideoLevel:deviceSerial cameraNo:cameraNo videoLevel:videoLevel resolve:resolve reject:reject];
}

RCT_EXPORT_METHOD( startReal:
                   (NSString *)deviceSerial
                   cameraNo:(NSInteger)cameraNo
                   verifyCode:(NSString *)verifyCode
                   reactTag:(nonnull NSNumber *)reactTag
                   resolve:(RCTPromiseResolveBlock)resolve
                   reject:(RCTPromiseRejectBlock)reject)
                  
{
    MyView *myView = [self getViewWithTag:reactTag];
    if (verifyCode == nil){
        verifyCode = _verifyCode;
    }
    [myView startReal:deviceSerial cameraNo:cameraNo verifyCode:verifyCode resolve:resolve reject:reject];
}

RCT_EXPORT_METHOD( startPlayback:
                 (NSString *)deviceSerial
                 cameraNo:(NSInteger)cameraNo
                 verifyCode:(NSString *)verifyCode
                 beginTime:(NSDate *)beginTime
                 reactTag:(nonnull NSNumber *)reactTag
                 resolve:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject)

{
    MyView *myView = [self getViewWithTag:reactTag];
    if (verifyCode == nil){
        verifyCode = _verifyCode;
    }
    [myView startPlayback:deviceSerial cameraNo:cameraNo verifyCode:verifyCode beginTime:beginTime resolve:resolve reject:reject];
}

RCT_EXPORT_METHOD( seekAdd:(nonnull NSNumber *)reactTag)
{
    MyView *myView = [self getViewWithTag:reactTag];
    [myView seekAdd];
}

RCT_EXPORT_METHOD( seekDecrease:(nonnull NSNumber *)reactTag)
{
    MyView *myView = [self getViewWithTag:reactTag];
    [myView seekDecrease];
}

RCT_EXPORT_METHOD( init:(NSString *)appKey)
{
    [EZOPENSDK initLibWithAppKey:appKey];
    [EZHCNetDeviceSDK initSDK];
}

RCT_EXPORT_METHOD(openAppStore:(BOOL)isGlobal)
{
    NSString *appId = @"";
if (isGlobal)
    appId = @"1459956048";
else
    appId = @"1527352337";
    NSString *urlString = [@"itms-apps://itunes.apple.com/app/id" stringByAppendingString:appId];
    [[UIApplication sharedApplication] openURL:[NSURL URLWithString:urlString] options:@{} completionHandler:nil];
}

RCT_EXPORT_METHOD(shareItem:(NSString *)path)
{
    NSArray *activityItems = [NSArray arrayWithObjects: [NSURL fileURLWithPath:path], nil];    
    UIActivityViewController *activityVC = [[UIActivityViewController alloc]initWithActivityItems:activityItems
                                                                            applicationActivities:nil];
    activityVC.excludedActivityTypes = @[UIActivityTypePrint,UIActivityTypeMessage,
                                         UIActivityTypeCopyToPasteboard,UIActivityTypeAssignToContact,
                                         UIActivityTypeSaveToCameraRoll,UIActivityTypeAddToReadingList];
    activityVC.completionWithItemsHandler = ^(UIActivityType  _Nullable activityType, BOOL completed, NSArray * _Nullable returnedItems, NSError * _Nullable activityError) {
            if (completed) {
                NSLog(@"share yes");
            }else{
                NSLog(@"share no");
            }
        };
    UIViewController * rootVc = [UIApplication sharedApplication].keyWindow.rootViewController;
    [rootVc presentViewController:activityVC animated:TRUE completion:nil];
}

RCT_EXPORT_METHOD( setToken:(NSString *)token)
{
    NSLog(@"xxxxxxxshare yes %@ %d",token,EZVIZ_GLOBAL);
    [EZOPENSDK setAccessToken:token];
}

RCT_EXPORT_METHOD( setVerifyCode:(NSString *)verifyCode)
{
    _verifyCode = verifyCode;
}

RCT_EXPORT_METHOD( startRecord:
                  (nonnull NSNumber *)reactTag
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
    MyView *myView = [self getViewWithTag:reactTag];
    [myView startRecord:resolve reject:reject];
}

RCT_EXPORT_METHOD( stopRecord:(nonnull NSNumber *)reactTag
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
{
    MyView *myView = [self getViewWithTag:reactTag];
    [myView stopRecord:resolve reject:reject];
}

- (MyView *) getViewWithTag:(NSNumber *)tag {
    UIView *view = [self.bridge.uiManager viewForReactTag:tag];
    return [view isKindOfClass:[MyView class]] ? (MyView *)view : nil;
}

- (UIView *)view {
    return [[MyView alloc] initWithFrame: [UIScreen mainScreen].bounds];
}

- (dispatch_queue_t)methodQueue
{
    return dispatch_get_main_queue();
}




@end
