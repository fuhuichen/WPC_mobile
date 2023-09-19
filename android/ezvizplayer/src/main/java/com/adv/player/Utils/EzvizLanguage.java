package com.adv.player.Utils;

import android.content.Context;

import com.alibaba.fastjson.JSONObject;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;

public class EzvizLanguage {
    private static String mLocale = "en-US";
    private static JSONObject mLangEN = null;
    private static JSONObject mLangCN = null;
    private static JSONObject mLangTW = null;

    private static JSONObject mLangCurrent = null;

    public static void init(Context context){
        mLangEN = JSONObject.parseObject(getJson("en-US.json", context));
        mLangCN = JSONObject.parseObject(getJson("zh-CN.json", context));
        mLangTW = JSONObject.parseObject(getJson("zh-TW.json", context));
    }

    public static void setLocale(String locale){
        mLocale = locale;
        mLangCurrent = mLocale.equals("en-US") ? mLangEN
                : mLocale.equals("zh-CN") ? mLangCN : mLangTW;
    }

    public static String getString(String key){
        return mLangCurrent.getString(key);
    }

    public static String getJson(String fileName, Context context){
        StringBuilder stringBuilder = new StringBuilder();
        try {
            InputStream is = context.getAssets().open(fileName);
            BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(is));
            String line;
            while ((line=bufferedReader.readLine()) != null){
                stringBuilder.append(line);
            }
        } catch (IOException e) {
            e.printStackTrace();
        }

        return stringBuilder.toString();
    }
}
