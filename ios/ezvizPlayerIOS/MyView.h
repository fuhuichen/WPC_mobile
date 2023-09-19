#import <UIKit/UIKit.h>
#import <EZOpenSDKFramework/EZPlayer.h>
#import <React/RCTComponent.h>
#import <React/RCTBridge.h>
#import <React/RCTUIManager.h>

NS_ASSUME_NONNULL_BEGIN

@interface MyView : UIView<EZPlayerDelegate>

@property (nonatomic, assign) BOOL sound;
@property (nonatomic, assign) BOOL play;
@property (nonatomic, assign) BOOL fullScreen;

@property (nonatomic, copy) RCTDirectEventBlock onVideoLoad;
@property (nonatomic, copy) RCTDirectEventBlock onVideoError;
@property (nonatomic, strong) EZPlayer *player;

- (void)capture:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject;
- (void)stop;
- (void)startReal:(NSString *)deviceSerial cameraNo:(NSInteger)cameraNo verifyCode:(NSString *)verifyCode
                  resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject;
- (void)startPlayback:(NSString *)deviceSerial cameraNo:(NSInteger) cameraNo verifyCode:(NSString *)verifyCode
            beginTime:(NSDate *)beginTime resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject;
- (void)seekAdd;
- (void)seekDecrease;
- (void)startRecord:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject;
- (void)stopRecord:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject;
- (void)setVideoLevel:(NSString *)deviceSerial cameraNo:(NSInteger)cameraNo videoLevel:(NSInteger)videoLevel
                  resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject;

@end

NS_ASSUME_NONNULL_END
