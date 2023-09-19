import React from 'react';
import {StyleSheet} from "react-native";

const BorderShadow = StyleSheet.create({
    div: {
        borderTopWidth:0.5,
        borderLeftWidth:1,
        borderRightWidth:1,
        borderBottomWidth:1.5,
        borderColor:'rgba(0,0,0,0.06)'
    },
    focus:{
        borderTopWidth:1,
        borderLeftWidth:1,
        borderRightWidth:1,
        borderBottomWidth:1,
        borderColor:'#2C90D9'
    }
});

module.exports = BorderShadow;
