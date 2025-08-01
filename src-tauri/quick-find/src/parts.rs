use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct QuickFindRespond {
    pub vec: Vec<String>,
    pub count: usize,
    pub spent_millis: u128,
}
