import { useEffect, useRef } from 'react';

export const useNotification = () => {
    const audioContextRef = useRef<AudioContext | null>(null);

    // Request notification permission on mount
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            console.log('🔔 Requesting notification permission...');
            Notification.requestPermission().then(permission => {
                console.log('🔔 Notification permission:', permission);
            });
        } else {
            console.log('🔔 Notification permission status:', Notification.permission);
        }
    }, []);

    // Initialize audio context
    useEffect(() => {
        if (typeof window !== 'undefined' && 'AudioContext' in window) {
            audioContextRef.current = new AudioContext();
            console.log('🔊 AudioContext initialized');
        }

        return () => {
            audioContextRef.current?.close();
        };
    }, []);

    const playNotificationSound = () => {
        try {
            console.log('🔊 Playing notification sound...');
            const audioContext = audioContextRef.current;
            if (!audioContext) {
                console.error('🔊 AudioContext not initialized');
                return;
            }

            // Create a simple notification beep sound
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            // Configure the sound (a pleasant notification beep)
            oscillator.frequency.value = 800; // Hz
            oscillator.type = 'sine';

            // Envelope for smooth sound
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
            console.log('🔊 Notification sound played successfully');
        } catch (error) {
            console.error('Error playing notification sound:', error);
        }
    };

    const showNotification = (title: string, body: string) => {
        try {
            console.log('📬 Attempting to show notification:', { title, body, permission: Notification.permission });
            if ('Notification' in window && Notification.permission === 'granted') {
                const notification = new Notification(title, {
                    body,
                    icon: '/favicon.ico',
                    badge: '/favicon.ico',
                    tag: 'message-notification',
                });

                console.log('📬 Notification created successfully');

                // Focus window when notification is clicked
                notification.onclick = () => {
                    window.focus();
                    notification.close();
                };

                // Auto-close after 5 seconds
                setTimeout(() => notification.close(), 5000);
            } else {
                console.warn('📬 Notification not shown. Permission:', Notification.permission);
            }
        } catch (error) {
            console.error('Error showing notification:', error);
        }
    };

    return {
        playNotificationSound,
        showNotification,
    };
};
