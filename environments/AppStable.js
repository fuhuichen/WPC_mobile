module.exports = {
    AppStable: {
        Global:{
            ServerUri: 'http://mgmt.storevue.com:80/storemonitor/api/',
            ServerUri_CashCheck: 'https://cashcheck.storevue.com/cashchecking/api/',
            UShopUri: 'https://api-portals.storevue.com/',
            PosUri: 'https://new-pos.storevue.com/',
            Update: true,
            WebSite: true
        },
        GlobalNew:{
            ServerUri:'https://inspection.storevue.com/storemonitor/api/',
            UShopUri: 'https://api-portals.storevue.com/',
            PosUri: 'https://new-pos.storevue.com/',
            Update: true,
            WebSite: true
        },
        China:{
            ServerUri: 'http://mgmt.storevue.com.cn:8081/storemonitor/api/',
            UShopUri: 'https://portals.ushop-plus.com/',
            PosUri: 'http://pos.ushop-plus.com/',
            Update: true,
            WebSite: false
        },
        Demo:{
            ServerUri: 'http://47.103.135.242:8081/storemonitor/api/',
            UShopUri: 'https://api-portals.storevue.com/',
            PosUri: 'https://new-pos.storevue.com/',
            Update: true,
            WebSite: true
        }
    }
};
