const loadedScripts: { [src: string]: Promise<any> } = {};

export function loadScript(src: string, globalVar: string): Promise<any> {
    if (loadedScripts[src]) {
        return loadedScripts[src];
    }

    const promise = new Promise<any>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.crossOrigin = 'anonymous'; // Add crossorigin attribute
        
        script.onload = () => {
            let attempts = 0;
            const interval = setInterval(() => {
                if ((window as any)[globalVar]) {
                    clearInterval(interval);
                    resolve((window as any)[globalVar]);
                } else {
                    attempts++;
                    if (attempts > 50) { // Poll for 5 seconds (50 * 100ms)
                        clearInterval(interval);
                        reject(new Error(`Script from ${src} loaded, but its global variable "${globalVar}" was not found.`));
                    }
                }
            }, 100);
        };
        
        script.onerror = (event) => {
            console.error("Script loading error event:", event);
            reject(new Error(`Failed to load script: ${src}`));
        };

        document.head.appendChild(script);
    });

    loadedScripts[src] = promise;
    return promise;
}
