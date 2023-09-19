import * as lib from '../app/common/PositionLib';
import {DevXian} from './DevXian';
import {DevTaiwan} from './DevTaiwan';
import {AppPreview} from './AppPreview';
import {AppStable} from './AppStable';
import {AppQA} from './AppQA';
import Config from "react-native-config";

const android_version = 'V3.11.4';
const ios_version = 'V3.11.4';
const suffix_version = ``;
const app_version = lib.isAndroid() ? android_version : ios_version;

const Debug_XA = {...DevXian.All, Version: app_version};
const Debug_TW = {...DevTaiwan.All, Version: app_version};
const Preview_China = {...AppPreview.China, Version: `${app_version}${"_CN"}`};
const Preview_Global= {...AppPreview.Global, Version: `${app_version}${"_preview"}`};
const QA_China = {...AppQA.China,Version: app_version};
const Release_Candidate = {...AppPreview.RC,Version: `${app_version}${"_RC"}`};
const Release_Demo = {...AppStable.Demo, Version: app_version};
const Dev = {...AppPreview.Dev, Version: `${app_version}${"_Dev"}`};

const Stable_China = {...AppStable.China, Version: app_version};
const Stable_Global = {...AppStable.Global, Version: app_version};
const Stable_GlobalNew = {...AppStable.GlobalNew, Version: app_version};
let collection = Preview_Global;
console.log("Build="+Config.SITE)
if(Config.SITE){
  if(Config.SITE == 'RC'){
    collection = Release_Candidate;
  }
  else if(Config.SITE == 'Preview'){
    collection = Preview_Global ;
  }
  else if(Config.SITE == 'Portals'){
    collection = Stable_Global;
  }
  else if(Config.SITE == 'NewPortals'){
    collection = Stable_GlobalNew;
  }
  else if(Config.SITE == 'Dev'){
    collection = Dev;
  }
  else if(Config.SITE == 'CN'){
    collection = Preview_China ;
  }
}


export const Environment = {
    USHOP_URL: collection.UShopUri,
    POST_URL: collection.PosUri,
    APP_VERSION: collection.Version,
    VERSION_UPDATE: collection.Update,
    isGlobal: ()=> collection.WebSite,
    onWebSite: () => collection.ServerUri,
    onWebSite_CashCheck: () => collection.ServerUri_CashCheck
};
