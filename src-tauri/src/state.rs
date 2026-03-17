use std::collections::HashMap;
use std::sync::Mutex;

use crate::settings::Settings;

pub struct AppState {
    pub settings: Mutex<Settings>,
    #[allow(dead_code)]
    pub current_url: Mutex<String>,
    pub icons: Mutex<HashMap<String, String>>,
}

impl AppState {
    pub fn new(settings: Settings) -> Self {
        AppState {
            settings: Mutex::new(settings),
            current_url: Mutex::new(String::new()),
            icons: Mutex::new(HashMap::new()),
        }
    }
}
