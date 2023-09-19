package com.adv.player.Utils;

import com.videogo.openapi.bean.EZDeviceRecordFile;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.List;
import java.util.ListIterator;

public class DeviceRecordFile {
    private Calendar calendar;
    private List<EZDeviceRecordFile> recordFiles;

    public DeviceRecordFile() {
        calendar = Calendar.getInstance();
        this.recordFiles = new ArrayList<>();
    }

    public void update(Calendar calendar, List<EZDeviceRecordFile> files){
        if (files == null || files.size() == 0){
            return;
        }

        if (this.calendar.compareTo(calendar) != 0){
            this.clear();
        }

        synchronized (this){
            this.calendar = calendar;
            recordFiles.addAll(files);
        }
    }

    public void clear(){
        synchronized (this){
            recordFiles.clear();
        }
    }

    public EZDeviceRecordFile getOne(Calendar playTime){
        EZDeviceRecordFile file = null;

        Calendar time = (Calendar) playTime.clone();
        time.set(Calendar.MILLISECOND, 0);

        synchronized (this){
            ListIterator iterator = recordFiles.listIterator();
            while (iterator.hasNext()){
                EZDeviceRecordFile record = (EZDeviceRecordFile)iterator.next();
                Calendar startTime = record.getStartTime();
                Calendar endTime = record.getStopTime();

                if ( (playTime.getTimeInMillis() >= startTime.getTimeInMillis() &&
                        playTime.getTimeInMillis() < endTime.getTimeInMillis() ) ||
                      (playTime.getTimeInMillis() <= startTime.getTimeInMillis() )){
                    file = record;
                    break;
                }
            }
        }

        return file;
    }

    public Calendar getOffset(Calendar playTime,Calendar startTime){
        Calendar calendar = null;

        Calendar time = (Calendar) playTime.clone();
        time.set(Calendar.MILLISECOND, 0);

        if (time.getTimeInMillis() > startTime.getTimeInMillis()){
            calendar = (Calendar) startTime.clone();

            long seconds = (time.getTimeInMillis() - startTime.getTimeInMillis())/1000;
            calendar.add(Calendar.SECOND, ((int) seconds));
        }

        return calendar;
    }

}
