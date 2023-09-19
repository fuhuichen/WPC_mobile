import * as lib from '../app/common/PositionLib';
import {DevXian} from './DevXian';
import {DevTaiwan} from './DevTaiwan';
import {AppPreview} from './AppPreview';
import {AppStable} from './AppStable';
import {AppQA} from './AppQA';

const android_version = 'V3.0.0';
const ios_version = 'V3.0.0';
const suffix_version = `_210101_Beta`;
const app_version = lib.isAndroid() ? android_version : ios_version;

const Debug_XA = {...DevXian.All, Version: app_version};
const Debug_TW = {...DevTaiwan.All, Version: app_version};
const Preview_China = {...AppPreview.China, Version: `${app_version}${suffix_version}`};
const QA_China = {...AppQA.China,Version: app_version};
const Release_Candidate = {...AppPreview.RC,Version: app_version};
const Release_Demo = {...AppStable.Demo, Version: app_version};

const Stable_China = {...AppStable.China, Version: app_version};
const Stable_Global = {...AppStable.Global, Version: app_version};

const collection = QA_China;
export const Environment = {
    USHOP_URL: collection.UShopUri,
    POST_URL: collection.PosUri,
    APP_VERSION: collection.Version,
    VERSION_UPDATE: collection.Update,
    isGlobal: ()=> collection.WebSite,
    onWebSite: () => collection.ServerUri
};
