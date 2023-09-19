//exports.APPTYPE='NT'
//exports.APPTYPE='MAIN'
import {
    Platform,Dimensions
} from 'react-native';

exports.APPTYPE = 'Master'
exports.SERVERURL = 'https://laddertechtw.com'
exports.WEBURL = 'http://laddertechtw.com'
exports.APPVERSION = '1.1.5'

exports.TESTTIME = 50
const X_width = 375;
const X_height = 812;
const width =  Dimensions.get('screen').width;
const height =  Dimensions.get('window').height;
exports.isIPhoneX = Platform.OS === 'ios' && ( (height === X_height && width ===X_width) || (height === X_width && width ===X_height) );

exports.DEBUGMODE = false;

exports.getWeatherIcon = function(index) {
  var weatherIcon = null;
  switch(index) {
    case 0: weatherIcon = require('../../images/weather/unknow.png'); break;
    case 1: weatherIcon = require('../../images/weather/sun.png'); break;
    case 2: weatherIcon = require('../../images/weather/cloud.png'); break;
    case 3: weatherIcon = require('../../images/weather/rain.png'); break;
    case 4: weatherIcon = require('../../images/weather/snow.png'); break;
    case 5: weatherIcon = require('../../images/weather/danger.png'); break;
  }
  return weatherIcon;
}

//exports.APPTYPE='DEBUG'
//exports.SERVERURL= 'http://114.34.5.111:3888'
//exports.WEBURL= 'http://114.34.5.111:3888'
//exports.APPVERSION = '2.19_TEST'

exports.COLORMAP={
        dkk_background2:'#F7F9FA',
        dkk_background:'#F7F9FA',
        dkk_font_white:'#ffffff',
        dkk_font_grey:'#556679',
        //dkk_red:'#fb4c5d',
        dkk_red:'#FC69A5',
        dkk_blue:'#006AB7',
        dkk_gray:'#989DB0',
        dkk_yellow:'#fcb13a',
        dkk_colorbar:['#CBDFF6','#8CBBF3','#5091D9','#F1A7AC','#EA7E84','#E75A63','#fb4c5d'],
        transparent:'#00000000',
        deadline_red:'#FF3162',
        deadline_orange:'#FF9244',
        deadline_green:'#7DC321',
        light_blue:'#FFFFFF88',
        gray_bg:'#878787',
        gray_middle:'#DDDDDD',
        highlight_yellow:'#F0C84D',
        white_half:'#FFFFFF88',
        white_almost:'#F0F0F0',
        blue_font:'#4B93DB',
        gray_font:'#64686D',
        gray_content_bg:'#F1F1F1',
        login_botton_gray:'#8D97AB',
        kpi_title_gray:'#666666',
        kpi_content_gray:'#444444',
        light_font_gray:'#999999',
        placholder_gray:'#A4DEB4',
        grid_line_gray:'#CCCCCC',
        setting_gray:'#E6E6E6',
        green : '#27CBC3',
        tifanny:'#32B0C7',
        red : '#FF8198',
        orange : '#D09A50',
        brown: '#cc8800',
        yellow:'#ffff1a',
        blue:'#33ffff',
        black : '#000000',
        white : '#FFFFFF',
        bright_blue : '#00B7FF',//'#32B0C7',
        background_blue :'#003B7E',//'#253358',
        middle_blue : '#2A4972',
        dark_blue : '#090920',
        font_gray :'#404040',
        light_gray :'#F2F2F2',
        clear_gray :'#F2F2F2',
        middle_gray :'#85898E',
        dark_gray :'#555555',
        chart_gray :'#626262',
        rank_red:'#B4504D',
        rank_green:'#65AEC0',
        color_list: ['#32B0C7', '#FB9745','#1E4A95','#cc8800','#33ffff' ],
        color_bar :['#CBDFF6','#8CBBF3','#5091D9','#F1A7AC','#EA7E84','#E75A63','#FF3162','#A75AD8'],
        rank_bar :['#E22472','#FFC53D','#78C5F2','#2C90D9','#CBCBCB','#8b91a9','#FF3162','#A75AD8'],
        return_bar :['#FFC53D','#2C90D9','#B4B3B3','#CBCBCB'],
        three_level_colors:['#00E800','#FF7E00','#FF0000'],
        login_input_background: '#29305282',
        switch_red: '#DF3A67',
};
