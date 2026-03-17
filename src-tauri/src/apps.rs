use std::collections::HashMap;

pub struct KnownApp {
    pub private_arg: Option<&'static str>,
    pub convert_url: Option<fn(&str) -> String>,
}

pub fn known_apps() -> HashMap<&'static str, KnownApp> {
    let mut map = HashMap::new();

    macro_rules! app {
        ($name:expr) => {
            map.insert(
                $name,
                KnownApp {
                    private_arg: None,
                    convert_url: None,
                },
            );
        };
        ($name:expr, private: $arg:expr) => {
            map.insert(
                $name,
                KnownApp {
                    private_arg: Some($arg),
                    convert_url: None,
                },
            );
        };
    }

    app!("Arc");
    app!("Brave Browser", private: "--incognito");
    app!("Brave Browser Beta", private: "--incognito");
    app!("Chromium", private: "--incognito");
    app!("DuckDuckGo");
    app!("Firefox", private: "--private-window");
    app!("Firefox Developer Edition", private: "--private-window");
    app!("Firefox Nightly", private: "--private-window");
    app!("Floorp");
    app!("Google Chrome", private: "--incognito");
    app!("Google Chrome Beta", private: "--incognito");
    app!("Google Chrome Canary", private: "--incognito");
    app!("Google Chrome Dev", private: "--incognito");
    app!("LibreWolf", private: "--private-window");
    app!("Microsoft Edge", private: "--inprivate");
    app!("Microsoft Edge Beta", private: "--inprivate");
    app!("Microsoft Edge Canary", private: "--inprivate");
    app!("Microsoft Edge Dev", private: "--inprivate");
    app!("Min");
    app!("Mullvad Browser", private: "--private-window");
    app!("Opera");
    app!("Opera GX");
    app!("Orion");
    app!("Polypane");
    app!("Safari");
    app!("Safari Technology Preview");
    app!("Sidekick", private: "--incognito");
    app!("SigmaOS");
    app!("Sizzy");
    app!("Thorium", private: "--incognito");
    app!("Tor Browser");
    app!("Vivaldi");
    app!("Vivaldi Snapshot");
    app!("Waterfox");
    app!("Wavebox", private: "--incognito");
    app!("Zen", private: "--private-window");
    app!("Zen Browser");
    app!("Iridium");
    app!("Lagrange");
    app!("Maxthon");
    app!("NAVER Whale");
    app!("Pale Moon");
    app!("qutebrowser");

    map
}
