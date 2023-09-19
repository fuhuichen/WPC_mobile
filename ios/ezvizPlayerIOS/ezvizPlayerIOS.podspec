
Pod::Spec.new do |s|
  s.name         = "ezvizPlayerIOS"
  s.version      = "1.0.0"
  s.summary      = "ezvizPlayerIOS"
  s.author       = "wan.bin"
  s.homepage     = "ezvizPlayerIOS"
  s.license      = "MIT"
  s.platform     = :ios, "9.0"
  s.source       = { :git => "" }  
  s.source_files  = "*.{h,m}"
  s.dependency "React"
  s.dependency "EZOpenSDK"
end
