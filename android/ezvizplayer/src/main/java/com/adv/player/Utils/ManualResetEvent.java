package com.adv.player.Utils;

public class ManualResetEvent {
    private final Object monitor = new Object();
    private volatile boolean open = false;

    public ManualResetEvent(boolean initialState) {
        open = initialState;
    }

    public boolean WaitOne() throws InterruptedException {
        synchronized (monitor) {
            if (!open) monitor.wait();
            return open;
        }
    }

    public boolean WaitOne (long timeout) throws InterruptedException {
        synchronized (monitor) {
            if (!open) monitor.wait(timeout);
            return open;
        }
    }

    public void Set() {
        synchronized (monitor) {
            open = true;
            monitor.notifyAll();
        }
    }

    public void Reset() {
        open = false;
    }
}
