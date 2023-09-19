#import "MyView.h"
#import <EZOpenSDKFramework/EZPlayer.h>
#import <EZOpenSDKFramework/EZHCNetDeviceSDK.h>
#import <EZOpenSDKFramework/EZOpenSDK.h>
#import <EZOpenSDKFramework/EZGlobalSDK.h>
#import <EZOpenSDKFramework/EZDeviceRecordFile.h>
#import <React/RCTBridge.h>
#import <React/RCTUIManager.h>

#ifndef EZVIZ_GLOBAL
#define EZVIZ_GLOBAL 1
#endif
#define EZVIZ_GLOBAL 1
#if EZVIZ_GLOBAL
#define EZOPENSDK [EZGlobalSDK class]
#else
#define EZOPENSDK [EZOpenSDK class]
#endif

@implementation MyView

 BOOL _bReal = true;
 NSDate *_beginTime = nil;
 NSDate *_endTime = nil;
 NSString *_deviceSerial = nil;
 NSInteger _cameraNo = -1;
 NSString *_verifyCode = nil;
 NSString *_recordPath = nil;

- (instancetype)initWithFrame:(CGRect)frame
{
    self = [super initWithFrame:frame];
    if (self) {
        self.backgroundColor = [UIColor blackColor];
    }
    
    [[NSNotificationCenter defaultCenter] addObserver:self
                                          selector:@selector(applicationDidEnterBackground:)
                                          name:UIApplicationDidEnterBackgroundNotification
                                          object:nil];
    
    [[NSNotificationCenter defaultCenter] addObserver:self
                                          selector:@selector(applicationWillEnterForeground:)
                                          name:UIApplicationWillEnterForegroundNotification
                                          object:nil];
    
    [[NSNotificationCenter defaultCenter] addObserver:self
                                          selector:@selector(applicationDidBecomeActiveNotification:)
                                          name:UIApplicationDidBecomeActiveNotification
                                          object:nil];
    
    [[NSNotificationCenter defaultCenter] addObserver:self
                                          selector:@selector(applicationResignActiveNotification:)
                                          name:UIApplicationWillResignActiveNotification
                                          object:nil];
    
    return self;
}

- (void)dealloc
{
    [[NSNotificationCenter defaultCenter] removeObserver:self];
    if (_player){
        [_player closeSound];
        [_player destoryPlayer];
    }
}

- (void)setVideoLevel:(NSString *)deviceSerial cameraNo:(NSInteger)cameraNo videoLevel:(NSInteger)videoLevel
              resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject{
    [EZOPENSDK setVideoLevel:deviceSerial cameraNo:cameraNo videoLevel:videoLevel completion:^(NSError *error) {
        if(error){
            resolve(@{@"result": [NSNumber numberWithBool:FALSE]});
        }
        else{
            resolve(@{@"result": [NSNumber numberWithBool:TRUE]});
        }
    }];
}

- (void)startReal:(NSString *)deviceSerial cameraNo:(NSInteger)cameraNo verifyCode:(NSString *)verifyCode resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject{
    if (_player){
        [_player closeSound];
        [_player destoryPlayer];
    }
    _player = [EZOPENSDK createPlayerWithDeviceSerial:deviceSerial cameraNo:cameraNo];
    _player.delegate = self;
    if (verifyCode != nil){
        [_player setPlayVerifyCode:verifyCode];
    }
    [_player setPlayerView:self];
    _bReal = true;
    BOOL result = [_player startRealPlay];
    resolve(@{@"result": [NSNumber numberWithBool:result]});
}

- (void)startPlayback:(NSString *)deviceSerial cameraNo:(NSInteger) cameraNo verifyCode:(NSString *)verifyCode
            beginTime:(NSDate *)beginTime resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject{
    NSDate *searchTime = beginTime;
#if EZVIZ_GLOBAL
    NSDate *date = [NSDate date];
    NSTimeZone *zone = [NSTimeZone systemTimeZone];
    NSInteger interval = [zone secondsFromGMTForDate: date];
    searchTime = [beginTime dateByAddingTimeInterval:interval];
#endif
    NSDate *endTime = [searchTime dateByAddingTimeInterval:300];
    if (_player){
        [_player closeSound];
        [_player destoryPlayer];
    }
    [EZOPENSDK searchRecordFileFromDevice:deviceSerial cameraNo:cameraNo
    beginTime:searchTime endTime:endTime
    completion:^(NSArray *deviceRecords, NSError *error) {
        if (!error && deviceRecords.count > 0){
            self->_player = [EZOPENSDK createPlayerWithDeviceSerial:deviceSerial cameraNo:cameraNo];
            self->_player.delegate = self;
            if (verifyCode != nil){
                [self->_player setPlayVerifyCode:verifyCode];
            }
            EZDeviceRecordFile * record = deviceRecords[0];
            BOOL result = [self->_player startPlaybackFromDevice:record];
            _beginTime = beginTime;
            _endTime = [record.stopTime dateByAddingTimeInterval:1];
            _deviceSerial = deviceSerial;
            _cameraNo = cameraNo;
            _verifyCode = verifyCode;
            _bReal = false;
            if (resolve){
                resolve(@{@"result": [NSNumber numberWithBool:result]});
            }
        }
        else{
            if (self.onVideoError ) {
                self.onVideoError(@{@"errorCode": [NSNumber numberWithInteger:101]});
            }
            if (resolve){
               resolve(@{@"result": [NSNumber numberWithBool:FALSE]});
            }
        }
   }];
}

- (void)stop{
    [self setPlay:false];
    if (_player){
        [_player closeSound];
        [_player destoryPlayer];
        _player = nil;
    }
}

- (void)seekAdd{
    NSDate *playTime = [_player getOSDTime];
    NSDate *endTime = [playTime dateByAddingTimeInterval:10];
    [_player seekPlayback:endTime];
}

- (void)seekDecrease{
    NSDate *playTime = [_player getOSDTime];
    NSDate *endTime = [playTime dateByAddingTimeInterval:-10];
    [_player seekPlayback:endTime];
}

- (void)capture:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
    UIImage *image = [_player capturePicture:100];
    NSData *data = UIImageJPEGRepresentation(image, 1.0);
    NSString *base64 = [data base64EncodedStringWithOptions:0];
    if (base64){
        resolve(@{@"base64": [NSString stringWithString:base64]});
    }
    else{
        reject(@"capture error", @"capture error", nil);
    }
}

- (void)startRecord:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject{
    if (_player){
        NSString *path = @"/OpenSDK/EzvizLocalRecord";
        NSArray * docdirs = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES);
        NSString * docdir = [docdirs objectAtIndex:0];
        NSString * configFilePath = [docdir stringByAppendingPathComponent:path];
        if(![[NSFileManager defaultManager] fileExistsAtPath:configFilePath]){
            NSError *error = nil;
            [[NSFileManager defaultManager] createDirectoryAtPath:configFilePath
                                      withIntermediateDirectories:YES
                                                       attributes:nil
                                                            error:&error];
        }
        NSDateFormatter *dateformatter = [[NSDateFormatter alloc] init];
        dateformatter.dateFormat = @"yyyyMMddHHmmssSSS";
        _recordPath = [NSString stringWithFormat:@"%@/%@.mp4",configFilePath,[dateformatter stringFromDate:[NSDate date]]];
        if ([_player startLocalRecordWithPathExt:_recordPath]){
            resolve(@{@"result": [NSNumber numberWithBool:TRUE]});
        }
        else{
            resolve(@{@"result": [NSNumber numberWithBool:FALSE]});
        }
    }
    else{
        reject(@"start record error", @"start record error", nil);
    }
}

- (void)stopRecord:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject{
    if (_player){
        [_player stopLocalRecordExt:^(BOOL ret) {
            if(ret){
                resolve(@{@"result": [NSNumber numberWithBool:TRUE],
                @"path":_recordPath});
            }
            else{
                resolve(@{@"result": [NSNumber numberWithBool:FALSE]});
                self.onVideoError(@{@"errorCode": [NSNumber numberWithInteger:104]});
            }
        }];
    }
    else{
        reject(@"start record error", @"start record error", nil);
    }
}

- (void)applicationDidEnterBackground:(NSNotification *)notification
{
    [self setPlayEx:false];
    self.onVideoError(@{@"errorCode": [NSNumber numberWithInteger:103]});
}

- (void)applicationResignActiveNotification:(NSNotification *)notification
{
    [self setPlayEx:false];
    self.onVideoError(@{@"errorCode": [NSNumber numberWithInteger:103]});
}

- (void)applicationWillEnterForeground:(NSNotification *)notification
{
    if (_play){
        [self setPlay:true];
        self.onVideoError(@{@"errorCode": [NSNumber numberWithInteger:105]});
    }
}

- (void)applicationDidBecomeActiveNotification:(NSNotification *)notification
{
    if (_play){
        [self setPlay:true];
        self.onVideoError(@{@"errorCode": [NSNumber numberWithInteger:105]});
    }
}

- (void)setSound:(BOOL)sound {
    _sound = sound;
    if (_player){
        if (sound){
            [_player openSound];
        }
        else{
            [_player closeSound];
        }
    }
}

- (void)setPlay:(BOOL)play {
    _play = play;
    [self setPlayEx:play];
}

- (void)setPlayEx:(BOOL)play {
    if (_player){
        if (_bReal){
            if (play){
                [_player startRealPlay];
            }
            else{
                [_player stopRealPlay];
            }
        }
        else{
            if (play){
                [_player resumePlayback];
            }
            else{
                [_player pausePlayback];
            }
        }
    }
}

- (void)setFullScreen:(BOOL)fullScreen {
    _fullScreen = fullScreen;
}

- (void)player:(EZPlayer *)player didPlayFailed:(NSError *)error
{
    if (self.onVideoError ) {
        self.onVideoError(@{@"errorCode": [NSNumber numberWithInteger:error.code]});
    }
}

- (void)player:(EZPlayer *)player didReceivedMessage:(NSInteger)messageCode
{
//    PLAYER_REALPLAY_START = 1,        //直播开始
//    PLAYER_VIDEOLEVEL_CHANGE = 2,     //直播流清晰度切换中
//    PLAYER_STREAM_RECONNECT = 3,      //直播流取流正在重连
//    PLAYER_VOICE_TALK_START = 4,      //对讲开始
//    PLAYER_VOICE_TALK_END = 5,        //对讲结束
//    PLAYER_STREAM_START = 10,         //录像取流开始
//    PLAYER_PLAYBACK_START = 11,       //录像回放开始播放
//    PLAYER_PLAYBACK_STOP = 12,        //录像回放结束播放
//    PLAYER_PLAYBACK_FINISHED = 13,    //录像回放被用户强制中断
//    PLAYER_PLAYBACK_PAUSE = 14,       //录像回放暂停
//    PLAYER_NET_CHANGED = 21,          //播放器检测到wifi变换过
//    PLAYER_NO_NETWORK = 22,           //播放器检测到无网络
    
    if(messageCode == PLAYER_PLAYBACK_START){
        if (_beginTime){
            [_player seekPlayback:_beginTime];
             [_player setPlayerView:self];
            _beginTime = nil;
        }
        else{
            [self setSound:_sound];
        }
    }
    else if(messageCode == PLAYER_REALPLAY_START){
        [self setSound:_sound];
    }
    else if (messageCode == PLAYER_PLAYBACK_STOP){
        if (_endTime){
            [self startPlayback:_deviceSerial cameraNo:_cameraNo verifyCode:_verifyCode beginTime:_endTime resolve:nil reject:nil];
            _endTime = nil;
        }
        self.onVideoError(@{@"errorCode": [NSNumber numberWithInteger:102]});
    }
}

- (void)player:(EZPlayer *)player didReceivedDisplayHeight:(NSInteger)height displayWidth:(NSInteger)width
{
    if (self.onVideoLoad ) {
        self.onVideoLoad(@{@"width": [NSNumber numberWithInteger:width],
                           @"height": [NSNumber numberWithInteger:height]});
    }
}

@end
