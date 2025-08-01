use pandorust_core::custom_err::PanError;
use parts::QuickFindRespond;
pub mod logic;
pub mod parts;

pub fn search(root_path: &str, glob_patter: &str) -> Result<QuickFindRespond, PanError> {
    logic::search(root_path, glob_patter)
}
