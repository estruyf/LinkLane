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
        ($name:expr, convert: $convert:expr) => {
            map.insert(
                $name,
                KnownApp {
                    private_arg: None,
                    convert_url: Some($convert),
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
    // Seshboard is not a browser: it takes the link through its own deep link
    // and opens it in the Browser panel of the session in front.
    app!("Seshboard", convert: seshboard_url);
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

/// Rewrites an http(s) URL into Seshboard's deep link,
/// `seshboard://open?url=<the URL, percent-encoded>`.
///
/// Seshboard accepts only http and https in that link, so any other URL is
/// passed through unchanged and `open` hands it to Seshboard as it is.
pub fn seshboard_url(url: &str) -> String {
    let lower = url.trim_start().to_ascii_lowercase();
    if !(lower.starts_with("http://") || lower.starts_with("https://")) {
        return url.to_string();
    }
    format!("seshboard://open?url={}", encode_query_value(url))
}

/// Percent-encodes every byte of the UTF-8 string except the unreserved
/// characters of RFC 3986 (`A-Z a-z 0-9 - _ . ~`), so the result is safe as
/// one query value. Spaces become `%20`, never `+`.
fn encode_query_value(value: &str) -> String {
    let mut out = String::with_capacity(value.len() * 3);
    for byte in value.bytes() {
        match byte {
            b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => {
                out.push(byte as char)
            }
            _ => out.push_str(&format!("%{:02X}", byte)),
        }
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn seshboard_is_registered_with_a_converter_and_no_private_mode() {
        let apps = known_apps();
        let app = apps.get("Seshboard").expect("Seshboard is a known app");
        assert!(app.private_arg.is_none());
        let convert = app.convert_url.expect("Seshboard converts the URL");
        assert_eq!(
            convert("https://example.com"),
            "seshboard://open?url=https%3A%2F%2Fexample.com"
        );
    }

    #[test]
    fn encodes_a_plain_url() {
        assert_eq!(
            seshboard_url("https://example.com/docs/page.html"),
            "seshboard://open?url=https%3A%2F%2Fexample.com%2Fdocs%2Fpage.html"
        );
        assert_eq!(
            seshboard_url("http://localhost:5173"),
            "seshboard://open?url=http%3A%2F%2Flocalhost%3A5173"
        );
    }

    #[test]
    fn encodes_query_and_fragment() {
        assert_eq!(
            seshboard_url("https://example.com/search?q=a+b&lang=en#top"),
            "seshboard://open?url=https%3A%2F%2Fexample.com%2Fsearch%3Fq%3Da%2Bb%26lang%3Den%23top"
        );
        assert_eq!(
            seshboard_url("https://example.com/?x=50%25"),
            "seshboard://open?url=https%3A%2F%2Fexample.com%2F%3Fx%3D50%2525"
        );
    }

    #[test]
    fn encodes_spaces_and_non_ascii() {
        assert_eq!(
            seshboard_url("https://example.com/a b/café?q=ü"),
            "seshboard://open?url=https%3A%2F%2Fexample.com%2Fa%20b%2Fcaf%C3%A9%3Fq%3D%C3%BC"
        );
    }

    #[test]
    fn keeps_unreserved_characters() {
        assert_eq!(
            seshboard_url("https://my-site_x.example.com/~user"),
            "seshboard://open?url=https%3A%2F%2Fmy-site_x.example.com%2F~user"
        );
    }

    #[test]
    fn accepts_an_upper_case_scheme() {
        assert_eq!(
            seshboard_url("HTTPS://example.com"),
            "seshboard://open?url=HTTPS%3A%2F%2Fexample.com"
        );
    }

    #[test]
    fn passes_other_schemes_through() {
        assert_eq!(seshboard_url("mailto:someone@example.com"), "mailto:someone@example.com");
        assert_eq!(seshboard_url("file:///tmp/a.html"), "file:///tmp/a.html");
    }
}
